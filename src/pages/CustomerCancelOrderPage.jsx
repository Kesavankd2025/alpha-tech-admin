import React from "react";
import MasterLayout from "../masterLayout/MasterLayout";
import Breadcrumb from "../components/Breadcrumb";
import AccessDeniedLayer from "../components/AccessDeniedLayer";
import CustomerCancelOrderLayer from "../components/CustomerCancelOrderLayer";
import usePermission from "../hook/usePermission";

const CustomerCancelOrderPage = () => {
    const hasPermission = usePermission("customerOrder", "view");
    return (
        <>
            <MasterLayout>
                {/* Breadcrumb */}
                <Breadcrumb title="Customer Cancelled Order" header="Customer Cancel Order List" />

                {/* Layer */}
                {hasPermission ? <CustomerCancelOrderLayer /> : <AccessDeniedLayer />}

            </MasterLayout>
        </>
    );
};

export default CustomerCancelOrderPage;
