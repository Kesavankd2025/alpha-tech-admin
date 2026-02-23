import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./styles/ordersInvoiceDetailLayer.css";
import customerapiProvider from "../apiProvider/customerorderapi";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import InvoiceTemplate from "./InvoiceTemplate";
import InvoiceTemplate2 from "./InvoiceTemplate2";
import { toast } from "react-toastify";
import LooseInvoiceTemplate from "./LooseInvoiceTemplate";
import BulkInvoiceTemplate from "./BulkInvoiceTemplate";

function OrdersInvoiceDetailCustomerLayer() {
  const { id } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [editOrderStatus, setEditOrderStatus] = useState();
  const [orderStatus, setOrderStatus] = useState();
  const [paymentStatus, setPaymentStatus] = useState();
  const [InvoiceData, setEInvoiceData] = useState();
  const [loading, setLoading] = useState(true);
  const [singlePage, setSinglePage] = useState(false);
  const [showEInvoiceModal, setShowEInvoiceModal] = useState(false);
  const [amount, setAmount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("");

  const [errors, setErrors] = useState([]);

  const bulkInvoiceRef = useRef(null);
  const looseInvoiceRef = useRef(null);
  const totalInvoiceRef = useRef(null);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reason, setReason] = useState("");
  const [pendingStatus, setPendingStatus] = useState("");

  const handleBackClick = () => {
    navigate(-1); // Go back to previous page
  };

  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);
  const navigate = useNavigate();
  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);
  const fetchData = async (id) => {
    try {
      setLoading(true);
      const result = await customerapiProvider.orderDetails(id);

      if (result?.status) {
        console.log(result.response.data, "resulttt");

        setOrderData(result.response.data);
        setEditOrderStatus(result.response.data.status);
        setOrderStatus(result.response.data.status);
        setPaymentStatus(result.response.data.paymentStatus);

        const gstResponseRaw = result.response.data.gstResponseRaw;
        console.log(gstResponseRaw, "gstResponseRaw");

        if (gstResponseRaw) {
          try {
            const raw = gstResponseRaw;

            const match = raw.match(/"Data"\s*:\s*"(\{.*\})"/s);

            if (!match) {
              throw new Error("No valid Data section found in gstResponseRaw");
            }

            let innerStr = match[1]
              .replace(/\\"/g, '"')
              .replace(/"{/g, '{')
              .replace(/}"/g, '}');
            const inner = JSON.parse(innerStr);
            const signedInvoice = inner?.SignedQRCode;
            const ackNo = inner?.AckNo;
            const irn = inner?.Irn;
            const ackDate = inner?.AckDt;

            console.log("✅ Signed Invoice:", signedInvoice);
            console.log("📄 AckNo:", ackNo);
            console.log("🧾 IRN:", irn);
            console.log("🕒 AckDt:", ackDate);

            setEInvoiceData(inner);
          } catch (err) {
            console.error("❌ Failed to parse gstResponseRaw safely:", err);
          }
        }

      }
    } catch (error) {
      console.error("API Error:", error);
    } finally {
      setLoading(false);
    }
  };

  console.log("Order Data:", orderData);
  if (loading) {
    return <div className="text-center mt-5">Loading order details...</div>;
  }
  const handleDownload = async () => {
    const buttons = document.getElementById("invoice-buttons");

    if (buttons) {
      buttons.style.display = "none"; // Hide buttons

      try {
        // Start with roll width (112mm) and max height (3276mm)
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: [112, 3276],
        });

        // Array of invoice sections
        const invoiceSections = [
          {
            id: "bulk-invoice-section",
            ref: bulkInvoiceRef,
            title: "Bulk Invoice",
          },
          {
            id: "loose-invoice-section",
            ref: looseInvoiceRef,
            title: "Loose Invoice",
          },
          {
            id: "total-invoice-section",
            ref: totalInvoiceRef,
            title: "Total Invoice",
          },
        ];

        for (let i = 0; i < invoiceSections.length; i++) {
          const section = invoiceSections[i];
          const element = document.getElementById(section.id);

          if (element) {
            // Hide other sections, show only current
            invoiceSections.forEach((s) => {
              const el = document.getElementById(s.id);
              if (el) el.style.display = "none";
            });
            element.style.display = "block";

            await new Promise((resolve) => setTimeout(resolve, 100));

            const canvas = await html2canvas(element, {
              useCORS: true,
              scale: 2,
              logging: false,
            });

            const imgData = canvas.toDataURL("image/png");

            // Convert canvas size to mm
            const imgWidth = 112; // fixed roll width
            const imgHeight = (canvas.height * imgWidth) / canvas.width; // dynamic height

            // On first page, adjust height dynamically
            if (i === 0) {
              pdf.internal.pageSize.setHeight(imgHeight);
            } else {
              pdf.addPage([112, imgHeight]); // new page with dynamic height
            }

            pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
          }
        }

        // Restore all sections
        invoiceSections.forEach((section) => {
          const element = document.getElementById(section.id);
          if (element) element.style.display = "block";
        });

        pdf.save(`invoice-${orderData.orderCode}.pdf`);
      } catch (error) {
        console.error("Error generating PDF:", error);
      } finally {
        buttons.style.display = "block";
        setSinglePage(false);
      }
    } else {
      console.error("Invoice buttons not found");
    }
  };

  const printDownload = async () => {
    await setSinglePage(true);
    await window.print();
    // setTimeout(()=>{
    setSinglePage(false);
    // },3000)
  };

  // Replace the handleSubmit function with this updated version
  const handleSubmit = async (e) => {
    e.preventDefault();
    let error = {};

    if (
      Number(amount) > Number(orderData.amountPending) &&
      paymentStatus === "partially-paid"
    ) {
      toast.error("Amount exceeds the pending amount");
      return;
    }
    if (Number(amount) > Number(orderData.totalAmount)) {
      toast.error("Amount exceeds the total amount");
      setErrors(error);
      return;
    }

    // Check if reason is required - ONLY for shipped→packed and delivered→packed
    const requiresReason = (
      (orderData.status === 'shipped' && orderStatus === 'packed') ||
      (orderData.status === 'delivered' && orderStatus === 'packed')
    );

    if (requiresReason) {
      setPendingStatus(orderStatus);
      setShowReasonModal(true);
      return;
    }

    await processStatusUpdate(orderStatus);
  };

  // Add this new function to handle the actual status update
  const processStatusUpdate = async (status, reasonText = "") => {
    try {
      let result;
      console.log(reasonText, "reasonText");

      // Call approvedUpdateStatus with reason if available
      if (reasonText) {
        result = await customerapiProvider.approvedUpdateStatus(id, status, reasonText);
      } else {
        result = await customerapiProvider.approvedUpdateStatus(id, status);
      }

      if (result.status) {
        toast.success("Order status updated successfully");

        if (status === "packed" && orderData?.gstNumber !== "" && orderData.status !== 'shipped' && orderData.status !== 'delivered') {
          setShowEInvoiceModal(true);
        } else {
          setTimeout(() => navigate("/customer-order"), 800);
        }
        return;
      }

      console.log("Update status result:", result);

      if (result.response?.toLowerCase().includes("pending credit exists")) {
        const confirmApproval = window.confirm(
          `${result.errorDetails || "Pending credit exists"} Do you want to approve anyway?`
        );

        if (confirmApproval) {
          const approveResult = await customerapiProvider.approvedUpdateStatus(
            id,
            status,
            reasonText || "" // Pass reason if available
          );

          if (approveResult.status) {
            toast.success("Order approved and status updated");

            if (status === "packed" && orderData?.gstNumber !== "") {
              setShowEInvoiceModal(true);
            } else {
              setTimeout(() => navigate("/customer-order"), 800);
            }
          } else {
            // toast.error("Failed to update order after approval");
          }
        }
      } else {
        // toast.error(result.message || "Failed to update order status");
      }
    } catch (error) {
      console.error("Error while updating:", error);
      // toast.error("Something went wrong");
    }
  };

  // Add this function to handle reason confirmation
  const handleReasonConfirm = async () => {
    if (!reason.trim()) {
      toast.error("Please enter a reason");
      return;
    }

    // Validate reason text must be exactly "customer not available" or "wrongly changed"
    const allowedReasons = ['customer not available', 'wrongly changed'];
    const enteredReason = reason.toLowerCase().trim();

    if (!allowedReasons.includes(enteredReason)) {
      toast.error(`Reason must be exactly "customer not available" or "wrongly changed"`);
      return;
    }

    setShowReasonModal(false);
    await processStatusUpdate(pendingStatus, reason);
    setReason("");
    setPendingStatus("");
  };

  // Add this function to handle reason cancellation
  const handleReasonCancel = () => {
    setShowReasonModal(false);
    setReason("");
    setPendingStatus("");
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   let error = {};

  //   if (
  //     Number(amount) > Number(orderData.amountPending) &&
  //     paymentStatus === "partially-paid"
  //   ) {
  //     toast.error("Amount exceeds the pending amount");
  //     return;
  //   }
  //   if (Number(amount) > Number(orderData.totalAmount)) {
  //     toast.error("Amount exceeds the total amount");
  //     setErrors(error);
  //     return;
  //   }
  //   try {
  //     let result;
  //     if (orderStatus === "pending") {
  //       const confirmApproval = window.confirm(
  //         "Move to 'Pending' requires approval. Do you want to approve this order?"
  //       );

  //       if (!confirmApproval) {
  //         toast.info("Order approval cancelled");
  //         return;
  //       }

  //       result = await customerapiProvider.approvedUpdateStatus(id, orderStatus);
  //     } else {
  //       result = await customerapiProvider.updateOrderStatus(
  //         id,
  //         orderStatus,
  //         amount,
  //         paymentMethod
  //       );
  //     }

  //     if (result.status) {
  //       toast.success("Order status updated successfully");

  //       if (orderStatus === "packed" && orderData?.gstNumber !== "") {
  //         setShowEInvoiceModal(true);
  //       } else {
  //         setTimeout(() => navigate("/order-list"), 800);
  //       }

  //       return;
  //     }

  //     console.log("Update status result:", result);

  //     if (result.response?.toLowerCase().includes("pending credit exists")) {
  //       const confirmApproval = window.confirm(
  //         `${result.errorDetails || "Pending credit exists"
  //         } Do you want to approve anyway?`
  //       );

  //       if (confirmApproval) {
  //         const approveResult = await customerapiProvider.approvedUpdateStatus(
  //           id,
  //           orderStatus
  //         );

  //         if (approveResult.status) {
  //           toast.success("Order approved and status updated");

  //           if (orderStatus === "packed" && orderData?.gstNumber !== "") {
  //             setShowEInvoiceModal(true);
  //           } else {
  //             setTimeout(() => navigate("/order-list"), 800);
  //           }
  //         } else {
  //           toast.error("Failed to update order after approval");
  //         }
  //       }
  //     } else {
  //       toast.error(result.message || "Failed to update order status");
  //     }
  //   } catch (error) {
  //     console.error("Error while updating:", error);
  //     toast.error("Something went wrong");
  //   }
  // };

  const handleEInvoiceConfirm = async (e) => {
    e.preventDefault();
    let error = {};
    try {
      const result = await customerapiProvider.generateEInvoice(id);

      if (result.status) {
        toast.success("E-Invoice generated successfully");
        setShowEInvoiceModal(false);
        // setTimeout(() => navigate("/order-list"), 800);
      } else {
        console.log("generate invoice result:", result);
      }
    } catch (error) {
      console.error("Error while updating:", error);
      toast.error("Something went wrong");
    }
  };

  const handleEInvoiceCancel = () => {
    setShowEInvoiceModal(false);
    setTimeout(() => navigate("/customer-order"), 800);
  };

  const isBulk = orderData.products?.some((ival) => ival.fullPacks > 0);
  console.log(isBulk, "sssssss");
  const isLoose = orderData.products?.some((ival) => ival.looseKg > 0);

  return (
    <div className="page-content">
      <div className="container-fluid">
        <div>
          <button
            onClick={handleBackClick}
            className="btn btn-primary"
            title="Go back"
            style={{ position: "fixed", top: "128px" }}
          >
            Go Back
          </button>
        </div>
        <div className="" style={{ marginTop: "75px" }}>
          <div className="row align-items-start">
            <div className="col-lg-6 d-flex">
              <div className="card flex-grow-1">
                <div className="card-body">
                  <article className="order-tracker ">
                    {/* Order Info */}
                    <section
                      className="order-info d-flex justify-content-evenly mb-4"
                      style={{ paddingTop: "55px" }}
                    >
                      <div className="order-info__number  text-sm text-muted mb-2">
                        <span className="me-4 text-md ">
                          ORDER<span></span>{" "}
                        </span>
                        <a
                          href="/"
                          className="order-number__numbers text-md fw-semibold"
                        >
                          #{orderData.orderCode}
                        </a>
                      </div>
                    </section>

                    {/* Progress Bar */}
                    <section className="order-status__progress mb-4 mt-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 562.4 38.21"
                        className="w-full h-auto"
                      >
                        <title>progress-bar</title>

                        {/* Background path */}
                        <path
                          className="fill-muted"
                          d="M551.34,4.89A19,19,0,0,0,535,14.22H358.34a19,19,0,0,0-32.67,0H200.12a19,19,0,0,0-32.67,0H43.34a19,19,0,1,0-.4,20H167.85a19,19,0,0,0,31.86,0H326.08a19,19,0,0,0,31.86,0H535.41A19,19,0,1,0,551.34,4.89Z"
                          transform="translate(-8.01 -4.87)"
                        />

                        {/* Connecting line */}
                        <line
                          className="stroke-muted-400"
                          x1="8.98"
                          y1="19.47"
                          x2="554.76"
                          y2="19.47"
                        />

                        {/* Steps */}
                        {["pending", "packed", "shipped", "delivered"].map(
                          (step, i) => {
                            const coords = [
                              [19.06, 19.13],
                              [175.8, 19.21],
                              [334.04, 19.06],
                              [543.4, 19],
                            ];
                            const polyCoords = [
                              [
                                [15.34, 17.83],
                                [19.04, 21.68],
                                [27.45, 12.46],
                              ],
                              [
                                [172.08, 17.91],
                                [175.78, 21.76],
                                [184.18, 12.54],
                              ],
                              [
                                [330.31, 17.76],
                                [334.02, 21.61],
                                [342.42, 12.39],
                              ],
                              [
                                [539.68, 17.7],
                                [543.38, 21.55],
                                [551.78, 12.33],
                              ],
                            ];
                            const pathD = [
                              "M36.75,24a9.67,9.67,0,1,1-5.91-8.92",
                              "M193.49,24.08a9.67,9.67,0,1,1-5.91-8.92",
                              "M351.73,23.93A9.67,9.67,0,1,1,345.82,15",
                              "M561.09,23.87a9.67,9.67,0,1,1-5.91-8.92",
                            ];

                            // Determine if step is completed
                            const statusOrder = [
                              "pending",
                              "packed",
                              "shipped",
                              "delivered",
                            ];
                            const currentStatusIndex = statusOrder.indexOf(
                              orderData.status
                            );
                            const isCompleted = i < currentStatusIndex;
                            const isCurrent = i === currentStatusIndex;

                            return (
                              <g key={step}>
                                {/* Outer circle (bubble) */}
                                <circle
                                  className={
                                    isCurrent
                                      ? "fill-muted w-25"
                                      : isCompleted
                                        ? "fill-primary w-25"
                                        : "fill-muted"
                                  }
                                  cx={coords[i][0]}
                                  cy={coords[i][1]}
                                  r="19"
                                />

                                {/* Step label (optional) */}
                                <text
                                  x={coords[i][0]}
                                  y={coords[i][1] + 40}
                                  textAnchor="middle"
                                  className="text-xs font-medium fill-foreground"
                                >
                                  {step}
                                </text>

                                {/* Show chequemark for completed steps */}
                                {isCompleted && (
                                  <g>
                                    {/* Circular cheque stroke */}
                                    <path
                                      className="stroke-primary-foreground"
                                      d={pathD[i]}
                                      transform="translate(-8.01 -4.87)"
                                      fill="none"
                                      strokeWidth="2"
                                    />
                                    {/* Checkmark */}
                                    <polyline
                                      className="stroke-primary-foreground"
                                      points={polyCoords[i]
                                        .map((p) => p.join(" "))
                                        .join(" ")}
                                      fill="none"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </g>
                                )}

                                {/* Show current step indicator */}
                                {isCurrent && (
                                  <circle
                                    cx={coords[i][0]}
                                    cy={coords[i][1]}
                                    r="8"
                                    className=""
                                    style={{ fill: "white" }}
                                  />
                                )}
                              </g>
                            );
                          }
                        )}
                      </svg>
                    </section>

                    <section className="order-status__status-info  ">
                      <ol className="order-details flex  justify-between items-start gap-4">
                        <li className="order-status__status-info__step flex flex-col items-center text-center flex-1">
                          <div className="icon w-6 h-6 ">
                            {/* Order Placed Icon */}
                            <svg
                              version="1.1"
                              id="Capa_1"
                              xmlns="http://www.w3.org/2000/svg"
                              x="0px"
                              y="0px"
                              viewBox="0 0 512 512"
                              fill="currentColor"
                              className="w-6 h-6"
                              style={{ width: "24px", height: "24px" }}
                            >
                              {/* All <path> elements go here. Remove any inline styles or class attributes that conflict. */}
                              <g>
                                <g>
                                  <path
                                    d="M400.292,32.064h-48.613v-5.276c0-12.572-18.105-17.987-31.724-20.966C302.789,2.068,280.076,0,256,0
          s-46.789,2.068-63.954,5.823c-13.619,2.979-31.724,8.394-31.724,20.966v5.276h-48.613c-21.816,0-39.564,17.749-39.564,39.565
          v400.806c0,21.816,17.749,39.564,39.564,39.564H400.29c21.816,0,39.564-17.749,39.564-39.564V71.629
          C439.856,49.813,422.107,32.064,400.292,32.064z M175.324,27.751C179.771,23.209,207.419,15,256,15
          c48.582,0,76.229,8.209,80.677,12.751v35.862c0,0.285-0.231,0.516-0.516,0.516H175.839c-0.285,0-0.516-0.232-0.516-0.516V27.751z
          M400.292,497H111.709c-13.545,0-24.564-11.02-24.564-24.564V71.629c0-13.545,11.02-24.565,24.564-24.565h48.613v16.548
          c0,8.556,6.96,15.516,15.516,15.516h160.322c8.556,0,15.516-6.961,15.516-15.516V47.064h48.613
          c13.545,0,24.564,11.02,24.564,24.565v400.807h0.002C424.856,485.981,413.836,497,400.292,497z"
                                  />
                                </g>
                              </g>
                              <g>
                                <g>
                                  <path d="..." />
                                </g>
                              </g>
                            </svg>
                          </div>
                          <div className="status text-xs leading-tight">
                            <span className="text-muted-foreground block">
                              Order
                            </span>
                            <span className="text-foreground font-semibold block">
                              Placed
                            </span>
                          </div>
                        </li>

                        <li className="order-status__status-info__step flex flex-col items-center text-center flex-1">
                          <div className="icon w-6 h-6 text-success-600">
                            <svg
                              viewBox="0 0 512 512"
                              // fill=''
                              className="w-6 h-6"
                              style={{ width: "24px", height: "24px" }}
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <g>
                                <g>
                                  <path
                                    d="M491.729,112.971L259.261,0.745c-2.061-0.994-4.461-0.994-6.521,0L20.271,112.971c-2.592,1.251-4.239,3.876-4.239,6.754
          v272.549c0,2.878,1.647,5.503,4.239,6.754l232.468,112.226c1.03,0.497,2.146,0.746,3.261,0.746s2.23-0.249,3.261-0.746
          l232.468-112.226c2.592-1.251,4.239-3.876,4.239-6.754V119.726C495.968,116.846,494.32,114.223,491.729,112.971z M256,15.828
          l215.217,103.897l-62.387,30.118c-0.395-0.301-0.812-0.579-1.27-0.8L193.805,45.853L256,15.828z M176.867,54.333l214.904,103.746
          l-44.015,21.249L132.941,75.624L176.867,54.333z M396.799,172.307v78.546l-41.113,19.848v-78.546L396.799,172.307z
          M480.968,387.568L263.5,492.55V236.658l51.873-25.042c3.73-1.801,5.294-6.284,3.493-10.015
          c-1.801-3.729-6.284-5.295-10.015-3.493L256,223.623l-20.796-10.04c-3.731-1.803-8.214-0.237-10.015,3.493
          c-1.801,3.73-0.237,8.214,3.493,10.015l19.818,9.567V492.55L31.032,387.566V131.674l165.6,79.945
          c1.051,0.508,2.162,0.748,3.255,0.748c2.788,0,5.466-1.562,6.759-4.241c1.801-3.73,0.237-8.214-3.493-10.015l-162.37-78.386
          l74.505-35.968L340.582,192.52c0.033,0.046,0.07,0.087,0.104,0.132v89.999c0,2.581,1.327,4.98,3.513,6.353
          c1.214,0.762,2.599,1.147,3.988,1.147c1.112,0,2.227-0.247,3.26-0.746l56.113-27.089c2.592-1.251,4.239-3.875,4.239-6.754v-90.495
          l69.169-33.392V387.568z"
                                  />
                                </g>
                              </g>
                              <g>
                                <g>
                                  <path
                                    d="M92.926,358.479L58.811,342.01c-3.732-1.803-8.214-0.237-10.015,3.493c-1.801,3.73-0.237,8.214,3.493,10.015
          l34.115,16.469c1.051,0.508,2.162,0.748,3.255,0.748c2.788,0,5.466-1.562,6.759-4.241
          C98.22,364.763,96.656,360.281,92.926,358.479z"
                                  />
                                </g>
                              </g>
                              <g>
                                <g>
                                  <path
                                    d="M124.323,338.042l-65.465-31.604c-3.731-1.801-8.214-0.237-10.015,3.494c-1.8,3.73-0.236,8.214,3.494,10.015
          l65.465,31.604c1.051,0.507,2.162,0.748,3.255,0.748c2.788,0,5.466-1.562,6.759-4.241
          C129.617,344.326,128.053,339.842,124.323,338.042z"
                                  />
                                </g>
                              </g>
                            </svg>
                          </div>
                          <div className="status text-xs leading-tight">
                            <span className="text-muted-foreground block">
                              Order
                            </span>
                            <span className="text-foreground font-semibold block">
                              Packed
                            </span>
                          </div>
                        </li>

                        <li className="order-status__status-info__step flex flex-col items-center text-center flex-1">
                          <div className="icon w-6 h-6 text-success-600">
                            {/* Shipped Icon */}
                            <svg
                              version="1.1"
                              viewBox="0 0 512 512"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-6 h-6 fill-current"
                              style={{ width: "24px", height: "24px" }}
                            >
                              <g>
                                <g>
                                  <path d="M111.709,344.693c-8.556,0-15.516,6.96-15.516,15.516c0,8.556,6.96,15.516,15.516,15.516c8.556,0,15.516-6.96,15.516-15.516C127.225,351.653,120.265,344.693,111.709,344.693z" />
                                </g>
                              </g>
                              <g>
                                <g>
                                  <path d="M432.355,344.693c-8.556,0-15.516,6.96-15.516,15.516c0,8.556,6.96,15.516,15.516,15.516c8.556,0,15.516-6.96,15.516-15.516C447.871,351.653,440.911,344.693,432.355,344.693z" />
                                </g>
                              </g>
                              <g>
                                <g>
                                  <path d="M495.909,245.23l-57.744-19.248l-26.989-74.218c-3.369-9.265-12.256-15.49-22.115-15.49h-69.448v-16.549c0-8.556-6.96-15.516-15.516-15.516H15.516C6.96,104.209,0,111.17,0,119.726v216.436c0,8.556,6.96,15.516,15.516,15.516H64.91c-0.504,2.77-0.781,5.619-0.781,8.532c0,26.236,21.345,47.581,47.581,47.581s47.581-21.345,47.581-47.581c0-2.914-0.277-5.762-0.781-8.532h227.047c-0.504,2.77-0.781,5.619-0.781,8.532c0,26.236,21.345,47.581,47.581,47.581c26.236,0,47.581-21.345,47.581-47.581c0-3.706-0.44-7.31-1.245-10.774l15.871-7.935C505.318,336.122,512,325.309,512,313.282v-45.727C512,257.411,505.534,248.439,495.909,245.23z M15,119.726c0-0.285,0.231-0.517,0.516-0.517h288.581c0.285,0,0.516,0.231,0.516,0.516v160.839H15V119.726z M111.709,392.791c-17.965,0-32.581-14.616-32.581-32.581c0-17.965,14.616-32.581,32.581-32.581c17.965,0,32.581,14.616,32.581,32.581C144.291,378.175,129.675,392.791,111.709,392.791z M304.613,336.677H153.038c-8.203-14.349-23.65-24.048-41.329-24.048c-17.679,0-33.125,9.699-41.328,24.048H15.516c-0.285,0-0.516-0.231-0.516-0.516v-40.597h289.613V336.677z M406.698,183.339l14.95,41.113h-16.104l-14.95-41.113H406.698z M319.613,151.274h69.448c3.575,0,6.797,2.257,8.019,5.616l4.163,11.448h-81.63V151.274z M319.613,183.339h55.02l14.95,41.113h-69.97V183.339z M432.355,392.791c-17.965,0-32.581-14.616-32.581-32.581c0-17.965,14.616-32.581,32.581-32.581c17.965,0,32.581,14.616,32.581,32.581C464.936,378.175,450.32,392.791,432.355,392.791z M497,280.563h-8.532c-4.142,0-7.5,3.358-7.5,7.5c0,4.142,3.358,7.5,7.5,7.5H497v17.718c0,6.31-3.505,11.981-9.147,14.803l-14.847,7.423c-8.36-13.707-23.454-22.878-40.651-22.878c-17.679,0-33.125,9.699-41.328,24.048h-71.414v-41.113h136.791c4.142,0,7.5-3.358,7.5-7.5c0-4.142-3.358-7.5-7.5-7.5H319.613v-41.113h111.525l60.028,20.009c3.49,1.163,5.834,4.416,5.834,8.094V280.563z" />
                                </g>
                              </g>
                              <g>
                                <g>
                                  <path
                                    className="fill-primary"
                                    d="M251.705,193.375l-56.113-32.064c-3.595-2.055-8.177-0.805-10.233,2.791c-2.055,3.597-0.806,8.178,2.791,10.233l31.592,18.053H71.629c-4.142,0-7.5,3.358-7.5,7.5c0,4.142,3.358,7.499,7.5,7.499h148.113L188.15,225.44c-3.596,2.055-4.846,6.636-2.791,10.233c1.384,2.422,3.915,3.78,6.519,3.78c1.262,0,2.541-0.319,3.714-0.99l56.113-32.064c2.336-1.335,3.779-3.82,3.779-6.512C255.484,197.195,254.042,194.711,251.705,193.375z"
                                  />
                                </g>
                              </g>
                            </svg>
                          </div>
                          <div className="status text-xs leading-tight">
                            <span className="text-muted-foreground block">
                              Order
                            </span>
                            <span className="text-foreground font-semibold block">
                              Shipped
                            </span>
                          </div>
                        </li>

                        <li className="order-status__status-info__step flex flex-col items-center text-center flex-1">
                          <div className="icon w-6 h-6 text-success-600">
                            {/* Delivered Icon */}
                            <svg
                              version="1.1"
                              id="Capa_1"
                              xmlns="http://www.w3.org/2000/svg"
                              xmlnsXlink="http://www.w3.org/1999/xlink"
                              x="0px"
                              y="0px"
                              width="100%"
                              viewBox="0 0 512 512"
                              // style={{ enableBackground: 'new 0 0 512 512' }}
                              style={{ width: "24px", height: "24px" }}
                              xmlSpace="preserve"
                            >
                              <g>
                                <g>
                                  <path
                                    d="M488.468,448.903h-8.532V226.4C499.202,214.003,512,192.386,512,167.822c0-1.305-0.341-2.588-0.988-3.721L451.499,59.953
          c-4.18-7.313-12.009-11.857-20.432-11.857H80.933c-8.423,0-16.252,4.543-20.432,11.857L0.988,164.101
          C0.341,165.234,0,166.518,0,167.822c0,24.564,12.798,46.181,32.064,58.578v222.503h-8.532c-4.142,0-7.5,3.358-7.5,7.5
          c0,4.142,3.358,7.5,7.5,7.5h464.936c4.143,0,7.5-3.358,7.5-7.5C495.968,452.261,492.61,448.903,488.468,448.903z
          M15.517,175.322h24.044c4.142,0,7.5-3.358,7.5-7.5c0-4.142-3.358-7.5-7.5-7.5H20.424l53.101-92.927
          c1.516-2.652,4.354-4.299,7.408-4.299h350.134c3.054,0,5.893,1.647,7.408,4.299l53.1,92.927h-19.141
          c-4.143,0-7.5,3.358-7.5,7.5c0,4.142,3.357,7.5,7.5,7.5h24.048c-3.667,26.584-26.532,47.125-54.108,47.125
          c-27.575,0-50.429-20.543-54.097-47.125h52.096c4.143,0,7.5-3.358,7.5-7.5c0-4.142-3.357-7.5-7.5-7.5H71.631
          c-4.142,0-7.5,3.358-7.5,7.5c0,4.142,3.358,7.5,7.5,7.5h52.091c-3.668,26.582-26.523,47.125-54.097,47.125
          C42.049,222.447,19.184,201.906,15.517,175.322z M372.222,175.322c-3.668,26.582-26.523,47.125-54.097,47.125
          c-27.575,0-50.429-20.543-54.097-47.125H372.222z M247.972,175.322c-3.668,26.582-26.523,47.125-54.097,47.125
          c-27.574,0-50.429-20.543-54.097-47.125H247.972z M424.854,448.904h-81.193v-25.081h81.193V448.904z M424.854,408.823
          h-81.193V271.516h81.193V408.823z M464.936,448.904h-25.081V264.016c0-4.142-3.357-7.5-7.5-7.5h-96.193c-4.143,0-7.5,3.358-7.5,7.5
          v184.887H47.064V233.674c7.081,2.433,14.665,3.773,22.561,3.773c27.095,0,50.624-15.556,62.125-38.207
          c11.501,22.65,35.03,38.207,62.125,38.207c27.095,0,50.624-15.556,62.125-38.207c11.501,22.65,35.03,38.207,62.125,38.207
          c27.095,0,50.624-15.556,62.125-38.207c11.501,22.65,35.03,38.207,62.125,38.207c7.896,0,15.48-1.34,22.561-3.772V448.904z"
                                  />
                                </g>
                              </g>
                              <g>
                                <g>
                                  <path
                                    className="accented"
                                    d="M296.081,256.516H79.645c-4.142,0-7.5,3.358-7.5,7.5v152.307c0,4.142,3.358,7.5,7.5,7.5h216.436
            c4.143,0,7.5-3.358,7.5-7.5V264.016C303.581,259.873,300.224,256.516,296.081,256.516z M288.581,408.823H87.145V271.516h201.436
            V408.823z"
                                  />
                                </g>
                              </g>
                            </svg>
                          </div>
                          <div className="status text-xs leading-tight">
                            <span className="text-muted-foreground block">
                              Order
                            </span>
                            <span className="text-foreground font-semibold block">
                              Delivered
                            </span>
                          </div>
                        </li>
                      </ol>
                    </section>
                  </article>
                </div>
              </div>
            </div>
            <div className="col-lg-3 d-flex">
              <div className="card flex-grow-1">
                <div className="card-header">
                  <h4 className="card-title mb-0">Update Status</h4>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    {/* Order Status */}
                    <div className="mb-3">
                      <label
                        htmlFor="order-status-select"
                        className="form-label"
                      >
                        Change order status
                      </label>
                      <select
                        id="order-status-select"
                        className="form-select"
                        disabled={[
                          "return-initiated",
                          // "cancelled",
                          // "delivered",
                        ].includes(editOrderStatus)}
                        value={orderStatus}
                        onChange={(e) =>
                          setOrderStatus(e.target.value.toLowerCase())
                        }
                      >
                        {[
                          "pending",
                          "packed",
                          "shipped",
                          "delivered",
                          "cancelled",
                        ]
                          .filter((status) => {
                            if (editOrderStatus === "pending")
                              return !["shipped", "delivered"].includes(status);
                            if (editOrderStatus === "packed")
                              return !["delivered"].includes(status);
                            if (editOrderStatus === "shipped")
                              return !["pending", "cancelled"].includes(status);
                            if (editOrderStatus === "delivered")
                              return ![
                                "pending",
                                "shipped",
                                "cancelled",
                              ].includes(status);
                            if (editOrderStatus === "cancelled")
                              return ![
                                "shipped",
                                "delivered",
                              ].includes(status);
                            return true;
                          })
                          .map((status) => (
                            <option key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                          ))}
                      </select>
                    </div>
                    {/* Submit Button */}
                    <div>
                      <button
                        type="submit"
                        className="btn btn-primary w-md"
                        title={
                          orderData?.currentCreditDetails
                            ?.remainingAmountToPay > 0
                            ? `Pending amount: ₹${orderData?.currentCreditDetails.remainingAmountToPay}`
                            : ""
                        }
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            <div className="col-lg-3 d-flex">
              <div className="card flex-grow-1">
                <div className="card-header">
                  <h4 className="card-title mb-0">
                    {orderData.shippingAddress?.contactName ||
                      orderData.userName}
                  </h4>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label htmlFor="order-status-select" className="form-label">
                      Credit Details
                    </label>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Total Credit:</span>
                      <span className="fw-semibold">
                        ₹
                        {orderData.currentCreditDetails?.creditLimit?.toLocaleString() ||
                          0}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Current Used Amount:</span>
                      <span className="fw-semibold">
                        ₹
                        {orderData.currentCreditDetails?.usedCreditAmount?.toLocaleString() ||
                          0}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Available Credit:</span>
                      <span className="fw-semibold">
                        ₹
                        {orderData.currentCreditDetails?.availableCreditAmount?.toLocaleString() ||
                          0}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Remaining to Pay:</span>
                      <span className="fw-semibold">
                        ₹
                        {orderData.currentCreditDetails?.usedCreditAmount?.toLocaleString() ||
                          0}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Credit Period:</span>
                      <span className="fw-semibold">
                        {orderData.currentCreditDetails?.creditPeriod || 0} days
                      </span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Last Payment:</span>
                      <span className="fw-semibold">
                        {orderData.currentCreditDetails?.lastPaymentDate
                          ? new Date(
                            orderData.currentCreditDetails.lastPaymentDate
                          ).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* {orderData.paymentMode === 'CREDIT' && ( */}
                  <div className="mt-3 pt-3 border-top">
                    <h6 className="text-muted mb-2">Order Payment</h6>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Total Amount:</span>
                      <span className="fw-semibold">
                        ₹{orderData.totalAmount?.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      {orderData.paymentStatus === "partially-paid" ? (
                        <>
                          <span className="text-muted">Pending Amount:</span>
                          <span className="fw-semibold">
                            ₹{orderData.amountPending?.toLocaleString() || 0}
                          </span>
                        </>
                      ) : (
                        <></>
                      )}
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Payment Status:</span>
                      <span
                        className={`badge bg-${orderData.paymentStatus === "paid"
                          ? "success"
                          : "warning"
                          }`}
                      >
                        {orderData.paymentStatus?.toUpperCase() || "PENDING"}
                      </span>
                    </div>
                  </div>
                  {/* )} */}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/*invoice print*/}
        {orderData.status !== "pending" ? (
          <div
            id="invoice-section"
            className="my-5"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <InvoiceTemplate2
              orderData={orderData}
              InvoiceData={InvoiceData}
              paymentStatus={paymentStatus}
            />
          </div>
        ) : (
          <div id="invoice-section" style={{ gap: "20px" }}>
            <div
              style={{
                display: singlePage ? "block" : "flex",
                justifyContent: "space-around",
                marginTop: "50px",
                marginBottom: "50px",
              }}
            >
              <div
                id="bulk-invoice-section"
                style={{ display: isBulk ? "block" : "none" }}
              >
                <BulkInvoiceTemplate orderData={orderData} />
              </div>

              <div
                id="loose-invoice-section"
                style={{ display: isLoose ? "block" : "none" }}
              >
                <LooseInvoiceTemplate orderData={orderData} />
              </div>
            </div>

            <div
              id="total-invoice-section"
              style={{
                display: singlePage ? "block" : "flex",
                justifyContent: "center",
              }}
            >
              <InvoiceTemplate
                orderData={orderData}
                paymentStatus={paymentStatus}
              />
            </div>
          </div>
          // <div
          //   id="invoice-section"
          //   className="my-5"
          //   style={{ display: "flex", justifyContent: "center" }}
          // >
          //   <InvoiceTemplate
          //     orderData={orderData}
          //     paymentStatus={paymentStatus}
          //   />
          // </div>
        )}

        {/* Buttons */}
        <div id="invoice-buttons" className="d-print-none mt-4">
          <div className="float-end">
            <button
              className="btn btn-success me-2"
              onClick={() => printDownload()}
            >
              <i className="fa fa-print me-1"></i> Print
            </button>
            {/* <button className="btn btn-primary" onClick={handleDownload}>
              <i className="fa fa-download me-1"></i> Download Invoice
            </button> */}
          </div>
        </div>
      </div>
      {showEInvoiceModal && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1050,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              className="modal-header"
              style={{
                borderBottom: "1px solid #dee2e6",
                paddingBottom: "15px",
                marginBottom: "15px",
              }}
            >
              <h5 className="modal-title">Convert to E-Invoice</h5>
            </div>
            <div
              className="modal-body"
              style={{
                paddingBottom: "15px",
                marginBottom: "15px",
              }}
            >
              Are you sure you want to convert to E-Invoice?
            </div>
            <div
              className="modal-footer"
              style={{
                borderTop: "1px solid #dee2e6",
                paddingTop: "15px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleEInvoiceCancel}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #6c757d",
                  borderRadius: "4px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                No
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEInvoiceConfirm}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Yes, Convert
              </button>
            </div>
          </div>
        </div>
      )}
      {showReasonModal && (
        <div
          className="modal-backdrop"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1060,
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div
              className="modal-header"
              style={{
                borderBottom: "1px solid #dee2e6",
                paddingBottom: "15px",
                marginBottom: "15px",
              }}
            >
              <h5 className="modal-title">Reason Required</h5>
            </div>
            <div
              className="modal-body"
              style={{
                paddingBottom: "15px",
                marginBottom: "15px",
              }}
            >
              <div className="mb-3">
                <label htmlFor="reason-input" className="form-label">
                  Please enter reason for status change:
                  {((orderData.status === 'delivered' || orderData.status === 'shipped') && pendingStatus === 'packed') && (
                    <small className="text-muted d-block mt-1">
                      Must be either "customer not available" or "wrongly changed"
                    </small>
                  )}
                  {(orderData.status === 'shipped' && pendingStatus === 'delivered') && (
                    <small className="text-muted d-block mt-1">
                      Must be either "customer not available" or "wrongly changed"
                    </small>
                  )}
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="reason-input"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason..."
                />
              </div>
            </div>
            <div
              className="modal-footer"
              style={{
                borderTop: "1px solid #dee2e6",
                paddingTop: "15px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleReasonCancel}
                style={{
                  padding: "8px 16px",
                  border: "1px solid #6c757d",
                  borderRadius: "4px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleReasonConfirm}
                style={{
                  padding: "8px 16px",
                  borderRadius: "4px",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Confirm Status Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrdersInvoiceDetailCustomerLayer;
