import React, { memo, useMemo } from "react";
import moment from "moment";
import { Divider, List } from "antd";
import logo from "../../assets/images/logo.png";

const FeeVoucher = memo(({ student, fee, isBulkPrint, index, total }) => {
  const months = useMemo(() => moment.months(), []);
  const currentYear = useMemo(() => moment().year(), []);

  const renderPaymentHistory = () => {
    if (!fee.partialPayments || fee.partialPayments.length === 0) return null;

    return (
      <div style={{ marginTop: 15 }}>
        <Divider orientation="left" style={{ fontSize: "12px" }}>
          Payment History
        </Divider>
        <List
          size="small"
          dataSource={fee.partialPayments}
          renderItem={(payment, index) => (
            <List.Item style={{ padding: "4px 0", fontSize: "10px" }}>
              <List.Item.Meta
                title={
                  <span style={{ fontSize: "11px", fontWeight: "bold" }}>
                    Payment #{index + 1} - Rs.{" "}
                    {payment.amount?.toLocaleString()}
                  </span>
                }
                description={
                  <div style={{ fontSize: "10px" }}>
                    <div>
                      Date: {moment(payment.date).format("DD/MM/YYYY hh:mm A")}
                    </div>
                    <div>Received By: {payment.receivedBy || "Cashier"}</div>
                    {payment.paymentMethod && (
                      <div>Method: {payment.paymentMethod}</div>
                    )}
                    {payment.remarks && <div>Remarks: {payment.remarks}</div>}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </div>
    );
  };

  const renderVoucherTypeHeader = () => {
    if (fee.isConsolidated) {
      return "CONSOLIDATED FEE VOUCHER";
    }
    if (fee.feeType === "admission") return "ADMISSION FEE VOUCHER";
    if (fee.feeType === "annual") return "PAPER FUND VOUCHER";
    return "MONTHLY FEE VOUCHER";
  };

  const renderVoucherRow = (voucher) => {
    const remainingAmount = voucher.amount - (voucher.paidAmount || 0);

    return (
      <>
        {voucher.feeType === "admission" ? (
          <>
            <tr>
              <td style={{ border: "1px solid #000", padding: "5px" }}>
                Admission Fee
              </td>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "5px",
                  textAlign: "right",
                }}
              >
                Rs. {(voucher.details?.admissionFee || 0).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "5px" }}>
                Annual Charges
              </td>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "5px",
                  textAlign: "right",
                }}
              >
                Rs. {(voucher.details?.annualCharges || 0).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "5px" }}>
                Security Card
              </td>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "5px",
                  textAlign: "right",
                }}
              >
                Rs. {(voucher.details?.securityCard || 0).toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "5px" }}>
                Paper Fund
              </td>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "5px",
                  textAlign: "right",
                }}
              >
                Rs. {(voucher.details?.paperFund || 0).toLocaleString()}
              </td>
            </tr>
            {voucher.details?.monthlyFee > 0 && (
              <tr>
                <td style={{ border: "1px solid #000", padding: "5px" }}>
                  Monthly Fee ({months[voucher.details?.monthlyFeeMonth - 1]}{" "}
                  {voucher.details?.monthlyFeeYear})
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "5px",
                    textAlign: "right",
                  }}
                >
                  Rs. {(voucher.details?.monthlyFee || 0).toLocaleString()}
                </td>
              </tr>
            )}
            {voucher.details?.otherDues > 0 && (
              <tr>
                <td style={{ border: "1px solid #000", padding: "5px" }}>
                  Other Dues
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "5px",
                    textAlign: "right",
                  }}
                >
                  Rs. {(voucher.details?.otherDues || 0).toLocaleString()}
                </td>
              </tr>
            )}
          </>
        ) : (
          <tr>
            <td style={{ border: "1px solid #000", padding: "5px" }}>
              {voucher.feeType === "annual" 
                ? `Paper Fund (${voucher.year})`
                : `Monthly Fee (${months[voucher.month - 1]} ${voucher.year})`}
            </td>
            <td
              style={{
                border: "1px solid #000",
                padding: "5px",
                textAlign: "right",
              }}
            >
              Rs. {voucher.amount.toLocaleString()}
            </td>
          </tr>
        )}

        {voucher.paidAmount > 0 && (
          <>
            <tr>
              <td style={{ border: "1px solid #000", padding: "5px" }}>
                Amount Paid
              </td>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "5px",
                  textAlign: "right",
                }}
              >
                Rs. {voucher.paidAmount.toLocaleString()}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "5px" }}>
                Remaining Balance
              </td>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "5px",
                  textAlign: "right",
                  color: remainingAmount > 0 ? "#F97316" : "inherit",
                  fontWeight: "bold",
                }}
              >
                Rs. {remainingAmount.toLocaleString()}
              </td>
            </tr>
          </>
        )}
      </>
    );
  };

  const hasUnpaidVouchers = fee.isConsolidated
    ? fee.vouchers.some((v) => v.amount - (v.paidAmount || 0) > 0)
    : fee.amount - (fee.paidAmount || 0) > 0;

  return (
    <div
      id={isBulkPrint ? `printable-voucher-${index}` : "printable-voucher"}
      style={{
        width: "190mm",
        height: "auto",
        margin: "0 auto",
        padding: "5mm",
        backgroundColor: "#ffffff",
        boxSizing: "border-box",
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        position: "relative",
        border: "1px solid #ddd",
        ...(isBulkPrint && total > 1 && index < total - 1
          ? { pageBreakAfter: "always" }
          : {}),
      }}
    >
      {/* Header Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <img
          src={logo}
          alt="School Logo"
          style={{ width: "60px", marginBottom: "5px" }}
        />
        <h1
          style={{
            fontSize: "18px",
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
            fontSize: "12px",
            color: "#4b5563",
            margin: "2px 0 0 0",
            textAlign: "center",
          }}
        >
          SHERONWALA PULL, JARANWALA
        </p>
      </div>

      <div style={{ textAlign: "center", marginBottom: "15px" }}>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            backgroundColor: "#2F5DAA",
            color: "#ffffff",
            padding: "4px 0",
            display: "inline-block",
            width: "100%",
            maxWidth: "250px",
            margin: "0 auto",
          }}
        >
          {renderVoucherTypeHeader()}
        </h2>
      </div>

      {/* Student Info */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "5px",
          marginBottom: "15px",
          fontSize: "12px",
        }}
      >
        <div>
          <p style={{ margin: "2px 0" }}>
            <span style={{ fontWeight: "600" }}>Student ID:</span>{" "}
            {student.studentId}
          </p>
        </div>
        <div>
          <p style={{ margin: "2px 0" }}>
            <span style={{ fontWeight: "600" }}>Date:</span>{" "}
            {moment(fee.createdAt || new Date()).format("DD/MM/YYYY")}
          </p>
        </div>
        {!fee.isConsolidated && (
          <div>
            <p style={{ margin: "2px 0" }}>
              <span style={{ fontWeight: "600" }}>Phone #:</span>{" "}
              {student.guardianPhone || ""}
            </p>
          </div>
        )}
        {fee.isConsolidated && (
          <div>
            <p style={{ margin: "2px 0" }}>
              <span style={{ fontWeight: "600" }}>Phone #:</span>{" "}
              {student.guardianPhone || ""}
            </p>
          </div>
        )}
        <div>
          <p style={{ margin: "2px 0" }}>
            <span style={{ fontWeight: "600" }}>Roll #:</span>{" "}
            {student.rollNumber || "N/A"}
          </p>
        </div>
        <div>
          <p style={{ margin: "2px 0" }}>
            <span style={{ fontWeight: "600" }}>Class:</span>{" "}
            {student.classId?.grade} {student.classId?.section}
          </p>
        </div>
        <div>
          <p style={{ margin: "2px 0" }}>
            <span style={{ fontWeight: "600" }}>Student Name:</span>{" "}
            {student.name}
          </p>
        </div>
        {fee.paymentDate && (
          <div>
            <p style={{ margin: "2px 0" }}>
              <span style={{ fontWeight: "600" }}>Payment Date:</span>{" "}
              {moment(fee.paymentDate).format("DD/MM/YYYY")}
            </p>
          </div>
        )}
      </div>

      {/* Voucher Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #000",
          marginBottom: "0",
          fontSize: "12px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#2F5DAA", color: "#ffffff" }}>
            <th style={{ border: "1px solid #000", padding: "5px" }}>
              Description
            </th>
            <th
              style={{ border: "1px solid #000", padding: "5px", width: "25%" }}
            >
              Amount (Rs.)
            </th>
          </tr>
        </thead>
        <tbody>
          {fee.isConsolidated ? (
            <>
              {fee.vouchers.map((v) => (
                <React.Fragment key={v._id}>
                  {renderVoucherRow(v)}
                </React.Fragment>
              ))}
              <tr style={{ fontWeight: "bold" }}>
                <td style={{ border: "1px solid #000", padding: "5px" }}>
                  Total Payable
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "5px",
                    textAlign: "right",
                  }}
                >
                  Rs.{" "}
                  {fee.vouchers
                    .reduce((sum, v) => sum + v.amount, 0)
                    .toLocaleString()}
                </td>
              </tr>
              <tr style={{ fontWeight: "bold" }}>
                <td style={{ border: "1px solid #000", padding: "5px" }}>
                  Total Paid
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "5px",
                    textAlign: "right",
                  }}
                >
                  Rs.{" "}
                  {fee.vouchers
                    .reduce((sum, v) => sum + (v.paidAmount || 0), 0)
                    .toLocaleString()}
                </td>
              </tr>
              <tr style={{ fontWeight: "bold" }}>
                <td style={{ border: "1px solid #000", padding: "5px" }}>
                  Remaining Balance
                </td>
                <td
                  style={{
                    border: "1px solid #000",
                    padding: "5px",
                    textAlign: "right",
                    color: "#F97316",
                  }}
                >
                  Rs.{" "}
                  {fee.vouchers
                    .reduce(
                      (sum, v) => sum + (v.amount - (v.paidAmount || 0)),
                      0
                    )
                    .toLocaleString()}
                </td>
              </tr>
            </>
          ) : (
            renderVoucherRow(fee)
          )}
        </tbody>
      </table>

      {!fee.isConsolidated && renderPaymentHistory()}

      {hasUnpaidVouchers && (
        <div
          style={{
            textAlign: "center",
            margin: "10px 0",
            fontSize: "12px",
            color: "#F97316",
            fontWeight: "bold",
          }}
        >
          <p>Please pay your fees immediately</p>
          {fee.isConsolidated ? (
            <p>
              Total Pending: Rs.{" "}
              {fee.vouchers
                .reduce((sum, v) => sum + (v.amount - (v.paidAmount || 0)), 0)
                .toLocaleString()}
            </p>
          ) : (
            fee.paidAmount > 0 && (
              <p>
                Partial payment received - Remaining: Rs.{" "}
                {(fee.amount - fee.paidAmount).toLocaleString()}
              </p>
            )
          )}
        </div>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          fontSize: "12px",
          borderTop: "1px solid #000",
          paddingTop: "5px",
          marginTop: "10px",
        }}
      >
        <div style={{ textAlign: "center", width: "100px" }}>Cashier</div>
        <div style={{ textAlign: "center", width: "100px" }}>Principal</div>
      </div>

      <div
        style={{
          textAlign: "center",
          fontSize: "10px",
          color: "#666",
          marginTop: "5px",
        }}
      >
        <p>For any Queries Please visit our office or contact with us</p>
        <p>Generated on: {moment().format("DD/MM/YYYY hh:mm A")}</p>
      </div>

      {!hasUnpaidVouchers && !fee.isConsolidated && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            fontSize: "72px",
            color: "#3AC97C",
            opacity: "0.2",
            zIndex: "1000",
            pointerEvents: "none",
          }}
        >
          PAID
        </div>
      )}
    </div>
  );
});

FeeVoucher.displayName = 'FeeVoucher';

export default FeeVoucher;
