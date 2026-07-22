import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL, API_ENDPOINTS } from "../../config/api";
import {
  Spin,
  Modal,
  Input,
  Select,
  Form,
  Card,
  Tag,
  Badge,
  Button,
  Popconfirm,
  Divider,
  Progress,
  Row,
  Col,
  Statistic,
  Table,
  InputNumber,
} from "antd";
import moment from "moment";
import {
  EditOutlined,
  DeleteOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  UserOutlined,
  DollarOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import toast from "react-hot-toast";
import { FaWhatsapp } from "react-icons/fa";
import FeeVoucher from "../components/FeeVoucher";
import PartialPaymentModal from "../components/PartialPaymentModal";
import BulkUnpaidVoucher from "../components/BulkUnpaidVoucher";

const { Option } = Select;

const StudentFeePage = () => {
  const { id } = useParams();
  const [student, setStudent] = useState({
    student: {
      photo: null,
      name: "",
      studentId: "",
      classId: {},
      rollNumber: "",
    },
    overall: { totalFees: 0, paidFees: 0, pendingFees: 0 },
    admissionFees: { details: [], paid: 0, pending: 0 },
    monthlyFees: { details: [], paid: 0, pending: 0 },
    annualFees: { details: [], paid: 0, pending: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [feeType, setFeeType] = useState("monthly");
  const [amount, setAmount] = useState(0);
  const [month, setMonth] = useState(moment().month() + 1);
  const [selectedPendingVouchers, setSelectedPendingVouchers] = useState([]);

  const [year, setYear] = useState(moment().year());
  const [monthlyFeeMonth, setMonthlyFeeMonth] = useState(moment().month() + 1);
  const [monthlyFeeYear, setMonthlyFeeYear] = useState(moment().year());
  const [printVoucher, setPrintVoucher] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [admissionDetails, setAdmissionDetails] = useState({
    admissionFee: 0,
    annualCharges: 0,
    securityCard: 0,
    paperFund: 0,
    monthlyFee: 0,
    otherDues: 0,
  });
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [partialPaymentModalVisible, setPartialPaymentModalVisible] =
    useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [paperFundModalVisible, setPaperFundModalVisible] = useState(false);
  const [paperFundAmount, setPaperFundAmount] = useState(0);
  const [paperFundYear, setPaperFundYear] = useState(moment().year());

  // Memoize constants
  const months = useMemo(() => moment.months(), []);
  const currentYear = useMemo(() => moment().year(), []);

  // Memoize fetch function
  const fetchStudent = useCallback(async () => {
    try {
      const res = await axios.get(
        API_ENDPOINTS.STUDENT_FEE_SUMMARY(id)
      );
      setStudent(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching student:", error);
      setLoading(false);
      toast.error("Failed to load student data");
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const showPartialPaymentModal = useCallback((voucher) => {
    setSelectedVoucher(voucher);
    setPartialPaymentModalVisible(true);
  }, []);

  const handleBulkPrintPending = useCallback(async () => {
    try {
      // 1. Get ALL pending vouchers (Monthly + Admission + Paper Fund) - All Years
      const pendingMonthly = student.monthlyFees.details.filter(
        (v) => !v.isPaid
      );

      const pendingAdmission = student.admissionFees.details.filter(
        (v) => !v.isPaid
      );

      const pendingAnnual = (student.annualFees?.details || []).filter(
        (v) => !v.isPaid
      );

      const allPendingVouchers = [...pendingMonthly, ...pendingAdmission, ...pendingAnnual];

      if (allPendingVouchers.length === 0) {
        toast("No pending vouchers found!");
        return;
      }

      // 2. Fetch details for all vouchers
      const voucherDetails = await Promise.all(
        allPendingVouchers.map((voucher) =>
          axios
            .get(
              API_ENDPOINTS.VOUCHER_DETAILS(student.student.studentId, voucher.voucherNumber)
            )
            .then((res) => res.data.voucher)
            .catch((error) => {
              console.error(
                `Error fetching voucher ${voucher.voucherNumber}:`,
                error
              );
              return null; // Return null for failed fetches
            })
        )
      );

      // Filter out any null values from failed fetches
      const validVouchers = voucherDetails.filter((v) => v !== null);

      if (validVouchers.length === 0) {
        toast.error("Could not load voucher details");
        return;
      }

      // 3. Calculate remaining amounts for each voucher
      const vouchersWithRemaining = validVouchers.map((voucher) => ({
        ...voucher,
        remainingAmount: voucher.amount - (voucher.paidAmount || 0), // Calculate remaining amount
      }));

      // 4. Create consolidated voucher object
      const consolidatedVoucher = {
        isConsolidated: true,
        vouchers: vouchersWithRemaining,
        student: student.student,
        totalAmount: vouchersWithRemaining.reduce(
          (sum, v) => sum + v.remainingAmount,
          0
        ), // Sum of remaining amounts
        containsAdmission: pendingAdmission.length > 0,
        containsMonthly: pendingMonthly.length > 0,
        containsAnnual: pendingAnnual.length > 0,
      };

      setPrintVoucher(consolidatedVoucher);

      // 5. Auto-trigger print after a small delay
      setTimeout(() => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          toast.error("Popup blocked! Please allow popups for this site");
          return;
        }

        printWindow.document.write(`
          <html>
            <head>
              <title>Pending Fee Vouchers - ${student.student.name}</title>
              <style>
                @media print {
                  @page { size: A4; margin: 0.5in; }
                  body { font-family: Arial, sans-serif; }
                  .page-break { page-break-after: always; }
                }
              </style>
            </head>
            <body>
              ${document.getElementById("printable-voucher").innerHTML}
            </body>
          </html>
        `);

        printWindow.document.close();
        printWindow.focus();

        // Add delay for content to load before printing
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }, 300);
    } catch (error) {
      console.error("Bulk print error:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to load pending vouchers for printing"
      );
    }
  }, [student, currentYear]);

  const handleAdmissionDetailChange = useCallback((field, value) => {
    setAdmissionDetails(prev => {
      const newDetails = {
        ...prev,
        [field]: parseFloat(value) || 0,
      };
      
      const total = [
        newDetails.admissionFee,
        newDetails.annualCharges,
        newDetails.securityCard,
        newDetails.paperFund,
        newDetails.monthlyFee || 0,
        newDetails.otherDues || 0,
      ].reduce((sum, val) => sum + val, 0);
      
      setAmount(total);
      return newDetails;
    });
  }, []);

  const handleGenerateVoucher = useCallback(async () => {
    try {
      const payload = {
        studentId: id,
        feeType,
        amount: parseFloat(amount),
        ...(feeType === "monthly" && { month, year }),
        ...(feeType === "annual" && { year }),
        ...(feeType === "admission" && {
          feeDetails: {
            ...admissionDetails,
            ...(admissionDetails.monthlyFee > 0 && {
              monthlyFeeMonth,
              monthlyFeeYear,
            }),
          },
        }),
      };

      const response = await axios.post(
        API_ENDPOINTS.GENERATE_FEE_VOUCHER,
        payload
      );

      if (feeType === "admission") {
        handlePrintVoucher(response.data.voucher);
      }

      const res = await axios.get(API_ENDPOINTS.STUDENT_FEE_SUMMARY(id));
      setStudent(res.data);

      toast.success("Voucher generated successfully!");
      setIsModalVisible(false);
      form.resetFields();
      setAdmissionDetails({
        admissionFee: 0,
        annualCharges: 0,
        securityCard: 0,
        paperFund: 0,
        monthlyFee: 0,
        otherDues: 0,
      });
    } catch (error) {
      console.error(
        "Voucher generation error:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || "Failed to generate voucher"
      );
    }
  }, [id, feeType, amount, month, year, admissionDetails, monthlyFeeMonth, monthlyFeeYear, form]);

  const handleEditVoucher = useCallback((voucher) => {
    setEditingVoucher(voucher);
    if (voucher.feeType === "admission") {
      setAdmissionDetails({
        admissionFee: voucher.details?.admissionFee || 0,
        annualCharges: voucher.details?.annualCharges || 0,
        securityCard: voucher.details?.securityCard || 0,
        paperFund: voucher.details?.paperFund || 0,
        monthlyFee: voucher.details?.monthlyFee || 0,
        otherDues: voucher.details?.otherDues || 0,
      });
      setAmount(voucher.amount);
      if (voucher.details?.monthlyFeeMonth) {
        setMonthlyFeeMonth(voucher.details.monthlyFeeMonth);
      }
      if (voucher.details?.monthlyFeeYear) {
        setMonthlyFeeYear(voucher.details.monthlyFeeYear);
      }
    } else {
      setAmount(voucher.amount);
      setMonth(voucher.month);
      setYear(voucher.year);
    }
    setFeeType(voucher.feeType);
    setIsEditModalVisible(true);
  }, []);

  const handleUpdateVoucher = useCallback(async () => {
    try {
      let payload;
      if (editingVoucher.feeType === "admission") {
        payload = {
          feeDetails: {
            ...admissionDetails,
            ...(admissionDetails.monthlyFee > 0 && {
              monthlyFeeMonth,
              monthlyFeeYear,
            }),
          },
        };
      } else {
        payload = {
          amount: parseFloat(amount),
          month,
          year,
        };
      }

      const endpoint =
        editingVoucher.feeType === "admission"
          ? API_ENDPOINTS.EDIT_ADMISSION_FEE(student.student.studentId, editingVoucher.voucherNumber)
          : API_ENDPOINTS.EDIT_MONTHLY_FEE(student.student.studentId, editingVoucher.voucherNumber);

      await axios.put(endpoint, payload);

      const res = await axios.get(API_ENDPOINTS.STUDENT_FEE_SUMMARY(id));
      setStudent(res.data);

      toast.success("Voucher updated successfully!");
      setIsEditModalVisible(false);
      setEditingVoucher(null);
      setAdmissionDetails({
        admissionFee: 0,
        annualCharges: 0,
        securityCard: 0,
        paperFund: 0,
        monthlyFee: 0,
        otherDues: 0,
      });
    } catch (error) {
      console.error(
        "Voucher update error:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || "Failed to update voucher"
      );
    }
  }, [editingVoucher, admissionDetails, amount, month, year, monthlyFeeMonth, monthlyFeeYear, student, id]);

  const handleDeleteVoucher = useCallback(async (voucherNumber) => {
    try {
      await axios.delete(
        API_ENDPOINTS.DELETE_VOUCHER(student.student.studentId, voucherNumber)
      );

      const res = await axios.get(API_ENDPOINTS.STUDENT_FEE_SUMMARY(id));
      setStudent(res.data);

      toast.success("Voucher deleted successfully!");
    } catch (error) {
      console.error(
        "Voucher deletion error:",
        error.response?.data || error.message
      );
      toast.error(
        error.response?.data?.message || "Failed to delete voucher"
      );
    }
  }, [student, id]);

  const markAsPaid = useCallback(async (voucherNumber) => {
    try {
      await axios.put(
        API_ENDPOINTS.UPDATE_FEE_STATUS(student.student.studentId, voucherNumber),
        { isPaid: true }
      );

      const res = await axios.get(API_ENDPOINTS.STUDENT_FEE_SUMMARY(id));
      setStudent(res.data);

      toast.success("Fee marked as paid successfully!");
    } catch (error) {
      console.error("Error marking as paid:", error);
      toast.error(
        error.response?.data?.message || "Failed to update fee status"
      );
    }
  }, [student, id]);

  const handlePrintVoucher = useCallback(async (voucher, isBulk = false) => {
    try {
      let fullVoucher = voucher;

      if (!isBulk && student?.feeHistory) {
        const localVoucher = student.feeHistory.find(
          (f) => f.voucherNumber === voucher.voucherNumber
        );
        if (localVoucher) fullVoucher = localVoucher;
      }

      if (
        !isBulk &&
        (!fullVoucher.details ||
          Object.keys(fullVoucher.details).length === 0 ||
          !fullVoucher.paidAmount)
      ) {
        const response = await axios.get(
          API_ENDPOINTS.VOUCHER_DETAILS(student.student.studentId, voucher.voucherNumber)
        );
        fullVoucher = response.data.voucher;
      }

      if (isBulk) {
        setSelectedPendingVouchers([fullVoucher]);
        setTimeout(() => {
          const printWindow = window.open("", "_blank");
          printWindow.document.write(`
            <html>
              <head>
                <title>Fee Voucher - ${fullVoucher.voucherNumber}</title>
                <style>
                  @media print {
                    @page { size: A4; margin: 0.5in; }
                    body { font-family: Arial, sans-serif; }
                  }
                </style>
              </head>
              <body>
                ${document.getElementById("printable-voucher-0").innerHTML}
                ${
                  fullVoucher.isPaid
                    ? `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 72px; color: green; opacity: 0.3; z-index: 1000; pointer-events: none;">PAID</div>`
                    : fullVoucher.paidAmount > 0
                    ? `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 72px; color: blue; opacity: 0.3; z-index: 1000; pointer-events: none;">PARTIAL</div>`
                    : ""
                }
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          setSelectedPendingVouchers([]);
        }, 500);
      } else {
        setPrintVoucher(fullVoucher);
        setTimeout(() => {
          const printWindow = window.open("", "_blank");
          printWindow.document.write(`
            <html>
              <head>
                <title>Fee Voucher - ${fullVoucher.voucherNumber}</title>
                <style>
                  @media print {
                    @page { size: A4; margin: 0.5in; }
                    body { font-family: Arial, sans-serif; }
                  }
                </style>
              </head>
              <body>
                ${document.getElementById("printable-voucher").innerHTML}
                ${
                  fullVoucher.isPaid
                    ? `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 72px; color: green; opacity: 0.3; z-index: 1000; pointer-events: none;">PAID</div>`
                    : fullVoucher.paidAmount > 0
                    ? `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 72px; color: blue; opacity: 0.3; z-index: 1000; pointer-events: none;">PARTIAL</div>`
                    : ""
                }
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
        }, 100);
      }
    } catch (error) {
      console.error("Print error:", error);
      toast.error("Failed to load voucher details for printing");
    }
  }, [student, selectedPendingVouchers]);
  
  // Memoize filtered vouchers for better performance
  const filteredAdmissionVouchers = useMemo(() => 
    student.admissionFees.details.filter((voucher) => {
      const name = voucher.studentName || student.student.name || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    }),
    [student.admissionFees.details, student.student.name, searchTerm]
  );

  const filteredMonthlyVouchers = useMemo(() =>
    student.monthlyFees.details
      .filter((voucher) => {
        const name = voucher.studentName || student.student.name || "";
        return name.toLowerCase().includes(searchTerm.toLowerCase());
      }),
    [student.monthlyFees.details, student.student.name, searchTerm]
  );

  const filteredAnnualVouchers = useMemo(() =>
    (student.annualFees?.details || []).filter((voucher) => {
      const name = voucher.studentName || student.student.name || "";
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    }),
    [student.annualFees?.details, student.student.name, searchTerm]
  );

  const normalizePhoneForWhatsApp = useCallback((phone) => {
    if (!phone) return "";
    const digitsOnly = String(phone).replace(/\D/g, "");
    if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
      return `92${digitsOnly.slice(1)}`;
    }
    return digitsOnly;
  }, []);

  const buildWhatsAppMessage = useCallback((voucher) => {
    const studentInfo = student.student;
    const feeTypeLabel =
      voucher.feeType === "admission"
        ? "Admission Fee"
        : voucher.feeType === "annual"
        ? "Paper Fund"
        : "Monthly Fee";

    const feePeriod = voucher.feeType === "monthly"
      ? `Month/Year: ${months[voucher.month - 1]} ${voucher.year}`
      : voucher.feeType === "annual"
      ? `Year: ${voucher.year}`
      : "";

    const paidAmount = voucher.paidAmount || 0;
    const status = voucher.isPaid
      ? "Paid"
      : paidAmount > 0
      ? "Partial"
      : "Unpaid";

    const createdDate = voucher.createdAt
      ? moment(voucher.createdAt).format("DD/MM/YYYY")
      : moment().format("DD/MM/YYYY");

    return [
      "========================",
      "🏫 *GARRISON SCHOOL SYSTEM*",
      "========================",
      `👤 *Student:* ${studentInfo.name}`,
      `🎓 *Class:* ${studentInfo.classId?.grade || ""}-${studentInfo.classId?.section || ""}`,
      `🧾 Roll: ${studentInfo.rollNumber || ""}`,
      "------------------------",
      `📌 Type: ${feeTypeLabel}`,
      `💰 *Fee:* Rs. ${voucher.amount?.toLocaleString() || 0}`,
      feePeriod ? `🗓️ ${feePeriod}` : "",
      `✅ Status: ${status}`,
      `📅 Date: ${createdDate}`,
      "========================",
    ]
      .filter(Boolean)
      .join("\n");
  }, [student, months]);

  const handleShareWhatsApp = useCallback((voucher) => {
    const phone = normalizePhoneForWhatsApp(student.student.guardianPhone);
    if (!phone) {
      toast.error("Student phone number not available");
      return;
    }

    const messageText = buildWhatsAppMessage(voucher);
    const shareUrl = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(messageText)}`;
    window.open(shareUrl, "whatsapp-web");
  }, [student, buildWhatsAppMessage, normalizePhoneForWhatsApp]);

  const handleGeneratePaperFund = useCallback(async () => {
    try {
      if (!paperFundAmount || paperFundAmount <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const payload = {
        studentId: id,
        feeType: "annual",
        amount: parseFloat(paperFundAmount),
        year: parseInt(paperFundYear),
      };

      await axios.post(API_ENDPOINTS.GENERATE_FEE_VOUCHER, payload);

      const res = await axios.get(API_ENDPOINTS.STUDENT_FEE_SUMMARY(id));
      setStudent(res.data);

      toast.success("Paper fund voucher generated successfully!");
      setPaperFundModalVisible(false);
      setPaperFundAmount(0);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate paper fund voucher"
      );
    }
  }, [id, paperFundAmount, paperFundYear]);

  const admissionColumns = [
    {
      title: "Voucher #",
      dataIndex: "voucherNumber",
      key: "voucherNumber",
      render: (text, record) => (
        <Badge
          count={text}
          color={
            record.isPaid ? "green" : record.paidAmount > 0 ? "blue" : "orange"
          }
        />
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => moment(date).format("DD/MM/YYYY"),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => `Rs. ${amount.toLocaleString()}`,
    },
    {
      title: "Payment Status",
      key: "paymentStatus",
      render: (_, record) => {
        const paid = record.paidAmount || 0;
        const remaining = record.amount - paid;
        const percentPaid = Math.round((paid / record.amount) * 100);

        return (
          <div>
            {record.isPaid ? (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Fully Paid
              </Tag>
            ) : (
              <>
                <div className="payment-details">
                  <div>
                    <span className="label">Paid:</span>
                    <span className="value">Rs. {paid.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="label">Remaining:</span>
                    <span className="value">
                      Rs. {remaining.toLocaleString()}
                    </span>
                  </div>
                </div>
                <Progress
                  percent={percentPaid}
                  size="small"
                  status={percentPaid > 0 ? "active" : "normal"}
                  strokeColor={percentPaid > 0 ? "#22C55E" : "#F97316"}
                />
              </>
            )}
          </div>
        );
      },
    },

    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex space-x-2">
          {!record.isPaid && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEditVoucher(record)}
              />
              <Popconfirm
                title="Are you sure to delete this voucher?"
                onConfirm={() => handleDeleteVoucher(record.voucherNumber)}
                okText="Yes"
                cancelText="No"
              >
                <Button icon={<DeleteOutlined />} danger />
              </Popconfirm>
              <Button
                type="primary"
                onClick={() => showPartialPaymentModal(record)}
              >
                Partial Pay
              </Button>
              <Button
                type="primary"
                onClick={() => markAsPaid(record.voucherNumber)}
              >
                Full Pay
              </Button>
            </>
          )}
          <Button
            icon={<PrinterOutlined />}
            onClick={() => handlePrintVoucher(record)}
          >
            Print
          </Button>
          <Button
            type="primary"
            icon={<FaWhatsapp />}
            onClick={() => handleShareWhatsApp(record)}
            style={{ background: "#25D366", borderColor: "#25D366" }}
          >
            WhatsApp
          </Button>
        </div>
      ),
    },
  ];

  const monthlyColumns = [
    {
      title: "Month",
      dataIndex: "month",
      key: "month",
      render: (month) => months[month - 1],
    },
    {
      title: "Voucher #",
      dataIndex: "voucherNumber",
      key: "voucherNumber",
      render: (text, record) => (
        <Badge
          count={text}
          color={
            record.isPaid ? "green" : record.paidAmount > 0 ? "blue" : "orange"
          }
        />
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amount) => `Rs. ${amount.toLocaleString()}`,
    },
    {
      title: "Payment Status",
      key: "paymentStatus",
      render: (_, record) => (
        <div>
          {record.isPaid ? (
            <Tag icon={<CheckCircleOutlined />} color="success">
              Fully Paid
            </Tag>
          ) : (
            <>
              <div>Paid: Rs. {record.paidAmount?.toLocaleString() || 0}</div>
              <div>
                Remaining: Rs.{" "}
                {(record.amount - (record.paidAmount || 0)).toLocaleString()}
              </div>
              <Progress
                percent={Math.round(
                  ((record.paidAmount || 0) / record.amount) * 100
                )}
                size="small"
                status="active"
              />
            </>
          )}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex space-x-2">
          {!record.isPaid && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => handleEditVoucher(record)}
              />
              <Popconfirm
                title="Are you sure to delete this voucher?"
                onConfirm={() => handleDeleteVoucher(record.voucherNumber)}
                okText="Yes"
                cancelText="No"
              >
                <Button icon={<DeleteOutlined />} danger />
              </Popconfirm>
              <Button
                type="primary"
                onClick={() => showPartialPaymentModal(record)}
              >
                Partial Pay
              </Button>
              <Button
                type="primary"
                onClick={() => markAsPaid(record.voucherNumber)}
              >
                Full Pay
              </Button>
            </>
          )}
          <Button
            icon={<PrinterOutlined />}
            onClick={() => handlePrintVoucher(record)}
          >
            Print
          </Button>
          <Button
            type="primary"
            icon={<FaWhatsapp />}
            onClick={() => handleShareWhatsApp(record)}
            style={{ background: "#25D366", borderColor: "#25D366" }}
          >
            WhatsApp
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="max-w-7xl mx-auto animate-fadeIn">
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              {student.student.photo ? (
                <img
                  src={`${API_BASE_URL}${student.student.photo}`}
                  alt={student.student.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-md">
                  <UserOutlined className="text-4xl text-blue-600" />
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md">
                {student.student.rollNumber}
              </div>
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800">
                {student.student.name}
              </h1>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <FileTextOutlined className="text-blue-500 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Student ID</div>
                    <div className="font-medium">
                      {student.student.studentId}
                    </div>
                  </div>
                </div>

                {student.student.classId && (
                  <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                    <FileTextOutlined className="text-purple-500 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Class</div>
                      <div className="font-medium">
                        {student.student.classId.grade} -{" "}
                        {student.student.classId.section}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                  <FileTextOutlined className="text-green-500 mr-2" />
                  <div>
                    <div className="text-sm text-gray-500">Roll Number</div>
                    <div className="font-medium">
                      {student.student.rollNumber}
                    </div>
                  </div>
                </div>

                {student.student.guardianPhone && (
                  <div className="flex items-center bg-gray-50 p-3 rounded-lg">
                    <FileTextOutlined className="text-orange-500 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Phone Number</div>
                      <div className="font-medium">
                        {student.student.guardianPhone}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-sm text-blue-600">Total Fees</div>
                <div className="text-xl font-bold text-blue-800">
                  Rs. {student.overall.totalFees?.toLocaleString() || 0}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-sm text-green-600">Paid Fees</div>
                <div className="text-xl font-bold text-green-800">
                  Rs. {student.overall.paidFees?.toLocaleString() || 0}
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg text-center">
                <div className="text-sm text-orange-600">Pending Fees</div>
                <div className="text-xl font-bold text-orange-800">
                  Rs. {student.overall.pendingFees?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-600">
                  Admission Fee
                </h3>
                <div className="text-2xl font-bold mt-2">
                  Rs. {student.admissionFees.paid?.toLocaleString() || 0} /{" "}
                  <span className="text-gray-500">
                    Rs.{" "}
                    {(
                      student.admissionFees.paid + student.admissionFees.pending
                    )?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <UserOutlined className="text-blue-600 text-xl" />
              </div>
            </div>
            <div className="mt-4">
              {student.admissionFees.pending > 0 ? (
                <Tag color="orange">
                  Pending: Rs. {student.admissionFees.pending?.toLocaleString()}
                </Tag>
              ) : (
                <Tag color="green">Fully Paid</Tag>
              )}
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="mt-4 w-full"
              onClick={() => {
                setFeeType("admission");
                setIsModalVisible(true);
              }}
            >
              Add Admission Fee
            </Button>
          </div>

          <div className="glass-card p-6 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-600">
                  Monthly Fee (All Years)
                </h3>
                <div className="text-2xl font-bold mt-2">
                  Rs. {student.monthlyFees.paid?.toLocaleString() || 0} /{" "}
                  <span className="text-gray-500">
                    Rs.{" "}
                    {(
                      student.monthlyFees.paid + student.monthlyFees.pending
                    )?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FileTextOutlined className="text-purple-600 text-xl" />
              </div>
            </div>
            <div className="mt-4">
              {student.monthlyFees.pending > 0 ? (
                <Tag color="orange">
                  Pending: Rs. {student.monthlyFees.pending?.toLocaleString()}
                </Tag>
              ) : (
                <Tag color="green">Fully Paid</Tag>
              )}
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="mt-4 w-full"
              onClick={() => {
                setFeeType("monthly");
                setIsModalVisible(true);
              }}
            >
              Generate Monthly Fee
            </Button>
          </div>

          <div className="glass-card p-6 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-600">
                  Quick Actions
                </h3>
                <div className="mt-4 space-y-3">
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    block
                    onClick={() => {
                      setFeeType("monthly");
                      setIsModalVisible(true);
                    }}
                  >
                    Generate Monthly Fee
                  </Button>
                  <Button
                    icon={<UserOutlined />}
                    block
                    onClick={() => {
                      setFeeType("admission");
                      setIsModalVisible(true);
                    }}
                  >
                    Generate Admission Fee
                  </Button>
                  <Button
                    onClick={handleBulkPrintPending}
                    icon={<PrinterOutlined />}
                  >
                    Print All Pending (
                    {student.monthlyFees.pending +
                      student.admissionFees.pending +
                      (student.annualFees?.pending || 0)}
                    )
                  </Button>
                  <Button
                    type="primary"
                    icon={<FileTextOutlined />}
                    block
                    style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                    onClick={() => setPaperFundModalVisible(true)}
                  >
                    Generate Paper Fund
                  </Button>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarOutlined className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Admission Fee Vouchers
            </h3>
            <Input
              placeholder="Search by student name"
              allowClear
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
            />
          </div>
          {student.admissionFees?.details?.length > 0 ? (
            <div className="glass-card overflow-hidden">
              <Table
                columns={admissionColumns}
                dataSource={filteredAdmissionVouchers}
                rowKey="_id"
                pagination={false}
                scroll={{ x: 800 }}
              />
            </div>
          ) : (
            <Card className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <InfoCircleOutlined className="text-5xl mx-auto" />
              </div>
              <p className="text-gray-500">
                No admission fee vouchers generated yet
              </p>
              <Button
                type="primary"
                className="mt-4"
                onClick={() => {
                  setFeeType("admission");
                  setIsModalVisible(true);
                }}
              >
                Generate Admission Fee
              </Button>
            </Card>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              Monthly Fee Vouchers (All Years)
            </h3>
            <Input
              placeholder="Search by student name"
              allowClear
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200 }}
            />
          </div>
          <div className="glass-card overflow-hidden">
            <Table
              columns={monthlyColumns}
              dataSource={filteredMonthlyVouchers}
              rowKey="_id"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </div>
        </div>

        {/* Paper Fund Vouchers Section */}
        <div className="mb-10 mt-10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              📄 Paper Fund Vouchers (Annual)
            </h3>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
              onClick={() => setPaperFundModalVisible(true)}
            >
              Generate Paper Fund
            </Button>
          </div>
          {filteredAnnualVouchers.length > 0 ? (
            <div className="glass-card overflow-hidden">
              <Table
                columns={[
                  {
                    title: "Year",
                    dataIndex: "year",
                    key: "year",
                    render: (year) => <span className="font-semibold">{year}</span>,
                  },
                  {
                    title: "Voucher #",
                    dataIndex: "voucherNumber",
                    key: "voucherNumber",
                    render: (text, record) => (
                      <Badge
                        count={text}
                        color={record.isPaid ? "green" : record.paidAmount > 0 ? "blue" : "orange"}
                      />
                    ),
                  },
                  {
                    title: "Amount",
                    dataIndex: "amount",
                    key: "amount",
                    render: (amount) => `Rs. ${amount.toLocaleString()}`,
                  },
                  {
                    title: "Payment Status",
                    key: "paymentStatus",
                    render: (_, record) => (
                      <div>
                        {record.isPaid ? (
                          <Tag icon={<CheckCircleOutlined />} color="success">Fully Paid</Tag>
                        ) : (
                          <>
                            <div>Paid: Rs. {record.paidAmount?.toLocaleString() || 0}</div>
                            <div>Remaining: Rs. {(record.amount - (record.paidAmount || 0)).toLocaleString()}</div>
                            <Progress
                              percent={Math.round(((record.paidAmount || 0) / record.amount) * 100)}
                              size="small"
                              status="active"
                            />
                          </>
                        )}
                      </div>
                    ),
                  },
                  {
                    title: "Actions",
                    key: "actions",
                    render: (_, record) => (
                      <div className="flex space-x-2">
                        {!record.isPaid && (
                          <>
                            <Popconfirm
                              title="Are you sure to delete this voucher?"
                              onConfirm={() => handleDeleteVoucher(record.voucherNumber)}
                              okText="Yes"
                              cancelText="No"
                            >
                              <Button icon={<DeleteOutlined />} danger />
                            </Popconfirm>
                            <Button type="primary" onClick={() => showPartialPaymentModal(record)}>
                              Partial Pay
                            </Button>
                            <Button type="primary" onClick={() => markAsPaid(record.voucherNumber)}>
                              Full Pay
                            </Button>
                          </>
                        )}
                        <Button icon={<PrinterOutlined />} onClick={() => handlePrintVoucher(record)}>
                          Print
                        </Button>
                        <Button
                          type="primary"
                          icon={<FaWhatsapp />}
                          onClick={() => handleShareWhatsApp(record)}
                          style={{ background: "#25D366", borderColor: "#25D366" }}
                        >
                          WhatsApp
                        </Button>
                      </div>
                    ),
                  },
                ]}
                dataSource={filteredAnnualVouchers}
                rowKey="_id"
                pagination={false}
                scroll={{ x: 800 }}
              />
            </div>
          ) : (
            <Card className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <InfoCircleOutlined className="text-5xl mx-auto" />
              </div>
              <p className="text-gray-500">No paper fund vouchers generated yet</p>
              <Button
                type="primary"
                className="mt-4"
                style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                onClick={() => setPaperFundModalVisible(true)}
              >
                Generate Paper Fund
              </Button>
            </Card>
          )}
        </div>

        {/* Paper Fund Modal */}
        <Modal
          title="Generate Paper Fund Voucher"
          open={paperFundModalVisible}
          onCancel={() => {
            setPaperFundModalVisible(false);
            setPaperFundAmount(0);
          }}
          onOk={handleGeneratePaperFund}
          okText="Generate Voucher"
          okButtonProps={{ style: { background: '#f59e0b', borderColor: '#f59e0b' } }}
        >
          <Form layout="vertical">
            <Form.Item label="Year" required>
              <Select
                value={paperFundYear}
                onChange={(val) => setPaperFundYear(val)}
              >
                {Array.from({ length: 5 }, (_, i) => currentYear - 1 + i).map((y) => (
                  <Option key={y} value={y}>{y}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Amount (Rs.)" required>
              <InputNumber
                min={1}
                value={paperFundAmount}
                onChange={(val) => setPaperFundAmount(val)}
                style={{ width: '100%' }}
                placeholder="Enter paper fund amount"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/,/g, '')}
              />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Generate Fee Voucher"
          visible={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
            setAdmissionDetails({
              admissionFee: 0,
              annualCharges: 0,
              securityCard: 0,
              paperFund: 0,
              monthlyFee: 0,
              otherDues: 0,
            });
          }}
          onOk={() => form.submit()}
          okText="Generate"
          width={600}
        >
          <Form layout="vertical" form={form} onFinish={handleGenerateVoucher}>
            <Form.Item label="Fee Type">
              <Select value={feeType} onChange={setFeeType}>
                <Option value="monthly">Monthly Fee</Option>
                <Option value="admission">Admission Fee</Option>
              </Select>
            </Form.Item>

            {feeType === "admission" && (
              <>
                <Form.Item label="Admission Fee">
                  <InputNumber
                    value={admissionDetails.admissionFee}
                    onChange={(value) =>
                      handleAdmissionDetailChange("admissionFee", value)
                    }
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item label="Annual Charges">
                  <InputNumber
                    value={admissionDetails.annualCharges}
                    onChange={(value) =>
                      handleAdmissionDetailChange("annualCharges", value)
                    }
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item label="Security Card">
                  <InputNumber
                    value={admissionDetails.securityCard}
                    onChange={(value) =>
                      handleAdmissionDetailChange("securityCard", value)
                    }
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item label="Paper Fund">
                  <InputNumber
                    value={admissionDetails.paperFund}
                    onChange={(value) =>
                      handleAdmissionDetailChange("paperFund", value)
                    }
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item label="Include Monthly Fee (Optional)">
                  <InputNumber
                    value={admissionDetails.monthlyFee || 0}
                    onChange={(value) =>
                      handleAdmissionDetailChange("monthlyFee", value)
                    }
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>

                {admissionDetails.monthlyFee > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item label="For Month">
                      <Select
                        value={monthlyFeeMonth}
                        onChange={setMonthlyFeeMonth}
                      >
                        {months.map((monthName, index) => (
                          <Option key={monthName} value={index + 1}>
                            {monthName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item label="For Year">
                      <Select
                        value={monthlyFeeYear}
                        onChange={setMonthlyFeeYear}
                      >
                        <Option value={currentYear - 1}>
                          {currentYear - 1}
                        </Option>
                        <Option value={currentYear}>{currentYear}</Option>
                        <Option value={currentYear + 1}>
                          {currentYear + 1}
                        </Option>
                      </Select>
                    </Form.Item>
                  </div>
                )}

                <Form.Item label="Other Dues (Optional)">
                  <InputNumber
                    value={admissionDetails.otherDues || 0}
                    onChange={(value) =>
                      handleAdmissionDetailChange("otherDues", value)
                    }
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </>
            )}

            {feeType === "monthly" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item label="Month">
                    <Select value={month} onChange={setMonth}>
                      {months.map((monthName, index) => (
                        <Option key={monthName} value={index + 1}>
                          {monthName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item label="Year">
                    <Select value={year} onChange={setYear}>
                      <Option value={currentYear - 1}>{currentYear - 1}</Option>
                      <Option value={currentYear}>{currentYear}</Option>
                      <Option value={currentYear + 1}>{currentYear + 1}</Option>
                    </Select>
                  </Form.Item>
                </div>
                <Form.Item label="Amount">
                  <InputNumber
                    value={amount}
                    onChange={setAmount}
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </>
            )}

            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <div className="text-blue-700 font-medium">
                Total Amount: Rs. {amount.toLocaleString()}
              </div>
            </div>
          </Form>
        </Modal>

        <Modal
          title={`Edit ${
            editingVoucher?.feeType === "admission" ? "Admission" : "Monthly"
          } Fee Voucher`}
          visible={isEditModalVisible}
          onCancel={() => {
            setIsEditModalVisible(false);
            setEditingVoucher(null);
            setAdmissionDetails({
              admissionFee: 0,
              annualCharges: 0,
              securityCard: 0,
              paperFund: 0,
              monthlyFee: 0,
              otherDues: 0,
            });
          }}
          onOk={handleUpdateVoucher}
          okText="Update"
          width={600}
        >
          <Form layout="vertical" form={editForm}>
            {editingVoucher?.feeType === "admission" && (
              <>
                <Form.Item label="Admission Fee">
                  <InputNumber
                    value={admissionDetails.admissionFee}
                    onChange={(value) =>
                      handleAdmissionDetailChange("admissionFee", value)
                    }
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item label="Annual Charges">
                  <InputNumber
                    value={admissionDetails.annualCharges}
                    onChange={(value) =>
                      handleAdmissionDetailChange("annualCharges", value)
                    }
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item label="Security Card">
                  <InputNumber
                    value={admissionDetails.securityCard}
                    onChange={(value) =>
                      handleAdmissionDetailChange("securityCard", value)
                    }
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item label="Paper Fund">
                  <InputNumber
                    value={admissionDetails.paperFund}
                    onChange={(value) =>
                      handleAdmissionDetailChange("paperFund", value)
                    }
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                <Form.Item label="Include Monthly Fee (Optional)">
                  <InputNumber
                    value={admissionDetails.monthlyFee || 0}
                    onChange={(value) =>
                      handleAdmissionDetailChange("monthlyFee", value)
                    }
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>

                {admissionDetails.monthlyFee > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    <Form.Item label="For Month">
                      <Select
                        value={monthlyFeeMonth}
                        onChange={setMonthlyFeeMonth}
                      >
                        {months.map((monthName, index) => (
                          <Option key={monthName} value={index + 1}>
                            {monthName}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item label="For Year">
                      <Select
                        value={monthlyFeeYear}
                        onChange={setMonthlyFeeYear}
                      >
                        <Option value={currentYear - 1}>
                          {currentYear - 1}
                        </Option>
                        <Option value={currentYear}>{currentYear}</Option>
                        <Option value={currentYear + 1}>
                          {currentYear + 1}
                        </Option>
                      </Select>
                    </Form.Item>
                  </div>
                )}

                <Form.Item label="Other Dues (Optional)">
                  <InputNumber
                    value={admissionDetails.otherDues || 0}
                    onChange={(value) =>
                      handleAdmissionDetailChange("otherDues", value)
                    }
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </>
            )}

            {editingVoucher?.feeType === "monthly" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item label="Month">
                    <Select value={month} onChange={setMonth}>
                      {months.map((monthName, index) => (
                        <Option key={monthName} value={index + 1}>
                          {monthName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item label="Year">
                    <Select value={year} onChange={setYear}>
                      <Option value={currentYear - 1}>{currentYear - 1}</Option>
                      <Option value={currentYear}>{currentYear}</Option>
                      <Option value={currentYear + 1}>{currentYear + 1}</Option>
                    </Select>
                  </Form.Item>
                </div>
                <Form.Item label="Amount">
                  <InputNumber
                    value={amount}
                    onChange={setAmount}
                    prefix="Rs."
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </>
            )}
          </Form>
        </Modal>

        <div id="printable-voucher" style={{ display: "none" }}>
          {printVoucher && (
            <FeeVoucher student={student.student} fee={printVoucher} />
          )}
        </div>

        <PartialPaymentModal
          visible={partialPaymentModalVisible}
          onCancel={() => setPartialPaymentModalVisible(false)}
          voucher={selectedVoucher}
          student={student.student}
          refreshData={async () => {
            try {
              const res = await axios.get(
                API_ENDPOINTS.STUDENT_FEE_SUMMARY(id)
              );
              setStudent(res.data);
              toast.success("Payment updated successfully");
            } catch (error) {
              toast.error("Failed to refresh payment data");
            }
          }}
        />
        {selectedPendingVouchers.length > 0 && (
          <div style={{ display: "none" }}>
            {selectedPendingVouchers.map((voucher, index) => (
              <div id={`printable-voucher-${index}`} key={voucher._id}>
                <FeeVoucher
                  student={student.student}
                  fee={voucher}
                  isBulkPrint={true}
                  index={index}
                  total={selectedPendingVouchers.length}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeePage;

