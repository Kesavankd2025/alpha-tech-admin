import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import HomePageOne from "./pages/HomePageOne";
import PurchaseHistory from "./pages/HomePageTwo";

import AlertPage from "./pages/AlertPage";

import ErrorPage from "./pages/ErrorPage";

import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";

import UsersListPage from "./pages/UsersListPage";

// i lap routes
import CategoryPage from "./pages/CategoryPage";
// import CourseListPage from "./pages/CourseListPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ContactUsRoutes from "./pages/ContactUsListPage";
import BrandPageRoutes from "./pages/BrandPage";
import AddCategoryPageRoutes from "./pages/AddCategoryPage";
import AddSubCategoryPageRoutes from "./pages/AddSubCategoryPage";
import AddChildCategoryPageRoutes from "./pages/AddChildCategoryPage";
import AttributePageRoutes from "./pages/AttributPage";
import ReviewManagementPage from "./pages/ReviewManagement";
import CreateProductPage from "./pages/createProductPage";
import OrdersInvoiceDetailLayer from "./pages/orderInvoiceDetail";
import CustomerInvoiceDetailLayer from "./pages/CustomerInvoiceDetailPage";
import CreateOrderpage from "./pages/orderListPage";
import WholesaleOrders from "./pages/wholesaleOrdersPage";
import RetailerleOrders from "./pages/RetailOrdersPage";

import CustomerOrders from "./pages/CustomerOrderPage";
import PosOrders from "./pages/PosOrderPage";
import ReturnRequests from "./pages/ReturnRequestPage";
import WarehouseList from "./pages/WerehouseListPage";
import StockTransferManagement from "./pages/StackTransferManagementPage";
import DamagedGoodsManagement from "./pages/DamagedGoodsManagementPage";
import WarehouseReports from "./pages/WerehouseReportPage";
import AddWarehouse from "./pages/AddWerehousepage";

import RetailerList from "./pages/RetailerListPage";
import CreateRetailer from "./pages/CreateRetailerPage";
import RetailerAssignSaleman from "./pages/AssignsalesmanPage";
import AssignSaleman from "./pages/AssignSalesmansPage";
import RetailerOrderHistory from "./pages/RetailerOrderHistoryPage";
import RetailerCreditManagement from "./pages/CreditManagementPage";
import RetailerAdjustCreditLimit from "./pages/AdjustCreditLimitPage";
import RetailerPaymentDues from "./pages/PaymentAndDuesPage";
import RetailerReports from "./pages/RetailerReportPage";

import DeliveryList from "./pages/DeliveryListPage";
import AssignDeliveryPerson from "./pages/AssignDeliveryPersonPage";
import DeliveryTrackingUpdates from "./pages/DeliveyTrackingUpdatePage";
import DeliveryPersonList from "./pages/DeliveryPersonListPage";
import DeliveryPerformancePayroll from "./pages/DeliveryPerformancePage";
import DeliveryReports from "./pages/DeliveryReportsPage";

import RepackingOrderList from "./pages/RepackingOrderListPage";
import RepackingAndWastageUpdate from "./pages/RepackingAndWastageUpdatePage";
import RepackingReports from "./pages/RepackingReportsPage";

import InventoryList from "./pages/InventoryListPage";
import InventoryLogs from "./pages/InventoryLogPage";
import InventoryReports from "./pages/InventoryReportsPage";
import ProductListPage from "./pages/ProductListPage";
import InventoryAddPage from "./pages/InventoryStockListPage";
import InventroryAddStockpage from "./pages/InventoryAddStockFormPage";

import PettyCashTransactionList from "./pages/PettyCashTransactionListPage";
import PettyCashBalance from "./pages/PettyCashBalancePage";
import PettyCashReport from "./pages/PettyCaseReportsPage";

import TaxList from "./pages/TaxListPage";

