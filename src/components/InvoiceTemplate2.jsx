import React from "react";
import { ProductQRCode } from "../utils/qr";

const InvoiceTemplate = ({ orderData, InvoiceData }) => {
  if (!orderData) return null;
  console.log(InvoiceData, "InvoiceDataInvoiceDataInvoiceData");
  // Style constants
  const thStyle = {
    border: "1px solid #000",
    fontWeight: "bold",
  };

  const tdStyle = {
    borderLeft: "1px solid #000",
    borderRight: "1px solid #000",
    padding: "2px",
  };

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-");
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount || 0)?.toFixed(2);
  };

  const getAmountInWords = (num) => {
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];
    const teens = [
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];

    function convertLessThanOneThousand(num) {
      if (num === 0) return "";
      if (num < 10) return ones[num];
      if (num < 20) return teens[num - 10];
      if (num < 100)
        return (
          tens[Math.floor(num / 10)] +
          (num % 10 !== 0 ? " " + ones[num % 10] : "")
        );
      return (
        ones[Math.floor(num / 100)] +
        " Hundred" +
        (num % 100 !== 0 ? " and " + convertLessThanOneThousand(num % 100) : "")
      );
    }

    if (num === 0) return "Zero Rupees Only";
    let result = "";
    if (Math.floor(num / 10000000) > 0) {
      result +=
        convertLessThanOneThousand(Math.floor(num / 10000000)) + " Crore ";
      num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
      result += convertLessThanOneThousand(Math.floor(num / 100000)) + " Lakh ";
      num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
      result +=
        convertLessThanOneThousand(Math.floor(num / 1000)) + " Thousand ";
      num %= 1000;
    }
    if (num > 0) {
      result += convertLessThanOneThousand(num);
    }
    return result + " Rupees Only";
  };

  // Extract data from order
  const data = orderData.data || orderData;
  const {
    orderCode = "",
    createdAt = "",
    shippingAddress = {},
    user = {},
    items = [],
    products = [],
    breakdown = {},
    paymentMode = "",
    invoiceId = "",
    discount: topDiscount = 0,
    totalDiscount: topTotalDiscount = 0,
    gstNumber,
    subTotal: topSubTotal = 0,
    total: topTotal = 0,
    totalAmount: topTotalAmount = 0,
    deliveryCharge = 0,
    customerTotalTax = 0,
    roundoff: topRoundoff = 0,
  } = data;

  const {
    subTotal = topSubTotal,
    discount = topDiscount,
    roundoff = topRoundoff,
    subtotalAfterDiscount: breakdownSubtotalAfterDiscount,
    tax = customerTotalTax,
    shippingCharge = deliveryCharge,
    total = topTotal || topTotalAmount,
  } = breakdown || {};

  const subtotalAfterDiscount = breakdownSubtotalAfterDiscount || (subTotal - discount);
  const totalGross = subTotal + tax;
  const totalSubTotal = subtotalAfterDiscount + tax;
  const itemDiscounts = items.reduce(
    (total, item) => total + (item.discount || 0),
    0
  );
  const lessFrightChargee = topTotalDiscount || 0;
  const overAllDiscount = itemDiscounts + lessFrightChargee;
  // Calculate tax breakdown for the new GST table
  const taxGroups = items.reduce((acc, item, index) => {
    const product = products[index] || {};
    const taxRate = item.taxRate || 0;

    if (!acc[taxRate]) {
      acc[taxRate] = { totalAmount: 0, totalTax: 0, count: 0 };
    }

    const itemTotal =
      (item.unitPrice || 0) * (item.quantity || 0) - item.discount;

    const itemDiscount = item.discount;
    const taxableAmount = itemTotal;
    const taxAmount = (taxableAmount * taxRate) / 100;
    const priceBeforeTax = taxableAmount - taxAmount;

    acc[taxRate].totalAmount += priceBeforeTax;
    acc[taxRate].totalTax += taxAmount;
    acc[taxRate].count += 1;

    return acc;
  }, {});

  // Calculate total item discounts
  // const totalItemDiscounts = items.reduce((total, item) => {
  //   const itemTotal = (item.unitPrice || 0) * (item.quantity || 0);
  //   const itemDiscount = ((item.discount || 0) / 100) * itemTotal;
  //   return total + itemDiscount;
  // }, 0);

  // Map products with their details
  const productDetails = items.map((item, index) => {
    const product = products[index] || {};
    const taxRate = product.taxRate || item.taxRate || 0;
    const itemTotal = item.unitPrice * item.quantity;
    const itemDiscount = item.discount;
    const taxableAmount = itemTotal - itemDiscount;
    const taxAmount = taxableAmount * (taxRate / 100);

    // return {
    //   ...item,
    //   ...product,
    //   index: index + 1,
    //   itemTotal: itemTotal,
    //   itemDiscount: itemDiscount,
    //   taxAmount: taxAmount,
    // };
    return {
      ...item,
      ...product,
      productName: product.productName || 'Product',
      variantName: item.attributes?.variantName || 'Product',
      quantity: item.quantity || 0,
      index: index + 1,
      itemTotal: itemTotal,
      itemDiscount: itemDiscount,
    };
  });

  // Calculate total weight
  const totalWeight = productDetails.reduce((total, product) => {
    return total + (product.quantity || 0);
  }, 0);

  const calculateItemsPerPage = () => {
    const footerHeight = 120;
    const headerHeight = 40;
    const customerDetailsHeight = 15;
    const pageHeight = 210;
    const availableHeight =
      pageHeight - headerHeight - customerDetailsHeight - footerHeight;
    const rowHeight = 3.2;
    return Math.max(1, Math.floor(availableHeight / rowHeight) - 1);
  };

  const itemsPerPage = calculateItemsPerPage();
  const totalPages = Math.ceil(productDetails.length / itemsPerPage);
  const lastPageCount = productDetails.length % itemsPerPage || itemsPerPage;

  // If last page is full OR last page has too few rows left for footer → push footer to new page
  const needsExtraPage =
    lastPageCount === itemsPerPage || lastPageCount > itemsPerPage - 2;

  // Function to render a single page
  const renderPage = (pageNumber, isFooterOnlyPage = false) => {
    const startIndex = pageNumber * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, productDetails.length);
    const pageProducts = productDetails.slice(startIndex, endIndex);

    const emptyRows = itemsPerPage - pageProducts.length;

    // If this is the last "real" page of products
    let isLastPage = pageNumber === totalPages - 1 && !isFooterOnlyPage;

    // If no empty space is left (products filled the page fully),
    // skip footer on this page and push it to a new page
    if (isLastPage && (emptyRows === 0 || emptyRows < 2)) {
      isLastPage = false; // force footer onto a new page
    }

    console.log(pageProducts, "pageProducts");

    return (
      <div
        key={pageNumber}
        style={{
          width: "148mm",
          height: "210mm",
          margin: "0 auto",
          padding: "3mm",
          fontFamily: "Arial",
          backgroundColor: "white",
          fontSize: "8px",
          lineHeight: "1.4",
          boxSizing: "border-box",
          border: "2px solid #000",
          pageBreakAfter: "always",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "5px",
            marginBottom: "8px",
            borderBottom: "1px solid #000",
            flexShrink: 0,
          }}
        >
          {/* Left: Company Logo */}
          <div style={{ width: "25%", textAlign: "left" }}>
            <img
              src="/assets/images/logo/Alpha-1.png"
              alt="Company Logo"
              style={{
                height: "70px",
                width: "160px",
                objectFit: "contain",
              }}
            />
          </div>

          {/* Center: Company Details */}
          <div style={{ textAlign: "center", width: "50%" }}>
            <div style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "3px" }}>Alpha Technical Rubber Sheets</div>
            <div style={{ fontSize: "9px", lineHeight: "1.3" }}>
              <div>W.L.L</div>
              <div>Bldg 123, Road 456, Block 789 Manama,</div>
              <div> Kingdom of Bahrain</div>
              {/* <div><strong>Email:</strong> sales@alphatechrubber.com</div> */}
              <div><strong>Ph:</strong> +973 1700 6820</div>
            </div>
          </div>

          {/* Right: FSSAI */}
          {/* <div style={{ width: "25%", textAlign: "right", fontSize: "9px" }}>
            <img
              src="/assets/images/logo/fssi-logo.png"
              alt="FSSAI Logo"
              style={{
                height: "40px",
                width: "70px",
                objectFit: "contain",
                marginBottom: "3px",
              }}
            />
            <div>
              <strong>FSSAI: 12419003002919</strong>
            </div>
          </div> */}
        </div>
        {/* Customer Details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "start",
            gap: "5px",
            border: "1px solid #000",
            padding: "10px",
            marginBottom: "10px",
            fontSize: "10px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "8px 12px",
              fontSize: "10px",
            }}
          >
            {/* COLUMN 1 */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <div>
                <strong>Name:</strong>{" "}
                <span style={{ fontWeight: "bold", fontSize: "11px" }}>
                  {shippingAddress.contactName || "N/A"}
                </span>
              </div>
              <div>
                <strong>Address:</strong>{" "}
                <span style={{ fontWeight: "bold", fontSize: "11px" }}>
                  {shippingAddress.street || "N/A"}
                </span>
              </div>
              <div>
                <strong>Ph:</strong>{" "}
                <span style={{ fontWeight: "bold", fontSize: "11px" }}>
                  {shippingAddress.contactNumber || "N/A"}
                </span>
              </div>
              <div>
                <strong>GSTIN:</strong>{" "}
                <span style={{ fontWeight: "bold", fontSize: "11px" }}>
                  {shippingAddress.gstin || gstNumber || "N/A"}
                </span>
              </div>
              {/* {InvoiceData && (
                <>
                  <div>
                    <strong>ACK NO:</strong>{" "}
                    <span style={{ fontWeight: "bold", fontSize: "11px" }}>
                      {InvoiceData?.AckNo || "N/A"}
                    </span>
                  </div>
                  <div>
                    <strong>ACK Date:</strong>{" "}
                    <span style={{ fontWeight: "bold", fontSize: "11px" }}>
                      {InvoiceData?.AckDt || "N/A"}
                    </span>
                  </div>
                </>
              )} */}
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <div>
                <strong>Inv. No:</strong>{" "}
                <span style={{ fontWeight: "bold", fontSize: "11px" }}>
                  {invoiceId || orderCode}
                </span>
              </div>
              <div>
                <strong>Bill Date:</strong>{" "}
                <span style={{ fontWeight: "bold", fontSize: "11px" }}>
                  {formatDate(createdAt)}
                </span>
              </div>
              <div>
                <strong>Bill Type:</strong>{" "}
                <span style={{ fontWeight: "bold", fontSize: "11px" }}>
                  {paymentMode}
                </span>
              </div>
              <div>
                <strong>Area:</strong>{" "}
                <span style={{ fontWeight: "bold", fontSize: "11px" }}>
                  {shippingAddress.city || "N/A"}
                </span>
              </div>
              <div>
                <strong>Order BY:</strong>{" "}
                <span style={{ fontWeight: "bold", fontSize: "11px" }}>
                  {user?.name || "N/A"}
                </span>
              </div>
            </div>
          </div>
          {/* {InvoiceData && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "5px",
              }}
            >
              <ProductQRCode
                productUrl={InvoiceData?.SignedQRCode}
                size={100}
              />
            </div>
          )} */}
        </div>

        {/* Products Table */}
        <div style={{ marginBottom: "10px", flexGrow: 1, overflow: "hidden" }}>
          <table
            className="gstTable"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "9px",
              border: "1px solid #000",
              tableLayout: "fixed",
              height: "100%",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#1a2238", color: "#fff", borderBottom: "1px solid #000" }}>
                <th style={{ ...thStyle, padding: "12px", width: "5%" }}>S.No</th>
                <th style={{ ...thStyle, padding: "12px", width: "35%", textAlign: "left" }}>Product</th>
                <th style={{ ...thStyle, padding: "12px", width: "10%" }}>HSN</th>
                <th style={{ ...thStyle, padding: "12px", width: "10%" }}>GST</th>
                <th style={{ ...thStyle, padding: "12px", width: "10%" }}>Qty</th>
                <th style={{ ...thStyle, padding: "12px", width: "10%" }}>Rate</th>
                <th style={{ ...thStyle, padding: "12px", width: "8%" }}>Disc</th>
                <th style={{ ...thStyle, padding: "12px", width: "12%" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {pageProducts.map((p, i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{p.index}</td>
                  <td style={{ ...tdStyle, textAlign: "left", fontWeight: "bold", fontSize: "10px" }}>{p.productName} - ({p.variantName})</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{p.hsn || "N/A"}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{p.taxRate}%</td>
                  <td style={{ ...tdStyle, textAlign: "center", fontWeight: "bold", fontSize: "10px" }}>{p.quantity || 0}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{formatCurrency(p.unitPrice)}</td>
                  <td style={{ ...tdStyle, textAlign: "center" }}>{p.discount || 0}</td>
                  <td style={{ ...tdStyle, textAlign: "center", fontWeight: "bold", fontSize: "10px" }}>{formatCurrency(p.itemTotal)}</td>
                </tr>
              ))}
              {[...Array(emptyRows)].map((_, i) => (
                <tr key={`empty-${i}`} style={{ height: "12px" }}>
                  {Array(8).fill(null).map((_, j) => <td key={j} style={tdStyle}></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Footer only on last real page or footer-only page */}
        {((isLastPage && !needsExtraPage) || isFooterOnlyPage) && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", border: "1px solid #000", padding: "5px", gap: "5px", flexShrink: 0 }}>
            <div style={{ width: "50%", textAlign: "left" }}>
              <div style={{ marginBottom: "8px", textAlign: "left" }}><strong>Total Items: {productDetails.length}</strong></div>
              <div style={{ marginBottom: "8px", textAlign: "left" }}><strong>Total Weight: {orderData.totalWeight || totalWeight.toFixed(2)} kg</strong></div>
              <div style={{ marginBottom: "10px", textAlign: "left" }}>
                <div style={{ textAlign: "left" }}><strong>Amount in Words:</strong></div>
                <div style={{ textAlign: "left" }}>{getAmountInWords(parseFloat(total || 0))}</div>
              </div>
              <div style={{ marginBottom: "8px", textAlign: "left" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8px", border: "1px solid #000" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#1a2238", color: "#fff" }}>
                      <th style={{ ...thStyle, padding: "4px" }}>GST%</th>
                      <th style={{ ...thStyle, padding: "4px" }}>Sale Amt</th>
                      <th style={{ ...thStyle, padding: "4px" }}>GST</th>
                      <th style={{ ...thStyle, padding: "4px" }}>CGST</th>
                      <th style={{ ...thStyle, padding: "4px" }}>SGST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(taxGroups).filter(([r]) => parseFloat(r) > 0).map(([r, d]) => (
                      <tr key={r}>
                        <td style={{ ...tdStyle, textAlign: "center", padding: "2px" }}>{r}%</td>
                        <td style={{ ...tdStyle, textAlign: "right", padding: "2px" }}>₹{formatCurrency(d.totalAmount)}</td>
                        <td style={{ ...tdStyle, textAlign: "right", padding: "2px" }}>₹{formatCurrency(d.totalTax)}</td>
                        <td style={{ ...tdStyle, textAlign: "right", padding: "2px" }}>₹{formatCurrency(d.totalTax / 2)}</td>
                        <td style={{ ...tdStyle, textAlign: "right", padding: "2px" }}>₹{formatCurrency(d.totalTax / 2)}</td>
                      </tr>
                    ))}
                    {Object.keys(taxGroups).filter((r) => parseFloat(r) > 0).length === 0 && (
                      <tr>
                        <td style={{ ...tdStyle, textAlign: "center", padding: "2px" }}>0%</td>
                        <td style={{ ...tdStyle, textAlign: "right", padding: "2px" }}>₹{formatCurrency(subTotal)}</td>
                        <td style={{ ...tdStyle, textAlign: "right", padding: "2px" }}>₹0.00</td>
                        <td style={{ ...tdStyle, textAlign: "right", padding: "2px" }}>₹0.00</td>
                        <td style={{ ...tdStyle, textAlign: "right", padding: "2px" }}>₹0.00</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ marginBottom: "5px", textAlign: "left" }}>
                <div style={{ textAlign: "left" }}><strong>Bank: HDFC BANK</strong></div>
                <div style={{ textAlign: "left" }}><strong>A/C No:</strong> 50200065787602</div>
                <div style={{ textAlign: "left" }}><strong>IFSC:</strong> HDFC0002407</div>
              </div>
              <div style={{ fontSize: "7px", textAlign: "left" }}>
                <div style={{ textAlign: "left" }}>Any Legal dispute solved by 1996 Arbitration act in coimbatore jurisdiction only.</div>
                <div style={{ textAlign: "left" }}><strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods and all particulars are true and correct.</div>
              </div>
            </div>
            <div style={{ width: "40%" }}>
              <div style={{ textAlign: "right", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}><span>Total Amount (Gross) :</span><span>₹{formatCurrency(totalGross)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}><span>Item Discounts :</span><span>-₹{formatCurrency(itemDiscounts)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}><span>Sub Total :</span><span>₹{formatCurrency(totalSubTotal)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}><span>Fright :</span><span>₹{formatCurrency(shippingCharge)}</span></div>
                {lessFrightChargee > 0 && <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}><span>Less Fright :</span><span>-₹{formatCurrency(lessFrightChargee)}</span></div>}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}><span>Round Off :</span><span>₹{formatCurrency(roundoff)}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #000", paddingTop: "3px", fontSize: "16px", fontWeight: "bold", marginTop: "5px" }}>
                  <span>Net Amount :</span><span>₹{formatCurrency(total)}</span>
                </div>
                <div style={{ textAlign: "right", marginTop: "3px" }}><strong>for RAMESH TRADERS</strong></div>
              </div>
              <div style={{ width: "60px", height: "60px", border: "1px solid #000", display: "flex", alignItems: "center", justifyContent: "center", margin: "5px auto" }}>
                <img src="/assets/images/logo/RT-QR.jpg" alt="QR Code" style={{ width: "100%", height: "100%", objectFit: "contain" }} onError={(e) => { e.target.style.display = 'none' }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", paddingTop: "15px", fontSize: "10px" }}>
                <div style={{ textAlign: "left" }}>RECEIVER SIGN</div>
                <div style={{ textAlign: "right" }}><strong>Authorized Signatory</strong></div>
              </div>
            </div>
          </div>
        )}
        <div style={{ textAlign: "center", marginTop: "5px", fontSize: "9px", flexShrink: 0 }}>Page {pageNumber + 1} of {totalPages + (needsExtraPage ? 1 : 0)}</div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "Arial" }}>
      {Array.from({ length: totalPages }, (_, i) => renderPage(i))}
      {needsExtraPage && renderPage(totalPages, true)}{" "}
      {/* extra empty page for footer */}
    </div>
  );
};

export default InvoiceTemplate;
