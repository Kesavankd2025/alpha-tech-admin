import { Icon } from "@iconify/react/dist/iconify.js";
import React, { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import apiProvider from "../apiProvider/api";
import SubcategoriesApi from "../apiProvider/subcategoryapi";
import ChildcategoryApi from "../apiProvider/childcategoryapi";
import { BASE_URL } from "../../src/network/apiClient";
import { NavLink } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import "./styles/categoryPageLayer.css";
import { IMAGE_BASE_URL } from "../../src/network/apiClient";
// import { useNavigate } from "react-router-dom";
import ReactTableComponent from "../table/ReactTableComponent";
import { useSearchParams, useNavigate } from "react-router-dom";

const CategoryPageLayer = () => {
  const navigate = useNavigate();
  // State declarations
  const [categoryData, setCategoryData] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [subCategorieById, setSubCategorieById] = useState([]);
  const [childCategories, setChildCategories] = useState([]);
  const [childCategorieById, setChildCategorieById] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [categorieById, setCategorieById] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Pagination state
  // Category pagination state1
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  // Subcategory pagination state
  const [subPageIndex, setSubPageIndex] = useState(0);
  const [subTotalPages, setSubTotalPages] = useState(0);
  const [subTotal, setSubTotal] = useState(0);
  // Child category pagination state
  const [childPageIndex, setChildPageIndex] = useState(0);
  const [childTotalPages, setChildTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSubPage, setCurrentSubPage] = useState(1);
  const [currentChildPage, setCurrentChildPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [childTotal, setChildTotal] = useState(0);
  // Table columns configuration
  const filterableColumns = ['name'];
  const subfilterableColumns = ['name', 'parentCategory'];
  const childFilterableColumns = ['name', 'subCategory', 'parentCategory'];

  // Add search state for each tab
  const [categorySearch, setCategorySearch] = useState("");
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [childCategorySearch, setChildCategorySearch] = useState("");
  const categorySearchRef = useRef();
  const subcategorySearchRef = useRef();
  const childCategorySearchRef = useRef();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("from") || "category";


  // Effects
  useEffect(() => {
    const type = searchParams.get("type");

    if (type === "subcategorylist") {
      document.getElementById("pills-focus-details-tab").click();
    }
    else if (type === "childcategorylist") {
      document.getElementById("pills-focus-profile-tab").click();
    }
    else {
      document.getElementById("pills-focus-home-tab").click();
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [pageIndex, itemsPerPage, categorySearch, sorting]);

  useEffect(() => {
    fetchSubCategoriesData();
  }, [subPageIndex, itemsPerPage, subcategorySearch, sorting]);

  useEffect(() => {
    fetchChildCategoriesData();
  }, [childPageIndex, itemsPerPage, childCategorySearch, sorting]);

  const columns = useMemo(() => [
    // S.No
    {
      header: 'S.No', size: 70,
      cell: info => (pageIndex * pageSize) + info.row.index + 1,
    },
    // Category Image
    {
      accessorKey: 'images',
      header: 'Image',
      cell: info => {
        const category = info.row.original;
        const imageUrl = category.images?.[0]
          ? `${IMAGE_BASE_URL}/${category.images[0].docPath}/${category.images[0].docName}`
          : '/default-image.png';
        return (
          <img
            src={imageUrl}
            alt={`${category.name} Image`}
            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
          />
        );
      },
    },
    // Category Name
    {
      accessorKey: 'name',
      header: ' Name',
      cell: info => {
        const name = info.getValue();
        return name ? name.charAt(0).toUpperCase() + name.slice(1) : '';
      },
      // Add accessorFn to handle search on the original value
      accessorFn: row => row.name ? row.name.toLowerCase() : ''
    },
    // Category Status
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => (
        <span
          className={`${info.getValue()
            ? 'bg-success-focus text-success-600 border border-success-border'
            : 'bg-danger-focus text-danger-600 border border-danger-main'
            } px-24 py-4 radius-4 fw-medium text-sm`}
        >{info.getValue() ? 'Active' : 'Inactive'}</span>
      ),
    },
    // Action
    {
      header: 'Actions',
      size: 160,
      cell: info => {
        const category = info.row.original;
        return (
          <div className="d-flex justify-content-start align-items-center gap-2">
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px rounded-circle"
              data-bs-toggle="modal"
              data-bs-target="#exampleModalView"
              onClick={() => {
                setSelectedCategory(category);
                console.log(category);
              }}
            >
              <Icon icon="majesticons:eye-line" className="text-xl" />
            </button>
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px rounded-circle"
              onClick={() => navigate('/category-add', { state: { editDatas: category } })}
            >
              <Icon icon="lucide:edit" />
            </button>
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px rounded-circle"
              onClick={() => handleDeleteCategory(category._id)}
            >
              <Icon icon="fluent:delete-24-regular" />
            </button>
          </div>
        );
      },
    }

  ], [pageSize, pageIndex]);
  const subCategoriesColumns = useMemo(() => [
    // S.No
    {
      header: 'S.No',
      size: 70,
      cell: info => (subPageIndex * pageSize) + info.row.index + 1,
    },
    // Category Image
    {
      accessorKey: 'images',
      header: ' Image',
      cell: info => {
        const category = info.row.original;
        const imageUrl = category.images?.[0]
          ? `${IMAGE_BASE_URL}/${category.images[0].docPath}/${category.images[0].docName}`
          : "/default-image.png"
        return (
          <img
            src={imageUrl}
            alt={`${category.name} Image`}
            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
          />
        );
      },
    },
    // Category Name
    {
      accessorKey: 'name',
      header: ' Name',
      cell: info => {
        const name = info.getValue();
        return name ? name.charAt(0).toUpperCase() + name.slice(1) : '';
      },
      accessorFn: row => row.name ? row.name.toLowerCase() : ''
    },
    {
      header: 'Category',
      accessorFn: row => row.category?.name?.toLowerCase() || '', // for sorting/filtering
      cell: info => {
        const categoryName = info.row.original.category?.name?.trim() || 'No category';
        const formattedCategory =
          categoryName && categoryName !== 'No category'
            ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase()
            : categoryName;
        return <span>{formattedCategory}</span>;
      }
    },
    // Category Status
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => (
        <span
          className={`${info.getValue()
            ? 'bg-success-focus text-success-600 border border-success-border'
            : 'bg-danger-focus text-danger-600 border border-danger-main'
            } px-24 py-4 radius-4 fw-medium text-sm`}
        >{info.getValue() ? 'Active' : 'Inactive'}</span>
      ),
    },
    {
      header: 'Actions',
      size: 180,
      cell: info => {
        const subCategory = info.row.original;
        return (
          <div className="d-flex justify-content-start align-items-center gap-2">
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px rounded-circle"
              data-bs-toggle="modal"
              data-bs-target="#exampleModalSubView"
              onClick={() =>
                getSubCategoriesList(subCategory)
              }
            >
              <Icon icon="majesticons:eye-line" className="text-xl" />
            </button>
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px rounded-circle"
              onClick={() => editNavigateToPage(subCategory)}
            >
              <Icon icon="lucide:edit" />
            </button>
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px rounded-circle"
              onClick={() =>
                deleteSubcategoryById(subCategory)
              }
            >
              <Icon icon="fluent:delete-24-regular" />
            </button>
          </div>
        );
      },
    },
    // Action
    // {
    //   header: 'Action',
    //   cell: info => {
    //     const subCategory = info.row.original;
    //     return (
    //       <ul className="list-inline mb-0">
    //         <li className="list-inline-item dropdown">
    //           <a
    //             className="text-muted font-size-18 px-2"
    //             href="#"
    //             role="button"
    //             data-bs-toggle="dropdown"
    //             aria-haspopup="true"
    //           >
    //             <Icon
    //               icon="entypo:dots-three-horizontal"
    //               className="menu-icon"
    //             />
    //           </a>
    //           <div className="dropdown-menu dropdown-menu-end">
    //             <a
    //               className="dropdown-item"
    //               data-bs-toggle="modal"
    //               data-bs-target="#exampleModalSubView"
    //               onClick={() =>
    //                 getSubCategoriesList(subCategory)
    //               }
    //             >
    //               View
    //             </a>
    //             <a
    //               className="dropdown-item "
    //               onClick={() => editNavigateToPage(subCategory)}
    //             >
    //               Edit
    //             </a>
    //             <a
    //               className="dropdown-item"
    //               onClick={() =>
    //                 deleteSubcategoryById(subCategory)
    //               }
    //             >
    //               Delete
    //             </a>
    //           </div>
    //         </li>
    //       </ul>
    //     );
    //   },
    // },
  ], [subPageIndex, pageSize]);
  const childCategoriesColumns = useMemo(() => [
    {
      header: 'S.No',
      size: 70,
      cell: info => (childPageIndex * pageSize) + info.row.index + 1,
    },
    {
      header: 'Image',
      cell: info => {
        const category = info.row.original;
        const imageUrl = category.images?.[0]
          ? `${IMAGE_BASE_URL}/${category.images[0].docPath}/${category.images[0].docName}`
          : "/default-image.png";
        return (
          <img
            src={imageUrl}
            alt={`${category.name} Image`}
            style={{ width: '40px', height: '40px', objectFit: 'cover' }}
          />
        );
      },
    },
    {
      header: 'Name',
      accessorFn: row => row.name?.toLowerCase() || '',
      cell: info => {
        const name = info.row.original.name || '';
        const formattedName = name
          ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
          : '';
        return <span>{formattedName}</span>;
      },
    },
    {
      header: 'Sub Category',
      accessorFn: row => (row.subcategory?.name || '').toLowerCase(),
      cell: info => {
        const subcategoryName = info.row.original.subcategory?.name || '';
        const formattedSubcategory = subcategoryName
          ? subcategoryName.charAt(0).toUpperCase() + subcategoryName.slice(1).toLowerCase()
          : '';
        return <span>{formattedSubcategory}</span>;
      },
    },
    {
      header: 'Category',
      accessorFn: row => (row.category?.name || '').toLowerCase(),
      cell: info => {
        const categoryName = info.row.original.category?.name || '';
        const formattedCategory = categoryName
          ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase()
          : '';
        return <span>{formattedCategory}</span>;
      },
    }
    ,
    {
      header: 'Status',
      accessorKey: 'status',
      cell: info => (
        <span
          className={`${info.getValue()
            ? 'bg-success-focus text-success-600 border border-success-border'
            : 'bg-danger-focus text-danger-600 border border-danger-main'
            } px-24 py-4 radius-4 fw-medium text-sm`}
        >{info.getValue() ? 'Active' : 'Inactive'}</span>
      ),
    },
    {
      header: 'Actions',
      size: 160,
      cell: info => {
        const childCategory = info.row.original;
        return (
          <div className="d-flex justify-content-start align-items-center gap-2">
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px rounded-circle"
              data-bs-toggle="modal"
              data-bs-target="#exampleModalChildView"
              onClick={() => getChildCategoriesList(childCategory)}
            >
              <Icon icon="majesticons:eye-line" className="text-xl" />
            </button>
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px rounded-circle"
              onClick={() => editNavigateToChildcatPage(childCategory)}
            >
              <Icon icon="lucide:edit" />
            </button>
            <button
              type="button"
              className="d-flex justify-content-center align-items-center bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px rounded-circle"
              onClick={() => deleteChildcategoryById(childCategory)}
            >
              <Icon icon="fluent:delete-24-regular" />
            </button>
          </div>
        );
      },
    },
  ], [childPageIndex, pageSize]);

  const fetchData = async () => {
    try {
      const input = {
        offset: pageIndex * pageSize,
        limit: pageSize,
        search: categorySearch.trim(),
      };

      if (sorting.length > 0) {
        input.sortBy = sorting[0].id;
        input.sortOrder = sorting[0].desc ? 'desc' : 'asc';
      }
      const result = await apiProvider.getCategory(input);
      if (result && result.status) {
        const items = result.response?.data?.items || [];
        const totalItems = result.response?.data?.total || 0;
        setCategoryData(items);
        setTotalPages(Math.ceil(totalItems / pageSize));
        setTotal(result.response?.data?.total || 0);
      } else {
        if (result && result.response?.message === "Invalid token") {
          console.warn("Token invalid. Redirecting to login...");
          return;
        }
        console.error(
          "Failed to fetch categories. Result is invalid or missing expected response:",
          result
        );
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
      if (error.response) {
        console.error("API Error Response Status:", error.response.status);
        console.error("API Error Response Data:", error.response.data);
      }
    }
  };

  const handleDeleteCategory = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${BASE_URL}/categories/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCategoryData((prevData) =>
        prevData.filter((category) => category._id !== id)
      );
      Swal.fire("Deleted!", "Category has been deleted.", "success");
    } catch (error) {
      console.error("Failed to delete category:", error);
      Swal.fire(
        "Error!",
        error.response?.data?.message || "Unauthorized access.",
        "error"
      );
    }
  };

  const fetchSubCategoriesData = async () => {
    try {
      const input = {
        offset: subPageIndex * pageSize,
        limit: pageSize,
        search: subcategorySearch.trim(),
      };
      console.log(subPageIndex * pageSize, "pageSize", subPageIndex, pageSize)
      if (sorting.length > 0) {
        input.sortBy = sorting[0].id;
        input.sortOrder = sorting[0].desc ? 'desc' : 'asc';
      }

      const result = await SubcategoriesApi.getSubCategorys(input);
      if (result && result.status) {
        const items = result.response?.data?.data?.items || [];
        const totalItems = result.response?.data?.data?.total || 0;
        setSubCategories(items);
        setSubTotalPages(Math.ceil(totalItems / pageSize));
        setSubTotal(totalItems || 0);
      } else {
        if (result && result.response?.message === "Invalid token") {
          console.warn("Token invalid. Redirecting to login...");
          return;
        }
        console.error(
          "Failed to fetch categories. Result is invalid or missing expected response:",
          result
        );
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
      if (error.response) {
        console.error("API Error Response Status:", error.response.status);
        console.error("API Error Response Data:", error.response.data);
      }
    }
  };

  const getSubCategoriesList = async (item) => {
    try {
      const result = await SubcategoriesApi.getSubCategoryById(item._id);
      if (result && result.status) {
        const items = result.response?.data?.data || [];
        setSubCategorieById(items);
      } else {
        if (result && result.response?.message === "Invalid token") {
          console.warn("Token invalid. Redirecting to login...");
          return;
        }
        console.error(
          "Failed to fetch categories. Result is invalid or missing expected response:",
          result
        );
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
      if (error.response) {
        console.error("API Error Response Status:", error.response.status);
        console.error("API Error Response Data:", error.response.data);
      }
    }
  };

  const getChildCategoriesList = async (item) => {
    try {
      const result = await ChildcategoryApi.getChildCategoryById(item._id);
      if (result && result.status) {
        const items = result.response?.data?.data || [];
        setChildCategorieById(items);
        console.log(items, "child")
      } else {
        if (result && result.response?.message === "Invalid token") {
          console.warn("Token invalid. Redirecting to login...");
          return;
        }
        console.error(
          "Failed to fetch categories. Result is invalid or missing expected response:",
          result
        );
      }
    } catch (error) {
      console.error("Error fetching category data:", error);
      if (error.response) {
        console.error("API Error Response Status:", error.response.status);
        console.error("API Error Response Data:", error.response.data);
      }
    }
  };

  const fetchChildCategoriesData = async () => {
    try {
      const input = {
        offset: childPageIndex * pageSize,
        limit: pageSize,
        search: childCategorySearch.trim(),
      };

      if (sorting.length > 0) {
        input.sortBy = sorting[0].id;
        input.sortOrder = sorting[0].desc ? 'desc' : 'asc';
      }

      const result = await ChildcategoryApi.getChildCategorys(input);
      console.log('Child Category API Response:', result);
      if (result && result.status) {
        const items = result.response?.data?.items || [];
        const totalItems = result.response?.data?.total || 0;
        console.log('Total Child Items from API:', totalItems);
        setChildCategories(items);
        setChildTotalPages(Math.ceil(totalItems / pageSize));
        setChildTotal(totalItems || 0);
      } else {
        if (result && result.response?.message === "Invalid token") {
          console.warn("Token invalid. Redirecting to login...");
          return;
        }
        console.error(
          "Failed to fetch child categories. Result is invalid or missing expected response:",
          result
        );
      }
    } catch (error) {
      console.error("Error fetching child category data:", error);
      if (error.response) {
        console.error("API Error Response Status:", error.response.status);
        console.error("API Error Response Data:", error.response.data);
      }
    }
  };

  const editNavigateToPage = (item) => {
    console.log(item, "items")
    if (item && item._id) {
      // navigate(`/subcategory-add`, { state: { editDatas: item } });
      navigate(`/subcategory-add?from=subcategorylist`, { state: { editDatas: item } })

    } else {
      alert("Category details not found.");
    }
  };

  const editNavigateToChildcatPage = (item) => {
    if (item && item._id) {
      // navigate(`/childcategory-add`, { state: { editDatas: item } });
      navigate(`/childcategory-add?from=childcategorylist`, { state: { editDatas: item } })

    } else {
      alert("Category details not found.");
    }
  };

  const deleteSubcategoryById = async (item) => {
    const result = await SubcategoriesApi.deleteSubCategory(item._id);
    if (result && result.response && result.response) {
      fetchSubCategoriesData();
    }
  };

  const deleteChildcategoryById = async (item) => {
    const result = await ChildcategoryApi.deleteChildCategory(item._id);
    if (result && result.response && result.response) {
      fetchChildCategoriesData();
    }
  };

  // Calculate paginated data
  const indexOfLastCategory = currentPage * itemsPerPage;
  const indexOfFirstCategory = indexOfLastCategory - itemsPerPage;
  const currentCategories = categoryData.slice(
    indexOfFirstCategory,
    indexOfLastCategory
  );
  const totalCategoryPages = Math.ceil(categoryData.length / itemsPerPage);

  const indexOfLastSubCategory = currentSubPage * itemsPerPage;
  const indexOfFirstSubCategory = indexOfLastSubCategory - itemsPerPage;
  const currentSubCategories = subCategories.slice(
    indexOfFirstSubCategory,
    indexOfLastSubCategory
  );
  const totalSubCategoryPages = Math.ceil(subCategories.length / itemsPerPage);

  const indexOfLastChildCategory = currentChildPage * itemsPerPage;
  const indexOfFirstChildCategory = indexOfLastChildCategory - itemsPerPage;
  const currentChildCategories = childCategories.slice(
    indexOfFirstChildCategory,
    indexOfLastChildCategory
  );
  const totalChildCategoryPages = Math.ceil(
    childCategories.length / itemsPerPage
  );
  const handleNextPage = () => {
    if (pageIndex + 1 < totalPages) setPageIndex(prev => prev + 1);
  };

  const handlePreviousPage = () => {
    if (pageIndex > 0) setPageIndex(prev => prev - 1);
  };

  // Debounced search handlers
  const handleCategorySearch = (e) => {
    const value = e.target.value;
    setCategorySearch(value);
    if (categorySearchRef.current) clearTimeout(categorySearchRef.current);
    setPageIndex(0);
    fetchData();
  };
  const handleSubcategorySearch = (e) => {
    const value = e.target.value;
    setSubcategorySearch(value);
    if (subcategorySearchRef.current) clearTimeout(subcategorySearchRef.current);
    setSubPageIndex(0);
    fetchSubCategoriesData();
  };
  const handleChildCategorySearch = (e) => {
    const value = e.target.value;
    setChildCategorySearch(value);
    if (childCategorySearchRef.current) clearTimeout(childCategorySearchRef.current);
    setChildPageIndex(0);
    fetchChildCategoriesData();
  };
  console.log(categoryData, "categoryData");
  console.log(subCategorieById, "selectedCategory")
  console.log(childCategorieById, "child")
  return (
    <div>
      <div className="col-xxl-12">
        <div className="p-0 overflow-hidden position-relative radius-12 h-100">
          <div className="card-body p-24 pt-10">
            <ul
              className="nav focus-tab nav-pills nav-justified mb-16"
              id="pills-tab-two"
              role="tablist"
            >
              <li className="nav-item" role="presentation">
                <button
                  className="nav-link fw-semibold text-primary-light radius-4 px-16 py-10"
                  id="pills-focus-home-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#pills-focus-home"
                  type="button"
                // onClick={() => navigate("/category")}
                >
                  Category List
                </button>

              </li>
              <li className="nav-item" role="presentation">
                <button
                  className="nav-link fw-semibold text-primary-light radius-4 px-16 py-10"
                  id="pills-focus-details-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#pills-focus-details"
                  type="button"
                // onClick={() => navigate("/category?type=subcategorylist")}
                >
                  Sub Category List
                </button>

              </li>
              {/* <li className="nav-item" role="presentation">
                <button
                  className="nav-link fw-semibold text-primary-light radius-4 px-16 py-10"
                  id="pills-focus-profile-tab"
                  data-bs-toggle="pill"
                  data-bs-target="#pills-focus-profile"
                  type="button"
                >
                  Child Category List
                </button>

              </li> */}
            </ul>
            <div className="tab-content" id="pills-tab-twoContent">
              <div
                className="tab-pane fade"
                id="pills-focus-home"
                role="tabpanel"
                aria-labelledby="pills-focus-home-tab"
                tabIndex={0}
              >
                <div>
                  <div className="card h-100 p-0 radius-12">
                    <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                      <div style={{ position: "relative" }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ maxWidth: 350, minWidth: 200 }}
                          placeholder="Search..."
                          value={categorySearch}
                          onChange={handleCategorySearch}
                        />
                        <div className="search-icon" style={{ position: "absolute", right: "10px", top: "8px" }}>
                          <Icon
                            icon="ic:baseline-search"
                            className="icon text-xl line-height-1"

                          />
                        </div>
                      </div>
                      <div>
                        <button
                          type="button"
                          className="btn btn-success text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-right gap-2"
                          onClick={() => navigate(`/category-add`)}
                        >
                          <Icon
                            icon="ic:baseline-plus"
                            className="icon text-xl line-height-1"
                          />
                          <NavLink to="/category-add" className="navLink-text">
                            Add Category
                          </NavLink>
                        </button>
                      </div>
                    </div>

                    <div className="card-body p-24">
                      <div className="table-responsive">
                        <table className="table table-striped table-centered align-middle table-nowrap mb-0 table-check d-none">
                          <thead>
                            <tr>
                              <th scope="col">S.No</th>
                              <th scope="col">Category Image</th>
                              <th scope="col">Category Name</th>
                              <th scope="col">Category Status</th>
                              <th scope="col">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentCategories.map((category, index) => (
                              <tr key={category._id}>
                                <td>{indexOfFirstCategory + index + 1}</td>
                                <td>
                                  <img
                                    src={
                                      category.images?.[0]
                                        ? `${IMAGE_BASE_URL}/${category.images[0].docPath}/${category.images[0].docName}`
                                        : "/default-image.png"
                                    }
                                    alt={`${category.name} Image`}
                                    style={{
                                      width: "40px",
                                      height: "40px",
                                      objectFit: "cover",
                                    }}
                                  />
                                </td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                      <span className="text-md mb-0 fw-normal text-secondary-light">
                                        {category.name}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span
                                    className={`${category.status
                                      ? "btn btn-subtle-success btn-sm"
                                      : "btn btn-subtle-danger btn-sm"
                                      } px-24 py-4 radius-4 fw-medium text-sm`}
                                  >
                                    {category.status ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td>
                                  <ul className="list-inline mb-0">
                                    <li className="list-inline-item dropdown">
                                      <a
                                        className="text-muted font-size-18 px-2"
                                        href="#"
                                        role="button"
                                        data-bs-toggle="dropdown"
                                        aria-haspopup="true"
                                      >
                                        <Icon
                                          icon="entypo:dots-three-horizontal"
                                          className="menu-icon"
                                        />
                                      </a>
                                      <div className="dropdown-menu dropdown-menu-end">
                                        <a
                                          className="dropdown-item"
                                          data-bs-toggle="modal"
                                          data-bs-target="#exampleModalView"
                                          onClick={() =>
                                            setSelectedCategory(category)
                                          }
                                        >
                                          View
                                        </a>
                                        <a
                                          className="dropdown-item"
                                          onClick={() =>
                                            navigate("/category-add", {
                                              state: { editDatas: category },
                                            })
                                          }
                                        >
                                          Edit
                                        </a>
                                        <a
                                          className="dropdown-item"
                                          onClick={() =>
                                            handleDeleteCategory(category._id)
                                          }
                                        >
                                          Delete
                                        </a>
                                      </div>
                                    </li>
                                  </ul>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <ReactTableComponent
                          data={categoryData}
                          columns={columns}
                          pageIndex={pageIndex}
                          totalPages={totalPages}
                          onNextPage={handleNextPage}
                          onPreviousPage={handlePreviousPage}
                          // sorting={sorting}
                          // setSorting={setSorting}
                          totalRecords={total}
                        />
                      </div>
                      {/* Category Pagination */}
                      <div className="d-flex align-items-center mt-4 gap-3 d-none">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="btn btn-primary btn-sm"
                        >
                          Previous
                        </button>
                        <span>
                          Page {currentPage} of {totalCategoryPages}
                        </span>
                        <select
                          className="form-select form-select-sm w-auto"
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                        <button
                          onClick={() => setCurrentPage((prev) => prev + 1)}
                          disabled={currentPage >= totalCategoryPages}
                          className="btn btn-primary btn-sm"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="tab-pane fade"
                id="pills-focus-details"
                role="tabpanel"
                aria-labelledby="pills-focus-details-tab"
                tabIndex={0}
              >
                <div className="card h-100 p-0 radius-12">
                  <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="form-control"
                        style={{ maxWidth: 350, minWidth: 200 }}
                        placeholder="Search ..."
                        value={subcategorySearch}
                        onChange={handleSubcategorySearch}
                      />
                      <div className="search-icon" style={{ position: "absolute", right: "10px", top: "8px", }}>
                        <Icon
                          icon="ic:baseline-search"
                          className="icon text-xl line-height-1"

                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="btn btn-success text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-right gap-2"
                        onClick={() => navigate(`/subcategory-add?from=subcategorylist`)}
                      >
                        <Icon
                          icon="ic:baseline-plus"
                          className="icon text-xl line-height-1"
                        />
                        <NavLink to="/subcategory-add?from=subcategorylist" className="navLink-text">
                          Add Sub Category
                        </NavLink>
                      </button>
                    </div>
                  </div>

                  <div className="card-body p-24">
                    <div>
                      <table className="table table-striped table-centered align-middle table-nowrap mb-0 table-check d-none">
                        <thead>
                          <tr>
                            <th scope="col">S.No</th>
                            <th scope="col">Sub Category Image</th>
                            <th scope="col">Sub Category Name</th>
                            <th scope="col">Parent Category</th>
                            <th scope="col"> Status</th>
                            <th scope="col">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentSubCategories.map((item, index) => (
                            <tr key={item.id}>
                              <td>{indexOfFirstSubCategory + index + 1}</td>
                              <td>
                                <img
                                  src={
                                    item.images?.[0]
                                      ? `${IMAGE_BASE_URL}/${item.images[0].docPath}/${item.images[0].docName}`
                                      : "/default-image.png"
                                  }
                                  alt={`${item.name} Image`}
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    objectFit: "cover",
                                  }}
                                />
                              </td>
                              <td>{item.name}</td>
                              <td>
                                {item &&
                                  item.category &&
                                  item.category.length > 0 &&
                                  item.category[0].name}
                              </td>
                              <td>
                                <span
                                  className={`${item.status === true
                                    ? "btn btn-subtle-success btn-sm "
                                    : "btn btn-subtle-danger btn-sm "
                                    } px-24 py-4 radius-4 fw-medium text-sm`}
                                >
                                  {item.status === true ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td>
                                <ul className="list-inline mb-0">
                                  <li className="list-inline-item dropdown">
                                    <a
                                      className="text-muted font-size-18 px-2"
                                      href="#"
                                      role="button"
                                      data-bs-toggle="dropdown"
                                      aria-haspopup="true"
                                    >
                                      <Icon
                                        icon="entypo:dots-three-horizontal"
                                        className="menu-icon"
                                      />
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-end">
                                      <a
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#exampleModalSubView"
                                        onClick={() =>
                                          getSubCategoriesList(item)
                                        }
                                      >
                                        View
                                      </a>
                                      <a
                                        className="dropdown-item "
                                        onClick={() => editNavigateToPage(item)}
                                      >
                                        Edit
                                      </a>
                                      <a
                                        className="dropdown-item"
                                        onClick={() =>
                                          deleteSubcategoryById(item)
                                        }
                                      >
                                        Delete
                                      </a>
                                    </div>
                                  </li>
                                </ul>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <ReactTableComponent
                        data={subCategories}
                        columns={subCategoriesColumns}
                        pageIndex={subPageIndex}
                        totalPages={subTotalPages}
                        onNextPage={() => setSubPageIndex(prev => Math.min(prev + 1, subTotalPages - 1))}
                        onPreviousPage={() => setSubPageIndex(prev => Math.max(prev - 1, 0))}
                        sorting={sorting}
                        setSorting={setSorting}
                        totalRecords={subTotal}
                      />
                    </div>
                    {/* Sub Category Pagination */}
                    <div className="d-flex align-items-center mt-4 gap-3 d-none">
                      <button
                        onClick={() =>
                          setCurrentSubPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentSubPage === 1}
                        className="btn btn-primary btn-sm"
                      >
                        Previous
                      </button>
                      <span>
                        Page {currentSubPage} of {totalSubCategoryPages}
                      </span>
                      <select
                        className="form-select form-select-sm w-auto"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentSubPage(1);
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                      <button
                        onClick={() => setCurrentSubPage((prev) => prev + 1)}
                        disabled={currentSubPage >= totalSubCategoryPages}
                        className="btn btn-primary btn-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="tab-pane fade"
                id="pills-focus-profile"
                role="tabpanel"
                aria-labelledby="pills-focus-profile-tab"
                tabIndex={0}
              >
                <div className="card h-100 p-0 radius-12">
                  <div className="card-header border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        className="form-control"
                        style={{ maxWidth: 350, minWidth: 200 }}
                        placeholder="Search ..."
                        value={childCategorySearch}
                        onChange={handleChildCategorySearch}
                      />
                      <div className="search-icon" style={{ position: "absolute", right: "10px", top: "8px", }}>
                        <Icon
                          icon="ic:baseline-search"
                          className="icon text-xl line-height-1"

                        />
                      </div>
                    </div>
                    <div>
                      <button
                        type="button"
                        className="btn btn-success text-sm btn-sm px-12 py-12 radius-8 d-flex align-items-right gap-2"
                        onClick={() => navigate(`/childcategory-add?from=childcategorylist`)}
                      >
                        <Icon
                          icon="ic:baseline-plus"
                          className="icon text-xl line-height-1"
                        />
                        <NavLink
                          to="/childcategory-add?from=childcategorylist"
                          className="navLink-text"
                        >
                          Add Child Category
                        </NavLink>
                      </button>
                    </div>
                  </div>

                  <div className="card-body p-24">
                    <div className="table-responsive scroll-sm">
                      <table className="table table-striped table-centered align-middle table-nowrap mb-0 table-check d-none">
                        <thead>
                          <tr>
                            <th scope="col">S.No</th>
                            <th scope="col">Child Category Image</th>
                            <th scope="col">Child Category Name</th>
                            <th scope="col">Sub Category Name</th>
                            <th scope="col">Parent Category Name</th>
                            <th scope="col">Category Status</th>
                            <th scope="col">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentChildCategories.map((item, index) => (
                            <tr key={item.id}>
                              <td>{indexOfFirstChildCategory + index + 1}</td>
                              <td>
                                <img
                                  src={
                                    item.images?.[0]
                                      ? `${IMAGE_BASE_URL}/${item.images[0].docPath}/${item.images[0].docName}`
                                      : "/default-image.png"
                                  }
                                  alt={`${item.name} Image`}
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    objectFit: "cover",
                                  }}
                                />
                              </td>
                              <td>{item.name}</td>
                              <td>
                                {item &&
                                  item.subcategory &&
                                  item.subcategory.length > 0 &&
                                  item.subcategory[0].name}
                              </td>
                              <td>
                                {item &&
                                  item.category &&
                                  item.category.length > 0 &&
                                  item.category[0].name}
                              </td>
                              <td>
                                <span
                                  className={`${item.status === true
                                    ? "btn btn-subtle-success btn-sm"
                                    : "btn btn-subtle-danger btn-sm"
                                    } px-24 py-4 radius-4 fw-medium text-sm`}
                                >
                                  {item.status === true ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td>
                                <ul className="list-inline mb-0">
                                  <li className="list-inline-item dropdown">
                                    <a
                                      className="text-muted font-size-18 px-2"
                                      href="#"
                                      role="button"
                                      data-bs-toggle="dropdown"
                                      aria-haspopup="true"
                                    >
                                      <Icon
                                        icon="entypo:dots-three-horizontal"
                                        className="menu-icon"
                                      />
                                    </a>
                                    <div className="dropdown-menu dropdown-menu-end">
                                      <a
                                        className="dropdown-item"
                                        data-bs-toggle="modal"
                                        data-bs-target="#exampleModalChildView"
                                        onClick={() =>
                                          getChildCategoriesList(item)
                                        }
                                      >
                                        View
                                      </a>
                                      <a
                                        className="dropdown-item"
                                        onClick={() =>
                                          editNavigateToChildcatPage(item)
                                        }
                                      >
                                        Edit
                                      </a>
                                      <a
                                        className="dropdown-item"
                                        onClick={() =>
                                          deleteChildcategoryById(item)
                                        }
                                      >
                                        Delete
                                      </a>
                                    </div>
                                  </li>
                                </ul>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <ReactTableComponent
                        data={childCategories}
                        columns={childCategoriesColumns}
                        pageIndex={childPageIndex}
                        totalPages={childTotalPages}
                        onNextPage={() => setChildPageIndex(prev => Math.min(prev + 1, childTotalPages - 1))}
                        onPreviousPage={() => setChildPageIndex(prev => Math.max(prev - 1, 0))}
                        // sorting={sorting}
                        // setSorting={setSorting}
                        totalRecords={childTotal}
                      />
                    </div>
                    {/* Child Category Pagination */}
                    <div className="d-flex align-items-center mt-4 gap-3 d-none">
                      <button
                        onClick={() =>
                          setCurrentChildPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={currentChildPage === 1}
                        className="btn btn-primary btn-sm"
                      >
                        Previous
                      </button>
                      <span>
                        Page {currentChildPage} of {totalChildCategoryPages}
                      </span>
                      <select
                        className="form-select form-select-sm w-auto"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentChildPage(1);
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                      <button
                        onClick={() => setCurrentChildPage((prev) => prev + 1)}
                        disabled={currentChildPage >= totalChildCategoryPages}
                        className="btn btn-primary btn-sm"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal fade"
        id="exampleModalView"
        tabIndex={-1}
        aria-labelledby="exampleModalEditLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog modal-lg  modal-dialog-centered">
          <div className="modal-content radius-16 bg-base">
            <div className="modal-header py-16 px-24 border border-top-0 border-start-0 border-end-0">
              <h1 className="modal-title fs-5" id="exampleModalEditLabel">
                Category Details
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body p-24">
              <div class="card-body">
                <div class="mb-3 row">
                  <div class="col-md-6">
                    <h5 class="font-size-14 py-2">Category Name :</h5>
                  </div>

                  <div class="col-md-6">
                    <span class="fw-normal text-body">
                      {selectedCategory?.name || "-"}
                    </span>
                  </div>
                </div>
                <div class="mb-3 row">
                  <div class="col-md-6">
                    <h5 class="font-size-14 py-2">Description : </h5>
                  </div>

                  <div class="col-md-6">
                    <span class="fw-normal text-body">
                      {selectedCategory?.description || "-"}
                    </span>
                  </div>
                </div>
                <div class="mb-3 row">
                  <div class="col-md-6">
                    <h5 class="font-size-14 py-2">Category Slug : </h5>
                  </div>

                  <div class="col-md-6">
                    <span class="fw-normal text-body">
                      {selectedCategory?.slug || "-"}
                    </span>
                  </div>
                </div>

                <div class="mb-3 row">
                  <div class="col-md-6">
                    <h5 class="font-size-14 py-2">Tags : </h5>
                  </div>

                  <div class="col-md-6">
                    <span class="fw-normal text-body">
                      {selectedCategory?.tags
                        ? selectedCategory.tags.split(",").join(", ")
                        : "-"}
                    </span>
                  </div>
                </div>

                <div class="mb-3 row d-none">
                  <div class="col-md-6">
                    <h5 class="font-size-14 py-2">Display Order : </h5>
                  </div>

                  <div class="col-md-6">
                    <span class="fw-normal text-body">
                      {selectedCategory?.displayOrder || "-"}
                    </span>
                  </div>
                </div>

                <div class="mb-3 row">
                  <div class="col-md-6">
                    <h5 class="font-size-14 py-2">Featured Category : </h5>
                  </div>

                  <div class="col-md-6">
                    <span class="fw-normal text-body">
                      {" "}
                      {selectedCategory?.isFeatured ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                <div class="mb-3 row">
                  <div class="col-md-6">
                    <h5 class="font-size-14 py-2">Status : </h5>
                  </div>

                  <div class="col-md-6">
                    <span class="fw-normal text-body">
                      {selectedCategory?.status ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/*
                                <div class="modal-footer">
                                    <button type="button" class="btn btn-secondary waves-effect" data-bs-dismiss="modal">Close</button>
                                    <button type="button" class="btn btn-primary waves-effect waves-light">Save changes</button>
                                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal fade"
        id="exampleModalChildView"
        tabIndex={-1}
        aria-labelledby="exampleModalEditLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-dialog modal-lg  modal-dialog-centered">
          <div className="modal-content radius-16 bg-base">
            <div className="modal-header py-16 px-24 border border-top-0 border-start-0 border-end-0">
              <h1 className="modal-title fs-5" id="exampleModalEditLabel">
                Child Category Details
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body p-24">
              <div className="card-body">
                <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Child Category Name :</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {childCategorieById?.name}
                    </span>
                  </div>
                </div>

                <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Sub Category :</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {childCategorieById?.subcategoryDetails ? <>{childCategorieById?.subcategoryDetails?.name}</> : <>-</>}
                    </span>
                  </div>
                </div>

                <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Category :</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {childCategorieById?.categoryDetails ? <>{childCategorieById.categoryDetails.name}</> : <>{"N/A"}</>}
                    </span>
                  </div>
                </div>

                <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Description :</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {childCategorieById?.description ? <>{childCategorieById?.description}</> : <>-</>}
                    </span>
                  </div>
                </div>

                <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Child Category Slug :</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {childCategorieById?.slug}
                    </span>
                  </div>
                </div>

                {/* <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Display Order :</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {childCategorieById?.displayOrder}
                    </span>
                  </div>
                </div> */}

                <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Featured Category :</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {childCategorieById?.featuredCategory ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Status :</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {childCategorieById?.status ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="modal fade"
        id="exampleModalSubView"
        tabIndex={-1}
        aria-labelledby="exampleModalEditLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content radius-16 bg-base">
            <div className="modal-header py-16 px-24 border-bottom">
              <h1 className="modal-title fs-5" id="exampleModalEditLabel">
                Sub Category Details
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body p-4">
              <div className="card-body">
                <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Sub Category Name:</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {subCategorieById.name}
                    </span>
                  </div>
                </div>

                <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Category:</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {subCategorieById?.categoryDetails?.name}
                    </span>
                  </div>
                </div>

                <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Description:</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {subCategorieById.description ? <>{subCategorieById.description}</> : <>-</>}
                    </span>
                  </div>
                </div>

                <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Sub Category Slug:</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {subCategorieById.slug}
                    </span>
                  </div>
                </div>

                {/* <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Display Order:</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {subCategorieById.displayOrder}
                    </span>
                  </div>
                </div> */}

                <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Featured Category:</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {subCategorieById.featuredCategory ? "Yes" : "No"}
                    </span>
                  </div>
                </div>

                <div className="mb-3 row">
                  <div className="col-md-6">
                    <h5 className="font-size-14 py-2">Status:</h5>
                  </div>
                  <div className="col-md-6">
                    <span className="fw-normal text-body">
                      {subCategorieById.status ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                You can hide or repurpose Save button if only viewing
                            </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPageLayer;
