import React from "react";
import logo from "../../assets/images/logo.webp";

const SalarySlip = ({ staffDetails, month, year, payment }) => {
  return (
    <div
      style={{
        width: "148mm",
        height: "210mm",
        padding: "15mm",
        margin: "0 auto",
        backgroundColor: "white",
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* Header with Logo */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "8mm",
          borderBottom: "1mm solid #2F5DAA",
          paddingBottom: "3mm",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            marginBottom: "2mm",
          }}
        >
          <img
            src={logo}
            alt="School Logo"
            style={{ height: "12mm", marginRight: "3mm" }}
          />
          <h1
            style={{
              fontSize: "6mm",
              fontWeight: "bold",
              color: "#2F5DAA",
              margin: "0",
            }}
          >
            THE QUAID-E-AZAM GROUP OF SCHOOLS & COLLEGES
          </h1>
        </div>
        <p
          style={{
            fontSize: "3.5mm",
            color: "#424242",
            margin: "0",
          }}
        >
          SHERONWALA PULL, JARANWALA
        </p>
      </div>

      {/* Title */}
      <h2
        style={{
          textAlign: "center",
          fontSize: "5mm",
          fontWeight: "600",
          color: "#2F5DAA",
          margin: "0 0 5mm 0",
          padding: "1.5mm 0",
          borderBottom: "0.5mm solid #2F5DAA",
          borderTop: "0.5mm solid #2F5DAA",
        }}
      >
        SALARY SLIP - {month}/{year}
      </h2>

      {/* Employee Info */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "5mm",
          fontSize: "3.8mm",
        }}
      >
        <tbody>
          <tr>
            <td style={{ ...tableCellStyle, width: "40%" }}>
              <strong>Employee Name:</strong>
            </td>
            <td style={tableCellStyle}>{staffDetails.name}</td>
          </tr>
          <tr>
            <td style={{ ...tableCellStyle, width: "40%" }}>
              <strong>Designation:</strong>
            </td>
            <td style={tableCellStyle}>{staffDetails.role}</td>
          </tr>
          <tr>
            <td style={{ ...tableCellStyle, width: "40%" }}>
              <strong>Amount Paid:</strong>
            </td>
            <td style={tableCellStyle}>
              <strong>{payment?.amount?.toLocaleString() || "0"} PKR</strong>
            </td>
          </tr>
          <tr>
            <td style={{ ...tableCellStyle, width: "40%" }}>
              <strong>Payment Date:</strong>
            </td>
            <td style={tableCellStyle}>
              {payment?.paymentDate
                ? new Date(payment.paymentDate).toLocaleDateString()
                : "N/A"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Signatures */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "0",
          paddingTop: "5mm",
          borderTop: "0.5mm dashed #9e9e9e",
          fontSize: "3.8mm",
        }}
      >
        <div style={{ textAlign: "center", width: "45%" }}>
          <div
            style={{
              borderTop: "0.5mm dashed #9e9e9e",
              width: "60%",
              margin: "0 auto 2mm auto",
            }}
          ></div>
          <p>Prepared by</p>
        </div>
        <div style={{ textAlign: "center", width: "45%" }}>
          <div
            style={{
              borderTop: "0.5mm dashed #9e9e9e",
              width: "60%",
              margin: "0 auto 2mm auto",
            }}
          ></div>
          <p>Received by</p>
        </div>
      </div>

      {/* Footer */}
      <p
        style={{
          textAlign: "center",
          fontSize: "3mm",
          color: "#757575",
          position: "absolute",
          bottom: "10mm",
          left: "15mm",
          right: "15mm",
        }}
      >
        *System generated document - No signature required
      </p>
    </div>
  );
};

// Table cell style
const tableCellStyle = {
  padding: "1.5mm 0",
  verticalAlign: "top",
  borderBottom: "0.25mm solid #f0f0f0",
};

export default SalarySlip;

