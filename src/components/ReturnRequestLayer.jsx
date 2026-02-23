// import { Icon } from "@iconify/react/dist/iconify.js";
// import React from "react";
// import { Navigate, useNavigate } from "react-router-dom";
// import "./styles/ReturnRequestLayer.css"

// function ReturnRequestLayer() {
//     const Navigate = useNavigate();
//     return (
//         <div className="container-fluid">
//             <div className="row">
//                 <div className="col-xxl-12">
//                     <div className="card">
//                         <div className="card-body">
//                             <div className="d-flex flex-wrap align-items-center mb-3">
//                                 <h5 className="card-title me-2">Return Request List</h5>
//                                 <div className="ms-auto">{/* Optional actions */}</div>
//                             </div>

//                             <div className="mx-n4">
//                                 <div className="table-responsive">
//                                     <table className="table table-striped table-centered align-middle table-nowrap mb-0 table-check">
//                                         <thead>
//                                             <tr>
//                                                 <th>S.No</th>
//                                                 <th>Order ID</th>
//                                                 <th>Return Request ID</th>
//                                                 <th style={{ width: "190px" }}>Customer Name</th>
//                                                 <th>Product Name</th>
//                                                 <th>Reason for Return</th>
//                                                 <th>Return Status</th>
//                                                 <th>Action</th>
//                                             </tr>
//                                         </thead>
//                                         <tbody>
//                                             {[
//                                                 {
//                                                     sno: 1,
//                                                     orderId: "#214569",
//                                                     returnId: "RT1234",
//                                                     customer: "Ramachandran J",
//                                                     product: "Coco Cola",
//                                                     reason: "Damaged",
//                                                     status: "Rejected",
//                                                     statusClass: "danger",
//                                                 },
//                                                 {
//                                                     sno: 2,
//                                                     orderId: "#214570",
//                                                     returnId: "RT1235",
//                                                     customer: "Sedhuraman V",
//                                                     product: "Coco Cola",
//                                                     reason: "Expired",
//                                                     status: "Pending",
//                                                     statusClass: "warning",
//                                                 },
//                                                 {
//                                                     sno: 3,
//                                                     orderId: "#214571",
//                                                     returnId: "RT1236",
//                                                     customer: "Varadarajan N",
//                                                     product: "Coco Cola",
//                                                     reason: "Wrong Product",
//                                                     status: "Accepted",
//                                                     statusClass: "success",
//                                                 },
//                                             ].map((row, idx) => (
//                                                 <tr key={idx}>
//                                                     <td>{row.sno}.</td>
//                                                     <td className="fw-semibold">{row.orderId}</td>
//                                                     <td>{row.returnId}</td>
//                                                     <td style={{ width: "190px" }}>{row.customer}</td>
//                                                     <td>{row.product}</td>
//                                                     <td>{row.reason}</td>
//                                                     <td>
//                                                         <button
//                                                             type="button"
//                                                             className={`btn btn-subtle-${row.statusClass} btn-sm waves-effect waves-light`}
//                                                         >
//                                                             {row.status}
//                                                         </button>
//                                                     </td>
//                                                     <td className="d-flex">
//                                                         <button
//                                                             type="button"
//                                                             data-bs-toggle="modal"
//                                                             data-bs-target="#myModalTwo"
//                                                             className="btn btn-subtle-success waves-effect waves-light me-1"
//                                                         // onClick={()=> Navigate('/create-order')}
//                                                         >
//                                                             <i className="bx bx-edit font-size-16 align-middle"></i>
//                                                         </button>
//                                                         <button
//                                                             type="button"
//                                                             className="bg-info-focus bg-hover-info-300 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-md"
//                                                             onClick={() => Navigate('/order-invoices-detail')}
//                                                         >
//                                                             <Icon
//                                                                 icon="majesticons:eye-line"
//                                                                 className="icon text-md"
//                                                             />
//                                                         </button>
//                                                         {/* <a
//                                                             href="order-invoices-detail"
//                                                             className="btn btn-subtle-info waves-effect waves-light"
//                                                         >
//                                                             <i className="fa fa-eye font-size-16 align-middle"></i>
//                                                         </a> */}
//                                                     </td>
//                                                 </tr>
//                                             ))}
//                                         </tbody>
//                                     </table>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Modal */}
//             <div
//                 id="myModalTwo"
//                 className="modal fade"
//                 tabIndex="-1"
//                 aria-labelledby="myModalLabel"
//                 aria-hidden="true"
//                 data-bs-scroll="true"
//             >
//                 <div className="modal-dialog">
//                     <div className="modal-content">
//                         <div className="modal-header">
//                             <h5 className="modal-title" id="myModalLabel">Change Return Status</h5>
//                             <button
//                                 type="button"
//                                 className="btn-close"
//                                 data-bs-dismiss="modal"
//                                 aria-label="Close"
//                             ></button>
//                         </div>
//                         <div className="modal-body">
//                             <div><h5 className="font-size-14 py-2">Order ID: <span className="float-end fw-normal text-body">#214569</span></h5></div>
//                             <div><h5 className="font-size-14 py-2">Return Request ID: <span className="float-end fw-normal text-body">RT1234</span></h5></div>
//                             <div><h5 className="font-size-14 py-2">Customer Name: <span className="float-end fw-normal text-body">Subramnai R</span></h5></div>
//                             <div><h5 className="font-size-14 py-2">Product Name: <span className="float-end fw-normal text-body">Coco Cola</span></h5></div>
//                             <div><h5 className="font-size-14 py-2">Reason for Return: <span className="float-end fw-normal text-body">Damaged</span></h5></div>
//                             <div><h5 className="font-size-14 py-2">Current Status: <span className="float-end fw-normal text-body">Pending</span></h5></div>
//                             <div>
//                                 <h5 className="font-size-14 py-2">
//                                     New Status:{" "}
//                                     <span className="float-end fw-normal text-body">
//                                         <select className="form-select">
//                                             <option defaultValue="">Select Status</option>
//                                             <option value="rejected">Rejected</option>
//                                             <option value="pending">Pending</option>
//                                             <option value="accepted">Accepted</option>
//                                         </select>
//                                     </span>
//                                 </h5>
//                             </div>
//                         </div>
//                         <div className="modal-footer">
//                             <button type="button" className="btn btn-secondary waves-effect" data-bs-dismiss="modal">
//                                 Close
//                             </button>
//                             <button type="button" className="btn btn-primary waves-effect waves-light">
//                                 Save changes
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }

// export default ReturnRequestLayer;

import React, { useState, useEffect } from "react";
import apiProvider from "../apiProvider/wholesaleorderapi";
import { Icon } from "@iconify/react/dist/iconify.js";
import customerapiProvider from "../apiProvider/customerorderapi";

export default function ReturnRequestLayer() {
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const statusClasses = {
        pending: "btn-subtle-warning",
        processed: "btn-subtle-info",
        shipped: "btn-subtle-secondary",
        delivered: "btn-subtle-success",
        returned: "btn-subtle-danger",
        cancelled: "btn-subtle-dark",
        rejected: "btn-subtle-danger",
        accepted: "btn-subtle-success"
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    const handleViewClick = (order) => {
        setSelectedOrderDetails(order);
        setShowModal(true);
    };

    // const handleCloseModal = () => {
    //     setShowModal(false);
    //     setSelectedOrderDetails(null);
    // };

    useEffect(() => {
        fetchOrders();
    }, [page, limit]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const input = {
                page,
                limit,
                type: 'customer',
                status: 'return-initiated',
            };
            const result = await apiProvider.getWholesaleOrder(input);
            setOrders(result?.response?.data || []);
            setTotal(result?.response?.total || 0);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessReturn = async (status) => {
        try {
            console.log(selectedOrderDetails, "selectedOrderDetails");

            setLoading(true);
            // Call your API to update the return status
            const result = await customerapiProvider.updateOrderStatus(
                selectedOrderDetails._id,
                status,
                selectedOrderDetails.paymentStatus
            );
            // const responce = await apiProvider.updateReturnStatus(, status);
            if (result && result.status) {
                // Show success message
                alert(`Return ${status} successfully`);

                // Refresh the data
                fetchOrders();

                // Close the modal
                handleCloseModal();
            }

        } catch (error) {
            console.error("Error processing return:", error);
            alert("Failed to process return");
        } finally {
            setLoading(false);
        }
    };
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedOrderDetails(null);
        setSelectedStatus(""); // Reset the status selection
    };
    return (
        <div className="card">
            <div className="card-body">
                <div className="d-flex flex-wrap align-items-center mb-3">
                    <h5 className="card-title me-2">Return Request List</h5>
                    <div className="ms-auto">
                        <div className="dropdown">
                            <a
                                className="dropdown-toggle text-reset"
                                href="#"
                                data-bs-toggle="dropdown"
                            >
                                <span className="text-muted font-size-12">Filter: </span>
                                <span className="fw-medium">
                                    Today<i className="mdi mdi-chevron-down ms-1" />
                                </span>
                            </a>
                            <div className="dropdown-menu dropdown-menu-end">
                                <a className="dropdown-item" href="#">This week</a>
                                <a className="dropdown-item" href="#">This month</a>
                                <a className="dropdown-item" href="#">This year</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-3 text-muted">
                    <div>
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped table-centered align-middle table-nowrap mb-0 table-check">
                                    <thead>
                                        <tr>
                                            <th>S.No</th>
                                            <th>Order ID</th>
                                            <th>Return Request ID</th>
                                            <th style={{ width: "190px" }}>Customer Name</th>
                                            <th>Product Name</th>
                                            <th>Reason for Return</th>
                                            <th>Return Status</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.length > 0 ? (
                                            orders.map((order, index) => (
                                                <tr key={order._id}>
                                                    <td>{page * limit + index + 1}.</td>
                                                    <td className="fw-semibold">{order.orderCode}</td>
                                                    <td>{order.returnRequestId || "N/A"}</td>
                                                    <td style={{ width: "190px" }}>
                                                        {order.shippingAddress?.contactName || order.name || "N/A"}
                                                    </td>
                                                    <td>
                                                        {order.items?.map(item => item.productName).join(", ") || "N/A"}
                                                    </td>
                                                    <td>{order.returnReason || "N/A"}</td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className={`btn btn-subtle-${statusClasses[order.returnStatus] || "btn-subtle-secondary"} btn-sm waves-effect waves-light`}
                                                        >
                                                            {order.returnStatus?.charAt(0).toUpperCase() + order.returnStatus?.slice(1) || "N/A"}
                                                        </button>
                                                    </td>
                                                    {/* <td className="d-flex">
                                                        <button
                                                            type="button"
                                                            className="btn btn-subtle-success waves-effect waves-light me-1"
                                                            onClick={() => handleViewClick(order)}
                                                        >
                                                            <i className="bx bx-edit font-size-16 align-middle"></i>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="bg-info-focus bg-hover-info-300 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-md"
                                                            onClick={() => handleViewClick(order)}
                                                        >
                                                            <Icon
                                                                icon="majesticons:eye-line"
                                                                className="icon text-md"
                                                            />
                                                        </button>
                                                    </td> */}
                                                    <td>
                                                        <div className="dropdown">
                                                            <Icon
                                                                icon="entypo:dots-three-vertical"
                                                                className="menu-icon"
                                                                data-bs-toggle="dropdown"
                                                            />
                                                            <div className="dropdown-menu">
                                                                {/* <Link
                                                                    to={`/order-invoices-detail/${order._id}`}
                                                                    state={{ order }}
                                                                    className="dropdown-item"
                                                                > */}
                                                                {/* View */}
                                                                {/* </Link> */}
                                                                <a className="dropdown-item"
                                                                    onClick={() => handleViewClick(order)}>
                                                                    Update                                                                </a>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="text-center py-4">
                                                    No return requests found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pagination controls */}
                {total > 0 && (
                    <div className="d-flex align-items-center mt-4 gap-3">
                        <button
                            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                            disabled={page === 0 || loading}
                            className="btn btn-primary"
                        >
                            Previous
                        </button>

                        <div className="d-flex align-items-center gap-2">
                            <div>
                                <span>Page {page + 1} of {Math.ceil(total / limit)}</span>
                            </div>
                            <div>
                                <select
                                    className="form-select"
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(Number(e.target.value));
                                        setPage(0);
                                    }}
                                    disabled={loading}
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={(page + 1) * limit >= total || loading}
                            className="btn btn-primary"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {showModal && selectedOrderDetails && (
                <>
                    <div
                        className="modal-backdrop fade show"
                        style={{
                            position: "fixed",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            zIndex: 1040,
                            backgroundColor: "#000",
                            opacity: 0.5,
                        }}
                        onClick={handleCloseModal}
                    ></div>

                    <div
                        className="modal fade show"
                        style={{
                            display: "block",
                            position: "fixed",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            zIndex: 1050,
                        }}
                        aria-modal="true"
                        role="dialog"
                    >
                        <div className="modal-dialog modal-dialog-scrollable modal-lg modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Return Request Details - {selectedOrderDetails.orderCode}</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={handleCloseModal}
                                    ></button>
                                </div>

                                <div className="modal-body p-4">
                                    <div className="row mb-4">
                                        <div className="col-md-6">
                                            <h6>Customer Information</h6>
                                            <p>
                                                <strong>Name:</strong> {selectedOrderDetails.shippingAddress?.contactName || selectedOrderDetails.name || "N/A"}<br />
                                                <strong>Phone:</strong> {selectedOrderDetails.shippingAddress?.contactNumber || "N/A"}<br />
                                                <strong>Address:</strong> {selectedOrderDetails.shippingAddress?.street}, {selectedOrderDetails.shippingAddress?.city}, {selectedOrderDetails.shippingAddress?.state} - {selectedOrderDetails.shippingAddress?.postalCode}
                                            </p>
                                        </div>
                                        <div className="col-md-6">
                                            <h6>Return Information</h6>
                                            <p>
                                                <strong>Order Date:</strong> {formatDate(selectedOrderDetails.createdAt)}<br />
                                                <strong>Status:</strong> <span className={`badge ${statusClasses[selectedOrderDetails.returnStatus] || "bg-secondary"}`}>
                                                    {selectedOrderDetails.returnStatus?.charAt(0).toUpperCase() + selectedOrderDetails.returnStatus?.slice(1) || "N/A"}
                                                </span><br />
                                                <strong>Reason:</strong> {selectedOrderDetails.returnReason || "N/A"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="table-responsive">
                                        <table className="table table-bordered">
                                            <thead>
                                                <tr>
                                                    <th>Product</th>
                                                    <th>Quantity</th>
                                                    <th>Unit Price</th>
                                                    <th>Total</th>
                                                    <th>Return Reason</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrderDetails.items?.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{item.productName || `Product ID: ${item.productId}`}</td>
                                                        <td>{item.quantity}</td>
                                                        <td>₹{item.unitPrice}</td>
                                                        <td>₹{item.quantity * item.unitPrice}</td>
                                                        <td>{item.returnReason || selectedOrderDetails.returnReason || "N/A"}</td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td colSpan="3" className="text-end"><strong>Total Amount:</strong></td>
                                                    <td><strong>₹{selectedOrderDetails.totalAmount}</strong></td>
                                                    <td></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="modal-footer">
                                    <div className="d-flex align-items-center gap-3 w-100">
                                        <div className="me-auto">
                                            <select
                                                className="form-select"
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                            >
                                                <option value="">Select Status</option>
                                                <option value="approved">Approved</option>
                                                <option value="rejected">Rejected</option>
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={handleCloseModal}
                                        >
                                            Close
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => {
                                                if (!selectedStatus) {
                                                    alert("Please select a status");
                                                    return;
                                                }
                                                // Call API to update status here
                                                handleProcessReturn(selectedStatus);
                                            }}
                                            disabled={!selectedStatus}
                                        >
                                            Process Return
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}