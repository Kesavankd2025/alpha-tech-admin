import React, { useState, useEffect, useRef } from "react";
import "./styles/customerOrderLayer.css";
import { Link } from "react-router-dom";
import { PlusCircle } from "@phosphor-icons/react";
import apiProvider from "../apiProvider/wholesaleorderapi";
import customerapiProvider from "../apiProvider/customerorderapi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import InvoiceTemplate from "./InvoiceTemplate";
import { Icon } from '@iconify/react';

function CustomerOrderLayer() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [downloadingOrder, setDownloadingOrder] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceTemplateRef = useRef(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [tabCounts, setTabCounts] = useState({
    pending: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    "return-initiated": 0,
    cancelled: 0,
  });
  const [initialLoad, setInitialLoad] = useState(true);

  const tabs = [
    { key: "pending", label: "Pending" },
    { key: "packed", label: "Packed" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
    // { key: "return-initiated", label: "Return-initiated" },
  ];

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchTabCounts();
      await fetchData();
      setInitialLoad(false);
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!initialLoad) {
      fetchData();
    }
  }, [page, limit, activeTab]);

  const fetchTabCounts = async () => {
    try {
      const counts = {};
      for (const tab of tabs) {
        const input = {
          page: 0,
          limit: 1,
          type: "customer",
          status: tab.key,
        };
        const result = await apiProvider.getWholesaleOrder(input);
        counts[tab.key] = result?.response?.total || 0;
      }
      setTabCounts(counts);
    } catch (error) {
      console.error("Error fetching tab counts:", error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      let input = {
        page: page,
        limit: limit,
        type: "customer",
        status: activeTab,
      };
      const result = await apiProvider.getWholesaleOrder(input);

      if (result?.status && result?.response?.data) {
        console.log(result.response.data, "result.response.data");

        const transformedOrders = result.response.data.map((order) => ({
          id: order.orderCode,
          _id: order._id,
          name: order.name || "N/A",
          date: formatDate(order.createdAt),
          amount: order.totalAmount || "0",
          type: order.paymentMode || "COD",
          originalData: order,
        }));

        setOrders(transformedOrders);
        setTotal(result.response.total || result.response.data.length);
        setTabCounts(prev => ({
          ...prev,
          [activeTab]: result.response.total
        }));
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  console.log(orders, "orders");

  const handleDownload = async (orderId) => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const result = await customerapiProvider.orderDetails(orderId);
      if (result?.status) {
        setDownloadingOrder(result.response.data);
      } else {
        console.error("Failed to fetch order details for download");
        setIsDownloading(false);
      }
    } catch (error) {
      console.error("API Error:", error);
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (downloadingOrder && invoiceTemplateRef.current) {
      html2canvas(invoiceTemplateRef.current, {
        useCORS: true,
        scale: 2,
      })
        .then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          const imgX = (pdfWidth - imgWidth * ratio) / 2;
          const imgY = 0;
          pdf.addImage(
            imgData,
            "PNG",
            imgX,
            imgY,
            imgWidth * ratio,
            imgHeight * ratio
          );
          pdf.save(`invoice-${downloadingOrder.orderCode}.pdf`);
        })
        .catch((err) => {
          console.error("Error generating PDF:", err);
        })
        .finally(() => {
          setDownloadingOrder(null); // Reset after download
          setIsDownloading(false);
        });
    }
  }, [downloadingOrder]);
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-xl-12">
          <div className="card">
            <div className="card-body">
              <div className="col text-end mb-3">
                <a href="create-order">
                </a>
              </div>

              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                {downloadingOrder && (
                  <InvoiceTemplate
                    ref={invoiceTemplateRef}
                    orderData={downloadingOrder}
                    paymentStatus={downloadingOrder.paymentStatus}
                  />
                )}
              </div>

              {/* Tabs */}
              <ul className="nav nav-pills red-tabs nav-justified" role="tablist">
                {tabs.map((tab) => (
                  <li className="nav-item" key={tab.key}>
                    <button
                      className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                      onClick={() => {
                        setActiveTab(tab.key);
                        setPage(0);
                      }}
                    >
                      <span className="d-none d-sm-block">{tab.label}</span>
                      <span className="badgde bg-dangder ms-1">
                        {tabCounts[tab.key] || 0}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {/* Tab Content */}
              <div className="tab-content p-3 text-muted">
                <div className="card">
                  <div className="card-body">
                    <div className="d-flex flex-wrap align-items-center mb-3">
                      <h5 className="card-title me-2">
                        {tabs.find((t) => t.key === activeTab)?.label} List
                      </h5>
                      {loading && (
                        <div className="spinner-border spinner-border-sm ms-2" role="status"></div>
                      )}
                    </div>
                    <div className="table-responsives">
                      <table className="table table-striped table-centered align-middle table-nowrap mb-0 table-check">
                        <thead>
                          <tr>
                            <th style={{ width: 30 }}>S.No</th>
                            <th>Order ID</th>
                            <th>Customer Name</th>
                            <th>Order Date &amp; Time</th>
                            <th>Total Amount</th>
                            <th>Payment Mode</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan="7" className="text-center">
                                <div className="spinner-border text-primary" role="status">
                                  <span className="visually-hidden">Loading...</span>
                                </div>
                              </td>
                            </tr>
                          ) : (
                            <>
                              {orders.map((order, index) => (
                                <tr key={order._id}>
                                  <td>{index + 1 + page * limit}.</td>
                                  <td>{order.id}</td>
                                  <td>{order.name}</td>
                                  <td>{order.date}</td>
                                  <td>{order.amount}</td>
                                  <td>{order.type}</td>
                                  <td>
                                    <div className="dropdown" style={{ cursor: "pointer" }}>
                                      <Icon
                                        icon="entypo:dots-three-vertical"
                                        className="menu-icon"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                      />
                                      <div className="dropdown-menu">
                                        <Link
                                          to={`/order-invoice-details-customer/${order._id}`}
                                          className="dropdown-item"
                                        >
                                          View
                                        </Link>
                                        <a className="dropdown-item" onClick={() => handleDownload(order._id)}
                                          disabled={isDownloading}>
                                          {isDownloading ? "Downloading..." : "Download Invoice"}
                                        </a>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                              {orders.length === 0 && !loading && (
                                <tr>
                                  <td colSpan="7" className="text-center text-muted">
                                    No orders found
                                  </td>
                                </tr>
                              )}
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination controls */}
                    <div className="d-flex align-items-center mt-4 gap-3">
                      <button
                        onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                        disabled={page === 0}
                        className="btn btn-primary"
                      >
                        Previous
                      </button>

                      <div className="d-flex align-items-center gap-2">
                        <div>
                          <span>Page {page + 1}</span>
                        </div>
                        <div>
                          <select
                            className="form-select"
                            value={limit}
                            onChange={(e) => {
                              setLimit(Number(e.target.value));
                              setPage(0);
                            }}
                          >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => setPage((prev) => prev + 1)}
                        disabled={(page + 1) * limit >= total}
                        className="btn btn-primary"
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
    </div>
  );
}

export default CustomerOrderLayer;