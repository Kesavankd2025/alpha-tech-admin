import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import OrdersInvoiceDetailCustomerLayer from "../components/OrdersInvoiceDetailLayerCustomer";


const CustomerInvoiceDetailPage = () => {
  return (
    <>

      {/* MasterLayout */}
      <MasterLayout>

        {/* Breadcrumb */}
        <Breadcrumb title="Customer Order Details" header="Customer Order Details" />

        {/* UsersListLayer */}
        <OrdersInvoiceDetailCustomerLayer />

      </MasterLayout>

    </>
  );
};

export default CustomerInvoiceDetailPage;
