import React, { memo, useMemo } from "react";
import moment from "moment";
import logo from "../../assets/images/logo.png";

const BulkUnpaidVoucher = memo(({ student, unpaidFees }) => {
  const months = useMemo(() => moment.months(), []);

  // Calculate totals with useMemo
  const { totalAmount, totalPaid, totalRemaining } = useMemo(() => {
    let totalAmount = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    unpaidFees.forEach((fee) => {
      totalAmount += fee.amount;
      totalPaid += fee.paidAmount || 0;
      totalRemaining += fee.amount - (fee.paidAmount || 0);
    });

    return { totalAmount, totalPaid, totalRemaining };
  }, [unpaidFees]);

  return (
    <div
      id="bulk-unpaid-voucher"
      style={{
        width: "210mm",
        height: "auto",
        margin: "0 auto",
        padding: "10mm",
        backgroundColor: "#ffffff",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        position: "relative",
        border: "1px solid #ddd",
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <img
          src={logo}
          alt="School Logo"
          style={{ width: "70px", marginBottom: "8px" }}
        />
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            color: "#2F5DAA",
            margin: "0",
            textAlign: "center",
          }}
        >
          THE QUAID-E-AZAM GROUP OF SCHOOLS & COLLEGES
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "#4b5563",
            margin: "3px 0 0 0",
            textAlign: "center",
          }}
        >
          SHERONWALA PULL, JARANWALA
        </p>
      </div>

      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            backgroundColor: "#F97316",
            color: "#ffffff",
            padding: "6px 0",
            display: "inline-block",
            width: "100%",
            maxWidth: "350px",
            margin: "0 auto",
          }}
        >
          ALL UNPAID FEES SUMMARY
        </h2>
      </div>

      {/* Student Info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
          marginBottom: "20px",
          fontSize: "13px",
          backgroundColor: "#f3f4f6",
          padding: "12px",
          borderRadius: "4px",
        }}
      >
        <div>
          <p style={{ margin: "3px 0" }}>
            <span style={{ fontWeight: "700" }}>Student ID:</span>{" "}
            {student.studentId}
          </p>
        </div>
        <div>
          <p style={{ margin: "3px 0" }}>
            <span style={{ fontWeight: "700" }}>Student Name:</span>{" "}
            {student.name}
          </p>
        </div>
        <div>
          <p style={{ margin: "3px 0" }}>
            <span style={{ fontWeight: "700" }}>Roll #:</span>{" "}
            {student.rollNumber || "N/A"}
          </p>
        </div>
        <div>
          <p style={{ margin: "3px 0" }}>
            <span style={{ fontWeight: "700" }}>Father Name:</span>{" "}
            {student.fatherName || "N/A"}
          </p>
        </div>
        <div>
          <p style={{ margin: "3px 0" }}>
            <span style={{ fontWeight: "700" }}>Class:</span>{" "}
            {student.classId?.grade} {student.classId?.section}
          </p>
        </div>
        <div>
          <p style={{ margin: "3px 0" }}>
            <span style={{ fontWeight: "700" }}>Print Date:</span>{" "}
            {moment().format("DD/MM/YYYY")}
          </p>
        </div>
      </div>

      {/* Unpaid Fees Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "2px solid #000",
          marginBottom: "15px",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#2F5DAA", color: "#ffffff" }}>
            <th
              style={{
                border: "1px solid #000",
                padding: "8px",
                textAlign: "left",
              }}
            >
              #
            </th>
            <th
              style={{
                border: "1px solid #000",
                padding: "8px",
                textAlign: "left",
              }}
            >
              Month
            </th>
            <th
              style={{
                border: "1px solid #000",
                padding: "8px",
                textAlign: "left",
              }}
            >
              Phone #
            </th>
            <th
              style={{
                border: "1px solid #000",
                padding: "8px",
                textAlign: "right",
              }}
            >
              Total Amount
            </th>
            <th
              style={{
                border: "1px solid #000",
                padding: "8px",
                textAlign: "right",
              }}
            >
              Paid Amount
            </th>
            <th
              style={{
                border: "1px solid #000",
                padding: "8px",
                textAlign: "right",
              }}
            >
              Remaining
            </th>
          </tr>
        </thead>
        <tbody>
          {unpaidFees.map((fee, index) => {
            const paidAmount = fee.paidAmount || 0;
            const remaining = fee.amount - paidAmount;
            const monthName = fee.feeType === "admission" 
              ? "Admission Fee" 
              : `${months[fee.month - 1]} ${fee.year}`;

            return (
              <tr key={fee._id}>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    textAlign: "center",
                  }}
                >
                  {index + 1}
                </td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>
                  {monthName}
                </td>
                <td style={{ border: "1px solid #000", padding: "6px" }}>
                  {student.guardianPhone || ""}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    textAlign: "right",
                  }}
                >
                  Rs. {fee.amount.toLocaleString()}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    textAlign: "right",
                    color: paidAmount > 0 ? "#3AC97C" : "#6b7280",
                  }}
                >
                  {paidAmount > 0 ? `Rs. ${paidAmount.toLocaleString()}` : "-"}
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "6px",
                    textAlign: "right",
                    color: "#F97316",
                    fontWeight: "600",
                  }}
                >
                  Rs. {remaining.toLocaleString()}
                </td>
              </tr>
            );
          })}
          
          {/* Summary Row */}
          <tr style={{ backgroundColor: "#f3f4f6", fontWeight: "bold" }}>
            <td
              colSpan="3"
              style={{
                border: "2px solid #000",
                padding: "8px",
                textAlign: "right",
                fontSize: "13px",
              }}
            >
              TOTAL:
            </td>
            <td
              style={{
                border: "2px solid #000",
                padding: "8px",
                textAlign: "right",
                fontSize: "13px",
              }}
            >
              Rs. {totalAmount.toLocaleString()}
            </td>
            <td
              style={{
                border: "2px solid #000",
                padding: "8px",
                textAlign: "right",
                fontSize: "13px",
                color: "#3AC97C",
              }}
            >
              Rs. {totalPaid.toLocaleString()}
            </td>
            <td
              style={{
                border: "2px solid #000",
                padding: "8px",
                textAlign: "right",
                fontSize: "13px",
                color: "#F97316",
              }}
            >
              Rs. {totalRemaining.toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Payment Notice */}
      <div
        style={{
          backgroundColor: "#FFEDD5",
          border: "2px solid #F97316",
          borderRadius: "4px",
          padding: "12px",
          marginBottom: "20px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: "14px",
            color: "#C2410C",
            fontWeight: "bold",
            margin: "0 0 5px 0",
          }}
        >
          ⚠️ URGENT PAYMENT REQUIRED ⚠️
        </p>
        <p
          style={{
            fontSize: "16px",
            color: "#F97316",
            fontWeight: "bold",
            margin: "5px 0",
          }}
        >
          Total Outstanding Amount: Rs. {totalRemaining.toLocaleString()}
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "#9A3412",
            margin: "5px 0 0 0",
          }}
        >
          Please clear all pending fees at the earliest to avoid any
          inconvenience
        </p>
      </div>

      {/* Signatures */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          fontSize: "13px",
          borderTop: "2px solid #000",
          paddingTop: "15px",
          marginTop: "20px",
        }}
      >
        <div style={{ textAlign: "center", width: "150px" }}>
          <div
            style={{
              borderTop: "1px solid #000",
              marginTop: "40px",
              paddingTop: "5px",
            }}
          >
            Cashier Signature
          </div>
        </div>
        <div style={{ textAlign: "center", width: "150px" }}>
          <div
            style={{
              borderTop: "1px solid #000",
              marginTop: "40px",
              paddingTop: "5px",
            }}
          >
            Principal Signature
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          fontSize: "11px",
          color: "#666",
          marginTop: "15px",
          borderTop: "1px solid #ddd",
          paddingTop: "10px",
        }}
      >
        <p style={{ margin: "3px 0" }}>
          For any queries, please visit our office or contact us
        </p>
        <p style={{ margin: "3px 0", fontWeight: "600" }}>
          Generated on: {moment().format("DD/MM/YYYY hh:mm A")}
        </p>
      </div>
    </div>
  );
});

BulkUnpaidVoucher.displayName = 'BulkUnpaidVoucher';

export default BulkUnpaidVoucher;

