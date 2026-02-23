import React, { useEffect, useState } from "react";
import "./styles/createProductListLayer.css";
import "@mdi/font/css/materialdesignicons.min.css";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import catetgoryProvider from "../apiProvider/categoryapi";
import subCategory from "../apiProvider/subcategoryapi";
import childCategory from "../apiProvider/childcategoryapi";
import BrandApi from "../apiProvider/brand";
import Attribute from "../apiProvider/attribute";
import { Button, ActionIcon, TextInput, Modal, Badge, Group, Stack, Text, ScrollArea, Loader, Tooltip } from "@mantine/core";
import { IconPlus, IconTrash, IconColumns, IconSearch, IconX, IconCheck } from "@tabler/icons-react";
import vendorApi from "../apiProvider/vendor";
import productApi from "../apiProvider/product";
import variantApis from "../apiProvider/variant";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { handleFormProduct } from "../redux/slices/product";
import { IMAGE_BASE_URL } from "../network/apiClient";
import "react-toastify/dist/ReactToastify.css";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// These always appear — cannot be removed by admin
const COMMON_COLUMNS = [
  { key: "sku", label: "SKU", type: "text", placeholder: "SKU-001" },
  { key: "stock", label: "Stock", type: "number", placeholder: "0" },
  { key: "weight", label: "Weight", type: "number", placeholder: "0.00" },
  { key: "customermrp", label: "Cust. MRP", type: "number", placeholder: "0.00" },
  { key: "price", label: "Price", type: "number", placeholder: "0.00" },
];


const ORING_CATEGORY_NAME = "o-rings";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const buildEmptyRow = (extraColumns) => {
  const row = {};
  extraColumns.forEach((col) => { row[col.key] = ""; });
  COMMON_COLUMNS.forEach((col) => { row[col.key] = ""; });
  return row;
};

const CreateProductListLayer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selector = useSelector((state) => state.product);

  // ── Section toggles
  const [isExpanded, setIsExpanded] = useState(true);
  const [isTechnicalSpecsOpen, setIsTechnicalSpecsOpen] = useState(false);
  const [isVariantOpen, setIsVariantOpen] = useState(false);
  const [isMetaTagsOpen, setIsMetaTagsOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [variantSearch, setVariantSearch] = useState("");
  const [isCreatingVariant, setIsCreatingVariant] = useState(false);

  // ── State
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [taxes, setTaxes] = useState([]);

  // ── Dropdown data
  const [categoryData, setCategories] = useState([]);
  const [subCategoryData, setSubCategory] = useState([]);
  const [childCategoryData, setchldCategory] = useState([]);
  const [brandData, setBrand] = useState([]);
  const [attributeData, setAttribute] = useState([]);
  const [vendorData, setVendor] = useState([]);
  const [availableExtraColumns, setAvailableExtraColumns] = useState([]);

  // ── O-ring sizes
  const [sizes, setSizes] = useState({
    as_568a_standard: [],
    jis_b_2401_standard: [],
  });

  // ── Variant table
  // selectedExtraColumns = columns admin chose from AVAILABLE_EXTRA_COLUMNS
  const [selectedExtraColumns, setSelectedExtraColumns] = useState([]);
  const [variantRows, setVariantRows] = useState([]);

  // Full column list = selected extra + common (always appended at end)
  const fullColumnList = [...selectedExtraColumns, ...COMMON_COLUMNS];

  // ── Form data
  const [formData, setFormData] = useState({
    category: "", subCategory: "", childCategory: "", brand: "",
    productName: "", productImage: [], additionalImages: [],
    shortDescription: "", slug: "", lowStockAlert: false,
    tagsLabel: "Select", refundable: "Yes", productStatus: "active",
    description: "", hsn: "",
    customerDiscunt: "", customerTax: "",
    wholeSalerDiscunt: "", wholeSalerTax: "",
    wholesalerAttribute: { attributeId: [], rowData: [] },
    customerAttribute: { attributeId: [], rowData: [] },
    metaTitle: "", metaKey: "", metaDescription: "",
    selectDeliveryOption: "", vendorNameSelect: "",
    isApplicableToCustomer: false, isApplicableToWholesaler: false,
    lowStockQuantity: 0, quantityPerPack: 0, packingType: "",
  });

  // Derived
  const isOringCategory = categoryData
    .find((c) => c._id === formData.category)
    ?.name?.toLowerCase()
    .replace(/[-\s]/g, "") === ORING_CATEGORY_NAME.toLowerCase().replace(/[-\s]/g, "");

  // Columns not yet added (available to pick)
  const unselectedColumns = availableExtraColumns.filter(
    (col) => !selectedExtraColumns.find((s) => s.key === col.key)
  );

  // ─── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          categoryDtls(), brandsDtls(), attributeDtls(), vendorDtls(), fetchTaxes(), fetchVariants(),
          selector.isEdit ? setUpdatedData() : Promise.resolve(),
        ]);
        if (selector.isEdit) setIsEditing(true);
      } catch (e) { console.error(e); }
    };
    init();
  }, []);

  const fetchVariants = async () => {
    try {
      const res = await variantApis.variantList({ page: 0, limit: 1000 });
      if (res.status) {
        const dynamicCols = res.response.data.map(v => ({
          key: v.name.toLowerCase().replace(/\s+/g, "_"),
          label: v.name,
        }));
        setAvailableExtraColumns(dynamicCols);
        return dynamicCols;
      }
    } catch (e) { console.error("Error fetching variants:", e); }
    return [];
  };

  const fetchTaxes = async () => {
    const res = await productApi.getTax();
    if (res.status) setTaxes(res.response.data);
  };

  // ─── Cascading dropdowns ───────────────────────────────────────────────────
  const categoryDtls = async () => {
    const res = await catetgoryProvider.getCategory();
    if (res) setCategories(res?.data?.data?.items);
  };

  useEffect(() => {
    subCategoryDtls();
  }, [formData.category]);
  const subCategoryDtls = async () => {
    if (!formData.category) { setSubCategory([]); return; }
    setLoading(true);
    try {
      const res = await subCategory.getSubCategorys({ categoryId: formData.category, limit: 100, page: 0 });
      if (res?.status) setSubCategory(res.response?.data?.data?.items || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (formData.subCategory) {
      childCategoryDtls(formData.subCategory);
    }
  }, [formData.subCategory]);
  const childCategoryDtls = async (id) => {
    try {
      const res = await childCategory.getChildCategoryBysubCategoryId(id);
      if (res?.status) setchldCategory(res.response?.data || []);
    } catch { setchldCategory([]); }
  };

  const brandsDtls = async () => { const r = await BrandApi.brandList({ type: "all", page: 0, limit: 100 }); if (r?.status) setBrand(r.response.data); };
  const attributeDtls = async () => { const r = await Attribute.attributeList({ type: "all" }); if (r?.status) setAttribute(r.response.data); };
  const vendorDtls = async () => { const r = await vendorApi.vendorList({ type: "all" }); if (r?.status) setVendor(r.response.data); };

  // ─── Column picker ─────────────────────────────────────────────────────────

  const handleAddExtraColumn = (col) => {
    setSelectedExtraColumns((prev) => [...prev, col]);
    setVariantRows((prev) => prev.map((row) => ({ ...row, [col.key]: "" })));
    setShowColumnPicker(false);
    setVariantSearch("");
  };

  const handleCreateNewVariant = async () => {
    if (!variantSearch.trim()) return;
    try {
      setIsCreatingVariant(true);
      const res = await variantApis.variantCreate({ name: variantSearch.trim() });
      if (res.status) {
        const dynamicCols = await fetchVariants();
        const newCol = dynamicCols.find(c => c.label.toLowerCase() === variantSearch.trim().toLowerCase());
        if (newCol) {
          handleAddExtraColumn(newCol);
          setShowColumnPicker(false);
          setVariantSearch("");
        }
      }
    } catch (e) {
      console.error("Error creating variant:", e);
    } finally {
      setIsCreatingVariant(false);
    }
  };

  const handleRemoveExtraColumn = (colKey) => {
    setSelectedExtraColumns((prev) => prev.filter((c) => c.key !== colKey));
    // Remove key from all rows
    setVariantRows((prev) =>
      prev.map((row) => { const r = { ...row }; delete r[colKey]; return r; })
    );
  };

  // ─── Variant row handlers ──────────────────────────────────────────────────
  const handleAddVariantRow = () => {
    setVariantRows((prev) => [...prev, buildEmptyRow(selectedExtraColumns)]);
    if (!isVariantOpen) setIsVariantOpen(true);
  };

  const handleVariantRowChange = (index, key, value) => {
    setVariantRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
    // Clear error
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`v_${key}_${index}`];
      // If price or mrp changed, clear the comparison error too
      if (key === "price" || key === "customermrp") {
        delete newErrors[`v_customermrp_${index}`];
      }
      return newErrors;
    });
  };

  const handleRemoveVariantRow = (index) => {
    setVariantRows((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── O-ring size handlers ──────────────────────────────────────────────────
  const blankOringRow = () => ({
    sizeCode: "", metric_id_mm: "", metric_id_tolerance_mm: "",
    metric_cs_mm: "", metric_cs_tolerance_mm: "",
    sku: "", stock: "", weight: "", customermrp: "", price: "",
  });

  const handleAddAS568ASize = () => setSizes((p) => ({ ...p, as_568a_standard: [...p.as_568a_standard, blankOringRow()] }));
  const handleAddJISSize = () => setSizes((p) => ({ ...p, jis_b_2401_standard: [...p.jis_b_2401_standard, blankOringRow()] }));

  const handleSizeChange = (standard, index, field, value) => {
    setSizes((prev) => {
      const copy = { ...prev, [standard]: [...prev[standard]] };
      copy[standard][index] = { ...copy[standard][index], [field]: value };
      return copy;
    });
    // Clear error
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`${standard}_${field}_${index}`];
      // If price or mrp changed, clear comparison error
      if (field === "price" || field === "customermrp") {
        delete newErrors[`${standard}_customermrp_${index}`];
      }
      return newErrors;
    });
  };

  const handleRemoveSize = (standard, index) =>
    setSizes((prev) => ({ ...prev, [standard]: prev[standard].filter((_, i) => i !== index) }));

  // ─── Slug auto-generate ────────────────────────────────────────────────────
  useEffect(() => {
    const slug = formData.productName
      ?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
    setFormData((prev) => ({ ...prev, slug }));
  }, [formData.productName]);

  // ─── Edit mode ─────────────────────────────────────────────────────────────
  const urlToFile = async (url, name, mime) => {
    const res = await fetch(url); const blob = await res.blob();
    return new File([blob], name, { type: mime });
  };

  const setUpdatedData = async () => {
    setLoading(true);
    const response = await productApi.productDetails(selector.id);
    if (response.status) {
      const resp = response.response.data;
      const existingImages = await Promise.all((resp.productImage || []).map((img) => urlToFile(`${IMAGE_BASE_URL}/${img.docPath}/${img.docName}`, img.originalName || img.docName, "image/png")));
      const additionalImgs = await Promise.all((resp.additionalImage || []).map((img) => urlToFile(`${IMAGE_BASE_URL}/${img.docPath}/${img.docName}`, img.originalName || img.docName, "image/png")));

      setFormData({
        category: resp.categoryId || "", subCategory: resp.subCategory || "",
        childCategory: resp.childCategory || "", brand: resp.brand || "",
        productName: resp.productName || "", hsn: resp.hsn || "",
        productImage: existingImages, additionalImages: additionalImgs,
        shortDescription: resp.shortDescription || "", slug: resp.slug || "",
        lowStockAlert: resp.lowStockAlert || false,
        tagsLabel: resp.tagAndLabel || "Select",
        refundable: resp.refundable ? "Yes" : "No",
        productStatus: resp.productStatus ? "active" : "inactive",
        description: resp.description || "",
        lowStockQuantity: resp.lowStockQuantity || "",
        customerDiscunt: resp.customerDiscount?.toString() || "",
        customerTax: resp.customerTax?.toString() || "",
        wholeSalerDiscunt: resp.wholesalerDiscount?.toString() || "",
        wholeSalerTax: resp.wholesalerTax?.toString() || "",
        wholesalerAttribute: { attributeId: [], rowData: [] },
        customerAttribute: { attributeId: [], rowData: [] },
        metaTitle: resp.metaTitle || "", metaKey: resp.metaKeyword || "",
        metaDescription: resp.metaDesc || "",
        selectDeliveryOption: resp.delivery || "",
        vendorNameSelect: resp.vendorId || "",
        isApplicableToCustomer: resp.applicableForCustomer || false,
        isApplicableToWholesaler: resp.applicableForWholesale || false,
        quantityPerPack: resp.quantityPerPack || 0,
        packingType: resp.packingType || "",
      });

      setSizes({
        as_568a_standard: (resp.as_568a_standard || []).map((s) => ({ ...blankOringRow(), ...s })),
        jis_b_2401_standard: (resp.jis_b_2401_standard || []).map((s) => ({ ...blankOringRow(), ...s })),
      });
      if (resp.as_568a_standard?.length > 0 || resp.jis_b_2401_standard?.length > 0)
        setIsTechnicalSpecsOpen(true);

      // Detect which extra columns were saved
      const savedRows = resp.customerAttribute?.rowData || [];
      if (savedRows.length > 0) {
        const firstRow = savedRows[0];
        // We wait for variants to be loaded before detection or use the freshly fetched ones
        let currentAvailable = availableExtraColumns;
        if (!currentAvailable.length) {
          currentAvailable = await fetchVariants();
        }
        const detected = currentAvailable.filter((col) => col.key in firstRow);
        setSelectedExtraColumns(detected);
        setVariantRows(savedRows);
        setIsVariantOpen(true);
      }
    }
    setLoading(false);
  };

  // ─── Form handlers ─────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };
  const handleChangeCheckBox = (e) => { const { name, value, type, checked } = e.target; setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value })); };
  const handleEditorChange = (_, editor) => setFormData((p) => ({ ...p, description: editor.getData() }));
  const handleDeleteImage = (i) => setFormData((p) => ({ ...p, productImage: p.productImage.filter((_, idx) => idx !== i) }));
  const handleDeleteAdditionalImage = (i) => setFormData((p) => ({ ...p, additionalImages: p.additionalImages.filter((_, idx) => idx !== i) }));

  const handleFileChange = (e, key) => {
    const files = Array.from(e.target.files); const allowed = ["image/jpeg", "image/png"];
    const valid = files.filter((f) => { if (!allowed.includes(f.type)) { alert(`${f.name} is not valid JPG/PNG`); return false; } return true; });
    if (!valid.length) return;
    setFormData((p) => ({ ...p, [key]: key === "productImage" ? [valid[0]] : [...(p[key] || []), ...valid] }));
  };

  // ─── Validation ────────────────────────────────────────────────────────────
  const Validate = () => {
    const newErrors = {};
    const req = (val, key, msg) => { if (!val || (typeof val === "string" && !val.trim()) || (Array.isArray(val) && !val.length)) newErrors[key] = msg; };
    req(formData.category, "category", "Category is Required");
    req(formData.subCategory, "subCategory", "Sub Category is Required");
    // req(formData.childCategory, "childCategory", "Child Category is Required");
    req(formData.brand, "brand", "Brand is Required");
    req(formData.productName, "productName", "Product Name is Required");
    req(formData.slug, "slug", "Slug is Required");
    req(formData.packingType, "packingType", "Packing Type is Required");
    if (!formData.productImage?.length) newErrors.productImage = "At least one product image is required";
    if (!formData.hsn) newErrors.hsn = "HSN code is required";
    else if (!/^\d+$/.test(formData.hsn)) newErrors.hsn = "HSN code must be numeric";
    else if (![4, 6, 8].includes(formData.hsn.length)) newErrors.hsn = "HSN code must be 4, 6, or 8 digits";
    if (!formData.quantityPerPack) newErrors.quantityPerPack = "Quantity Per Pack is Required";
    else if (Number(formData.quantityPerPack) <= 0) newErrors.quantityPerPack = "Quantity must be > 0";

    if (!isOringCategory && variantRows.length > 0) {
      variantRows.forEach((row, i) => {
        fullColumnList.forEach(({ key, label, type }) => {
          const val = row[key];
          if (!val || val.toString().trim() === "") newErrors[`v_${key}_${i}`] = `${label} is required`;
          else if (type === "number" && isNaN(Number(val))) newErrors[`v_${key}_${i}`] = `${label} must be a number`;
          else if (type === "number" && Number(val) < 0) newErrors[`v_${key}_${i}`] = `${label} cannot be negative`;
        });
        if (Number(row.customermrp) < Number(row.price)) {
          newErrors[`v_customermrp_${i}`] = "MRP must be >= Price";
        }
      });
    }

    if (isOringCategory) {
      ["as_568a_standard", "jis_b_2401_standard"].forEach((std) => {
        sizes[std].forEach((row, i) => {
          if (Number(row.customermrp) < Number(row.price)) {
            newErrors[`${std}_customermrp_${i}`] = "MRP must be >= Price";
          }
        });
      });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const buildFormData = () => {
    const fd = new FormData();
    fd.append("categoryId", formData.category); fd.append("subCategory", formData.subCategory);
    // fd.append("childCategory", formData.childCategory); 
    fd.append("productName", formData.productName);
    fd.append("brand", formData.brand); fd.append("shortDescription", formData.shortDescription);
    fd.append("slug", formData.slug); fd.append("hsn", formData.hsn);
    fd.append("lowStockAlert", String(formData.lowStockAlert === true));
    fd.append("tagAndLabel", formData.tagsLabel);
    fd.append("refundable", String(formData.refundable === "Yes" || formData.refundable === true));
    fd.append("productStatus", String(formData.productStatus === "active"));
    fd.append("description", formData.description);
    fd.append("applicableForCustomer", String(formData.isApplicableToCustomer === true));
    fd.append("customerDiscount", String(Number(formData.customerDiscunt)));
    fd.append("customerTax", String(Number(formData.customerTax)));
    fd.append("applicableForWholesale", String(formData.isApplicableToWholesaler === true));
    fd.append("wholesalerDiscount", String(Number(formData.wholeSalerDiscunt)));
    fd.append("wholesalerTax", String(Number(formData.wholeSalerTax)));
    fd.append("metaTitle", formData.metaTitle); fd.append("metaKeyword", formData.metaKey);
    fd.append("metaDesc", formData.metaDescription); fd.append("delivery", formData.selectDeliveryOption);
    fd.append("lowStockQuantity", formData.lowStockQuantity); fd.append("quantityPerPack", formData.quantityPerPack);
    fd.append("packingType", formData.packingType);
    (formData.productImage || []).forEach((img) => { if (img instanceof File) fd.append("productImage", img); });
    (formData.additionalImages || []).forEach((img) => { fd.append("additionalImages", img); });
    if (isOringCategory) {
      if (sizes.as_568a_standard.length > 0) fd.append("as_568a_standard", JSON.stringify(sizes.as_568a_standard));
      if (sizes.jis_b_2401_standard.length > 0) fd.append("jis_b_2401_standard", JSON.stringify(sizes.jis_b_2401_standard));
    } else if (variantRows.length > 0) {
      fd.append("customerAttribute", JSON.stringify({ attributeId: [], rowData: variantRows }));
    }
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!Validate()) return;
    const fd = buildFormData();
    console.log("=== FormData Contents ===");
    for (let [key, value] of fd.entries()) {
      if (value instanceof File) {
        console.log(key, ":", value.name, `(${value.type})`);
      } else {
        console.log(key, ":", value);
      }
    }
    console.log("========================");

    if (isEditing) {
      fd.append("id", selector.id);
      const r = await productApi.updateproduct(fd, selector.id);
      if (r.status) setTimeout(handleClose, 2000);
    }
    else {
      const r = await productApi.productcreate(fd);
      if (r.status) setTimeout(handleClose, 2000);
    }
  };

  const handleClose = () => {
    dispatch(handleFormProduct({ view: false, isEdit: false, id: "" }));
    setSizes({ as_568a_standard: [], jis_b_2401_standard: [] });
    setVariantRows([]); setSelectedExtraColumns([]);
    setIsTechnicalSpecsOpen(false); setIsVariantOpen(false);
    setTimeout(() => navigate("/product"), 300);
  };

  if (isLoading) return <div className="p-5 text-center">Loading...</div>;

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-12">
            <div id="addproduct-accordion" className="custom-accordion">

              {/* ══════════════════════════════════════════════════
                  01 — GENERAL INFO
              ══════════════════════════════════════════════════ */}
              <div className="card mb-4">
                <a href="#gen-collapse" className={`text-body ${isExpanded ? "" : "collapsed"}`}
                  data-bs-toggle="collapse" aria-expanded={isExpanded}
                  onClick={(e) => { e.preventDefault(); setIsExpanded(!isExpanded); }}>
                  <div className="p-4">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-3">
                        <div className="avatar"><div className="avatar-title custom-avatar rounded-circle bg-primary-subtle text-primary d-flex justify-content-center align-items-center"><h5 className="text-primary font-size-17 mb-0">01</h5></div></div>
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <h5 className="font-size-16 mb-1">General Info</h5>
                        <p className="text-muted text-truncate mb-0">Fill all information below</p>
                      </div>
                      <i className={`mdi mdi-chevron-${isExpanded ? "up" : "down"} accor-down-icon font-size-24`}></i>
                    </div>
                  </div>
                </a>
                <div id="gen-collapse" className={`collapse ${isExpanded ? "show" : ""}`} data-bs-parent="#addproduct-accordion">
                  <div className="p-4 border-top">
                    <div className="row">
                      <div className="col-lg-4 mb-3">
                        <label className="form-label">Category</label>
                        <select name="category" className="form-control" value={formData.category} onChange={(e) => { handleChange(e); categoryDtls(e.target.value); }}>
                          <option value="">Select Category</option>
                          {categoryData?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        {errors.category && <div className="text-danger small">{errors.category}</div>}
                      </div>
                      <div className="col-lg-4 mb-3">
                        <label className="form-label">Sub Category</label>
                        <select name="subCategory" className="form-control" value={formData.subCategory} onChange={handleChange}>
                          <option value="">Select Sub Category</option>
                          {subCategoryData?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                        {errors.subCategory && <div className="text-danger small">{errors.subCategory}</div>}
                      </div>
                      {/* <div className="col-lg-4 mb-3">
                        <label className="form-label">Child Category</label>
                        <select name="childCategory" className="form-control" value={formData.childCategory} onChange={handleChange}>
                          <option value="">Select Child Category</option>
                          {childCategoryData?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        {errors.childCategory && <div className="text-danger small">{errors.childCategory}</div>}
                      </div> */}
                      <div className="col-lg-3 mb-3">
                        <label className="form-label">Brand</label>
                        <select name="brand" className="form-select" value={formData.brand} onChange={handleChange}>
                          <option value="">Select Brand</option>
                          {brandData?.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                        {errors.brand && <div className="text-danger small">{errors.brand}</div>}
                      </div>
                      <div className="col-lg-3 mb-3">
                        <label className="form-label">Product Name</label>
                        <input type="text" name="productName" className="form-control" value={formData.productName} onChange={handleChange} />
                        {errors.productName && <div className="text-danger small">{errors.productName}</div>}
                      </div>
                      <div className="col-lg-3 mb-3">
                        <label className="form-label">Short Description</label>
                        <textarea name="shortDescription" className="form-control" rows="1" value={formData.shortDescription} onChange={handleChange} />
                      </div>
                      <div className="col-lg-3 mb-3">
                        <label className="form-label">Slug</label>
                        <input type="text" name="slug" className="form-control" value={formData.slug} onChange={handleChange} />
                        {errors.slug && <div className="text-danger small">{errors.slug}</div>}
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Packing Type</label>
                        <select name="packingType" className="form-select" value={formData.packingType} onChange={handleChange}>
                          <option value="">Select</option><option>Bag</option><option>Box</option>
                        </select>
                        {errors.packingType && <div className="text-danger small">{errors.packingType}</div>}
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Quantity Per Pack</label>
                        <input type="number" name="quantityPerPack" className="form-control" min={0} value={formData.quantityPerPack} onChange={handleChange} />
                        {errors.quantityPerPack && <div className="text-danger small">{errors.quantityPerPack}</div>}
                      </div>
                      <div className="col-lg-3 mb-3">
                        <label className="form-label">HSN Code</label>
                        <input type="text" name="hsn" className="form-control" value={formData.hsn} onChange={handleChange} />
                        {errors.hsn && <div className="text-danger small">{errors.hsn}</div>}
                      </div>
                      <div className="col-lg-3 mb-3">
                        <label className="form-label">Tags &amp; Label</label>
                        <select name="tagsLabel" className="form-select" value={formData.tagsLabel} onChange={handleChange}>
                          <option>Select</option><option>Best Seller</option><option>New Arrival</option><option>Top Rated</option>
                        </select>
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Refundable</label>
                        <select name="refundable" className="form-select" value={formData.refundable} onChange={handleChange}>
                          <option value="Yes">Yes</option><option value="No">No</option>
                        </select>
                      </div>
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Product Status</label>
                        <select name="productStatus" className="form-select" value={formData.productStatus} onChange={handleChange}>
                          <option value="active">Active</option><option value="inactive">Inactive</option>
                        </select>
                      </div>
                      <div className="col-lg-3 mb-3 d-flex align-items-center gap-2 pt-4">
                        <input type="checkbox" name="lowStockAlert" className="form-check-input" checked={formData.lowStockAlert} onChange={handleChangeCheckBox} />
                        <label className="form-label mb-0">Low Stock Alert</label>
                      </div>
                      {formData.lowStockAlert && (
                        <div className="col-lg-3 mb-3">
                          <label className="form-label">Alert Quantity</label>
                          <input type="number" name="lowStockQuantity" className="form-control" min="1" value={formData.lowStockQuantity || ""} onChange={handleChange} />
                        </div>
                      )}
                    </div>
                    <div className="card mt-2">
                      <div className="card-header"><h4 className="card-title mb-0">Description</h4></div>
                      <div className="card-body">
                        <CKEditor editor={ClassicEditor} data={formData.description} onChange={handleEditorChange}
                          config={{ licenseKey: "GPL", toolbar: ["undo", "redo", "heading", "|", "bold", "italic", "link", "bulletedList", "numberedList", "|", "outdent", "indent"] }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════
                  02 — TECHNICAL SPECS (O-rings only)
              ══════════════════════════════════════════════════ */}
              {isOringCategory && (
                <div className="card mb-4">
                  <a href="#tech-collapse" className={`text-body ${isTechnicalSpecsOpen ? "" : "collapsed"}`}
                    data-bs-toggle="collapse" aria-expanded={isTechnicalSpecsOpen}
                    onClick={(e) => { e.preventDefault(); setIsTechnicalSpecsOpen(!isTechnicalSpecsOpen); }}>
                    <div className="p-4">
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0 me-3"><div className="avatar"><div className="avatar-title custom-avatar rounded-circle bg-primary-subtle text-primary d-flex justify-content-center align-items-center"><h5 className="text-primary font-size-17 mb-0">02</h5></div></div></div>
                        <div className="flex-grow-1 overflow-hidden">
                          <h5 className="font-size-16 mb-1">Technical Specifications</h5>
                          <p className="text-muted text-truncate mb-0">AS 568A & JIS B 2401 standard sizes</p>
                        </div>
                        <i className={`mdi mdi-chevron-${isTechnicalSpecsOpen ? "up" : "down"} accor-down-icon font-size-24`}></i>
                      </div>
                    </div>
                  </a>
                  <div id="tech-collapse" className={`collapse ${isTechnicalSpecsOpen ? "show" : ""}`}>
                    <div className="p-4 border-top">
                      {/* AS 568A */}
                      <div className="mb-5">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0 text-primary"><i className="mdi mdi-circle-medium me-1"></i>AS 568A Standard</h6>
                          <Button onClick={handleAddAS568ASize} leftIcon={<IconPlus size={14} />} variant="light" color="blue" size="sm">Add AS 568A Size</Button>
                        </div>
                        {sizes.as_568a_standard.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-bordered" style={{ fontSize: "12px" }}>
                              <thead style={{ background: "#1e293b", color: "#fff" }}>
                                <tr>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">AS 568A SIZE</Text>
                                  </th>
                                  <th colSpan="4" className="text-center" style={{ verticalAlign: "middle", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">METRIC MEASUREMENTS IN MILLIMETERS</Text>
                                  </th>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">SKU</Text>
                                  </th>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">Stock</Text>
                                  </th>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">Weight</Text>
                                  </th>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">Cust. MRP</Text>
                                  </th>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">Price</Text>
                                  </th>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">Action</Text>
                                  </th>
                                </tr>
                                <tr>
                                  <th style={{ textAlign: "center", border: "1px solid #334155" }}><Text weight={800} color="white" size="xs">ID</Text></th>
                                  <th style={{ textAlign: "center", border: "1px solid #334155" }}><Text weight={800} color="white" size="xs">±</Text></th>
                                  <th style={{ textAlign: "center", border: "1px solid #334155" }}><Text weight={800} color="white" size="xs">CS</Text></th>
                                  <th style={{ textAlign: "center", border: "1px solid #334155" }}><Text weight={800} color="white" size="xs">±</Text></th>
                                </tr>
                              </thead>
                              <tbody>
                                {sizes.as_568a_standard.map((size, idx) => (
                                  <tr key={idx}>
                                    {[["sizeCode", "A0001", "70px"], ["metric_id_mm", "0.74", "60px"], ["metric_id_tolerance_mm", "0.10", "50px"], ["metric_cs_mm", "1.02", "60px"], ["metric_cs_tolerance_mm", "0.08", "50px"], ["sku", "SKU", "80px"], ["stock", "0", "60px"], ["weight", "g", "60px"], ["customermrp", "MRP", "80px"], ["price", "₹", "80px"]].map(([field, ph, minW]) => (
                                      <td key={field}>
                                        <TextInput
                                          placeholder={ph}
                                          value={size[field]}
                                          onChange={(e) => handleSizeChange("as_568a_standard", idx, field, e.target.value)}
                                          style={{ minWidth: minW }}
                                          styles={{ input: { fontSize: "11px" } }}
                                          error={errors[`as_568a_standard_${field}_${idx}`]}
                                        />
                                      </td>
                                    ))}
                                    <td><ActionIcon onClick={() => handleRemoveSize("as_568a_standard", idx)} color="red" variant="light" size="xs"><IconTrash size={12} /></ActionIcon></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-3 border rounded">
                            <p className="text-muted mb-2">No AS 568A sizes added yet</p>
                            <Button onClick={handleAddAS568ASize} leftIcon={<IconPlus size={14} />} variant="outline" color="blue" size="sm">Add First AS 568A Size</Button>
                          </div>
                        )}
                      </div>
                      {/* JIS B 2401 */}
                      <div>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0 text-success"><i className="mdi mdi-circle-medium me-1"></i>JIS B 2401 Standard</h6>
                          <Button onClick={handleAddJISSize} leftIcon={<IconPlus size={14} />} variant="light" color="green" size="sm">Add JIS Size</Button>
                        </div>
                        {sizes.jis_b_2401_standard.length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-bordered" style={{ fontSize: "12px" }}>
                              <thead style={{ background: "#1e293b", color: "#fff" }}>
                                <tr>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">JIS SIZE</Text>
                                  </th>
                                  <th colSpan="4" className="text-center" style={{ verticalAlign: "middle", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">MEASUREMENTS IN MILLIMETERS</Text>
                                  </th>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">SKU</Text>
                                  </th>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">Stock</Text>
                                  </th>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">Weight</Text>
                                  </th>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">Cust. MRP</Text>
                                  </th>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">Price</Text>
                                  </th>
                                  <th rowSpan="2" style={{ verticalAlign: "middle", textAlign: "center", border: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">Action</Text>
                                  </th>
                                </tr>
                                <tr>
                                  <th style={{ textAlign: "center", border: "1px solid #334155" }}><Text weight={800} color="white" size="xs">ID</Text></th>
                                  <th style={{ textAlign: "center", border: "1px solid #334155" }}><Text weight={800} color="white" size="xs">±</Text></th>
                                  <th style={{ textAlign: "center", border: "1px solid #334155" }}><Text weight={800} color="white" size="xs">CS</Text></th>
                                  <th style={{ textAlign: "center", border: "1px solid #334155" }}><Text weight={800} color="white" size="xs">±</Text></th>
                                </tr>
                              </thead>
                              <tbody>
                                {sizes.jis_b_2401_standard.map((size, idx) => (
                                  <tr key={idx}>
                                    {[["sizeCode", "G25/P25", "70px"], ["metric_id_mm", "24.40", "60px"], ["metric_id_tolerance_mm", "0.25", "50px"], ["metric_cs_mm", "3.10", "60px"], ["metric_cs_tolerance_mm", "0.10", "50px"], ["sku", "SKU", "80px"], ["stock", "0", "60px"], ["weight", "g", "60px"], ["customermrp", "MRP", "80px"], ["price", "₹", "80px"]].map(([field, ph, minW]) => (
                                      <td key={field}>
                                        <TextInput
                                          placeholder={ph}
                                          value={size[field]}
                                          onChange={(e) => handleSizeChange("jis_b_2401_standard", idx, field, e.target.value)}
                                          style={{ minWidth: minW }}
                                          styles={{ input: { fontSize: "11px" } }}
                                          error={errors[`jis_b_2401_standard_${field}_${idx}`]}
                                        />
                                      </td>
                                    ))}
                                    <td><ActionIcon onClick={() => handleRemoveSize("jis_b_2401_standard", idx)} color="red" variant="light" size="xs"><IconTrash size={12} /></ActionIcon></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-3 border rounded">
                            <p className="text-muted mb-2">No JIS B 2401 sizes added yet</p>
                            <Button onClick={handleAddJISSize} leftIcon={<IconPlus size={14} />} variant="outline" color="green" size="sm">Add First JIS Size</Button>
                          </div>
                        )}
                      </div>
                      <div className="text-muted small mt-3">
                        <p className="mb-1"><i className="mdi mdi-information-outline me-1"></i><strong>AS 568A:</strong> NOMINAL (fraction inches), STANDARD (decimal inches), METRIC (mm)</p>
                        <p className="mb-0"><i className="mdi mdi-information-outline me-1"></i><strong>JIS B 2401:</strong> G-series (static), P-series (dynamic)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════
                  02 — PRODUCT VARIANTS with column picker
                       (shown for all non-O-ring categories)
              ══════════════════════════════════════════════════ */}
              {!isOringCategory && (
                <div className="card mb-4">
                  <a href="#variant-collapse" className={`text-body ${isVariantOpen ? "" : "collapsed"}`}
                    data-bs-toggle="collapse" aria-expanded={isVariantOpen}
                    onClick={(e) => { e.preventDefault(); setIsVariantOpen(!isVariantOpen); }}>
                    <div className="p-4">
                      <div className="d-flex align-items-center">
                        <div className="flex-shrink-0 me-3"><div className="avatar"><div className="avatar-title custom-avatar rounded-circle bg-primary-subtle text-primary d-flex justify-content-center align-items-center"><h5 className="text-primary font-size-17 mb-0">02</h5></div></div></div>
                        <div className="flex-grow-1 overflow-hidden">
                          <h5 className="font-size-16 mb-1">Product Variants</h5>
                          <p className="text-muted text-truncate mb-0">
                            {variantRows.length > 0
                              ? `${variantRows.length} variant(s) | ${fullColumnList.map(c => c.label).join(", ")}`
                              : "Choose columns and add size / material / dimension variants"}
                          </p>
                        </div>
                        <i className={`mdi mdi-chevron-${isVariantOpen ? "up" : "down"} accor-down-icon font-size-24`}></i>
                      </div>
                    </div>
                  </a>

                  <div id="variant-collapse" className={`collapse ${isVariantOpen ? "show" : ""}`}>
                    <div className="p-4 border-top">

                      {/* ── Compact Column Selector ─────────────────────────── */}
                      <div
                        className="mb-3 px-4 py-3 rounded-3"
                        style={{
                          background: "#f8fafc",
                          border: "1.5px solid #e2e8f0",
                          boxShadow: "0 2px 8px rgba(15,23,42,0.05)",
                        }}
                      >
                        <div className="d-flex align-items-center mb-3" style={{ gap: "8px" }}>
                          <div
                            style={{
                              width: "4px", height: "16px", borderRadius: "4px",
                              background: "#1e293b",
                            }}
                          />
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              color: "#475569",
                              letterSpacing: "0.1em",
                              textTransform: "uppercase",
                            }}
                          >
                            Variant Fields
                          </span>
                        </div>

                        <Group spacing={6} align="center" style={{ flexWrap: "wrap" }}>
                          {/* Common columns — permanently shown */}
                          {COMMON_COLUMNS.map((col) => (
                            <Tooltip label="Required field — cannot be removed" key={col.key} withArrow>
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  padding: "5px 11px",
                                  borderRadius: "8px",
                                  background: "#dbeafe",
                                  border: "1px solid #93c5fd",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  color: "#1d4ed8",
                                  cursor: "default",
                                  userSelect: "none",
                                }}
                              >
                                <IconCheck size={10} stroke={3} color="#1d4ed8" />
                                {col.label}
                              </div>
                            </Tooltip>
                          ))}

                          {/* Selected extra columns — removable */}
                          {selectedExtraColumns.map((col) => (
                            <div
                              key={col.key}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "5px 8px 5px 11px",
                                borderRadius: "8px",
                                background: "#ffffff",
                                border: "1.5px solid #cbd5e1",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#334155",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                              }}
                            >
                              {col.label}
                              <button
                                type="button"
                                onClick={() => handleRemoveExtraColumn(col.key)}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "16px",
                                  height: "16px",
                                  borderRadius: "50%",
                                  background: "#fee2e2",
                                  border: "1px solid #fecaca",
                                  color: "#dc2626",
                                  cursor: "pointer",
                                  padding: 0,
                                  flexShrink: 0,
                                }}
                                title={`Remove ${col.label}`}
                              >
                                <IconX size={9} stroke={3} />
                              </button>
                            </div>
                          ))}

                          {/* Add Button */}
                          <button
                            type="button"
                            onClick={() => setShowColumnPicker(true)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "5px 12px",
                              borderRadius: "8px",
                              background: "#1e293b",
                              border: "none",
                              fontSize: "11px",
                              fontWeight: 700,
                              color: "#ffffff",
                              cursor: "pointer",
                              letterSpacing: "0.03em",
                              transition: "background 0.15s ease",
                              boxShadow: "0 2px 6px rgba(15,23,42,0.2)",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#0f172a"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#1e293b"; }}
                          >
                            <IconPlus size={11} stroke={3} />
                            Add Field
                          </button>
                        </Group>
                      </div>

                      {/* ── Column Picker Modal ─────────────────────────── */}
                      <Modal
                        opened={showColumnPicker}
                        onClose={() => { setShowColumnPicker(false); setVariantSearch(""); }}
                        title={
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div
                              style={{
                                width: "30px", height: "30px", borderRadius: "8px",
                                background: "#1e293b",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <IconColumns size={15} color="#fff" />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a", lineHeight: 1.2 }}>
                                Add Variant Field
                              </div>
                              <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                                Search existing or create new
                              </div>
                            </div>
                          </div>
                        }
                        centered
                        size="sm"
                        overlayBlur={3}
                        styles={{
                          modal: { borderRadius: "16px" },
                          header: {
                            padding: "16px 20px 14px",
                            borderBottom: "1px solid #f1f5f9",
                            background: "#fafafa",
                            borderRadius: "16px 16px 0 0",
                          },
                          body: { padding: "16px 20px 20px" },
                        }}
                      >
                        <Stack spacing="sm">
                          <TextInput
                            placeholder="Search or type new variant name..."
                            icon={<IconSearch size={14} color="#94a3b8" />}
                            value={variantSearch}
                            onChange={(e) => setVariantSearch(e.target.value)}
                            autoFocus
                            styles={{
                              input: {
                                borderRadius: "10px",
                                border: "1.5px solid #e2e8f0",
                                fontSize: "13px",
                                background: "#f8fafc",
                                padding: "10px 14px 10px 36px",
                                "&:focus": { borderColor: "#1e293b", background: "#fff" },
                              },
                            }}
                            rightSection={
                              variantSearch && (
                                <ActionIcon
                                  size="xs"
                                  radius="xl"
                                  variant="filled"
                                  onClick={() => setVariantSearch("")}
                                  styles={{ root: { background: "#cbd5e1", color: "#475569" } }}
                                >
                                  <IconX size={10} />
                                </ActionIcon>
                              )
                            }
                          />

                          <div>
                            <Text
                              size="10px"
                              weight={800}
                              mb={6}
                              style={{
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                color: "#94a3b8",
                              }}
                            >
                              Available Fields
                            </Text>
                            <ScrollArea h={190} offsetScrollbars>
                              <Stack spacing={2}>
                                {unselectedColumns
                                  .filter((col) =>
                                    col.label.toLowerCase().includes(variantSearch.toLowerCase())
                                  )
                                  .map((col) => (
                                    <button
                                      key={col.key}
                                      type="button"
                                      onClick={() => {
                                        handleAddExtraColumn(col);
                                        setShowColumnPicker(false);
                                        setVariantSearch("");
                                      }}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                        width: "100%",
                                        padding: "9px 12px",
                                        borderRadius: "8px",
                                        background: "transparent",
                                        border: "1px solid transparent",
                                        fontSize: "13px",
                                        fontWeight: 500,
                                        color: "#1e293b",
                                        cursor: "pointer",
                                        textAlign: "left",
                                        transition: "all 0.1s ease",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "#f1f5f9";
                                        e.currentTarget.style.borderColor = "#e2e8f0";
                                        e.currentTarget.style.paddingLeft = "16px";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.borderColor = "transparent";
                                        e.currentTarget.style.paddingLeft = "12px";
                                      }}
                                    >
                                      {col.label}
                                    </button>
                                  ))}

                                {variantSearch.trim() !== "" &&
                                  !unselectedColumns.some(
                                    (col) => col.label.toLowerCase() === variantSearch.toLowerCase()
                                  ) && (
                                    <button
                                      type="button"
                                      onClick={handleCreateNewVariant}
                                      disabled={isCreatingVariant}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "7px",
                                        width: "100%",
                                        padding: "10px 14px",
                                        marginTop: "8px",
                                        borderRadius: "10px",
                                        background: "#1e293b",
                                        fontSize: "13px",
                                        fontWeight: 700,
                                        color: "#fff",
                                        cursor: isCreatingVariant ? "not-allowed" : "pointer",
                                        opacity: isCreatingVariant ? 0.7 : 1,
                                        transition: "all 0.15s ease",
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isCreatingVariant) {
                                          e.currentTarget.style.background = "#0f172a";
                                          e.currentTarget.style.borderColor = "#94a3b8";
                                        }
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "#1e293b";
                                        e.currentTarget.style.borderColor = "#475569";
                                      }}
                                    >
                                      {isCreatingVariant ? (
                                        <Loader size={13} color="white" />
                                      ) : (
                                        <IconPlus size={13} stroke={3} />
                                      )}
                                      {isCreatingVariant ? "Creating..." : `Create & Add "${variantSearch}"`}
                                    </button>
                                  )}

                                {variantSearch.trim() === "" && unselectedColumns.length === 0 && (
                                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                                    <IconCheck size={24} color="#86efac" style={{ marginBottom: "6px" }} />
                                    <Text size="xs" color="dimmed">All fields have been added.</Text>
                                  </div>
                                )}
                              </Stack>
                            </ScrollArea>
                          </div>
                        </Stack>
                      </Modal>

                      {/* ── Variant Table ────────────────────────────── */}
                      {variantRows.length > 0 ? (
                        <div className="table-responsive rounded-3 border bg-white" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                          <table className="table table-hover align-middle mb-0" style={{ fontSize: "13px" }}>
                            <thead style={{ background: "#1e293b", color: "#fff" }}>
                              <tr>
                                <th style={{ width: "50px", textAlign: "center", borderBottom: "1px solid #334155" }}>
                                  <Text weight={800} transform="uppercase" color="white" size="xs">#</Text>
                                </th>
                                {selectedExtraColumns.map((col) => (
                                  <th key={col.key} style={{ borderBottom: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">
                                      {col.label}
                                    </Text>
                                  </th>
                                ))}
                                {COMMON_COLUMNS.map((col) => (
                                  <th key={col.key} style={{ borderBottom: "1px solid #334155" }}>
                                    <Text weight={800} transform="uppercase" color="white" size="xs">
                                      {col.label}
                                    </Text>
                                  </th>
                                ))}
                                <th style={{ width: "80px", textAlign: "center", borderBottom: "1px solid #334155" }}>
                                  <Text weight={800} transform="uppercase" color="white" size="xs">Action</Text>
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {variantRows.map((row, rowIdx) => (
                                <tr key={rowIdx}>
                                  <td className="text-center text-muted" style={{ fontSize: "11px" }}>{rowIdx + 1}</td>
                                  {selectedExtraColumns.map((col) => (
                                    <td key={col.key}>
                                      <TextInput
                                        size="xs"
                                        variant="filled"
                                        placeholder={`Enter ${col.label}...`}
                                        error={errors[`v_${col.key}_${rowIdx}`]}
                                        value={row[col.key] || ""}
                                        onChange={(e) => handleVariantRowChange(rowIdx, col.key, e.target.value)}
                                        styles={{ input: { fontSize: '12px' } }}
                                      />
                                    </td>
                                  ))}
                                  {COMMON_COLUMNS.map((col) => (
                                    <td key={col.key}>
                                      <TextInput
                                        size="xs"
                                        variant="filled"
                                        type={col.type}
                                        placeholder={col.placeholder}
                                        error={errors[`v_${col.key}_${rowIdx}`]}
                                        value={row[col.key] || ""}
                                        onChange={(e) => handleVariantRowChange(rowIdx, col.key, e.target.value)}
                                        styles={{ input: { fontSize: '12px' } }}
                                      />
                                    </td>
                                  ))}
                                  <td className="text-center">
                                    <Tooltip label="Remove variation">
                                      <ActionIcon
                                        onClick={() => handleRemoveVariantRow(rowIdx)}
                                        color="red"
                                        variant="light"
                                        size="sm"
                                      >
                                        <IconTrash size={14} />
                                      </ActionIcon>
                                    </Tooltip>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="py-5 border rounded-3 bg-light d-flex flex-column align-items-center justify-content-center" style={{ borderStyle: "dashed !important", background: "rgba(248, 249, 250, 0.5)" }}>
                          <Stack align="center" spacing="xs">
                            <IconColumns size={32} color="#adb5bd" stroke={1.5} />
                            <Stack spacing={2} align="center">
                              <Text weight={600} size="sm" color="gray.7">No variants configured</Text>
                              <Text size="xs" color="dimmed" align="center">
                                Add columns above to define attributes, then add variation rows.
                              </Text>
                            </Stack>
                            <Button
                              onClick={handleAddVariantRow}
                              leftIcon={<IconPlus size={14} />}
                              variant="light"
                              color="indigo"
                              size="sm"
                              mt="sm"
                            >
                              Add First variation
                            </Button>
                          </Stack>
                        </div>
                      )}

                      {/* Add row button */}
                      {variantRows.length > 0 && (
                        <Group position="right" mt="sm">
                          <Button
                            onClick={handleAddVariantRow}
                            leftIcon={<IconPlus size={16} />}
                            variant="subtle"
                            color="indigo"
                            size="sm"
                            styles={{ root: { fontWeight: 500 } }}
                          >
                            Add another variation
                          </Button>
                        </Group>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════════
                  03 — META TAGS
              ══════════════════════════════════════════════════ */}
              <div className="card mb-4">
                <div className="text-body collapsed" style={{ cursor: "pointer" }}
                  data-bs-toggle="collapse" data-bs-target="#meta-collapse"
                  onClick={() => setIsMetaTagsOpen(!isMetaTagsOpen)}>
                  <div className="p-4">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-3"><div className="avatar"><div className="avatar-title custom-avatar rounded-circle bg-primary-subtle text-primary d-flex justify-content-center align-items-center"><h5 className="text-primary font-size-17 mb-0">03</h5></div></div></div>
                      <div className="flex-grow-1 overflow-hidden">
                        <h5 className="font-size-16 mb-1">Product Meta Tags</h5>
                        <p className="text-muted text-truncate mb-0">SEO information</p>
                      </div>
                      <i className={`mdi mdi-chevron-${isMetaTagsOpen ? "up" : "down"} accor-down-icon font-size-24`}></i>
                    </div>
                  </div>
                </div>
                <div id="meta-collapse" className={`collapse ${isMetaTagsOpen ? "show" : ""}`}>
                  <div className="p-4 border-top">
                    <div className="col-12 mb-3"><label className="form-label">Meta Title</label><input type="text" name="metaTitle" className="form-control" value={formData.metaTitle} onChange={handleChange} /></div>
                    <div className="col-12 mb-3"><label className="form-label">Meta Keywords</label><input type="text" name="metaKey" className="form-control" value={formData.metaKey} onChange={handleChange} /></div>
                    <div className="col-12 mb-3"><label className="form-label">Meta Description</label><textarea name="metaDescription" className="form-control" rows="3" value={formData.metaDescription} onChange={handleChange} /></div>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════
                  04 — IMAGES
              ══════════════════════════════════════════════════ */}
              <div className="card mb-4">
                <a onClick={() => setImageOpen(!imageOpen)} className={`text-body ${imageOpen ? "" : "collapsed"}`} style={{ cursor: "pointer" }}>
                  <div className="p-4">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0 me-3"><div className="avatar"><div className="avatar-title custom-avatar rounded-circle bg-primary-subtle text-primary d-flex justify-content-center align-items-center"><h5 className="text-primary font-size-17 mb-0">04</h5></div></div></div>
                      <div className="flex-grow-1 overflow-hidden">
                        <h5 className="font-size-16 mb-1">Images</h5>
                        <p className="text-muted text-truncate mb-0">Product & additional images</p>
                      </div>
                      <i className={`mdi mdi-chevron-${imageOpen ? "up" : "down"} accor-down-icon font-size-24`}></i>
                    </div>
                  </div>
                </a>
                {imageOpen && (
                  <div className="p-4 border-top">
                    <div className="row">
                      <div className="col-lg-3">
                        <label className="form-label">Product Image</label>
                        <input className="form-control" type="file" accept="image/*" onChange={(e) => handleFileChange(e, "productImage")} />
                        {errors.productImage && <div className="text-danger small">{errors.productImage}</div>}
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          {(formData.productImage || []).map((img, i) => (
                            <div key={i} style={{ position: "relative" }}>
                              <img src={img instanceof File ? URL.createObjectURL(img) : `${IMAGE_BASE_URL}${img.docPath}/${img.docName}`} className="img-thumbnail" style={{ width: "60px", height: "60px", objectFit: "cover" }} />
                              <button type="button" onClick={() => handleDeleteImage(i)} style={{ position: "absolute", top: 0, right: 0, background: "red", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer", fontSize: "11px" }}>×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="col-lg-3">
                        <label className="form-label">Additional Images</label>
                        <input className="form-control" type="file" multiple accept="image/*" onChange={(e) => handleFileChange(e, "additionalImages")} />
                        <div className="mt-2 d-flex flex-wrap gap-2">
                          {(formData.additionalImages || []).map((img, i) => (
                            <div key={i} style={{ position: "relative" }}>
                              <img src={img instanceof File ? URL.createObjectURL(img) : `${IMAGE_BASE_URL}${img.docPath}/${img.docName}`} className="img-thumbnail" style={{ width: "60px", height: "60px", objectFit: "cover" }} />
                              <button type="button" onClick={() => handleDeleteAdditionalImage(i)} style={{ position: "absolute", top: 0, right: 0, background: "red", color: "white", border: "none", borderRadius: "50%", width: "18px", height: "18px", cursor: "pointer", fontSize: "11px" }}>×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        <div className="modal-footer mt-3">
          <button type="button" onClick={handleClose} className="btn btn-secondary me-1 px-32">Cancel</button>
          <button type="submit" className="btn btn-primary px-32" onClick={handleSubmit}>Save</button>
        </div>
      </div>
    </div>
  );
};

export default CreateProductListLayer;