import UserRolePermission from "./pages/UserRolePermissionPage";
import PasswordManagement from "./pages/PasswordManagementPage";
import UserActivityLogs from "./pages/UserActivityLogPage";
import UsersReport from "./pages/UserReportsPage";
import CreateRole from "./pages/CreateRolePage";
import CreateUser from "./pages/CreateUserPage";

import ManageMentPage from "./pages/ManagementPage";

import RouteScrollToTop from "./helper/RouteScrollToTop";

import TransactionPage from "./pages/TransactionListPage";

import ReportPayment from "./pages/ReportPaymentPage";

import OutstandingPayment from "./pages/OutstandingPaymentPage";

import ProcessRefund from "./pages/ProcessRefundPage";

import PaymentCreditreportLayer from "./pages/PaymentCreditReportPage";

import PosList from "./pages/PosPage";

import WholeSalerPage from "./pages/WholesalerListPage";

import WholeSalerForm from "./pages/CreateWholesalerPage";

import WholesaleAssignSalesman from "./pages/WholesaleAssignSalesmanPage";

import WholesaleOrderHistory from "./pages/WholesalerOrderHistoryPage";

import WholesaleCreditManagement from "./pages/WholesaleCreditManagementPage";

import WholesaleAdjustCreditLimit from "./pages/WholesaleAdjustCreditLimitPage";

import WholesalePaymentDues from "./pages/WholesalePaymentDuesPage";

import WholesalerReport from "./pages/WholesaleReportspage";

import CustomerReportpage from "./pages/CustomerReportpage";

import VendorList from "./pages/VendorListPage";

import VendorOrderList from "./pages/VendorOrderPage";

import VendorAddOrderList from "./pages/VendorOrderAddList";

import VendorOrderHistory from "./pages/VendorOrderHistoryPage";

import VendorPayment from "./pages/VendorPaymentPage";

import VendorPaymentDues from "./pages/VendorPaymentDuespage";

import VendorReport from "./pages/VendorReportsPage";

import SalesmanList from "./pages/SalesmanListPage";

import SalesmanTargetIncentive from "./pages/SalesmanTargetsIncentivesPage";

import SalesmanAssignWholesalerRetailer from "./pages/SalesmanAssignWholesalerRetailerPage";

import SalesmanPerformance from "./pages/SalesmanPergormancePage";

import SalesmanOrderHistory from "./pages/SalesmanOrderHistoryPage";

import SalesmanReport from "./pages/SalesmanReportsPage";

import "boxicons/css/boxicons.min.css";

import PosNewList from "./pages/PosNewPage";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import HomeBannerpage from "./pages/HomePage";
import GlobalReportPage from "./pages/GlobalReport";

import RootCreationListPage from "./pages/RootCreationPage";

import OfferCreationRoute from "./pages/OfferPage";

import PosOrderStage from "./pages/PosOrderStagePage";
import CustomerOrderSatage from "./pages/CustomerPageStage";
import OrderReportPage from "./pages/OrderReportPage";
import CustomerListPage from "./pages/CustomerListPage";
import CouponPage from "./pages/CouponPage";
import AccessDeniedPage from "./pages/AccessDeniedPage";
import SalesCashSettlement from "./pages/SalesCashSettlement";
import DeliveryManRequest from "./pages/DeliveryManRequest";
import DeliveryManComplaint from "./pages/DeliveryManComplaint";
import PettyCashManagementPage from "./pages/PettyCashManagement";
import AddTransactionPage from "./pages/AddTranscationPage";
import ShopType from "./pages/ShopTypePage";
import VehicleListPage from "./pages/VehicleListPage";
import BankDetailsForAdminPage from "./pages/BankDetailsPageForAdminPage";
import ExpenseTypePage from "./pages/ExpenseTypePage";
import RetailerInvoiceDetailPage from "./pages/RetailerInvoiceDetailPage";
import CrmOrderPage from "./pages/CrmOrderPage";
import CrmorderListPage from "./pages/CrmOrderListPage";
import CrmListPage from "./pages/CrmUserListPage";
import ProductReportPage from "./pages/ProductReportPage";
import CustomerCancelOrderPage from "./pages/CustomerCancelOrderPage";


