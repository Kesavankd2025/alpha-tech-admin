import { useState, useEffect, useMemo } from "react";
import Select from "react-select";
import { Icon } from "@iconify/react/dist/iconify.js";
import { ToastContainer, toast } from "react-toastify";
import { Modal, Button } from "react-bootstrap";
import apiProvider from "../apiProvider/api";
import prodapiProvider from "../apiProvider/product";
import ReactTableComponent from "../table/ReactTableComponent";
import { IMAGE_BASE_URL } from "../network/apiClient";
import { IconTrash, IconPlus } from "@tabler/icons-react";
import "../components/styles/offerViewPopup.css";

const OfferPageLayer = () => {
  const initialDiscountGroup = {
    offerName: "",
    image: null,
    categories: [],
    products: [],
    percentage: "",
    isActive: true,
    startDate: "",
    endDate: "",
  };

  const initialPackageGroup = {
    offerName: "",
    image: null,
    categories: [],
    products: [{ id: null, attributes: [] }],
    fixedAmount: "",
    applicableForCustomer: null,
    isActive: true,
    startDate: "",
    endDate: "",
    totalPrice: "",
    stock: "",
  };
  const [deletingId, setDeletingId] = useState(null);
  const [state, setState] = useState({
    discountOffers: [],
    packageOffers: [],
    discountForm: { ...initialDiscountGroup },
    packageForm: { ...initialPackageGroup },
    offerName: "",
    startDate: "",
    endDate: "",
    isActive: true,
    applicableForCustomer: null,

    // UI state
    showDiscountModal: false,
    showPackageModal: false,
    showViewModal: false,
    editDiscountIndex: null,
    editPackageIndex: null,
    viewOfferData: null,
  });

  // Data state
  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [productsOption, setproductsOptions] = useState([]);
  const [previewImageURL, setPreviewImageURL] = useState(null);
  const [errors, setErrors] = useState({});
  const [discountOffers, setDiscountOffers] = useState([]);
  const [packageOffers, setPackageOffers] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [editMode, seteditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [finalProducts, setFinalProducts] = useState([]);
  const [totalPrice, settotalPrice] = useState(0);
  const filterableColumns = ["offerName", "categoryDetails", "productDetails"];
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Get filtered products for package form (excludes already selected products)
  const getFilteredProducts = useMemo(() => {
    const selectedProductIds = state.packageForm.products
      .map((product) => product.id)
      .filter((id) => id !== null);

    return productsOption.filter(
      (product) => !selectedProductIds.includes(product.value)
    );
  }, [productsOption, state.packageForm.products]);

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      // Fetch categories
      let input = {};
      const categoryResult = await apiProvider.getCategory(input);
      console.log(categoryResult, "categoryResult");
      if (categoryResult.status) {
        setCategories(
          categoryResult?.response?.data?.items.map((cat) => ({
            value: cat._id,
            label: cat.name,
          }))
        );
      }

      // Fetch all products
      const productResult = await prodapiProvider.getProductsByCategoryId();
      if (productResult.status) {
        setAllProducts(
          productResult?.response?.data.map((prod) => ({
            value: prod._id,
            label: prod.productName,
            categoryId: prod.categoryIdDetails?._id || prod.categoryId,
            basePrice: prod.customerBasePrice || 0,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      toast.error("Failed to load initial data");
    }
  };

  useEffect(() => {
    fetchInitialData();
    getDiscountOffers();
    getPackageOffers();
  }, []);

  const getDiscountOffers = async () => {
    const input = {
      page: pageIndex + 1,
      limit: pageSize,
      offerType: "individual",
      type: "customer",
      filters: {},
      sortBy: "",
      sortOrder: "",
    };

    // Convert filters array to filters object
    filters.forEach((filter) => {
      input.filters[filter.id] = filter.value;
    });

    if (sorting.length > 0) {
      input.sortBy = sorting[0].id;
      input.sortOrder = sorting[0].desc ? "desc" : "asc";
    }
    const getOffers = await prodapiProvider.getOffer(input);
    console.log(getOffers, "getOffers");
    if (getOffers.status && getOffers?.response?.data) {
      setState((prevState) => ({
        ...prevState,
        discountOffers: getOffers?.response?.data,
      }));
      setTotalPages(getOffers.response.totalPages);
      console.log(getOffers?.response?.data, "getOffers?.response?.data");
    }
  };

  const getPackageOffers = async () => {
    const input = {
      page: pageIndex + 1,
      limit: pageSize,
      offerType: "package",
    };

    const getOffers = await prodapiProvider.getOffer(input);

    if (getOffers.status && getOffers?.response?.data) {
      const normalized = getOffers.response.data.map((offer) => ({
        ...offer,
        applicableForCustomer: Boolean(offer.applicableForCustomer),
        isActive: Boolean(offer.isActive),
      }));
      console.log(normalized, "normalized--------pakage");
      setState((prev) => ({
        ...prev,
        packageOffers: normalized,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setState((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle discount form changes
  const handleDiscountChange = async (field, value) => {
    console.log(field, value, "value");
    setState((prev) => ({
      ...prev,
      discountForm: {
        ...prev.discountForm,
        [field]: value,
      },
    }));

    // Clear name error if it exists and meets length requirement
    if (field === "offerName") {
      if (value.length >= 3 && errors.offerName) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.offerName;
          return newErrors;
        });
      }
    }
    if (field === "categories") {
      const idString = value.map((item) => String(item.value)).join(",");
      console.log(idString);
      const productResult = await prodapiProvider.getProductsByCategoryId(
        idString
      );
      console.log(productResult, "productResult");
      let arr = [];
      if (productResult?.data?.data) {
        arr = productResult.data.data.map((ival) => ({
          value: ival._id,
          label: ival.productName,
        }));
      }
      console.log(arr);
      setproductsOptions(arr);
    }
  };

  const handlePackageChange = async (field, value) => {
    setState((prev) => {
      let newProducts = prev.packageForm.products;

      if (field === "categories") {
        if (value.length === 0) {
          newProducts = [];
        } else if (prev.packageForm.products.length === 0) {
          newProducts = [{ id: null, attributes: [] }];
        }
      }

      return {
        ...prev,
        packageForm: {
          ...prev.packageForm,
          [field]: value,
          products: newProducts,
        },
      };
    });

    // Clear name error if it exists and meets length requirement
    if (field === "offerName") {
      if (value.length >= 3 && errors.offerName) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.offerName;
          return newErrors;
        });
      }
    }

    if (field === "categories") {
      if (value.length === 0) {
        setproductsOptions([]);
      } else {
        try {
          const idString = value.map((item) => String(item.value)).join(",");
          console.log("Fetching products for categories:", idString);
          const productResult = await prodapiProvider.getProductsByCategoryId(
            idString
          );

          if (productResult?.data?.data) {
            // Check specific path from previous log
            setAllProducts(productResult.data.data);
            const options = productResult.data.data.map((ival) => ({
              value: ival._id,
              label: ival.productName,
            }));
            setproductsOptions(options);
          } else if (productResult?.response?.data) {
            // Fallback check
            setAllProducts(productResult.response.data);
            const options = productResult.response.data.map((ival) => ({
              value: ival._id,
              label: ival.productName,
            }));
            setproductsOptions(options);
          }
        } catch (error) {
          console.error("Error fetching products:", error);
          setproductsOptions([]);
        }
      }
    }
  };

  // Handle image upload
  const handleImageUpload = (key, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Size Validation (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImageURL(reader.result); // Preview for new image
      setState((prev) => ({
        ...prev,
        discountForm: {
          ...prev.discountForm,
          image: file, // Store the new image file
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  const packageImageUpload = (key, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Size Validation (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      e.target.value = null; // Clear input
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImageURL(reader.result); // Preview for new image
      setState((prev) => ({
        ...prev,
        packageForm: {
          ...prev.packageForm,
          image: file, // Store the new image file
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  // Open discount modal
  const openDiscountModal = () => {
    if (state.discountOffers.length >= 3) {
      toast.error(
        "Maximum number of offers reached. Remove one to add a new offer"
      );
    } else {
      seteditMode(false);
      setEditId(null);
      setPreviewImageURL(null);
      setErrors({});
      setState((prev) => ({
        ...prev,
        showDiscountModal: true,
        editDiscountIndex: null,
        discountForm: { ...initialDiscountGroup },
        existingImage: null,
      }));
    }
  };

  const handleEdit = async (offer, index) => {
    console.log(offer.applicableForCustomer, "applicableForCustomer");

    seteditMode(true);
    setEditId(offer._id);

    try {
      // Fetch products for the categories in this offer
      const idString = offer.categories.map((c) => c._id).join(",");
      console.log("Fetching products for categories in handleEdit:", idString);
      const productResult = await prodapiProvider.getProductsByCategoryId(
        idString
      );

      if (productResult?.status) {
        const loadedProducts =
          productResult?.data?.data || productResult?.response?.data || [];
        setAllProducts(loadedProducts);
        const options = loadedProducts.map((p) => ({
          value: p._id,
          label: p.productName,
        }));
        setproductsOptions(options);
      }
    } catch (error) {
      console.error("Error fetching products in handleEdit:", error);
    }

    setState((prev) => ({
      ...prev,
      discountForm: {
        offerName: offer.offerName,
        categories: offer.categories.map((c) => ({
          label: c.name,
          value: c._id,
        })),
        products: offer.productDetails.map((p) => ({
          label: p.productName,
          value: p._id,
        })),
        percentage: offer.discount,
        startDate: offer.startDate.split("T")[0],
        endDate: offer.endDate.split("T")[0],
        image: null, // New image will come here if selected
        isActive: offer.isActive,
      },
      existingImage: offer.images.length > 0 ? offer.images[0] : null, // Store existing image separately
      editDiscountIndex: index,
      showDiscountModal: true,
    }));
    console.log(offer.applicableForCustomer, "applicableForCustomer");
    setPreviewImageURL(null); // Reset preview image
  };

  // Open package modal
  const openPackageModal = () => {
    if (state.packageOffers.length >= 3) {
      toast.error(
        "Maximum number of offers reached. Remove one to add a new offer"
      );
    } else {
      seteditMode(false);
      setEditId(null);
      setPreviewImageURL(null);
      setErrors({});
      settotalPrice(0);
      setFinalProducts([]);
      setState((prev) => ({
        ...prev,
        showPackageModal: true,
        editPackageIndex: null,
        packageForm: { ...initialPackageGroup },
        existingImage: null,
      }));
    }
  };

  // Open view modal
  const openViewModal = (offer) => {
    setState((prev) => ({
      ...prev,
      showViewModal: true,
      viewOfferData: offer,
    }));
  };

  // Close modals
  const closeModals = () => {
    setState((prev) => ({
      ...prev,
      showDiscountModal: false,
      showPackageModal: false,
      showViewModal: false,
      editDiscountIndex: null,
      editPackageIndex: null,
      viewOfferData: null,
    }));
  };

  // Add/update discount offer
  const handleDiscountSubmit = async () => {
    const { offerName, categories, products, percentage, startDate, endDate } =
      state.discountForm;
    const errors = {};

    if (offerName === "" || !offerName) {
      errors.offerName = "Enter your offer name";
      setErrors(errors);
      return false;
    } else if (offerName.length < 3) {
      errors.offerName = "Offer name must be at least 3 characters";
      setErrors(errors);
      return false;
    }

    // Image validation: Only required when creating
    if (!state.discountForm.image && !editMode) {
      errors.image = "Select image";
      setErrors(errors);
      return false;
    }

    if (categories && categories.length === 0) {
      errors.categories = "Select categories";
      setErrors(errors);
      return false;
    }

    if (products && products.length === 0) {
      errors.products = "Select products";
      setErrors(errors);
      return false;
    }

    if (!percentage || percentage < 1 || percentage > 99 || percentage === "") {
      errors.percentage = "Enter percentage 1-99%";
      setErrors(errors);
      return false;
    }

    if (!startDate) {
      errors.startDate = "Enter start date";
      setErrors(errors);
      return false;
    }

    if (!endDate) {
      errors.endDate = "Enter end date";
      setErrors(errors);
      return false;
    }
    const input = new FormData();
    input.append("offerName", offerName);

    if (state.discountForm.image) {
      input.append("image", state.discountForm.image);
    }

    // For arrays, you might need to append each item separately

    const productIds = products?.map((p) => ({
      id: p.value,
      attribute: null,
    }));
    input.append(
      "categoryId",
      categories?.map((c) => c.value)
    );
    input.append(
      "productId",
      products?.map((c) => c.value)
    );
    input.append("discount", percentage);
    input.append("startDate", startDate);
    input.append("endDate", endDate);
    input.append("isActive", state.discountForm?.isActive);
    input.append("offerType", "individual");
    input.append("fixedAmount", "0"); // Convert number to string
    console.log([...input.entries()], "input");
    if (editMode) {
      const productResult = await prodapiProvider.updateOffer(editId, input);
      if (productResult.status) {
        const result = await prodapiProvider.getOffer();
        toast.success(`Discount offer updated successfully!`);
        console.log(result, "Update Result");
        fetchInitialData();
        getDiscountOffers();
        getPackageOffers();
      }
    } else {
      const productResult = await prodapiProvider.createOffer(input);
      if (productResult.status) {
        const result = await prodapiProvider.getOffer();
        toast.success(`Discount offer added successfully!`);
        console.log(result, "Create Result");
        fetchInitialData();
        getDiscountOffers();
        getPackageOffers();
      }
    }
    setState((prev) => ({
      ...prev,
      discountForm: {
        offerName: "",
        categories: [],
        products: [],
        percentage: "",
        startDate: "",
        endDate: "",
        image: null,
        isActive: true,
      },
      existingImage: null,
      showDiscountModal: false,
      editDiscountIndex: null,
    }));

    setPreviewImageURL(null);
    seteditMode(false);
  };

  // Add/update package offer
  const handlePackageSubmit = async () => {
    const {
      offerName,
      categories,
      products,
      startDate,
      endDate,
      fixedAmount,
      applicableForCustomer,
      stock,
    } = state.packageForm;
    const errors = {};

    if (offerName === "" || !offerName) {
      errors.offerName = "Enter your offer name";
      setErrors(errors);
      return false;
    } else if (offerName.length < 3) {
      errors.offerName = "Offer name must be at least 3 characters";
      setErrors(errors);
      return false;
    }

    // Image validation: Only required when creating
    if (!state.packageForm.image && !editMode) {
      errors.image = "Select image";
      setErrors(errors);
      return false;
    }

    if (categories && categories.length === 0) {
      errors.categories = "Select categories";
      setErrors(errors);
      return false;
    }

    const productErrors = [];
    let hasProductErrors = false;

    if (!products || products.length === 0) {
      errors.products = "Select at least one product";
      setErrors(errors);
      return false;
    }

    products.forEach((product, index) => {
      const rowError = {};
      const productData = allProducts?.find((p) => p._id === product.id);
      const hasAttributes = productData?.customerAttributeDetails?.length > 0;

      if (!product.id) {
        rowError.id = true;
        hasProductErrors = true;
      }

      if (hasAttributes && (!product.attributes || !product.attributes.id)) {
        rowError.attributes = true;
        hasProductErrors = true;
      }

      productErrors[index] = rowError;
    });

    if (hasProductErrors) {
      errors.products = productErrors;
      setErrors(errors);
      return false;
    }

    if (fixedAmount === "" || !fixedAmount) {
      errors.fixedAmount = "Enter fixedamount";
      setErrors(errors);
      return false;
    }

    if (!startDate) {
      errors.startDate = "Enter start date";
      setErrors(errors);
      return false;
    }

    if (!endDate) {
      errors.endDate = "Enter end date";
      setErrors(errors);
      return false;
    }
    if (fixedAmount > totalPrice) {
      errors.fixedAmount = "Fixed amount should be less than the total price";
      setErrors(errors);
      return false;
    }

    const total = Number(totalPrice);
    const discounted = Number(state.packageForm.fixedAmount);

    // ❌ Invalid or empty
    if (isNaN(discounted) || discounted === "") {
      errors.fixedAmount = "Enter discounted price";
      setErrors(errors);
      return;
    }

    // ❌ Negative value
    if (discounted < 0) {
      errors.fixedAmount = "Discounted price cannot be negative";
      setErrors(errors);
      return;
    }

    // ❌ Above total amount (THIS IS YOUR MAIN REQUIREMENT)
    if (discounted > total) {
      errors.fixedAmount = `Discounted price must be less than or equal to ₹${total}`;
      setErrors(errors);
      return;
    }

    const input = new FormData();
    console.log(state.packageForm.products, "state.packageForm.products");

    input.append("offerName", offerName);

    if (state.packageForm.image) {
      input.append("image", state.packageForm.image); // New image
    }

    input.append(
      "categoryId",
      categories.map((c) => c.value)
    );
    input.append("productId", JSON.stringify(finalProducts));
    input.append("discount", 0);
    input.append("startDate", startDate);
    input.append("endDate", endDate);
    // input.append("isActive", state.packageForm.isActive);
    input.append("offerType", "package");
    input.append("fixedAmount", fixedAmount);
    input.append(
      "applicableForCustomer",
      state.packageForm.applicableForCustomer ? "true" : "false"
    );
    input.append("isActive", state.packageForm.isActive ? "true" : "false");

    input.append("stock", Number(stock));
    input.append("mrpPrice", Number(totalPrice));
    console.log([...input], "input");
    if (editMode) {
      console.log(editId, "editId");
      const productResult = await prodapiProvider.updateOffer(editId, input);
      if (productResult.status) {
        const result = await prodapiProvider.getOffer();

        console.log(result, "Update Result");
        fetchInitialData();
        getDiscountOffers();
        getPackageOffers();
      }
    } else {
      const productResult = await prodapiProvider.createOffer(input);
      if (productResult.status) {
        // toast.success('Package offer created successfully!');
        // Reset form first
        setState((prev) => ({
          ...prev,
          packageForm: {
            ...prev.packageForm,
            offerName: "",
            categories: [],
            products: [],
            fixedAmount: "",
            startDate: "",
            endDate: "",
            image: null,
            isActive: true,
            applicableForCustomer: false,
            stock: "",
          },
          existingImage: null,
          showDiscountModal: false,
          editDiscountIndex: null,
        }));
        setPreviewImageURL(null);

        // Then refresh the data
        try {
          await Promise.all([
            fetchInitialData(),
            getDiscountOffers(),
            getPackageOffers(),
          ]);
        } catch (error) {
          console.error("Error refreshing offers:", error);
          toast.error("Failed to refresh offers list");
        }
      } else {
        toast.error("Failed to create package offer");
      }
    }
    toast.success(
      `Package offer ${editMode ? "updated" : "added"} successfully!`
    );
    setState((prev) => ({
      ...prev,
      existingImage: null,
      showPackageModal: false, // Close the correct modal
      editDiscountIndex: null,
    }));

    setPreviewImageURL(null);
    seteditMode(false);
    closeModals();
  };

  useEffect(() => {
    getTotalMrp();
  }, [state.packageForm.products]);

  const getTotalMrp = () => {
    if (allProducts?.length > 0) {
      console.log(allProducts, "state.packageForm.products");
      const finalProducts = state.packageForm.products.map((product) => {
        // Initialize empty attributes object
        const formattedAttributes = {};
        // Check if product has attributes
        if (product.attributes) {
          // Handle both array and single object cases
          const attributesList = Array.isArray(product.attributes)
            ? product.attributes
            : [product.attributes];

          // Process each attribute
          attributesList.forEach((attr) => {
            if (attr && attr.id && attr.name) {
              // Convert name to lowercase for consistent keys
              const attributeKey = attr.name;
              formattedAttributes[attributeKey] = attr.id;
            }
          });
        }

        return {
          id: product._id || product.id, // Use whichever field contains product ID
          attributes: formattedAttributes,
        };
      });
      // console.log(finalProducts, "finalProducts");
      setFinalProducts(finalProducts);

      const calculatedTotal = finalProducts?.reduce((sum, selected) => {
        const product = allProducts?.find((p) => p._id === selected.id);
        if (
          !product ||
          !product.customerAttribute ||
          !product.customerAttribute.rowData
        )
          return sum;

        const attributeKey = Object.keys(selected.attributes)[0];
        const attributeValue = selected.attributes[attributeKey];

        const matchedRow = product.customerAttribute.rowData.find(
          (row) => row[attributeKey] === attributeValue
        );
        if (matchedRow && matchedRow.price) {
          return sum + parseFloat(matchedRow.price);
        }
        return sum;
      }, 0);

      settotalPrice(calculatedTotal);
    }
  };
  const toAttributeArray = (attributes) => {
    if (Array.isArray(attributes)) return attributes;
    if (attributes && typeof attributes === "object") return [attributes];
    return [];
  };

  // Remove discount offer
  // Update removeDiscountOffer function
  const removeDiscountOffer = async (offerId) => {
    if (!offerId || deletingId) return;

    if (window.confirm("Are you sure you want to delete this offer?")) {
      setDeletingId(offerId);
      try {
        const getOffers = await prodapiProvider.deleteOffer(offerId);
        if (getOffers.status) {
          // Optimistic update
          setState((prev) => ({
            ...prev,
            discountOffers: prev.discountOffers.filter(
              (offer) => offer._id !== offerId
            ),
          }));

          toast.success("Discount offer removed!");

          // Refresh in background
          fetchInitialData();
          getDiscountOffers();
          getPackageOffers();
        }
      } catch (error) {
        console.error("Error deleting offer:", error);
        toast.error("Failed to delete offer");
        fetchInitialData();
        getDiscountOffers();
        getPackageOffers();
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Remove package offer
  const removePackageOffer = (index) => {
    const newPackageOffers = [...state.packageOffers];
    newPackageOffers.splice(index, 1);
    setState((prev) => ({
      ...prev,
      packageOffers: newPackageOffers,
    }));
    toast.success("Package offer removed!");
  };

  // Submit final offer
  const handleFinalSubmit = async () => {
    if (state.discountOffers.length === 0 && state.packageOffers.length === 0) {
      toast.error("Please add at least one offer");
      return;
    }

    if (!state.offerName || !state.startDate || !state.endDate) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      name: state.offerName,
      startDate: state.startDate,
      endDate: state.endDate,
      isActive: state.isActive,
      discountOffers: state.discountOffers.map((offer) => ({
        offerName: offer.offerName,
        image: offer.image,
        categoryIds: offer.categories.map((c) => c.value),
        categoryNames: offer.categories.map((c) => c.label),
        productIds: offer.products.map((p) => p.value),
        productNames: offer.products.map((p) => p.label),
        percentage: offer.percentage,
        isActive: offer.isActive,
        startDate: offer.startDate,
        endDate: offer.endDate,
      })),
      packageOffers: state.packageOffers.map((offer) => ({
        offerName: offer.offerName,
        image: offer.image,
        categoryIds: offer.categories.map((c) => c.value),
        categoryNames: offer.categories.map((c) => c.label),
        productIds: offer.products.map((p) => p.value),
        productNames: offer.products.map((p) => p.label),
        fixedAmount: offer.fixedAmount,
        applicableForCustomer: offer.applicableForCustomer,
        isActive: offer.isActive,
        startDate: offer.startDate,
        endDate: offer.endDate,
      })),
    };

    console.log("Final payload:", payload);
    setIsLoading(true);

    try {
      const response = await apiProvider.createOffer(payload);
      if (response.status) {
        toast.success("Offer created successfully!");
        // Reset form
        setState({
          discountOffers: [],
          packageOffers: [],
          discountForm: { ...initialDiscountGroup },
          packageForm: { ...initialPackageGroup },
          offerName: "",
          startDate: "",
          endDate: "",
          isActive: true,
          showDiscountModal: false,
          showPackageModal: false,
          editDiscountIndex: null,
          editPackageIndex: null,
        });
      }
    } catch (error) {
      console.error("Error creating offer:", error);
      toast.error("Failed to create offer");
    } finally {
      setIsLoading(false);
    }
  };

  console.log(state, "state.discountOffers");
  const columns = useMemo(
    () => [
      {
        header: "S.No",
        size: 80, // 👈 static width
        minSize: 80,
        maxSize: 80,
        cell: ({ row }) => row.index + 1,
      },

      { header: "Offer Name", accessorKey: "offerName" },
      {
        header: "Categories",
        accessorFn: (row) => row.categories?.map((c) => c.name).join(", "),
        size: 150, // Fixed width
        id: "categories", // Required for filtering when using accessorFn
        cell: (info) => {
          const text = info.getValue();
          return (
            <div
              style={{
                maxWidth: "150px",
                width: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={text} // Show full text on hover
            >
              {text}
            </div>
          );
        },
        filterFn: (row, columnId, filterValue) => {
          return row
            .getValue(columnId)
            ?.toLowerCase()
            .includes(filterValue.toLowerCase());
        },
      },
      {
        header: "Products",
        accessorFn: (row) =>
          row.productDetails?.map((p) => p.productName).join(", "),
        size: 200, // Fixed width (slightly larger for product names)
        id: "productDetails",
        cell: (info) => {
          const text = info.getValue();
          return (
            <div
              style={{
                maxWidth: "150px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={text} // Show full text on hover
            >
              {text}
            </div>
          );
        },
        filterFn: (row, columnId, filterValue) => {
          return row
            .getValue(columnId)
            ?.toLowerCase()
            .includes(filterValue.toLowerCase());
        },
      },
      {
        header: "Discount %",
        accessorKey: "discount",
        size: 120, // 👈 static width
        minSize: 120,
        maxSize: 120,
        cell: (info) => {
          const value = info?.getValue?.();
          return value ? `${Number(value).toFixed()}%` : "0%";
        },
      },
      {
        header: "Active",
        accessorKey: "isActive",
        size: 80, // 👈 static width
        minSize: 80,
        maxSize: 80,
        cell: (info) => (
          <span
            className={`badge bg-${info.getValue() ? "success" : "danger"}`}
          >
            {info.getValue() ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        header: "Date Range",
        // size: 90,          // 👈 static width
        // minSize: 90,
        // maxSize: 90,
        accessorFn: (row) =>
          `${new Date(row.startDate).toLocaleDateString()} to ${new Date(
            row.endDate
          ).toLocaleDateString()}`,
        size: 120,
      },
      {
        header: "Created On",
        accessorKey: "createdAt",
        size: 90, // 👈 static width
        minSize: 90,
        maxSize: 90,
        cell: (info) => {
          const date = new Date(info.getValue());

          return date
            .toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .replace("am", "AM")
            .replace("pm", "PM");
        },
      },

      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="d-flex gap-2">
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px rounded-circle"
              onClick={() => openViewModal(row.original)}
            >
              <Icon icon="majesticons:eye-line" className="text-xl" />
            </button>
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px rounded-circle"
              onClick={() => handleEdit(row.original)}
            >
              <Icon icon="lucide:edit" />
            </button>

            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px rounded-circle"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeDiscountOffer(row.original._id);
              }}
              disabled={deletingId === row.original._id}
            >
              {deletingId === row.original._id ? (
                <span
                  className="spinner-border spinner-border-sm"
                  role="status"
                  aria-hidden="true"
                ></span>
              ) : (
                <Icon icon="fluent:delete-24-regular" />
              )}
            </button>
          </div>
        ),
        size: 200,
      },
    ],
    [openViewModal, handleEdit, openDiscountModal, removeDiscountOffer]
  );

  // Handler for adding a new product field
  // 🔥 COMPLETE FIX: Replace your handlePackageEdit function with this
  const handlePackageEdit = async (offer, index) => {
    console.log(
      offer.productDetails?.[0]?.applicableForCustomer,
      "offer11111111111111111"
    );
    console.log(initialPackageGroup, " ...initialPackageGroup");
    try {
      seteditMode(true);
      setEditId(offer._id);
      setIsLoadingProducts(true);

      // 1️⃣ Base form
      setState((prev) => ({
        ...prev,
        packageForm: {
          ...initialPackageGroup, // ✅ Use the initial state as a base
          offerName: offer.offerName,
          categories:
            offer.categories?.map((c) => ({
              label: c.name,
              value: c._id,
            })) || [],
          fixedAmount: offer.fixedAmount,
          stock: offer.stock || "",
          startDate: offer.startDate.split("T")[0],
          endDate: offer.endDate.split("T")[0],
          // ✅ CRITICAL FIXES
          applicableForCustomer: Boolean(offer.applicableForCustomer),
          isActive: Boolean(offer.isActive),
          products: [],
        },
        showPackageModal: true,
        existingImage: offer.images?.length > 0 ? offer.images[0] : null,
      }));

      // 2️⃣ Load products
      const categoryIds = offer.categoryId.map((c) => c.id).join(",");
      const res = await prodapiProvider.getProductsByCategoryId(categoryIds);
      if (!res?.status) return;

      const loadedProducts =
        res.data?.data || res.response?.data || res.data || [];
      setAllProducts(loadedProducts);

      // Set products options for the dropdowns
      const options = loadedProducts.map((p) => ({
        value: p._id,
        label: p.productName,
      }));
      setproductsOptions(options);

      // 3️⃣ CORE FIX – map exactly saved products
      const formattedProducts = offer.productId
        .map((p) => {
          const product = loadedProducts.find((lp) => lp._id === p.id);
          if (!product) return null;

          const attributeDetail = product.customerAttributeDetails?.[0];
          if (!attributeDetail) return null;

          const attributeName = attributeDetail.name; // "Kilo Grams"
          const savedAttributeId = p.attributes?.[attributeName];

          const matchedValue = attributeDetail.value.find(
            (v) => v._id === savedAttributeId
          );

          if (!matchedValue) return null;

          return {
            id: product._id,
            label: product.productName,
            value: product._id,
            attributes: {
              id: matchedValue._id,
              value: matchedValue.value,
              name: attributeName,
            },
          };
        })
        .filter(Boolean);

      // 4️⃣ Set products EXACTLY
      setState((prev) => ({
        ...prev,
        packageForm: {
          ...prev.packageForm,
          products: formattedProducts,
        },
      }));

      setTimeout(getTotalMrp, 100);
    } catch (err) {
      console.error(err);
      toast.error("Edit load failed");
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const packageColumns = useMemo(
    () => [
      // {
      //     header: 'S.No',
      //     cell: ({ row }) => row.index + 1,
      //     size: 20
      // },
      {
        header: "S.No",
        size: 80, // 👈 static width
        minSize: 80,
        maxSize: 80,
        cell: ({ row }) => row.index + 1,
      },
      {
        header: "Offer Name",
        accessorKey: "offerName",
        filterFn: "includesString",
      },

      {
        header: "Offer Type",
        size: 90,
        accessorKey: "offerType",
        cell: (info) => (
          <span className="text-capitalize">{info.getValue()}</span>
        ),
        filterFn: "includesString",
      },
      {
        header: "Fixed Price",
        size: 90,
        accessorKey: "discount",
        cell: (info) => {
          const discount = info.getValue();
          const fixedAmount = info.row.original.fixedAmount;

          return fixedAmount
            ? `₹${fixedAmount} fixed`
            : `${Number(discount).toFixed()}%`;
        },
      },
      {
        header: "Status",
        size: 90,
        accessorKey: "isActive",
        cell: (info) => (
          <span
            className={`badge bg-${info.getValue() ? "success" : "danger"}`}
          >
            {info.getValue() ? "Active" : "Inactive"}
          </span>
        ),
        filterFn: "equals",
      },
      {
        header: "Date Range",
        size: 120,
        accessorFn: (row) => {
          const start = new Date(row.startDate).toLocaleDateString("en-IN");
          const end = new Date(row.endDate).toLocaleDateString("en-IN");
          return `${start} to ${end}`;
        },
        id: "dateRange",
      },
      {
        header: "Created On",
        accessorKey: "createdAt",
        cell: (info) => {
          const date = new Date(info.getValue());

          return date
            .toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })
            .replace("am", "AM")
            .replace("pm", "PM");
        },
      },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="d-flex gap-2">
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px rounded-circle"
              onClick={() => openViewModal(row.original)}
            >
              <Icon icon="majesticons:eye-line" className="text-xl" />
            </button>
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px rounded-circle"
              onClick={() => handlePackageEdit(row.original)}
            >
              <Icon icon="lucide:edit" />
            </button>
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px rounded-circle"
              onClick={() => removeDiscountOffer(row.original._id)}
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          </div>
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
    ],
    [openViewModal, handlePackageEdit, removeDiscountOffer]
  );


  // ============================================
  // ALGORITHM BREAKDOWN
  // ============================================

  /*
      ROOT CAUSE ANALYSIS:
      - Backend returns: attributes: undefined (not being saved properly)
      - Frontend expects: { id: "xxx", value: "1Kg", name: "Kilo Grams" }
      
      THE PROBLEM CASCADE:
      1. When saving, finalProducts might not have correct format
      2. Backend doesn't store attributes properly
      3. On edit, attributes come back as undefined
      4. Dropdown has no value to display
      
      SOLUTION APPROACH:
      
      STEP 1: Defensive Loading
      - Check if attributes exist before processing
      - Handle undefined/null gracefully
      - Log everything for debugging
      
      STEP 2: Multiple Format Support
      - String: "683694ee8619d5235aa3a409"
      - Array: ["683694ee8619d5235aa3a409"]
      - Object: {id: "683694ee8619d5235aa3a409"}
      - Object with key: {"Kilo Grams": "683694ee8619d5235aa3a409"}
      
      STEP 3: Robust Matching
      - Try multiple extraction methods
      - Match against customerAttributeDetails
      - Fallback to null if not found
      
      STEP 4: Proper State Update
      - Format matches Select component expectations
      - Triggers dropdown to show selected value
      - Maintains consistency with create flow
      */

  // ============================================
  // DEBUGGING CHECKLIST
  // ============================================

  /*
      If dropdown still doesn't show value, check these logs:
      
      1. "🔍 Product attributes from backend:" 
         → Should show the saved attribute data
      
      2. "🔍 Extracted attribute ID:" 
         → Should show valid MongoDB ID (24 chars)
      
      3. "🔍 Available attribute values:" 
         → Should show array with matching _id
      
      4. "✅ Successfully matched attribute:" 
         → Should show { id, value, name }
      
      5. "🎯 FINAL FORMATTED PRODUCTS:" 
         → Should show products with attributes property
      
      If any of these fail, the issue is at that step.
      Most likely: attributes is undefined from backend,
      which means the SAVE function needs fixing too.
      */
  const AttributeSelector = ({
    productId,
    allProducts,
    value,
    onChange,
    name,
  }) => {
    const product = allProducts.find((p) => p._id === productId);
    const firstAttribute = product?.customerAttributeDetails?.[0];

    if (!firstAttribute) return null;

    return (
      <Select
        options={
          firstAttribute.value?.map((v) => ({
            value: v._id,
            label: v.value,
            price: v.customerMrp,
          })) || []
        }
        value={value}
        onChange={onChange}
        placeholder={`Select ${firstAttribute.name}...`}
        isClearable
      />
    );
  };

  const addProductField = () => {
    setState((prev) => ({
      ...prev,
      packageForm: {
        ...prev.packageForm,
        products: [...prev.packageForm.products, { id: null, attributes: [] }],
      },
    }));
  };

  // Handler for removing a product field
  const removeProductField = (index) => {
    setState((prev) => ({
      ...prev,
      packageForm: {
        ...prev.packageForm,
        products: prev.packageForm.products.filter((_, i) => i !== index),
      },
    }));
  };

  // Handler for product changes
  const handleProductChange = (index, field, value, label = null) => {
    console.log(index);
    setState((prev) => {
      const updatedProducts = [...prev.packageForm.products];
      updatedProducts[index] = {
        ...updatedProducts[index],
        [field]: value,
      };

      // If changing the product ID, reset attributes
      if (field === "id") {
        updatedProducts[index].attributes = [];
        if (label) updatedProducts[index].label = label;

        // Clear product error if it exists
        if (
          errors.products &&
          Array.isArray(errors.products) &&
          errors.products[index]
        ) {
          const newProductsErrors = [...errors.products];
          newProductsErrors[index] = { ...newProductsErrors[index], id: false };
          setErrors((prevErrors) => ({
            ...prevErrors,
            products: newProductsErrors,
          }));
        }
      }

      return {
        ...prev,
        packageForm: {
          ...prev.packageForm,
          products: updatedProducts,
        },
      };
    });
  };

  // Handle attribute selection change
  const handleAttributeChange = (
    productIndex,
    selectedOption,
    attributeName
  ) => {
    setState((prev) => {
      const updatedProducts = [...prev.packageForm.products];

      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        attributes: selectedOption
          ? {
            id: selectedOption.value,
            value: selectedOption.label,
            name: attributeName,
            price: selectedOption.price,
          }
          : null,
      };

      // Clear attribute error if it exists
      if (
        selectedOption &&
        errors.products &&
        Array.isArray(errors.products) &&
        errors.products[productIndex]
      ) {
        const newProductsErrors = [...errors.products];
        newProductsErrors[productIndex] = {
          ...newProductsErrors[productIndex],
          attributes: false,
        };
        setErrors((prevErrors) => ({
          ...prevErrors,
          products: newProductsErrors,
        }));
      }

      return {
        ...prev,
        packageForm: {
          ...prev.packageForm,
          products: updatedProducts,
        },
      };
    });
  };
  // View Offer Modal
  const ViewOfferModal = ({ offer, onHide }) => {
    console.log(offer, "view----------");
    if (!offer) return null;

    const isPackageOffer = offer.offerType === "package";
    const hasImage = offer.images && offer.images.length > 0;

    return (
      <>
        <Modal
          show={true}
          onHide={onHide}
          size="xl"
          centered
          dialogClassName="business-modal"
        >
          <Modal.Header closeButton className="border-0 pb-0 position-relative">
            <div className="header-content-business">
              <div className="d-flex align-items-center gap-3 mb-3">
                {/* <div
                  className={`status-indicator ${
                    offer.isActive ? "active" : "inactive"
                  }`}
                >
                  <div className="indicator-dot"></div>
                  <span>{offer.isActive ? "Active" : "Inactive"}</span>
                </div> */}
                {/* <div className="offer-id">
                  <i className="fas fa-hashtag me-1"></i>
                  OFFER-{offer.id?.slice(0, 8) || "001"}
                </div> */}
              </div>
              <h2 className="offer-title-business-view">{offer.offerName}</h2>
            </div>
            {/* <button className="close-button-red" onClick={onHide}>
      <i className="fas fa-times">X</i>
    </button> */}
          </Modal.Header>

          <Modal.Body className="pt-0">
            {/* Quick Stats Bar */}
            <div className="stats-bar mb-4">
              <div className="row g-3">
                <div className="col-md-3">
                  <div className="stat-card">
                    <div className="stat-content-view">
                      <div className="stat-label">Remaining</div>
                      <div className="stat-value1">
                        {Math.ceil(
                          (new Date(offer.endDate) - new Date()) /
                          (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card">
                    <div className="stat-content-view">
                      <div className="stat-label">Products</div>
                      <div className="stat-value1">
                        {offer.productDetails?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card">
                    <div className="stat-content-view">
                      <div className="stat-label">Categories</div>
                      <div className="stat-value1">
                        {offer.categories?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="stat-card">
                    <div className="stat-content-view">
                      <div className="stat-label">Type</div>
                      <div className="stat-value1">
                        {isPackageOffer ? "Package" : `Discount`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-layout">
              {/* Left Panel */}
              <div className="left-panel-business">
                {/* Offer Image */}
                <div className="business-card mb-4">
                  <div className="card-header-business">
                    <div className="header-title">
                      <i className="fas fa-image me-2"></i>
                      Offer Preview
                    </div>
                  </div>
                  <div className="card-body-business">
                    {hasImage ? (
                      <div className="business-image">
                        <img
                          src={`${IMAGE_BASE_URL}/${offer.images[0].docPath}/${offer.images[0].docName}`}
                          alt={offer.offerName}
                          className="img-fluid rounded-3"
                        />
                        <div className="image-badge">
                          {isPackageOffer ? (
                            <div className="badge-package">
                              <span className="badge-text">Package Deal</span>
                            </div>
                          ) : (
                            <div className="badge-discount">
                              <span className="badge-text">
                                {offer.discount}% OFF
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="image-placeholder-business">
                        <div className="placeholder-content">
                          <i className="fas fa-image-slash fa-2x"></i>
                          <p className="mt-2 mb-0">No image uploaded</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Products Table */}
                <div className="business-card">
                  <div className="card-header-business">
                    <div className="header-title">
                      <i className="fas fa-list-alt me-2"></i>
                      Products List
                      <span className="count-badge ms-2">
                        {offer.productDetails?.length || 0}
                      </span>
                    </div>
                    {isPackageOffer && (
                      <div className="stock-info">
                        <i className="fas fa-box me-1"></i>
                        Stock: {offer.stock || "0"}
                      </div>
                    )}
                  </div>
                  <div className="card-body-business p-0">
                    {offer.productDetails && offer.productDetails.length > 0 ? (
                      <div className="table-responsive">
                        <div
                          className="table-container"
                          style={{
                            height: !isPackageOffer ? "280px" : "475px",
                            overflowY: "scroll",
                            overflowX: "hidden",
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                          }}
                        >
                          {/* Discount Table */}
                          {!isPackageOffer ? (
                            <>
                              {/* Discount Header */}
                              <div
                                className="table-header"
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "95px 1fr 170px",
                                  backgroundColor: "#f9fafb",
                                  padding: "12px 16px",
                                  borderBottom: "2px solid #e5e7eb",
                                  position: "sticky",
                                  top: 0,
                                  zIndex: 10,
                                  fontWeight: "600",
                                  fontSize: "0.875rem",
                                  color: "#374151",
                                }}
                              >
                                <div style={{ width: "90px" }}>S.No</div>
                                <div style={{ width: "260px" }}>Product Name</div>
                                <div style={{ textAlign: "left", paddingRight: "20px" }}>Price</div>
                              </div>

                              {/* Discount Body */}
                              <div style={{ maxHeight: "350px" }}>
                                {offer.productDetails.map((product, index) => {
                                  let price = "0";
                                  if (product.attributes && product.attributes.length > 0) {
                                    price = product.attributes[0].price;
                                  } else if (product.customerAttribute?.rowData?.[0]?.price) {
                                    price = product.customerAttribute.rowData[0].price;
                                  }

                                  return (
                                    <div
                                      key={index}
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "95px 1fr 170px",
                                        padding: "12px 16px",
                                        borderBottom: "1px solid #f3f4f6",
                                        alignItems: "center",
                                      }}
                                    >
                                      <div>
                                        <div
                                          style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: "600",
                                            color: "#4b5563",
                                          }}
                                        >
                                          {index + 1}
                                        </div>
                                      </div>

                                      <div style={{ wordBreak: "break-word", width: "260px" }}>
                                        {product.productName}
                                      </div>

                                      <div style={{
                                        textAlign: "left",
                                        paddingRight: "20px",
                                        fontWeight: "500"
                                      }}>
                                        ₹{price}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            /* Package Table */
                            <>
                              {/* Package Header */}
                              <div
                                className="table-header"
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "95px 1fr 1fr 100px",
                                  backgroundColor: "#f9fafb",
                                  padding: "12px 16px",
                                  borderBottom: "2px solid #e5e7eb",
                                  position: "sticky",
                                  top: 0,
                                  zIndex: 10,
                                  fontWeight: "600",
                                  fontSize: "0.875rem",
                                  color: "#374151",
                                }}
                              >
                                <div>S.No</div>
                                <div style={{ width: "260px" }}>Product Name</div>
                                <div>Attributes</div>
                                <div style={{ textAlign: "right", paddingRight: "20px" }}>Price</div>
                              </div>

                              {/* Package Body */}
                              <div style={{ maxHeight: "350px" }}>
                                {offer.productDetails.map((product, index) => {
                                  let price = "0";
                                  if (product.attributes && product.attributes.length > 0) {
                                    price = product.attributes[0].price;
                                  } else if (product.customerAttribute?.rowData?.[0]?.price) {
                                    price = product.customerAttribute.rowData[0].price;
                                  }

                                  return (
                                    <div
                                      key={index}
                                      style={{
                                        display: "grid",
                                        gridTemplateColumns: "95px 1fr 1fr 100px",
                                        padding: "12px 16px",
                                        borderBottom: "1px solid #f3f4f6",
                                        alignItems: "center",
                                      }}
                                    >
                                      <div>
                                        <div
                                          style={{
                                            width: "32px",
                                            height: "32px",
                                            borderRadius: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontWeight: "600",
                                            color: "#4b5563",
                                          }}
                                        >
                                          {index + 1}
                                        </div>
                                      </div>

                                      <div style={{ wordBreak: "break-word", width: "260px" }}>
                                        {product.productName}
                                      </div>

                                      <div style={{ wordBreak: "break-word" }}>
                                        {product.customerAttributeDetails?.[0]?.value?.[0]?.value ||
                                          <span className="text-muted">-</span>}
                                      </div>

                                      <div style={{
                                        textAlign: "right",
                                        paddingRight: "20px",
                                        fontWeight: "500"
                                      }}>
                                        ₹{price}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-table">
                        <i className="fas fa-clipboard-list fa-2x"></i>
                        <p>No products added</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div className="right-panel-business">
                {/* Pricing Summary */}
                <div className="business-card mb-4">
                  <div className="card-header-business">
                    <div className="header-title">
                      <i className="fas fa-chart-bar me-2"></i>
                      Pricing Summary
                    </div>
                  </div>
                  <div className="card-body-business">
                    {isPackageOffer ? (
                      <div className="pricing-summary">
                        <div className="price-row-business">
                          <div className="price-label">Total MRP</div>
                          <div className="price-value original-price">
                            ₹{offer.mrpPrice || "0"}
                          </div>
                        </div>
                        <div className="price-row-business">
                          {" "}
                          <div className="price-label">
                            Discounted Price
                          </div>{" "}
                          <div className="price-value discounted-price">
                            ₹{offer.fixedAmount || "0"}
                          </div>{" "}
                        </div>{" "}
                        {/* <div className="divider-business"></div>{" "} */}
                        <div className="price-row-business total">
                          {" "}
                          <div className="price-label">Total Savings</div>{" "}
                          <div className="price-value savings-amount">
                            {" "}
                            ₹{offer.mrpPrice - offer.fixedAmount || "0"}{" "}
                          </div>{" "}
                        </div>{" "}
                        <div className="savings-percent">
                          {" "}
                          {Math.round(
                            ((offer.mrpPrice - offer.fixedAmount) /
                              offer.mrpPrice) *
                            100
                          )}
                          % savings{" "}
                        </div>{" "}
                      </div>
                    ) : (
                      <div className="discount-summary">
                        <div className="discount-display">
                          <div className="discount-percentage">
                            {offer.discount}%
                          </div>
                          <div className="discount-info">
                            <div className="discount-title">
                              Discount Applied
                            </div>
                            <div className="discount-applicable">
                              For {offer.type || "all customers"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Offer Details */}
                <div className="business-card mb-4">
                  <div className="card-header-business">
                    <div className="header-title">
                      <i className="fas fa-info-circle me-2"></i>
                      Offer Details
                    </div>
                  </div>
                  <div className="card-body-business">
                    <div className="details-grid-business">
                      <div className="detail-card">
                        <div className="detail-content">
                          <div className="detail-label">Offer Type</div>
                          <div className="detail-value text-capitalize">
                            {isPackageOffer ? offer.offerType : "Discount"}
                          </div>
                        </div>
                      </div>
                      <div className="detail-card">
                        <div className="detail-content">
                          <div className="detail-label">Start Date</div>
                          <div className="detail-value">
                            {new Date(offer.startDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="detail-card">
                        <div className="detail-content">
                          <div className="detail-label">End Date</div>
                          <div className="detail-value">
                            {new Date(offer.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="detail-card">
                        <div className="detail-content">
                          <div className="detail-label">Status</div>
                          <div
                            className={`status-indicator ${offer.isActive ? "active" : "inactive"
                              }`}
                          >
                            <div className="indicator-dot"></div>
                            <span>
                              {offer.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {/* <div
                            className={`status-indicator ${
                              offer.applicableForCustomer
                                ? "active"
                                : "inactive"
                            }`}
                            style={{ width: "80px" }}
                          >
                            <div className="indicator-dot"></div>
                            <span>
                              {offer.applicableForCustomer ? "Yes" : "No"}
                            </span>
                          </div> */}
                          {/* <div className="detail-value text-capitalize">{offer.applicableForCustomer ? 'Yes' : 'No'}</div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="business-card">
                  <div className="card-header-business">
                    <div className="header-title">
                      <i className="fas fa-folder me-2"></i>
                      Categories
                    </div>
                  </div>
                  <div className="card-body-business">
                    {offer.categories && offer.categories.length > 0 ? (
                      <div className="categories-container">
                        {offer.categories.map((category, index) => (
                          <div key={index} className="category-tag-business">
                            <i className="fas fa-folder-open me-1"></i>
                            {category.name}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-categories-business">
                        <i className="fas fa-folder-minus me-2"></i>
                        No categories assigned
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer className="border-0">
            <div className="footer-actions">
              <button
                className="btn btn-secondary"
                onClick={onHide}
              >
                <i className="fas fa-times me-2"></i>
                Close
              </button>
            </div>
          </Modal.Footer>
        </Modal>
      </>
    );
  };

  return (
    <div className="container-fluid py-4">
      <div className="card">
        <div className="card-header text-white d-flex justify-content-end align-items-center gap-2">
          <button
            type="button"
            className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
            onClick={() => openDiscountModal()}
          >
            <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
            Add Discount Offer
          </button>

          <button
            type="button"
            className="btn btn-primary text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-center gap-2"
            onClick={() => openPackageModal()}
          >
            <Icon icon="ic:baseline-plus" className="icon text-xl line-height-1" />
            Add Package Offer
          </button>
        </div>


        <div className="card-body">
          <div className="mb-5">
            <h4 className="mb-3">Discount Offers</h4>
            {state.discountOffers.length > 0 ? (
              <div className="table-responsive">
                <ReactTableComponent
                  key={`discount-table-${state.discountOffers.length}`} // Add this key
                  data={state.discountOffers}
                  columns={columns}
                  getRowId={(row) => row._id} // Ensure each row has a unique ID
                  showRecordCount={false}
                />
              </div>
            ) : (
              <div className="alert alert-info">
                No discount offers added yet. Click "Add Discount Offer" to
                create one.
              </div>
            )}
          </div>

          <div className="mb-4">
            <h4 className="mb-3">Package Offers</h4>
            {state.packageOffers.length > 0 ? (
              <div className="table-responsive">
                <ReactTableComponent
                  key={`package-table-${state.packageOffers.length}`} // Add this key
                  data={state.packageOffers}
                  columns={packageColumns}
                  getRowId={(row) => row._id} // Ensure each row has a unique ID
                  showRecordCount={false}
                />
              </div>
            ) : (
              <div className="alert alert-info">
                No package offers added yet. Click "Add Package Offer" to create
                one.
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="text-center mt-4 d-none">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleFinalSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                  ></span>
                  Creating Offer...
                </>
              ) : (
                "Create Master Offer"
              )}
            </button>
          </div>
        </div>
      </div>

      <Modal show={state.showDiscountModal} onHide={closeModals} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {state.editDiscountIndex !== null ? "Edit" : "Add"} Discount Offer
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="row">
            <div className="col-md-12">
              <div className="form-group mb-3">
                <label className="form-label">Offer Name*</label>
                <input
                  type="text"
                  className="form-control"
                  value={state.discountForm.offerName}
                  onChange={(e) =>
                    handleDiscountChange("offerName", e.target.value)
                  }
                  placeholder="Enter offer name"
                />
                {errors && errors.offerName ? (
                  <span className="text-danger">{errors.offerName}</span>
                ) : null}
              </div>
            </div>
            <div className="col-md-12">
              <div className="form-group mb-3">
                <label className="form-label">Offer Image</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => handleImageUpload("discount", e)}
                />
                {state.existingImage && (
                  <div className="mb-3">
                    <label className="form-label">Existing Image:</label>
                    <br />
                    <img
                      src={`${IMAGE_BASE_URL}/${state.existingImage.docPath}/${state.existingImage.docName}`}
                      alt={state.existingImage.docName}
                      style={{
                        width: "150px",
                        height: "auto",
                        borderRadius: "8px",
                      }}
                    />
                  </div>
                )}
                {state.discountForm.image && (
                  <div className="mt-3">
                    {/* New Image Preview (if a new image is selected) */}
                    {previewImageURL && (
                      <div className="mb-3">
                        <label className="form-label">New Image Preview:</label>
                        <br />
                        <img
                          src={previewImageURL}
                          alt="New Preview"
                          style={{
                            width: "150px",
                            height: "100px",
                            borderRadius: "8px",
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
                {errors && errors.image ? (
                  <span className="text-danger">{errors.image}</span>
                ) : null}
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label className="form-label">Categories*</label>
                <Select
                  isMulti
                  options={categories}
                  value={state.discountForm.categories}
                  onChange={(selected) =>
                    handleDiscountChange("categories", selected)
                  }
                  placeholder="Select categories..."
                />
                {errors && errors.categories ? (
                  <span className="text-danger">{errors.categories}</span>
                ) : null}
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group mb-3">
                <label className="form-label">Products*</label>
                <Select
                  isMulti
                  options={productsOption}
                  value={state.discountForm.products}
                  onChange={(selected) =>
                    handleDiscountChange("products", selected)
                  }
                  placeholder="Select products..."
                  isDisabled={state.discountForm.categories.length === 0}
                />
              </div>
              {errors && errors.products ? (
                <span
                  className="text-danger"
                  style={{ bottom: "15px", position: "relative" }}
                >
                  {errors.products}
                </span>
              ) : null}
            </div>
            <div className="col-md-4">
              <div className="form-group mb-3">
                <label className="form-label">
                  Discount Percentage* (1-99%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  className="form-control"
                  value={state.discountForm.percentage}
                  onChange={(e) =>
                    handleDiscountChange("percentage", e.target.value)
                  }
                  placeholder="Enter percentage"
                />
                {errors && errors.percentage ? (
                  <span className="text-danger">{errors.percentage}</span>
                ) : null}
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group mb-3">
                <label className="form-label">Start Date*</label>
                <input
                  type="date"
                  className="form-control"
                  value={state.discountForm.startDate}
                  onChange={(e) =>
                    handleDiscountChange("startDate", e.target.value)
                  }
                />
              </div>
              {errors && errors.startDate ? (
                <span
                  className="text-danger"
                  style={{ bottom: "15px", position: "relative" }}
                >
                  {errors.startDate}
                </span>
              ) : null}
            </div>
            <div className="col-md-4">
              <div className="form-group mb-3">
                <label className="form-label">End Date*</label>
                <input
                  type="date"
                  className="form-control"
                  value={state.discountForm.endDate}
                  onChange={(e) =>
                    handleDiscountChange("endDate", e.target.value)
                  }
                />
              </div>
              {errors && errors.endDate ? (
                <span
                  className="text-danger"
                  style={{ bottom: "15px", position: "relative" }}
                >
                  {errors.endDate}
                </span>
              ) : null}
            </div>
            <div className="col-md-12">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={state.discountForm.isActive}
                  onChange={(e) =>
                    handleDiscountChange("isActive", e.target.checked)
                  }
                  id="discountActiveCheck"
                />
                <label
                  className="form-check-label"
                  htmlFor="discountActiveCheck"
                >
                  Active
                </label>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModals}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleDiscountSubmit}>
            {state.editDiscountIndex !== null ? "Update" : "Add"} Offer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Package Offer Modal */}
      <Modal
        show={state.showPackageModal}
        onHide={closeModals}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{editMode ? "Edit" : "Add"} Package Offer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {isLoadingProducts ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p>Loading offer data...</p>
            </div>
          ) : (
            <div className="row">
              {/* Offer Name */}
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label className="form-label">Offer Name*</label>
                  <input
                    type="text"
                    className={`form-control ${errors?.offerName ? "is-invalid" : ""
                      }`}
                    value={state.packageForm.offerName}
                    onChange={(e) =>
                      handlePackageChange("offerName", e.target.value)
                    }
                    placeholder="Enter offer name"
                  />
                  {errors?.offerName && (
                    <div className="text-danger small mt-1">
                      {errors.offerName}
                    </div>
                  )}
                </div>
              </div>

              {/* Offer Image */}
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label className="form-label">
                    Offer Image{!editMode && "*"}
                  </label>
                  <input
                    type="file"
                    className={`form-control ${errors?.image ? "is-invalid" : ""
                      }`}
                    accept="image/*"
                    onChange={(e) => packageImageUpload("package", e)}
                  />
                  {errors?.image && (
                    <div className="text-danger small mt-1">{errors.image}</div>
                  )}
                  {previewImageURL ? (
                    <div className="mt-3">
                      <img
                        src={previewImageURL}
                        alt="Preview"
                        className="img-thumbnail"
                        style={{
                          width: "150px",
                          height: "150px",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  ) : (
                    state.existingImage && (
                      <div className="mt-3">
                        <img
                          src={`${IMAGE_BASE_URL}/${state.existingImage.docPath}/${state.existingImage.docName}`}
                          alt="Current"
                          className="img-thumbnail"
                          style={{
                            width: "150px",
                            height: "150px",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Categories */}
              <div className="col-md-12">
                <div className="form-group mb-3">
                  <label className="form-label">Categories*</label>
                  <Select
                    isMulti
                    options={categories}
                    value={state.packageForm.categories}
                    onChange={(selected) =>
                      handlePackageChange("categories", selected)
                    }
                    placeholder="Select categories..."
                    className={errors?.categories ? "is-invalid" : ""}
                    classNamePrefix="select"
                  />
                  {errors?.categories && (
                    <div className="text-danger small mt-1">
                      {errors.categories}
                    </div>
                  )}
                </div>
              </div>
              {/* Products Section */}
              {state.packageForm.categories.length > 0 && (
                <div className="col-md-12">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label">Products*</label>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={addProductField}
                    >
                      <IconPlus size={16} className="me-1" />
                      Add Product
                    </button>
                  </div>

                  {state.packageForm.products.map((product, index) => {
                    const productData = allProducts?.find(
                      (p) => p._id === product.id
                    );
                    console.log(productData, "productData");
                    const firstAttribute =
                      productData?.customerAttributeDetails?.[0];
                    console.log(firstAttribute, "firstAttribute");
                    const allowedAttributeIds =
                      productData && firstAttribute
                        ? productData.customerAttribute?.rowData
                          ?.map((row) => row[firstAttribute.name])
                          .filter(Boolean)
                        : [];
                    const rowData =
                      productData?.customerAttribute?.rowData || [];
                    const attributeName = firstAttribute?.name; // "Kilo Grams"

                    const selectedAttributeId =
                      rowData.length > 0 && attributeName
                        ? rowData[0][attributeName] // 👈 THIS IS THE KEY LINE
                        : null;
                    const matchedAttribute =
                      firstAttribute?.value?.find(
                        (v) => v._id === selectedAttributeId
                      ) || null;

                    return (
                      <div
                        key={`product-${index}`}
                        className="product-row mb-3 p-3 border rounded"
                      >
                        <div className="row g-2 align-items-center">
                          {/* Product Selection */}
                          <div className="col-md-5">
                            <Select
                              options={getFilteredProducts}
                              value={
                                product.id
                                  ? {
                                    value: product.id,
                                    label:
                                      product.label ||
                                      productsOption?.find(
                                        (p) => p.value === product.id
                                      )?.label,
                                  }
                                  : null
                              }
                              onChange={(selected) =>
                                handleProductChange(
                                  index,
                                  "id",
                                  selected?.value || null,
                                  selected?.label
                                )
                              }
                              placeholder="Select product..."
                              className={
                                errors?.products?.[index]?.id
                                  ? "is-invalid"
                                  : ""
                              }
                              classNamePrefix="select"
                            />
                          </div>

                          {/* Attribute Selection */}
                          <div className="col-md-5">
                            {product.id && firstAttribute ? (
                              <Select
                                options={firstAttribute.value
                                  .filter((v) =>
                                    allowedAttributeIds.includes(v._id)
                                  ) // ✅ FILTER
                                  .map((v) => ({
                                    value: v._id,
                                    label: v.value,
                                  }))}
                                value={
                                  product.attributes
                                    ? {
                                      value: product.attributes.id,
                                      label: product.attributes.value,
                                    }
                                    : null
                                }
                                onChange={(selected) =>
                                  handleAttributeChange(
                                    index,
                                    selected,
                                    firstAttribute.name
                                  )
                                }
                                placeholder={`Select ${firstAttribute.name}...`}
                                isClearable
                                className={
                                  errors?.products?.[index]?.attributes
                                    ? "is-invalid"
                                    : ""
                                }
                                classNamePrefix="select"
                              />
                            ) : product.id ? (
                              <div className="text-warning small">
                                No attributes available
                              </div>
                            ) : null}
                          </div>

                          {/* Remove Button */}

                          <div className="col-md-2 text-end">

                            <div className="d-flex gap-2 justify-content-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={addProductField}
                              >
                                <IconPlus size={16} className="me-1" />
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeProductField(index);
                                }}
                              >
                                <IconTrash size={16} />
                              </button>
                            </div>

                          </div>
                        </div>

                        {/* Error Messages */}
                        {errors?.products?.[index]?.id && (
                          <div className="text-danger small mt-1">
                            Please select a product
                          </div>
                        )}
                        {errors?.products?.[index]?.attributes && (
                          <div className="text-danger small mt-1">
                            Please select an attribute
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Show overall products error if no products selected */}
                  {errors?.products && typeof errors.products === "string" && (
                    <div className="text-danger small mt-1 mb-3">
                      {errors.products}
                    </div>
                  )}
                </div>
              )}
              {/* Package Details */}
              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label className="form-label">Total Amount*</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={totalPrice}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="form-group mb-3">
                  <label className="form-label">Stock*</label>
                  <input
                    type="number"
                    className={`form-control ${errors?.stock ? "is-invalid" : ""
                      }`}
                    value={state.packageForm.stock}
                    onChange={(e) =>
                      handlePackageChange("stock", e.target.value)
                    }
                    placeholder="Enter available stock"
                    min="0"
                  />
                  {errors?.stock && (
                    <div className="text-danger small mt-1">{errors.stock}</div>
                  )}
                </div>
              </div>

              {/* Pricing */}
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label className="form-label">Discounted Price*</label>
                  <div className="input-group">
                    <span className="input-group-text">₹</span>
                    <input
                      type="number"
                      className={`form-control ${errors?.fixedAmount ? "is-invalid" : ""
                        }`}
                      value={state.packageForm.fixedAmount}
                      style={{ zIndex: 0 }}
                      onChange={(e) => {
                        const val = e.target.value;

                        // ✅ allow empty
                        if (val === "") {
                          handlePackageChange("fixedAmount", "");
                          return;
                        }

                        // ✅ remove leading zero
                        const cleanValue = val.replace(/^0+(?!$)/, "");

                        // ✅ max validation
                        if (Number(cleanValue) <= totalPrice) {
                          handlePackageChange("fixedAmount", cleanValue);
                        }
                      }}
                      placeholder="Enter amount"
                      min={0}
                      max={totalPrice}
                    />
                  </div>
                  {errors?.fixedAmount && (
                    <div className="text-danger small mt-1">
                      {errors.fixedAmount}
                    </div>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label className="form-label">Start Date*</label>
                  <input
                    type="date"
                    className={`form-control ${errors?.startDate ? "is-invalid" : ""
                      }`}
                    value={state.packageForm.startDate}
                    onChange={(e) =>
                      handlePackageChange("startDate", e.target.value)
                    }
                    min={new Date().toISOString().split("T")[0]}
                  />
                  {errors?.startDate && (
                    <div className="text-danger small mt-1">
                      {errors.startDate}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-md-4">
                <div className="form-group mb-3">
                  <label className="form-label">End Date*</label>
                  <input
                    type="date"
                    className={`form-control ${errors?.endDate ? "is-invalid" : ""
                      }`}
                    value={state.packageForm.endDate}
                    onChange={(e) =>
                      handlePackageChange("endDate", e.target.value)
                    }
                    min={
                      state.packageForm.startDate ||
                      new Date().toISOString().split("T")[0]
                    }
                  />
                  {errors?.endDate && (
                    <div className="text-danger small mt-1">
                      {errors.endDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="col-md-6">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={state.packageForm.isActive}
                    onChange={(e) =>
                      handlePackageChange("isActive", e.target.checked)
                    }
                    id="packageActiveCheck"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="packageActiveCheck"
                  >
                    Active Offer
                  </label>
                </div>
              </div>

              {/* <div className="col-md-6">
                <div className="form-check form-switch mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={state.packageForm.applicableForCustomer}
                    onChange={(e) =>
                      handlePackageChange(
                        "applicableForCustomer",
                        e.target.checked
                      )
                    }
                    id="customerApplicableCheck"
                  />
                  <label
                    className="form-check-label"
                    htmlFor="customerApplicableCheck"
                  >
                    Available for Customers
                  </label>
                </div>
              </div> */}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModals}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handlePackageSubmit}
            disabled={isLoadingProducts}
          >
            {isLoadingProducts ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                {state.editPackageIndex !== null
                  ? "Updating..."
                  : "Creating..."}
              </>
            ) : editMode ? (
              "Update Offer"
            ) : (
              "Create Offer"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Offer Modal */}
      {state.showViewModal && (
        <ViewOfferModal offer={state.viewOfferData} onHide={closeModals} />
      )}


    </div>
  );
};

export default OfferPageLayer;
