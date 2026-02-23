import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, NavLink, useLocation } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import { logout, setUser } from "../redux/authSlice";
import { useDispatch, useSelector } from "react-redux";
import "boxicons/css/boxicons.min.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import adminUserApi from "../apiProvider/adminuserapi";
import usePermission from "../hook/usePermission";

const MasterLayout = ({ children }) => {
  let [sidebarActive, seSidebarActive] = useState(false);
  let [mobileMenu, setMobileMenu] = useState(false);
  const location = useLocation();
  const disPatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchUserOnRefresh = async () => {
      if (token) {
        try {
          const decodedToken = jwtDecode(token);
          const userId = decodedToken.id;
          const userData = await adminUserApi.Userbyid(userId);
          console.log(userData, "userDataertyuioiuytrewertyu");
          if (userData.status) {
            disPatch(setUser(userData.response.data));
          }
        } catch (error) {
          console.error("Error fetching user data on refresh:", error);
        }
      }
    };
    fetchUserOnRefresh();
  }, [token, disPatch]);


  useEffect(() => {
    const handleDropdownClick = (event) => {
      event.preventDefault();
      const clickedLink = event.currentTarget;
      const clickedDropdown = clickedLink.closest(".dropdown");

      if (!clickedDropdown) return;

      const isActive = clickedDropdown.classList.contains("open");

      // Close all dropdowns
      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");
        const submenu = dropdown.querySelector(".sidebar-submenu");
        if (submenu) {
          submenu.style.maxHeight = "0px"; // Collapse submenu
        }
      });

      // Toggle the clicked dropdown
      if (!isActive) {
        clickedDropdown.classList.add("open");
        const submenu = clickedDropdown.querySelector(".sidebar-submenu");
        if (submenu) {
          submenu.style.maxHeight = `${submenu.scrollHeight}px`;
        }
        // Store the active dropdown state
        const dropdownIndex = Array.from(allDropdowns).indexOf(clickedDropdown);
        localStorage.setItem('activeDropdownIndex', dropdownIndex.toString());
      } else {
        localStorage.removeItem('activeDropdownIndex');
      }
    };

    // Attach click event listeners to all dropdown triggers
    // Use a timeout to ensure DOM is ready, especially after component mount
    const attachEventListeners = () => {
      const dropdownTriggers = document.querySelectorAll(
        ".sidebar-menu .dropdown > a"
      );

      if (dropdownTriggers.length === 0) {
        // Retry if elements not found yet
        setTimeout(attachEventListeners, 50);
        return;
      }

      dropdownTriggers.forEach((trigger) => {
        // Remove existing listener to prevent duplicates
        trigger.removeEventListener("click", handleDropdownClick);
        trigger.addEventListener("click", handleDropdownClick);
      });
    };

    attachEventListeners();

    const openActiveDropdown = () => {
      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");

      // If dropdowns are not found, retry after a short delay (for page refresh scenarios)
      if (allDropdowns.length === 0) {
        setTimeout(() => {
          openActiveDropdown();
        }, 100);
        return;
      }

      let activeDropdownFound = false;

      // First, try to find active dropdown based on current route
      allDropdowns.forEach((dropdown, index) => {
        const submenuLinks = dropdown.querySelectorAll(".sidebar-submenu li a");
        submenuLinks.forEach((link) => {
          if (
            link.getAttribute("href") === location.pathname ||
            link.getAttribute("to") === location.pathname
          ) {
            dropdown.classList.add("open");
            const submenu = dropdown.querySelector(".sidebar-submenu");
            if (submenu) {
              submenu.style.maxHeight = `${submenu.scrollHeight}px`; // Expand submenu
            }
            // Store the active dropdown state
            localStorage.setItem('activeDropdownIndex', index.toString());
            activeDropdownFound = true;
          }
        });
      });

      // If no active dropdown found based on route, try to restore from localStorage
      if (!activeDropdownFound) {
        const storedActiveIndex = localStorage.getItem('activeDropdownIndex');
        if (storedActiveIndex !== null) {
          const index = parseInt(storedActiveIndex, 10);
          if (index >= 0 && index < allDropdowns.length) {
            const dropdown = allDropdowns[index];
            dropdown.classList.add("open");
            const submenu = dropdown.querySelector(".sidebar-submenu");
            if (submenu) {
              submenu.style.maxHeight = `${submenu.scrollHeight}px`;
            }
          }
        }
      }
    };

    // Open the submenu that contains the active route
    // Use setTimeout to ensure DOM is fully rendered, especially on page refresh
    const timeoutId = setTimeout(() => {
      openActiveDropdown();
    }, 0);

    // Cleanup event listeners on unmount
    return () => {
      clearTimeout(timeoutId);
      // Clean up all dropdown event listeners
      const dropdownTriggers = document.querySelectorAll(
        ".sidebar-menu .dropdown > a"
      );
      dropdownTriggers.forEach((trigger) => {
        trigger.removeEventListener("click", handleDropdownClick);
      });
    };
  }, [location.pathname]);

  let sidebarControl = () => {
    seSidebarActive(!sidebarActive);
  };

  let mobileMenuControl = () => {
    setMobileMenu(!mobileMenu);
  };
  const logOutFunct = () => {
    disPatch(logout());
  };
  // Dashboard
  const canViewDashboard = usePermission("dashboard", "view");

  // Website
  const canViewHomePage = usePermission("homePage", "view");
  const canViewWebsite = canViewHomePage;

  // Catalog
  const canViewCategories = usePermission("categories", "view");
  const canViewAttributes = usePermission("attributes", "view");
  const canViewBrands = usePermission("brands", "view");
  const canViewProducts = usePermission("products", "view");
  const canViewOfferCreations = usePermission("offerCreations", "view");
  const canViewRootCreation = usePermission("rootCreation", "view");
  const canViewCouponCreation = usePermission("couponCreation", "view");
  const canViewCatalog = canViewCategories || canViewAttributes || canViewBrands || canViewProducts || canViewOfferCreations || canViewRootCreation || canViewCouponCreation;

  // Orders
  const canViewOrderList = usePermission("orderList", "view");
  const canViewRetailerOrderList = usePermission("retailerOrderList", "view");
  const canViewCustomerOrder = usePermission("customerOrder", "view");
  const canViewPosOrder = usePermission("posOrder", "view");
  const canViewReturnRequest = usePermission("returnRequest", "view");
  const canViewOrderReport = usePermission("orderReport", "view");
  const canViewOrders = canViewOrderList || canViewRetailerOrderList || canViewCustomerOrder || canViewPosOrder || canViewReturnRequest || canViewOrderReport;

  // Users
  const canViewUsersList = usePermission("usersList", "view");
  const canViewUserRolePermission = usePermission("userRolePermission", "view");
  const canViewPasswordManagement = usePermission("passwordManagement", "view");
  const canViewUserActivityLog = usePermission("userActivityLog", "view");
  const canViewUsersReport = usePermission("usersReport", "view");
  const canViewUsers = canViewUsersList || canViewUserRolePermission || canViewPasswordManagement || canViewUserActivityLog || canViewUsersReport;

  // POS
  const canViewPosNew = usePermission("posNew", "view");
  const canViewPosOrderHistroy = usePermission("posOrderHistroy", "view");
  const canViewPOS = canViewPosNew || canViewPosOrderHistroy;

  // CRM
  const canViewCrmUserList = usePermission("crmUserList", "view");
  const canViewCrmNew = usePermission("crmNew", "view");
  const canViewCrmOrderHistroy = usePermission("crmOrderHistroy", "view");
  const canViewCRM = canViewCrmUserList || canViewCrmNew || canViewCrmOrderHistroy;

  // Customer
  const canViewCustomerList = usePermission("customerList", "view");
  const canViewCustomerOrderHistroy = usePermission("customerOrderHistroy", "view");
  const canViewCustomerReports = usePermission("customerReports", "view");
  const canViewCustomer = canViewCustomerList || canViewCustomerOrderHistroy || canViewCustomerReports;

  // Wholesalers
  const canViewWholesalerList = usePermission("wholesalerList", "view");
  const canViewWholesalerOrderHistory = usePermission("wholesalerOrderHistory", "view");
  const canViewWholesalerCreditManagement = usePermission("wholesalerCreditManagement", "view");
  const canViewWholesalerPaymentDues = usePermission("wholesalerPaymentDues", "view");
  const canViewWholesalerReports = usePermission("wholesalerReports", "view");
  const canViewWholesalers = canViewWholesalerList || canViewWholesalerOrderHistory || canViewWholesalerCreditManagement || canViewWholesalerPaymentDues || canViewWholesalerReports;

  // Retailers
  const canViewRetailersList = usePermission("retailersList", "view");
  const canViewRetailerOrderHistory = usePermission("retailerOrderHistory", "view");
  const canViewRetailerCreditManagement = usePermission("retailerCreditManagement", "view");
  const canViewRetailerPaymentDues = usePermission("retailerPaymentDues", "view");
  const canViewRetailerReports = usePermission("retailerReports", "view");
  const canViewRetailers = canViewRetailersList || canViewRetailerOrderHistory || canViewRetailerCreditManagement || canViewRetailerPaymentDues || canViewRetailerReports;

  // Vendors
  const canViewVendorList = usePermission("vendorList", "view");
  const canViewVendorOrderList = usePermission("vendorOrderList", "view");
  const canViewVendorPayments = usePermission("vendorPayments", "view");
  const canViewVendorPaymentDues = usePermission("vendorPaymentDues", "view");
  const canViewVendorReports = usePermission("vendorReports", "view");
  const canViewVendors = canViewVendorList || canViewVendorOrderList || canViewVendorPayments || canViewVendorPaymentDues || canViewVendorReports;

  // Salesman
  const canViewSalesmanList = usePermission("salesmanList", "view");
  const canViewSalesmanTargetsIncentives = usePermission("salesmanTargetsIncentives", "view");
  const canViewSalesmanPerformance = usePermission("salesmanPerformance", "view");
  const canViewSalesmanOrderHistory = usePermission("salesmanOrderHistory", "view");
  const canViewSalesmanReport = usePermission("salesmanReport", "view");
  const canViewSalesCashSettlement = usePermission("salesCashSettlement", "view");
  const canViewSalesman = canViewSalesmanList || canViewSalesmanTargetsIncentives || canViewSalesmanPerformance || canViewSalesmanOrderHistory || canViewSalesmanReport || canViewSalesCashSettlement;

  // Delivery
  const canViewDeliveryList = usePermission("deliveryList", "view");
  const canViewDeliveryTrackingUpdates = usePermission("deliveryTrackingUpdates", "view");
  const canViewDeliveryPersonList = usePermission("deliveryPersonList", "view");
  const canViewDeliveryPerformancePayroll = usePermission("deliveryPerformancePayroll", "view");
  const canViewDeliveryReports = usePermission("deliveryReports", "view");
  const canViewDelivery = canViewDeliveryList || canViewDeliveryTrackingUpdates || canViewDeliveryPersonList || canViewDeliveryPerformancePayroll || canViewDeliveryReports;

  // Payment & Credit
  const canViewPaymentTransactionList = usePermission("paymentTransactionList", "view");
  const canViewRecordManualPayment = usePermission("recordManualPayment", "view");
  const canViewOutstandingPayment = usePermission("outstandingPayment", "view");
  const canViewProcessRefund = usePermission("processRefund", "view");
  const canViewPaymentCreditReport = usePermission("paymentCreditReport", "view");
  const canViewPaymentAndCredit = canViewPaymentTransactionList || canViewRecordManualPayment || canViewOutstandingPayment || canViewProcessRefund || canViewPaymentCreditReport;

  // Inventory
  const canViewAddStock = usePermission("addStock", "view");
  const canViewInventoryList = usePermission("inventoryList", "view");
  const canViewInventoryLog = usePermission("inventoryLog", "view");
  const canViewInventoryReports = usePermission("inventoryReports", "view");
  const canViewInventory = canViewAddStock || canViewInventoryList || canViewInventoryLog || canViewInventoryReports;

  // Petty Cash
  const canViewPettycashTransactionList = usePermission("pettycashTransactionList", "view");
  const canViewPettyCashReport = usePermission("pettyCashReport", "view");
  const canViewPettyCash = canViewPettycashTransactionList || canViewPettyCashReport;

  // Tax
  const canViewTaxList = usePermission("taxList", "view");
  const canViewTax = canViewTaxList;

  // Reports
  const canViewProductReport = usePermission("productReport", "view");
  const canViewReports = canViewProductReport;

  return (
    <section className={mobileMenu ? "overlay active" : "overlay "}>
      {/* sidebar */}
      <aside
        className={
          sidebarActive
            ? "sidebar active "
            : mobileMenu
              ? "sidebar sidebar-open"
              : "sidebar"
        }
      >
        <button
          onClick={mobileMenuControl}
          type="button"
          className="sidebar-close-btn"
        >
          <Icon icon="radix-icons:cross-2" />
        </button>
        <div>
          <Link to="/dashboard" className="sidebar-logo">
            <img
              src="/assets/images/logo/Alpha-5.png"
              alt="site logo"
              className="light-logo"
              style={{ maxHeight: "4.4375rem" }}
            />
            <img
              src="/assets/images/logo/nalsuvai-logo.png"
              alt="site logo"
              className="dark-logo"
            />
            <img
              src="/assets/images/logo/Alpha-9.png"
              alt="site logo"
              className="logo-icon"
            />
          </Link>
        </div>
        <div className="sidebar-menu-area">
          <ul className="sidebar-menu" id="sidebar-menu">
            {canViewDashboard && (
              <li className="sidebar-menu-group-title">
                <NavLink to="/dashboard">
                  <Icon icon="bx:bx-home-alt" className="menu-icon" />
                  Dashboard
                </NavLink>
              </li>
            )}
            {canViewWebsite && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:cart-arrow-right" className="menu-icon" />

                  <span>Website</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewHomePage && (
                    <li>
                      <NavLink
                        to="/home-page"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Home Banner
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )}
            {canViewCatalog && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:cart-arrow-right" className="menu-icon" />

                  <span>Catalog</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewCategories && (
                    <li>
                      <NavLink
                        to="/category"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Categories
                      </NavLink>
                    </li>
                  )}
                  {/* {canViewAttributes && (
                    <li>
                      <NavLink
                        to="/attribute"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Attributes
                      </NavLink>
                    </li>
                  )} */}

                  {canViewTaxList && (
                    <li>
                      <NavLink
                        to="/tax-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Tax List
                      </NavLink>
                    </li>
                  )}
                  {canViewBrands && (
                    <li>
                      <NavLink
                        to="/brand"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Brands
                      </NavLink>
                    </li>
                  )}
                  {canViewProducts && (
                    <li>
                      <NavLink
                        to="/product"
                        className={(navData) =>
                          navData.isActive || location.pathname === '/create-product' ? "active-page" : ""
                        }
                      >
                        Products
                      </NavLink>
                    </li>
                  )}
                  {/* {canViewOfferCreations && (
                    <li>
                      <NavLink
                        to="/offer-creations"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Offers
                      </NavLink>
                    </li>
                  )}
                  {canViewRootCreation && (
                    <li>
                      <NavLink
                        to="/root-creation"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Route  Creation
                      </NavLink>
                    </li>
                  )}
                  {canViewCouponCreation && (
                    <li>
                      <NavLink
                        to="/coupon-creation"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Coupon code
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <NavLink
                      to="/shop-type"
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >
                      Shop Type
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/vehicle-list"
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >
                      Vehicles
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/Bank-details"
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >
                      Bank Details
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/expense-type"
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >
                      Expense type
                    </NavLink>
                  </li> */}
                </ul>
              </li>
            )}
            {canViewOrders && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:order-bool-ascending" className="menu-icon" />

                  <span>Orders</span>
                </Link>
                <ul className="sidebar-submenu">
                  {/* {canViewOrderList && (
                    <li>
                      <NavLink
                        to="/order-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Wholesale Orders
                      </NavLink>
                    </li>
                  )} */}
                  {/* {canViewRetailerOrderList && (
                    <li>
                      <NavLink
                        to="/retailer-order-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Retailer Orders
                      </NavLink>
                    </li>
                  )} */}
                  {canViewCustomerOrder && (
                    <li>
                      <NavLink
                        to="/customer-order"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Customer Orders
                      </NavLink>
                    </li>
                  )}
                  {canViewCustomerOrder && (
                    <li>
                      <NavLink
                        to="/customer-cancel-order"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Cancel Orders
                      </NavLink>
                    </li>
                  )}
                  {/* {canViewPosOrder && (
                    <li>
                      <NavLink
                        to="/pos-order"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        POS Orders
                      </NavLink>
                    </li>
                  )} */}
                  {canViewReturnRequest && (
                    <li>
                      <NavLink
                        to="/return-request"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Return Request
                      </NavLink>
                    </li>
                  )}
                  {/* {canViewOrderReport && (
                    <li>
                      <NavLink
                        to="/order-report"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Order Reports
                      </NavLink>
                    </li>
                  )} */}
                </ul>
              </li>
            )}
            {/* Users */}
            {canViewUsers && (
              <li className="dropdown">
                <Link to="#">
                  {/* <Icon icon="mdi:cart-arrow-right" className="menu-icon" /> */}
                  <Icon icon="bx:user" className="menu-icon" />

                  <span>Users</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewUsersList && (
                    <li>
                      <NavLink
                        to="/users-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        User List
                      </NavLink>
                    </li>
                  )}
                  {canViewUserRolePermission && (
                    <li>
                      <NavLink
                        to="/user-role-permission"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        User Role & Permission
                      </NavLink>
                    </li>
                  )}
                  {canViewCustomerList && (
                    <li>
                      <NavLink
                        to="/customer-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Customer List
                      </NavLink>
                    </li>
                  )}
                  {/* {canViewPasswordManagement && (
                    <li>
                      <NavLink
                        to="/password-management"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Password Management
                      </NavLink>
                    </li>
                  )} */}
                  {canViewUserActivityLog && (
                    <li>
                      <NavLink
                        to="/user-activity-log"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        User Activity Logs
                      </NavLink>
                    </li>
                  )}
                  {/* {canViewUsersReport && (
                    <li>
                      <NavLink
                        to="/users-report"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Users Reports
                      </NavLink>
                    </li>
                  )} */}
                </ul>
              </li>
            )}
            {canViewPOS && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:point-of-sale" className="menu-icon" />

                  <span>POS</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewPosNew && (
                    <li>
                      <NavLink
                        to="/pos-new"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        POS
                      </NavLink>
                    </li>
                  )}
                  {canViewPosOrderHistroy && (
                    <li>
                      <NavLink
                        to="/pos-order-histroy"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        POS Order Histroy
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )}
            {/* {canViewCRM && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:point-of-sale" className="menu-icon" />

                  <span>CRM</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewCrmUserList && (
                    <li>
                      <NavLink
                        to="/crm-user-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        CRM User List
                      </NavLink>
                    </li>
                  )}
                  {canViewCrmNew && (
                    <li>
                      <NavLink
                        to="/crm-order"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        CRM Order
                      </NavLink>
                    </li>
                  )}
                  {canViewCrmOrderHistroy && (
                    <li>
                      <NavLink
                        to="/crm-order-histroy"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        CRM Order Histroy
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )} */}

            {/* {canViewCustomer && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:account" className="menu-icon" />


                  <span>Customer</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewCustomerList && (
                    <li>
                      <NavLink
                        to="/customer-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Customer List
                      </NavLink>
                    </li>
                  )}
                  {canViewCustomerOrderHistroy && (
                    <li>
                      <NavLink
                        to="/customer-order-histroy"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Customer Order Histroy
                      </NavLink>
                    </li>
                  )}
                  {canViewCustomerReports && (
                    <li>
                      <NavLink
                        to="/customer-reports"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Customer Reports
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )} */}

            {/* {canViewWholesalers && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:cart-percent" className="menu-icon" />

                  <span>Wholesalers</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewWholesalerList && (
                    <li>
                      <NavLink
                        to="/wholesaler-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Wholesaler List
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <NavLink
                      to='/wholesale-assign-salesman'
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >

                      Assign Salesman
                    </NavLink>
                  </li>
                  {canViewWholesalerOrderHistory && (
                    <li>
                      <NavLink
                        to="/wholesaler-order-history"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Wholesaler Orders
                      </NavLink>
                    </li>
                  )}
                  {canViewWholesalerCreditManagement && (
                    <li>
                      <NavLink
                        to="/wholesaler-credit-management"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Credit Management
                      </NavLink>
                    </li>
                  )}

                  <li>
                    <NavLink
                      to='/wholesaler-adjust-credit-limit'
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >

                      Adjust Credit Limit
                    </NavLink>
                  </li>
                  {canViewWholesalerPaymentDues && (
                    <li>
                      <NavLink
                        to="/wholesaler-payment-dues"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Payment & Dues
                      </NavLink>
                    </li>
                  )}
                  {canViewWholesalerReports && (
                    <li>
                      <NavLink
                        to="/wholesaler-reports"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Wholesaler Reports
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )} */}

            {/* retailer */}
            {/* {canViewRetailers && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="bx:user-voice" className="menu-icon" />

                  <span>Retailers</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewRetailersList && (
                    <li>
                      <NavLink
                        to="/retailers-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Retailers List
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <NavLink
                      to='/retailer-assign-salesman'
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >

                      Assign Salesman
                    </NavLink>
                  </li>
                  {canViewRetailerOrderHistory && (
                    <li>
                      <NavLink
                        to="/retailer-order-history"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Retailer Orders
                      </NavLink>
                    </li>
                  )}
                  {canViewRetailerCreditManagement && (
                    <li>
                      <NavLink
                        to="/retailer-credit-management"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Credit Management
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <NavLink
                      to='/retailer-adjust-credit-limit'
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >

                      Adjust Credit Limit
                    </NavLink>
                  </li>
                  {canViewRetailerPaymentDues && (
                    <li>
                      <NavLink
                        to="/retailer-payment-dues"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Payment & Dues
                      </NavLink>
                    </li>
                  )}
                  {canViewRetailerReports && (
                    <li>
                      <NavLink
                        to="/retailer-reports"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Retailer Reports
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )} */}

            {/* {canViewVendors && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:store-cog-outline" className="menu-icon" />

                  <span>Vendors</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewVendorList && (
                    <li>
                      <NavLink
                        to="/vendor-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Vendor List
                      </NavLink>
                    </li>
                  )}
                  {canViewVendorOrderList && (
                    <li>
                      <NavLink
                        to="/vendor-order-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Vendor Purchase List
                      </NavLink>
                    </li>
                  )}
                  <li>
                  <NavLink
                    to='/vendor-order-history'
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >

                    Vendor Order History
                  </NavLink>
                </li>
                  {canViewVendorPayments && (

                    <li>
                      <NavLink
                        to="/vendor-payments"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Vendor Payments
                      </NavLink>
                    </li>
                  )}
                  {canViewVendorPaymentDues && (

                    <li>
                      <NavLink
                        to="/vendor-payment-dues"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Payment & Dues
                      </NavLink>
                    </li>
                  )}
                  {canViewVendorReports && (
                    <li>
                      <NavLink
                        to="/vendor-reports"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Vendor Reports
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )} */}

            {/* salesman */}
            {/* {canViewSalesman && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:account-check" className="menu-icon" />

                  <span>Salesman</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewSalesmanList && (
                    <li>
                      <NavLink
                        to="/salesman-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Salesman List
                      </NavLink>
                    </li>
                  )}
                  {canViewSalesmanTargetsIncentives && (
                    <li>
                      <NavLink
                        to="/salesman-targets-incentives"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Targets & Incentives
                      </NavLink>
                    </li>
                  )}

                  {canViewSalesCashSettlement && (
                    <li>
                      <NavLink
                        to="/sales-cash-settlement"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Cash Settlements
                      </NavLink>
                    </li>
                  )}
                  {canViewSalesmanPerformance && (
                    <li>
                      <NavLink
                        to="/salesman-performance"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Salesman Performance
                      </NavLink>
                    </li>
                  )}
                  {canViewSalesmanOrderHistory && (
                    <li>
                      <NavLink
                        to="/salesman-order-history"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Salesman Order History
                      </NavLink>
                    </li>
                  )}
                  {canViewSalesmanReport && (
                    <li>
                      <NavLink
                        to="/salesman-report"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Salesman Reports
                      </NavLink>
                    </li>
                  )}

                </ul>
              </li>
            )} */}

            {/* delivery */}
            {/* {canViewDelivery && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="bx:building-house" className="menu-icon" />

                  <span>Delivery</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewDeliveryList && (
                    <li>
                      <NavLink
                        to="/delivery-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Delivery List
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <NavLink
                      to="/assign-delivery-person"
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >
                      Assign Delivery Person
                    </NavLink>
                  </li>
                  {canViewDeliveryTrackingUpdates && (
                    <li>
                      <NavLink
                        to="/delivery-tracking-updates"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Delivery Tracking Updates
                      </NavLink>
                    </li>
                  )}
                  {canViewDeliveryPersonList && (
                    <li>
                      <NavLink
                        to="/delivery-person-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Delivery Person List
                      </NavLink>
                    </li>
                  )}
                  {canViewDeliveryPerformancePayroll && (
                    <li>
                      <NavLink
                        to="/delivery-performance-payroll"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Delivery Performance
                      </NavLink>
                    </li>
                  )}
                  {canViewDeliveryReports && (
                    <li>
                      <NavLink
                        to="/delivery-reports"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Delivery Reports
                      </NavLink>
                    </li>
                  )}
                  <li>
                    <NavLink
                      to="/delivery-man-request"
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >
                      Delivery Man Request
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/delivery-man-complaint"
                      className={(navData) =>
                        navData.isActive ? "active-page" : ""
                      }
                    >
                      Delivery Man Complaint
                    </NavLink>
                  </li>
                </ul>
              </li>
            )} */}

            {/* {canViewPaymentAndCredit && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:book-open-variant" className="menu-icon" />

                  <span>Payment & Credit</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewPaymentTransactionList && (
                    <li>
                      <NavLink
                        to="/add-payment-transaction"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Pay & Collect
                      </NavLink>
                    </li>
                  )}
                  {canViewPaymentTransactionList && (
                    <li>
                      <NavLink
                        to="/payment-transaction-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Payment Transaction List
                      </NavLink>
                    </li>
                  )}
                  {canViewRecordManualPayment && (
                    <li>
                      <NavLink
                        to="/record-manual-payment"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Record Manual Payment
                      </NavLink>
                    </li>
                  )}
                  {canViewOutstandingPayment && (
                    <li>
                      <NavLink
                        to="/outstanding-payment"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Outstanding Payments
                      </NavLink>
                    </li>
                  )}
                  {canViewProcessRefund && (
                    <li>
                      <NavLink
                        to="/process-refund"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Process Refund
                      </NavLink>
                    </li>
                  )}
                  {canViewPaymentCreditReport && (
                    <li>
                      <NavLink
                        to="/payment-credit-report"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Payments & Credit Reports
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )} */}


            {/* warehouse */}
            {/* <li className="dropdown">
              <Link to="#">
                <Icon icon="mdi:warehouse" className="menu-icon" />

                <span>Warehouse</span>
              </Link>
              <ul className="sidebar-submenu">
                <li>
                  <NavLink
                    to="/warehouse-list"
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    Warehouse List
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/stock-transfer-management"
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    Stock Transfer Management
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/damaged-goods-management"
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    Damaged Goods Management
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/warehouse-reports"
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    Warehouse Reports
                  </NavLink>
                </li>
              </ul>
            </li> */}
            {/* Repacking */}

            {/* <li className="dropdown">
              <Link to="#">
                <Icon icon="bx:package" className="menu-icon" />

                <span>Repacking</span>
              </Link>
              <ul className="sidebar-submenu">
                <li>
                  <NavLink
                    to="/repacking-order-list"
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    Repacking Order List
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/repacking-wastage-update"
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    Repacking and Wastage Update
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/repacking-report"
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    Repacking Reports
                  </NavLink>
                </li>
              </ul>
            </li> */}

            {/* Inventory */}
            {/* {canViewInventory && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="bx:list-plus" className="menu-icon" />

                  <span>Inventory</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewAddStock && (
                    <li>
                      <NavLink
                        to="/add-stock"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Add stock
                      </NavLink>
                    </li>
                  )}
                  {canViewInventoryList && (
                    <li>
                      <NavLink
                        to="/inventory-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Inventory List
                      </NavLink>
                    </li>
                  )}
                  {canViewInventoryLog && (
                    <li>
                      <NavLink
                        to="/inventory-log"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Inventory Log
                      </NavLink>
                    </li>
                  )}
                  {canViewInventoryReports && (
                    <li>
                      <NavLink
                        to="/inventory-reports"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Inventory Reports
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )} */}

            {/* Petty Cash */}
            {/* {canViewPettyCash && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="bx:receipt" className="menu-icon" />
                  <span>Petty Cash</span>
                </Link>
                <ul
                  className="sidebar-submenu"
                >
                  {canViewPettycashTransactionList && (
                    <li>
                      <NavLink
                        to="/pettycash-management"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Petty Cash Management
                      </NavLink>
                    </li>
                  )}
                  {canViewPettycashTransactionList && (
                    <li>
                      <NavLink
                        to="/pettycash-transaction-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Petty Cash Transaction
                      </NavLink>
                    </li>
                  )}
                  {canViewPettyCashReport && (
                    <li>
                      <NavLink
                        to="/petty-cash-report"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Petty Cash Reports
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )} */}

            {/* Tax */}
            {/* {canViewTax && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="fa-solid:file-invoice" className="menu-icon" />

                  <span>Tax</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewTaxList && (
                    <li>
                      <NavLink
                        to="/tax-list"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Tax List
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )} */}

            {/* Reports */}
            {canViewReports && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:chart-bar" className="menu-icon" />
                  <span>Reports</span>
                </Link>
                <ul className="sidebar-submenu">
                  {canViewProductReport && (
                    <li>
                      <NavLink
                        to="/product-report"
                        className={(navData) =>
                          navData.isActive ? "active-page" : ""
                        }
                      >
                        Product Report
                      </NavLink>
                    </li>
                  )}
                </ul>
              </li>
            )}
            {/* <li className="dropdown">
              <Link to="#">
                <Icon icon="mdi:cart-arrow-right" className="menu-icon" />

                <span>Reports</span>
              </Link>
              <ul className="sidebar-submenu">
                <li>
                  <NavLink
                    to="/global-report"
                    className={(navData) =>
                      navData.isActive ? "active-page" : ""
                    }
                  >
                    Product Report
                  </NavLink>
                </li>
              </ul>
            </li> */}
          </ul>
        </div>
      </aside>

      <main
        className={sidebarActive ? "dashboard-main active" : "dashboard-main"}
      >
        <div className="navbar-header">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <div className="d-flex flex-wrap align-items-center gap-4">
                <button
                  type="button"
                  className="sidebar-toggle"
                  onClick={sidebarControl}
                >
                  {sidebarActive ? (
                    <Icon
                      icon="iconoir:arrow-right"
                      className="icon text-2xl non-active"
                    />
                  ) : (
                    <Icon
                      icon="heroicons:bars-3-solid"
                      className="icon text-2xl non-active "
                    />
                  )}
                </button>
                <button
                  onClick={mobileMenuControl}
                  type="button"
                  className="sidebar-mobile-toggle"
                >
                  <Icon icon="heroicons:bars-3-solid" className="icon" />
                </button>
              </div>
            </div>
            <div className="col-auto">
              <div className="d-flex flex-wrap align-items-center gap-3">
                {/* ThemeToggleButton */}
                {/* <ThemeToggleButton /> */}

                {/* Notification dropdown end */}
                <div className="dropdown">
                  <button
                    className="d-flex justify-content-center align-items-center rounded-circle"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <img
                      src="/assets/images/admin_profile.png"
                      alt="image_user"
                      className="w-40-px h-40-px object-fit-cover rounded-circle"
                    />
                  </button>
                  <div className="dropdown-menu to-top dropdown-menu-sm">
                    <div className="py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <h6 className="text-lg text-primary-light fw-semibold mb-2">
                          {user?.name || ''}
                        </h6>
                        <span className="text-secondary-light fw-medium text-sm">
                          {user?.role?.roleName || user?.role || user?.type || ''}
                        </span>
                      </div>
                      <button type="button" className="hover-text-danger">
                        <Icon
                          icon="radix-icons:cross-1"
                          className="icon text-xl"
                        />
                      </button>
                    </div>
                    <ul className="to-top-list">
                      {/* <li>
                        <Link
                          className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'
                          to='/view-profile'
                        >
                          <Icon
                            icon='solar:user-linear'
                            className='icon text-xl'
                          />{" "}
                          My Profile
                        </Link>
                      </li> 
                      <li>
                        <Link
                          className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'
                          to='/email'
                        >
                          <Icon
                            icon='tabler:message-check'
                            className='icon text-xl'
                          />{" "}
                          Inbox
                        </Link>
                      </li> 
                      <li>
                        <Link
                          className='dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-primary d-flex align-items-center gap-3'
                          to='/company'
                        >
                          <Icon
                            icon='icon-park-outline:setting-two'
                            className='icon text-xl'
                          />
                          Setting
                        </Link>
                      </li> */}
                      <li onClick={logOutFunct}>
                        <Link
                          className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3"
                          to="/"
                        >
                          <Icon icon="lucide:power" className="icon text-xl" />{" "}
                          Log Out
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                {/* Profile dropdown end */}
              </div>
            </div>
          </div>
        </div>

        {/* dashboard-main-body */}
        <div className="dashboard-main-body">{children}</div>
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Footer section */}
        <footer className="d-footer">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto">
              <p className="mb-0">© {new Date().getFullYear()} Alpha Tech. All Rights Reserved.</p>
            </div>
            <div className="col-auto">
              <p className="mb-0">
                Developed & Maintained By{" "}
                <span className="text-primary-600">Ocean Softwares</span>
              </p>
            </div>
          </div>
        </footer>
      </main>
    </section>
  );
};

export default MasterLayout;