function App() {
  return (

    <BrowserRouter>
      <RouteScrollToTop />
      <Routes>
        <Route exact path="/sign-in" element={<SignInPage />} />
        <Route exact path="/sign-up" element={<SignUpPage />} />
        <Route exact path="/dashboard" element={<HomePageOne />} />
        <Route exact path="/category" element={<CategoryPage />} />
        <Route exact path="/access-denied" element={<AccessDeniedPage />} />
        {/* <Route exact path='/course'element={<CourseListPage />}  /> */}
        <Route exact path="/category-add" element={<AddCategoryPageRoutes />} />
        <Route
          exact
          path="/subcategory-add"
          element={<AddSubCategoryPageRoutes />}
        />
        <Route
          exact
          path="/childcategory-add"
          element={<AddChildCategoryPageRoutes />}
        />
        <Route exact path="/users-list" element={<UsersListPage />} />
        <Route exact path="/customer-list" element={<CustomerListPage />} />

        <Route exact path="/contact-us-list" element={<ContactUsRoutes />} />
        <Route exact path="/brand" element={<BrandPageRoutes />} />
        <Route exact path="/offer-creations" element={<OfferCreationRoute />} />
        <Route exact path="/coupon-creation" element={<CouponPage />} />

        <Route exact path="/product" element={<ProductListPage />} />
        <Route exact path="/create-product" element={<CreateProductPage />} />
        <Route exact path="/create-order" element={<CreateOrderpage />} />
        <Route exact path="/attribute" element={<AttributePageRoutes />} />
        <Route exact path="/management-team" element={<ManageMentPage />} />
        <Route exact path="/global-report" element={<GlobalReportPage />} />

        <Route exact path="/order-list" element={<WholesaleOrders />} />
        <Route exact path="/retailer-order-list" element={<RetailerleOrders />} />

        <Route
          exact
          path="/order-invoices-detail/:id"
          element={<OrdersInvoiceDetailLayer />}
        />
        <Route
          exact
          path="/order-invoice-details-retailer/:id"
          element={<RetailerInvoiceDetailPage />}
        />
        <Route
          path="/order-invoice-details-customer/:id"
          element={<CustomerInvoiceDetailLayer />}
        />
        <Route
          path="/order-invoice-details-pos/:id"
          element={<CustomerInvoiceDetailLayer />}
        />

        <Route exact path="/customer-order" element={<CustomerOrders />} />
        <Route exact path="/customer-cancel-order" element={<CustomerCancelOrderPage />} />
        <Route
          exact
          path="/customer-order-histroy"
          element={<CustomerOrderSatage />}
        />
        <Route exact path="/pos-order" element={<PosOrderStage />} />
        <Route exact path="/crm-order" element={<CrmOrderPage />} />
        <Route exact path="/crm-order-histroy" element={<CrmorderListPage />} />
        <Route exact path="/crm-user-list" element={<CrmListPage />} />


        <Route exact path="/pos-order-histroy" element={<PosOrders />} />

        <Route exact path="/return-request" element={<ReturnRequests />} />

        <Route exact path="/order-report" element={<OrderReportPage />} />

        <Route
          exact
          path="/review-management"
          element={<ReviewManagementPage />}
        />
        <Route exact path="/bokking-histroy" element={<PurchaseHistory />} />
        <Route exact path="/alert" element={<AlertPage />} />

        {/* //wereouse */}
        <Route exact path="/warehouse-list" element={<WarehouseList />} />
        <Route exact path="/warehouse-reports" element={<WarehouseReports />} />
        <Route exact path="/add-warehouse" element={<AddWarehouse />} />
        <Route
          exact
          path="/stock-transfer-management"
          element={<StockTransferManagement />}
        />
        <Route
          exact
          path="/damaged-goods-management"
          element={<DamagedGoodsManagement />}
        />
        {/* <Route exact path='/damaged-goods-management' element={<DamagedGoodsManagement />} /> */}
        <Route exact path="/warehouse-reports" element={<WarehouseReports />} />

        {/* Retailer */}
        <Route exact path="/retailers-list" element={<RetailerList />} />
        <Route exact path="/create-retailer" element={<CreateRetailer />} />
        <Route
          exact
          path="/retailer-assign-salesman"
          element={<RetailerAssignSaleman />}
        />
        <Route exact path="/assign-salesman" element={<AssignSaleman />} />
        <Route
          exact
          path="/retailer-order-history"
          element={<RetailerOrderHistory />}
        />
        <Route
          exact
          path="/retailer-credit-management"
          element={<RetailerCreditManagement />}
        />
        <Route
          exact
          path="/retailer-adjust-credit-limit"
          element={<RetailerAdjustCreditLimit />}
        />
        <Route
          exact
          path="/retailer-payment-dues"
          element={<RetailerPaymentDues />}
        />
        <Route exact path="/retailer-reports" element={<RetailerReports />} />

        {/* Delivery */}
        <Route exact path="/delivery-list" element={<DeliveryList />} />
        <Route
          exact
          path="/assign-delivery-person"
          element={<AssignDeliveryPerson />}
        />
        <Route
          exact
          path="/delivery-tracking-updates"
          element={<DeliveryTrackingUpdates />}
        />
        <Route
          exact
          path="/delivery-person-list"
          element={<DeliveryPersonList />}
        />
        <Route
          exact
          path="/delivery-performance-payroll"
          element={<DeliveryPerformancePayroll />}
        />
        <Route exact path="/delivery-reports" element={<DeliveryReports />} />
        <Route exact path="/delivery-man-request" element={<DeliveryManRequest />} />
        <Route exact path="/delivery-man-complaint" element={<DeliveryManComplaint />} />
        <Route exact path="/root-creation" element={<RootCreationListPage />} />
        <Route exact path="/shop-type" element={<ShopType />} />
        <Route exact path="/vehicle-list" element={<VehicleListPage />} />
        <Route exact path="/Bank-details" element={<BankDetailsForAdminPage />} />
        <Route exact path="/expense-type" element={<ExpenseTypePage />} />
        {/* Repacking */}
        <Route
          exact
          path="/repacking-order-list"
          element={<RepackingOrderList />}
        />
        <Route
          exact
          path="/repacking-wastage-update"
          element={<RepackingAndWastageUpdate />}
        />
        <Route exact path="/repacking-report" element={<RepackingReports />} />

        {/* Inventory */}
        <Route exact path="/inventory-list" element={<InventoryList />} />
        <Route exact path="/inventory-log" element={<InventoryLogs />} />
        <Route exact path="/inventory-reports" element={<InventoryReports />} />
        <Route exact path="/add-stock" element={<InventoryAddPage />} />
        <Route
          exact
          path="/add-form-stock"
          element={<InventroryAddStockpage />}
        />

        {/* Petty Cash */}
        <Route
          exact
          path="/pettycash-transaction-list"
          element={<PettyCashTransactionList />}
        />
        <Route
          exact
          path="/pettycash-management"
          element={<PettyCashManagementPage />}
        />
        <Route exact path="/pettycash-balance" element={<PettyCashBalance />} />
        <Route exact path="/petty-cash-report" element={<PettyCashReport />} />

        <Route exact path="/tax-list" element={<TaxList />} />

        <Route exact path="/users-list" element={<UsersListPage />} />
        <Route
          exact
          path="/user-role-permission"
          element={<UserRolePermission />}
        />
        <Route
          exact
          path="/password-management"
          element={<PasswordManagement />}
        />
        <Route exact path="/user-activity-log" element={<UserActivityLogs />} />
        <Route exact path="/users-report" element={<UsersReport />} />
        <Route exact path="/create-role" element={<CreateRole />} />
        <Route exact path="/create-user" element={<CreateUser />} />
        <Route
          exact
          path="/payment-transaction-list"
          element={<TransactionPage />}
        />
        <Route
          exact
          path="/add-payment-transaction"
          element={<AddTransactionPage />}
        />
        <Route
          exact
          path="/record-manual-payment"
          element={<ReportPayment />}
        />
        <Route
          exact
          path="/outstanding-payment"
          element={<OutstandingPayment />}
        />
        <Route exact path="/process-refund" element={<ProcessRefund />} />
        <Route
          exact
          path="/payment-credit-report"
          element={<PaymentCreditreportLayer />}
        />
        <Route exact path="/pos" element={<PosList />} />
        <Route exact path="/wholesaler-list" element={<WholeSalerPage />} />
        <Route exact path="/create-wholesaler" element={<WholeSalerForm />} />
        <Route
          exact
          path="/wholesale-assign-salesman"
          element={<WholesaleAssignSalesman />}
        />
        <Route
          exact
          path="/wholesaler-order-history"
          element={<WholesaleOrderHistory />}
        />
        <Route
          exact
          path="/wholesaler-credit-management"
          element={<WholesaleCreditManagement />}
        />
        <Route
          exact
          path="/wholesaler-adjust-credit-limit"
          element={<WholesaleAdjustCreditLimit />}
        />
        <Route
          exact
          path="/wholesaler-payment-dues"
          element={<WholesalePaymentDues />}
        />
        <Route
          exact
          path="/wholesaler-reports"
          element={<WholesalerReport />}
        />
        <Route
          exact
          path="/customer-reports"
          element={<CustomerReportpage />}
        />
        <Route exact path="/vendor-list" element={<VendorList />} />
        <Route exact path="/vendor-order-list" element={<VendorOrderList />} />
        <Route
          exact
          path="/vendor-add-order-list"
          element={<VendorAddOrderList />}
        />

        <Route
          exact
          path="/vendor-order-history"
          element={<VendorOrderHistory />}
        />
        <Route exact path="/vendor-payments" element={<VendorPayment />} />
        <Route
          exact
          path="/vendor-payment-dues"
          element={<VendorPaymentDues />}
        />
        <Route exact path="/vendor-reports" element={<VendorReport />} />
        <Route exact path="/salesman-list" element={<SalesmanList />} />
        <Route
          exact
          path="/salesman-targets-incentives"
          element={<SalesmanTargetIncentive />}
        />
        <Route
          exact
          path="/salesman-assign-wholesaler-retailer"
          element={<SalesmanAssignWholesalerRetailer />}
        />
        <Route
          exact
          path="/salesman-performance"
          element={<SalesmanPerformance />}
        />
        <Route
          exact
          path="/salesman-order-history"
          element={<SalesmanOrderHistory />}
        />
        <Route exact path="/salesman-report" element={<SalesmanReport />} />
        <Route exact path="/pos-new" element={<PosNewList />} />

        {/* <Route exact path='/nalsuvai/public/login' element={<LoginPage />} /> */}
        <Route exact path="/" element={<LoginPage />} />
        <Route
          exact
          path="/nalsuvai/register"
          element={<RegisterPage />}
        />
        <Route
          exact
          path="/nalsuvai/password/reset"
          element={<ResetPasswordPage />}
        />
        <Route
          exact
          path="/sales-cash-settlement"
          element={<SalesCashSettlement />}
        />
        {/* Website content */}

        <Route exact path="/home-page" element={<HomeBannerpage />} />
        <Route exact path="/product-report" element={<ProductReportPage />} />


        {/* Default redirect to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route exact path="*" element={<ErrorPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
