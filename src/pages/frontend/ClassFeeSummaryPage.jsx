import React, { useEffect, useState, useRef } from "react";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Input } from "antd";
import toast from "react-hot-toast";
import { API_ENDPOINTS, API_BASE_URL } from "../../config/api";
import {
  Modal,
  Card,
  Select,
  InputNumber,
  Form,
  Table,
  Button,
  Spin,
  Progress,
  Tag,
  Divider,
  Statistic,
  Row,
  Col,
  Typography,
  Alert,
  Checkbox,
} from "antd";
import {
  PrinterOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  DownOutlined,
  UserOutlined,
  DownloadOutlined,
  FileTextOutlined,
  PercentageOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  TrophyOutlined,
  CloseOutlined,
  InfoCircleOutlined,
  LoadingOutlined,
  SmileOutlined,
  FireOutlined,
} from "@ant-design/icons";
import axios from "axios";
import moment from "moment";
import FeeVoucher from "../components/FeeVoucher";
import { isEqual } from "lodash";
import PartialPaymentModal from "../components/PartialPaymentModal";
import BulkUnpaidVoucher from "../components/BulkUnpaidVoucher";

const { Title, Text } = Typography;
const { Option } = Select;

const months = moment.months();

const ClassFeeSummaryPage = () => {
  const [selectedClass, setSelectedClass] = useState("");
  const [month, setMonth] = useState(moment().month() + 1);
  const [year, setYear] = useState(moment().year());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [admissionModalVisible, setAdmissionModalVisible] = useState(false);
  const [paperFundModalVisible, setPaperFundModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [admissionForm] = Form.useForm();
  const [paperFundForm] = Form.useForm();
  const [classes, setClasses] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const prevValuesRef = useRef();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [printUnpaidOnly, setPrintUnpaidOnly] = useState(false);
  const [printAdmissionOnly, setPrintAdmissionOnly] = useState(false);
  const [partialPaymentModalVisible, setPartialPaymentModalVisible] =
    useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedPendingVouchers, setSelectedPendingVouchers] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const showPartialPaymentModal = (voucher) => {
    setSelectedVoucher(voucher);
    setSelectedStudent({
      studentId: voucher.studentId,
      name: voucher.studentName,
      classId: {
        grade: summary.className.split(" - ")[0],
        section: summary.className.split(" - ")[1] || "",
      },
    });
    setPartialPaymentModalVisible(true);
  };
  const filteredVouchers =
    summary?.vouchers
      ?.filter((voucher) => {
        if (voucher.feeType === "monthly") {
          return voucher.month === month && voucher.year === year;
        }
        return true; // Keep all admission vouchers
      })
      ?.filter((voucher) => {
        if (!searchTerm) return true;
        return voucher.studentName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      }) || [];

  const handleEditVoucher = (voucher) => {
    setCurrentVoucher(voucher);

    if (voucher.feeType === "admission") {
      admissionForm.setFieldsValue({
        admissionFee: voucher.details?.admissionFee || 0,
        annualCharges: voucher.details?.annualCharges || 0,
        securityCard: voucher.details?.securityCard || 0,
        paperFund: voucher.details?.paperFund || 0,
        otherDues: voucher.details?.otherDues || 0,
        monthlyFee: voucher.details?.monthlyFee || 0,
        monthlyFeeMonth: voucher.details?.monthlyFeeMonth,
        monthlyFeeYear: voucher.details?.monthlyFeeYear,
      });
    } else {
      form.setFieldsValue({
        amount: voucher.amount,
        month: voucher.month,
        year: voucher.year,
      });
    }

    setEditModalVisible(true);
  };

  const handleDeleteVoucher = (voucher) => {
    setCurrentVoucher(voucher);
    setDeleteConfirmVisible(true);
  };

  const confirmDeleteVoucher = async () => {
    try {
      await axios.delete(
        API_ENDPOINTS.DELETE_VOUCHER(currentVoucher.studentId, currentVoucher.voucherNumber)
      );
      toast.success("Voucher deleted successfully");
      fetchClassSummary();
      setDeleteConfirmVisible(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete voucher"
      );
    }
  };

  const handleUpdateVoucher = async () => {
    try {
      setLoading(true);

      if (currentVoucher.feeType === "admission") {
        const values = await admissionForm.validateFields();
        await axios.put(
          API_ENDPOINTS.EDIT_ADMISSION_FEE(currentVoucher.studentId, currentVoucher.voucherNumber) ,
          { feeDetails: values }
        );
      } else {
        const values = await form.validateFields();
        await axios.put(
          API_ENDPOINTS.EDIT_MONTHLY_FEE(currentVoucher.studentId, currentVoucher.voucherNumber),
          values
        );
      }

      toast.success("Voucher updated successfully");
      fetchClassSummary();
      setEditModalVisible(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update voucher"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) fetchClassSummary();
  }, [selectedClass, month, year]);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentValues = admissionForm.getFieldsValue();
      if (!isEqual(prevValuesRef.current, currentValues)) {
        prevValuesRef.current = currentValues;
        const calculatedTotal = Object.values(currentValues).reduce(
          (sum, val) => sum + (val || 0),
          0
        );
        setTotalAmount(calculatedTotal);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [admissionForm]);

  const fetchClasses = async () => {
    try {
  const response = await axios.get(API_ENDPOINTS.CLASSES);
      setClasses(response.data);
    } catch (error) {
      toast.error("Failed to fetch classes");
    }
  };

  const fetchClassSummary = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        API_ENDPOINTS.STUDENT_FEE_CLASS_SUMMARY,
        { params: { classId: selectedClass, month, year } }
      );
      setSummary(response.data);
    } catch (error) {
      toast.error("Failed to fetch class summary");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVouchers = async () => {
    try {
      const values = await form.validateFields();
      if (values.amount <= 0) {
        toast.error("Fee amount must be greater than 0");
        return;
      }
      setGenerateModalVisible(false);
      setLoading(true);
      const response = await axios.post(
        API_ENDPOINTS.GENERATE_BULK_MONTHLY,
        { classId: selectedClass, month, year, amount: values.amount }
      );
      toast.success(`Generated ${response.data.count} vouchers successfully`);
      fetchClassSummary();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate vouchers"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePaperFund = async () => {
    try {
      const values = await paperFundForm.validateFields();
      if (!values.classId) {
        toast.error("Please select a class");
        return;
      }
      if (values.amount <= 0) {
        toast.error("Amount must be greater than 0");
        return;
      }
      setPaperFundModalVisible(false);
      setLoading(true);
      const response = await axios.post(
        API_ENDPOINTS.GENERATE_BULK_PAPERFUND,
        { classId: values.classId, year: values.year, amount: values.amount }
      );
      toast.success(response.data.message, { duration: 4000 });
      if (values.classId === selectedClass) fetchClassSummary();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate paper fund vouchers"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAdmissionVouchers = async () => {
    try {
      const values = await admissionForm.validateFields();
      if (!selectedClass) {
        toast.error("Please select a class first");
        return;
      }
      if (!values.admissionFee) {
        toast.error("Admission fee is required");
        return;
      }
      if (
        values.monthlyFee > 0 &&
        (!values.monthlyFeeMonth || !values.monthlyFeeYear)
      ) {
        toast.error("Month and year are required when including monthly fee");
        return;
      }

      setAdmissionModalVisible(false);
      setLoading(true);

      const response = await axios.post(
        API_ENDPOINTS.GENERATE_BULK_ADMISSION,
        {
          classId: selectedClass,
          feeDetails: {
            admissionFee: values.admissionFee,
            annualCharges: values.annualCharges || 0,
            securityCard: values.securityCard || 0,
            paperFund: values.paperFund || 0,
            otherDues: values.otherDues || 0,
            ...(values.monthlyFee > 0 && {
              monthlyFee: values.monthlyFee,
              monthlyFeeMonth: values.monthlyFeeMonth,
              monthlyFeeYear: values.monthlyFeeYear,
            }),
          },
        }
      );

      toast.success(
        `Generated ${response.data.count} admission vouchers successfully`
      );
      fetchClassSummary();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to generate admission vouchers"
      );
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (voucherNumber, studentId) => {
    try {
      setLoading(true);
      await axios.put(
        API_ENDPOINTS.UPDATE_FEE_STATUS(studentId, voucherNumber),
        { isPaid: true }
      );
      toast.success("Fee marked as fully paid successfully");
      fetchClassSummary();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update fee status"
      );
    } finally {
      setLoading(false);
    }
  };

  const printVoucher = (voucher, student, paid = false) => {
    if (!voucher) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html><head><title>Fee Voucher - ${student.name}</title>
      <style>@page { size: A4 portrait; margin: 0; } body { margin: 0; padding: 0; }</style></head>
      <body><div id="voucher-container">
        ${
          document.getElementById(`voucher-${voucher.voucherNumber}`)
            ?.innerHTML || "<h1>Voucher not found</h1>"
        }
        ${
          paid
            ? `<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 72px; color: green; opacity: 0.3; z-index: 1000; pointer-events: none;">PAID</div>`
            : ""
        }
      </div>
      <script>window.onload=function(){setTimeout(()=>{window.print();window.close();},500);};</script>
      </body></html>
    `);
    printWindow.document.close();
  };
  const printAllMonthlyVouchers = (paidOnly = false, unpaidOnly = false) => {
    if (!summary?.vouchers?.length) {
      toast("No vouchers available to print");
      return;
    }

    let vouchersToPrint = summary.vouchers.filter(
      (voucher) =>
        voucher.feeType === "monthly" &&
        voucher.month === month &&
        voucher.year === year
    );

    if (paidOnly) {
      vouchersToPrint = vouchersToPrint.filter((v) => v.isPaid);
    } else if (unpaidOnly) {
      vouchersToPrint = vouchersToPrint.filter((v) => !v.isPaid);
    }

    if (vouchersToPrint.length === 0) {
      toast("No monthly vouchers match the selected filters");
      return;
    }

    const printWindow = window.open("", "_blank");
    let vouchersHTML = `
    <style>
      @page { size: A4 portrait; margin: 0; }
      body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
      .voucher-page { width: 210mm; height: 297mm; page-break-after: always; position: relative; }
      .voucher { width: 190mm; height: 140mm; margin: 0 auto; padding: 5mm; box-sizing: border-box; position: absolute; left: 10mm; }
      .voucher-top { top: 0; } .voucher-bottom { top: 140mm; }
      .paid-stamp { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 72px; color: green; opacity: 0.3; z-index: 1000; pointer-events: none; }
      .unpaid-notice { position: absolute; bottom: 20mm; left: 0; right: 0; text-align: center; color: red; font-weight: bold; }
      .filter-info { text-align: center; margin-bottom: 10mm; font-size: 14px; color: #666; }
    </style>
    <div class="filter-info">
      Printing ${
        paidOnly ? "Paid" : unpaidOnly ? "Unpaid" : "All"
      } Monthly Vouchers for ${months[month - 1]} ${year}
    </div>
  `;

    for (let i = 0; i < vouchersToPrint.length; i += 2) {
      vouchersHTML += `<div class="voucher-page">`;
      if (i < vouchersToPrint.length) {
        const voucher = vouchersToPrint[i];
        vouchersHTML += `
        <div class="voucher voucher-top">
          ${
            document.getElementById(`voucher-${voucher.voucherNumber}`)
              ?.innerHTML || ""
          }
          ${
            voucher.isPaid
              ? '<div class="paid-stamp">PAID</div>'
              : '<div class="unpaid-notice">Please pay your fees immediately</div>'
          }
        </div>
      `;
      }
      if (i + 1 < vouchersToPrint.length) {
        const voucher = vouchersToPrint[i + 1];
        vouchersHTML += `
        <div class="voucher voucher-bottom">
          ${
            document.getElementById(`voucher-${voucher.voucherNumber}`)
              ?.innerHTML || ""
          }
          ${
            voucher.isPaid
              ? '<div class="paid-stamp">PAID</div>'
              : '<div class="unpaid-notice">Please pay your fees immediately</div>'
          }
        </div>
      `;
      }
      vouchersHTML += `</div>`;
    }

    printWindow.document.write(`
    <html><head><title>Monthly Fee Vouchers - ${summary.className}</title></head>
    <body>${vouchersHTML}</body></html>
  `);
    printWindow.document.close();
  };

  const printAllVouchers = (unpaidOnly = false, admissionOnly = false) => {
    if (!summary?.vouchers?.length) {
      toast("No vouchers available to print");
      return;
    }

    let vouchersToPrint = summary.vouchers;

    // Filter by month and year for monthly vouchers, by year for annual
    vouchersToPrint = vouchersToPrint.filter((voucher) => {
      if (voucher.feeType === "monthly") {
        return voucher.month === month && voucher.year === year;
      }
      if (voucher.feeType === "annual") {
        return !year || voucher.year === year;
      }
      return true; // Keep all admission vouchers
    });

    // Apply additional filters
    if (unpaidOnly) {
      vouchersToPrint = vouchersToPrint.filter((v) => !v.isPaid);
    }
    if (admissionOnly) {
      vouchersToPrint = vouchersToPrint.filter(
        (v) => v.feeType === "admission"
      );
    }

    if (vouchersToPrint.length === 0) {
      toast("No vouchers match the selected filters");
      return;
    }

    // Group vouchers by studentId — one combined voucher per student
    const studentVoucherMap = {};
    vouchersToPrint.forEach((voucher) => {
      const sid = voucher.studentId;
      if (!studentVoucherMap[sid]) {
        studentVoucherMap[sid] = {
          studentId: sid,
          studentName: voucher.studentName,
          rollNumber: voucher.rollNumber,
          vouchers: [],
        };
      }
      studentVoucherMap[sid].vouchers.push(voucher);
    });

    const consolidatedList = Object.values(studentVoucherMap);

    const printWindow = window.open("", "_blank");
    let vouchersHTML = `
      <style>
        @page { size: A4 portrait; margin: 0; }
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        .voucher-page { width: 210mm; height: 297mm; page-break-after: always; position: relative; }
        .voucher { width: 190mm; height: 140mm; margin: 0 auto; padding: 5mm; box-sizing: border-box; position: absolute; left: 10mm; overflow: hidden; }
        .voucher-top { top: 0; } .voucher-bottom { top: 140mm; }
        .paid-stamp { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 72px; color: green; opacity: 0.3; z-index: 1000; pointer-events: none; }
        .unpaid-notice { position: absolute; bottom: 5mm; left: 0; right: 0; text-align: center; color: red; font-weight: bold; }
        .filter-info { text-align: center; margin-bottom: 10mm; font-size: 14px; color: #666; }
      </style>
      <div class="filter-info">
        Printing ${unpaidOnly ? "Unpaid" : "All"} ${
      admissionOnly ? "Admission" : ""
    } Vouchers for ${months[month - 1]} ${year}
      </div>
    `;

    for (let i = 0; i < consolidatedList.length; i += 2) {
      vouchersHTML += `<div class="voucher-page">`;
      // Top voucher
      if (i < consolidatedList.length) {
        const group = consolidatedList[i];
        const allPaid = group.vouchers.every((v) => v.isPaid);
        const elemId = group.vouchers.length === 1
          ? `voucher-${group.vouchers[0].voucherNumber}`
          : `consolidated-${group.studentId}`;
        vouchersHTML += `
          <div class="voucher voucher-top">
            ${document.getElementById(elemId)?.innerHTML || ""}
            ${allPaid
              ? '<div class="paid-stamp">PAID</div>'
              : '<div class="unpaid-notice">Please pay your fees immediately</div>'
            }
          </div>
        `;
      }
      // Bottom voucher
      if (i + 1 < consolidatedList.length) {
        const group = consolidatedList[i + 1];
        const allPaid = group.vouchers.every((v) => v.isPaid);
        const elemId = group.vouchers.length === 1
          ? `voucher-${group.vouchers[0].voucherNumber}`
          : `consolidated-${group.studentId}`;
        vouchersHTML += `
          <div class="voucher voucher-bottom">
            ${document.getElementById(elemId)?.innerHTML || ""}
            ${allPaid
              ? '<div class="paid-stamp">PAID</div>'
              : '<div class="unpaid-notice">Please pay your fees immediately</div>'
            }
          </div>
        `;
      }
      vouchersHTML += `</div>`;
    }

    printWindow.document.write(`
      <html><head><title>Class Fee Vouchers - ${summary.className}</title></head>
      <body>${vouchersHTML}</body></html>
    `);
    printWindow.document.close();
  };

  const printAllStudentsUnpaidVouchers = async () => {
    if (!selectedClass) {
      toast("Please select a class first");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.CLASS_STUDENTS_UNPAID_FEES, {
        params: { classId: selectedClass }
      });

      const { students: studentsWithUnpaid } = response.data;

      if (!studentsWithUnpaid || studentsWithUnpaid.length === 0) {
        toast("No students with unpaid fees found in this class");
        setLoading(false);
        return;
      }

      toast.success(`Found ${studentsWithUnpaid.length} students with unpaid fees. Preparing print...`);

      // Create a temporary div to hold all the bulk vouchers
      const tempDiv = document.createElement('div');
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);

      // Render all student vouchers in the temp div
      studentsWithUnpaid.forEach((student) => {
        const voucherDiv = document.createElement('div');
        voucherDiv.className = 'student-unpaid-voucher';
        voucherDiv.innerHTML = `
          <div style="page-break-after: always;">
            <div id="bulk-unpaid-voucher" style="width: 210mm; height: auto; margin: 0 auto; padding: 10mm; background-color: #ffffff; box-sizing: border-box; font-family: Arial, sans-serif; fontSize: 11px; position: relative; border: 1px solid #ddd;">
              ${generateUnpaidVoucherHTML(student)}
            </div>
          </div>
        `;
        tempDiv.appendChild(voucherDiv);
      });

      // Open print window and print
      setTimeout(() => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
          <html>
            <head>
              <title>All Students Unpaid Fees - ${response.data.className}</title>
              <style>
                @page { size: A4 portrait; margin: 0; }
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                .student-unpaid-voucher { page-break-after: always; }
              </style>
            </head>
            <body>
              ${tempDiv.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        
        setTimeout(() => {
          printWindow.print();
          document.body.removeChild(tempDiv);
          setLoading(false);
        }, 500);
      }, 300);

    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch unpaid fees");
      setLoading(false);
    }
  };

  const generateUnpaidVoucherHTML = (student) => {
    const totalAmount = student.unpaidFees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalPaid = student.unpaidFees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
    const totalRemaining = totalAmount - totalPaid;

    return `
      <!-- Header Section -->
      <div style="display: flex; flex-direction: column; align-items: center; margin-bottom: 15px;">
        <img src="/src/assets/images/logo.png" alt="School Logo" style="width: 70px; margin-bottom: 8px;" />
        <h1 style="font-size: 22px; font-weight: bold; color: #2F5DAA; margin: 0; text-align: center;">
          THE QUAID-E-AZAM GROUP OF SCHOOLS & COLLEGES
        </h1>
        <p style="font-size: 13px; color: #4b5563; margin: 3px 0 0 0; text-align: center;">
          SHERONWALA PULL, JARANWALA
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: bold; background-color: #F97316; color: #ffffff; padding: 6px 0; display: inline-block; width: 100%; max-width: 350px; margin: 0 auto;">
          ALL UNPAID FEES SUMMARY
        </h2>
      </div>

      <!-- Student Info -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 20px; font-size: 13px; background-color: #f3f4f6; padding: 12px; border-radius: 4px;">
        <div><p style="margin: 3px 0;"><span style="font-weight: 700;">Student ID:</span> ${student.studentId}</p></div>
        <div><p style="margin: 3px 0;"><span style="font-weight: 700;">Student Name:</span> ${student.name}</p></div>
        <div><p style="margin: 3px 0;"><span style="font-weight: 700;">Roll #:</span> ${student.rollNumber || 'N/A'}</p></div>
        <div><p style="margin: 3px 0;"><span style="font-weight: 700;">Father Name:</span> ${student.fatherName || 'N/A'}</p></div>
        <div><p style="margin: 3px 0;"><span style="font-weight: 700;">Class:</span> ${student.classId?.grade} ${student.classId?.section}</p></div>
        <div><p style="margin: 3px 0;"><span style="font-weight: 700;">Print Date:</span> ${moment().format('DD/MM/YYYY')}</p></div>
      </div>

      <!-- Unpaid Fees Table -->
      <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; margin-bottom: 15px; font-size: 12px;">
        <thead>
          <tr style="background-color: #2F5DAA; color: #ffffff;">
            <th style="border: 1px solid #000; padding: 8px; text-align: left;">#</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Month</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: left;">Voucher #</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: right;">Total Amount</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: right;">Paid Amount</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: right;">Remaining</th>
          </tr>
        </thead>
        <tbody>
          ${student.unpaidFees.map((fee, index) => {
            const paidAmount = fee.paidAmount || 0;
            const remaining = fee.amount - paidAmount;
            const monthName = fee.feeType === 'admission' 
              ? 'Admission Fee' 
              : `${months[fee.month - 1]} ${fee.year}`;

            return `
              <tr>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">${index + 1}</td>
                <td style="border: 1px solid #000; padding: 6px;">${monthName}</td>
                <td style="border: 1px solid #000; padding: 6px;">${fee.voucherNumber}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: right;">Rs. ${fee.amount.toLocaleString()}</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: right; color: ${paidAmount > 0 ? '#3AC97C' : '#6b7280'};">
                  ${paidAmount > 0 ? `Rs. ${paidAmount.toLocaleString()}` : '-'}
                </td>
                <td style="border: 1px solid #000; padding: 6px; text-align: right; color: #F97316; font-weight: 600;">
                  Rs. ${remaining.toLocaleString()}
                </td>
              </tr>
            `;
          }).join('')}
          
          <!-- Summary Row -->
          <tr style="background-color: #f3f4f6; font-weight: bold;">
            <td colspan="3" style="border: 2px solid #000; padding: 8px; text-align: right; font-size: 13px;">TOTAL:</td>
            <td style="border: 2px solid #000; padding: 8px; text-align: right; font-size: 13px;">Rs. ${totalAmount.toLocaleString()}</td>
            <td style="border: 2px solid #000; padding: 8px; text-align: right; font-size: 13px; color: #3AC97C;">Rs. ${totalPaid.toLocaleString()}</td>
            <td style="border: 2px solid #000; padding: 8px; text-align: right; font-size: 13px; color: #F97316;">Rs. ${totalRemaining.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <!-- Payment Notice -->
      <div style="background-color: #FFEDD5; border: 2px solid #F97316; border-radius: 4px; padding: 12px; margin-bottom: 20px; text-align: center;">
        <p style="font-size: 14px; color: #C2410C; font-weight: bold; margin: 0 0 5px 0;">⚠️ URGENT PAYMENT REQUIRED ⚠️</p>
        <p style="font-size: 16px; color: #F97316; font-weight: bold; margin: 5px 0;">
          Total Outstanding Amount: Rs. ${totalRemaining.toLocaleString()}
        </p>
        <p style="font-size: 12px; color: #9A3412; margin: 5px 0 0 0;">
          Please clear all pending fees at the earliest to avoid any inconvenience
        </p>
      </div>

      <!-- Signatures -->
      <div style="display: flex; justify-content: space-between; width: 100%; font-size: 13px; border-top: 2px solid #000; padding-top: 15px; margin-top: 20px;">
        <div style="text-align: center; width: 150px;">
          <div style="border-top: 1px solid #000; margin-top: 40px; padding-top: 5px;">Cashier Signature</div>
        </div>
        <div style="text-align: center; width: 150px;">
          <div style="border-top: 1px solid #000; margin-top: 40px; padding-top: 5px;">Principal Signature</div>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; font-size: 11px; color: #666; margin-top: 15px; border-top: 1px solid #ddd; padding-top: 10px;">
        <p style="margin: 3px 0;">For any queries, please visit our office or contact us</p>
        <p style="margin: 3px 0; font-weight: 600;">Generated on: ${moment().format('DD/MM/YYYY hh:mm A')}</p>
      </div>
    `;
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto animate-fadeIn">
        {/* Hidden voucher elements for printing */}
        {summary?.vouchers?.map((voucher) => (
          <div
            key={`voucher-${voucher.voucherNumber}`}
            id={`voucher-${voucher.voucherNumber}`}
            style={{ display: "none" }}
          >
            <FeeVoucher
              student={{
                studentId: voucher.studentId,
                name: voucher.studentName,
                rollNumber: voucher.rollNumber,
                classId: {
                  grade: summary.className.split(" - ")[0],
                  section: summary.className.split(" - ")[1] || "",
                },
              }}
              fee={{
                ...voucher,
                feeType: voucher.feeType,
                amount: voucher.amount,
                isPaid: voucher.isPaid,
                voucherNumber: voucher.voucherNumber,
                details: voucher.details || {},
                month: voucher.month,
                year: voucher.year,
              }}
            />
          </div>
        ))}

        {/* Hidden consolidated voucher elements for per-student combined printing */}
        {(() => {
          if (!summary?.vouchers?.length) return null;
          // Group vouchers by studentId (same filter as printAllVouchers)
          const grouped = {};
          summary.vouchers
            .filter((voucher) => {
              if (voucher.feeType === "monthly") {
                return voucher.month === month && voucher.year === year;
              }
              if (voucher.feeType === "annual") {
                return !year || voucher.year === year;
              }
              return true;
            })
            .forEach((voucher) => {
              const sid = voucher.studentId;
              if (!grouped[sid]) {
                grouped[sid] = {
                  studentId: sid,
                  studentName: voucher.studentName,
                  rollNumber: voucher.rollNumber,
                  vouchers: [],
                };
              }
              grouped[sid].vouchers.push(voucher);
            });
          return Object.values(grouped)
            .filter((g) => g.vouchers.length > 1)
            .map((group) => (
              <div
                key={`consolidated-${group.studentId}`}
                id={`consolidated-${group.studentId}`}
                style={{ display: "none" }}
              >
                <FeeVoucher
                  student={{
                    studentId: group.studentId,
                    name: group.studentName,
                    rollNumber: group.rollNumber,
                    classId: {
                      grade: summary.className.split(" - ")[0],
                      section: summary.className.split(" - ")[1] || "",
                    },
                  }}
                  fee={{
                    isConsolidated: true,
                    vouchers: group.vouchers,
                    createdAt: new Date(),
                  }}
                />
              </div>
            ));
        })()}

        {/* Header Section */}
        <div className="glass-card p-6 mb-6 border border-gray-100">
          <Row justify="space-between" align="middle">
            <Col>
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl" style={{ background: '#2F5DAA' }}>
                  <DollarOutlined className="text-white text-2xl" />
                </div>
                <div>
                  <Title level={2} className="mb-0" style={{ color: '#2F5DAA' }}>
                    Class Fee Dashboard
                  </Title>
                  <Text type="secondary" className="text-base">
                    {summary
                      ? `${summary.className} • ${months[month - 1]} ${year}`
                      : "Select class and month to view fee summary"}
                  </Text>
                </div>
              </div>
            </Col>
            <Col>
              <Button.Group size="large">
                <Button
                  icon={<PrinterOutlined />}
                  onClick={() => setPrintModalVisible(true)}
                  className="transition-all duration-300 hover:scale-105"
                >
                  Print
                </Button>
                <Button
                  type="primary"
                  icon={<DollarOutlined />}
                  onClick={() => setGenerateModalVisible(true)}
                  className="border-0 transition-all duration-300 hover:scale-105 text-white"
                  style={{ background: '#2F5DAA' }}
                >
                  Generate Monthly
                </Button>
                <Button
                  type="primary"
                  icon={<CreditCardOutlined />}
                  onClick={() => setAdmissionModalVisible(true)}
                  className="border-0 transition-all duration-300 hover:scale-105 text-white"
                  style={{ background: '#2F5DAA' }}
                >
                  Generate Admission
                </Button>
                <Button
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={() => {
                    paperFundForm.setFieldsValue({ year: moment().year(), amount: 500, classId: selectedClass || undefined });
                    setPaperFundModalVisible(true);
                  }}
                  className="border-0 transition-all duration-300 hover:scale-105 text-white"
                  style={{ background: '#2F5DAA' }}
                >
                  Generate Paper Fund
                </Button>
              </Button.Group>
            </Col>
          </Row>
        </div>

        {/* Filters Card */}
        <Card className="mb-6 shadow-lg border-0 rounded-xl">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Class">
              <Select
                placeholder="Select Class"
                value={selectedClass}
                onChange={setSelectedClass}
                suffixIcon={<DownOutlined />}
              >
                {classes.map((cls) => (
                  <Option key={cls._id} value={cls._id}>
                    {cls.grade} - {cls.section}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Month">
              <Select
                placeholder="Select Month"
                value={month}
                onChange={setMonth}
                suffixIcon={<DownOutlined />}
              >
                {months.map((_, i) => (
                  <Option key={i + 1} value={i + 1}>
                    {moment().month(i).format("MMMM")}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Year">
              <Select
                placeholder="Select Year"
                value={year}
                onChange={setYear}
                suffixIcon={<DownOutlined />}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <Option key={i} value={moment().year() - 2 + i}>
                    {moment().year() - 2 + i}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>
      {loading && !summary ? (
        <div className="flex justify-center items-center h-96">
          <Spin size="large" tip="Loading class summary..." />
        </div>
      ) : summary ? (
        <>
          {/* Stats Cards with Beautiful Design */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={6}>
              <Card 
                className="shadow-lg border-0 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: '#2F5DAA' }}
              >
                <div className="text-white">
                  <div className="flex items-center justify-between mb-3">
                    <UserOutlined className="text-3xl opacity-80" />
                    <div className="text-right">
                      <div className="text-sm opacity-90 mb-1">Total Students</div>
                      <div className="text-3xl font-bold">{summary.totalStudents}</div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card 
                className="shadow-lg border-0 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: '#0A8F4F' }}
              >
                <div className="text-white">
                  <div className="flex items-center justify-between mb-3">
                    <CheckCircleOutlined className="text-3xl opacity-80" />
                    <div className="text-right">
                      <div className="text-sm opacity-90 mb-1">Paid Students</div>
                      <div className="text-3xl font-bold">{summary.paidStudents}</div>
                    </div>
                  </div>
                  <Progress
                    percent={Math.round((summary.paidStudents / summary.totalStudents) * 100)}
                    size="small"
                    strokeColor="#fff"
                    trailColor="rgba(255,255,255,0.3)"
                    showInfo={false}
                  />
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card 
                className="shadow-lg border-0 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: '#F97316' }}
              >
                <div className="text-white">
                  <div className="flex items-center justify-between mb-3">
                    <ClockCircleOutlined className="text-3xl opacity-80" />
                    <div className="text-right">
                      <div className="text-sm opacity-90 mb-1">Pending Students</div>
                      <div className="text-3xl font-bold">{summary.pendingStudents}</div>
                    </div>
                  </div>
                  <div className="text-sm text-black font-semibold bg-white bg-opacity-20 px-3 py-1 rounded-full inline-block">
                    {Math.round((summary.pendingStudents / summary.totalStudents) * 100)}% pending
                  </div>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card 
                className="shadow-lg border-0 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: summary.paidStudents / summary.totalStudents > 0.7 
                  ? '#0A8F4F' 
                  : '#F97316' }}
              >
                <div className="text-white">
                  <div className="flex items-center justify-between mb-3">
                    <PercentageOutlined className="text-3xl opacity-80" />
                    <div className="text-right">
                      <div className="text-sm opacity-90 mb-1">Collection Rate</div>
                      <div className="text-3xl font-bold">
                        {Math.round((summary.paidStudents / summary.totalStudents) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-semibold bg-white text-black bg-opacity-20 px-3 py-1 rounded-full inline-block">
                    {summary.paidStudents / summary.totalStudents > 0.7 ? '🎯 On Target' : '⚠️ Needs Attention'}
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Financial Summary Card */}
          <Card 
            title={
              <span className="text-xl font-bold text-gray-800">
                <DollarOutlined className="mr-2" />
                Financial Summary
              </span>
            }
            className="mb-6 shadow-lg border-0 rounded-xl"
          >
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={8}>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <FileTextOutlined className="text-3xl text-blue-600" />
                    <div className="text-2xl font-bold text-blue-700">
                      Rs. {summary.totalFees.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-gray-600 font-medium mb-2">Total Fees</div>
                  <Progress
                    percent={100}
                    strokeColor="#3b82f6"
                    showInfo={false}
                    strokeWidth={8}
                  />
                </div>
              </Col>

              <Col xs={24} lg={8}>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <CheckCircleOutlined className="text-3xl text-green-600" />
                    <div className="text-2xl font-bold text-green-700">
                      Rs. {summary.paidFees.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-gray-600 font-medium mb-2">Paid Fees</div>
                  <Progress
                    percent={Math.round((summary.paidFees / summary.totalFees) * 100)}
                    strokeColor="#10b981"
                    showInfo={true}
                    strokeWidth={8}
                    format={(percent) => `${percent}%`}
                  />
                </div>
              </Col>

              <Col xs={24} lg={8}>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <ClockCircleOutlined className="text-3xl text-orange-600" />
                    <div className="text-2xl font-bold text-orange-700">
                      Rs. {summary.pendingFees.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-gray-600 font-medium mb-2">Pending Fees</div>
                  <Progress
                    percent={Math.round((summary.pendingFees / summary.totalFees) * 100)}
                    strokeColor="#f59e0b"
                    showInfo={true}
                    strokeWidth={8}
                    format={(percent) => `${percent}%`}
                  />
                </div>
              </Col>
            </Row>

            {summary.paidFees / summary.totalFees > 0.8 && (
              <Alert
                message="🎉 Excellent Performance!"
                description="You've collected over 80% of fees this month. Outstanding work!"
                type="success"
                showIcon
                icon={<TrophyOutlined />}
                className="mt-6"
                style={{
                  background: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
                  border: 'none',
                  borderRadius: '12px'
                }}
              />
            )}
          </Card>

          <Card
            title={
              <span className="text-xl font-bold text-gray-800">
                <FileTextOutlined className="mr-2" />
                Student Vouchers ({months[month - 1]} {year})
              </span>
            }
            extra={
              <div style={{ display: "flex", alignItems: "center", gap: '12px' }}>
                <Input
                  placeholder="🔍 Search by student name..."
                  allowClear
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: 250, borderRadius: '8px' }}
                  size="large"
                />
                <Tag color="blue" style={{ fontSize: '14px', padding: '6px 12px', borderRadius: '8px' }}>
                  {filteredVouchers.length} records
                </Tag>
              </div>
            }
            className="shadow-lg border-0 rounded-xl"
          >
            <Table
              columns={[
                {
                  title: "Roll No.",
                  dataIndex: "rollNumber",
                  key: "rollNumber",
                },
                {
                  title: "Student",
                  render: (_, record) => (
                    <>
                      <Text strong>{record.studentName}</Text>
                      <br />
                      <Text type="secondary">ID: {record.studentId}</Text>
                    </>
                  ),
                },
                {
                  title: "Voucher",
                  dataIndex: "voucherNumber",
                  key: "voucherNumber",
                },
                {
                  title: "Amount",
                  dataIndex: "amount",
                  key: "amount",
                  render: (amount) => (
                    <Text strong>Rs. {amount.toLocaleString()}</Text>
                  ),
                },
                {
                  title: "Status",
                  dataIndex: "isPaid",
                  key: "status",
                  render: (isPaid) =>
                    isPaid ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        Paid
                      </Tag>
                    ) : (
                      <Tag icon={<ClockCircleOutlined />} color="orange">
                        Pending
                      </Tag>
                    ),
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
                          <div>
                            Paid: Rs. {record.paidAmount?.toLocaleString() || 0}
                          </div>
                          <div>
                            Remaining: Rs.{" "}
                            {(
                              record.amount - (record.paidAmount || 0)
                            ).toLocaleString()}
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
                    <Button.Group>
                      {record.isPaid ? (
                        <Button
                          icon={<PrinterOutlined />}
                          onClick={() =>
                            printVoucher(record, {
                              studentId: record.studentId,
                              name: record.studentName,
                              rollNumber: record.rollNumber,
                              classId: {
                                grade: summary.className.split(" - ")[0],
                                section:
                                  summary.className.split(" - ")[1] || "",
                              },
                            })
                          }
                        >
                          Print
                        </Button>
                      ) : (
                        <>
                          <Button
                            icon={<DollarOutlined />}
                            onClick={() => showPartialPaymentModal(record)}
                          >
                            Partial Pay
                          </Button>
                          <Button
                            icon={<CheckCircleOutlined />}
                            onClick={() =>
                              markAsPaid(record.voucherNumber, record.studentId)
                            }
                            loading={loading}
                          >
                            Mark Fully Paid
                          </Button>
                          <Button
                            icon={<EditOutlined />}
                            onClick={() => handleEditVoucher(record)}
                          />
                          <Button
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => handleDeleteVoucher(record)}
                          />
                          <Button
                            icon={<PrinterOutlined />}
                            onClick={() =>
                              printVoucher(record, {
                                studentId: record.studentId,
                                name: record.studentName,
                                rollNumber: record.rollNumber,
                                classId: {
                                  grade: summary.className.split(" - ")[0],
                                  section:
                                    summary.className.split(" - ")[1] || "",
                                },
                              })
                            }
                          >
                            Print
                          </Button>
                        </>
                      )}
                    </Button.Group>
                  ),
                },
              ]}
              dataSource={filteredVouchers}
              rowKey="voucherNumber"
              loading={loading}
            />
          </Card>
        </>
      ) : (
        <Card className="shadow-lg border-0 rounded-xl" style={{ minHeight: '400px' }}>
          <div className="text-center py-16">
            <div className="mb-6 animate-bounce">
              <InfoCircleOutlined 
                className="text-6xl" 
                style={{ 
                  color: '#2F5DAA'
                }} 
              />
            </div>
            <Title level={3} style={{ color: '#4b5563', marginBottom: '12px' }}>
              No Class Selected
            </Title>
            <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '24px' }}>
              Please select a class, month, and year from the filters above<br />
              to view comprehensive fee summary and student vouchers.
            </Text>
            <div className="flex justify-center gap-4 mt-8">
              <div className="bg-[#2F5DAA]/10 px-6 py-3 rounded-lg">
                <UserOutlined className="text-[#2F5DAA] mr-2" />
                <Text strong>Select Class</Text>
              </div>
              <div className="bg-[#2F5DAA]/10 px-6 py-3 rounded-lg">
                <FilterOutlined className="text-[#2F5DAA] mr-2" />
                <Text strong>Choose Filters</Text>
              </div>
              <div className="bg-[#2F5DAA]/10 px-6 py-3 rounded-lg">
                <DollarOutlined className="text-[#2F5DAA] mr-2" />
                <Text strong>View Summary</Text>
              </div>
            </div>
          </div>
        </Card>
      )}
      {/* Generate Monthly Vouchers Modal */}
      <Modal
        title="Generate Vouchers"
        visible={generateModalVisible}
        onCancel={() => setGenerateModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setGenerateModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleGenerateVouchers}
          >
            Generate Vouchers
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Amount per Student (Rs.)"
            name="amount"
            rules={[
              { required: true, message: "Please enter fee amount" },
              {
                validator: (_, value) =>
                  value > 0
                    ? Promise.resolve()
                    : Promise.reject("Amount must be greater than 0"),
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>

          <Card title="Generation Summary" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Class:</Text>
                <Text className="block">
                  {selectedClass
                    ? classes.find((c) => c._id === selectedClass)?.grade +
                      " - " +
                      classes.find((c) => c._id === selectedClass)?.section
                    : "Not selected"}
                </Text>
              </Col>
              <Col span={12}>
                <Text strong>Month:</Text>
                <Text className="block">{months[month - 1]}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Year:</Text>
                <Text className="block">{year}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Students:</Text>
                <Text className="block">{summary?.totalStudents || 0}</Text>
              </Col>
            </Row>
          </Card>
        </Form>
      </Modal>
      {/* Generate Admission Vouchers Modal */}
      <Modal
        title="Generate Admission Vouchers"
        visible={admissionModalVisible}
        onCancel={() => setAdmissionModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setAdmissionModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleGenerateAdmissionVouchers}
            icon={<CreditCardOutlined />}
          >
            Generate Vouchers
          </Button>,
        ]}
        width={800}
      >
        <Form
          form={admissionForm}
          layout="vertical"
          onValuesChange={(changedValues, allValues) => {
            const calculatedTotal = Object.values(allValues).reduce(
              (sum, val) => sum + (val || 0),
              0
            );
            setTotalAmount(calculatedTotal);
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Admission Fee (Rs.)"
                name="admissionFee"
                rules={[
                  { required: true, message: "Please enter admission fee" },
                  {
                    validator: (_, value) =>
                      value > 0
                        ? Promise.resolve()
                        : Promise.reject("Amount must be greater than 0"),
                  },
                ]}
              >
                <InputNumber style={{ width: "100%" }} min={1} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Annual Charges (Rs.)" name="annualCharges">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Security Card Fee (Rs.)" name="securityCard">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Paper Fund (Rs.)" name="paperFund">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Other Dues (Rs.)" name="otherDues">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Monthly Fee (Rs.)" name="monthlyFee">
                <InputNumber style={{ width: "100%" }} min={0} />
              </Form.Item>
            </Col>
          </Row>

          {admissionForm.getFieldValue("monthlyFee") > 0 && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Month for Monthly Fee"
                  name="monthlyFeeMonth"
                  rules={[
                    {
                      required: admissionForm.getFieldValue("monthlyFee") > 0,
                      message: "Please select month",
                    },
                  ]}
                >
                  <Select placeholder="Select month">
                    {months.map((_, i) => (
                      <Option key={i + 1} value={i + 1}>
                        {moment().month(i).format("MMMM")}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Year for Monthly Fee"
                  name="monthlyFeeYear"
                  rules={[
                    {
                      required: admissionForm.getFieldValue("monthlyFee") > 0,
                      message: "Please select year",
                    },
                  ]}
                >
                  <Select placeholder="Select year">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Option key={i} value={moment().year() - 2 + i}>
                        {moment().year() - 2 + i}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          <Card title="Total Amount" size="small" className="mb-4">
            <Statistic
              value={totalAmount}
              prefix={<DollarOutlined />}
              valueStyle={{ fontSize: "24px" }}
            />
          </Card>

          <Card title="Generation Summary" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Class:</Text>
                <Text className="block">
                  {selectedClass
                    ? classes.find((c) => c._id === selectedClass)?.grade +
                      " - " +
                      classes.find((c) => c._id === selectedClass)?.section
                    : "Not selected"}
                </Text>
              </Col>
              <Col span={12}>
                <Text strong>Students:</Text>
                <Text className="block">{summary?.totalStudents || 0}</Text>
              </Col>
            </Row>
          </Card>
        </Form>
      </Modal>
      {/* Edit Voucher Modal */}
      {/* Edit Voucher Modal */}
      <Modal
        title={`Edit ${
          currentVoucher?.feeType === "admission" ? "Admission" : "Monthly"
        } Fee Voucher`}
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setEditModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={handleUpdateVoucher}
            loading={loading}
          >
            Update
          </Button>,
        ]}
        width={800}
        destroyOnClose
      >
        {currentVoucher?.feeType === "admission" ? (
          <Form
            form={admissionForm}
            layout="vertical"
            initialValues={{
              admissionFee: currentVoucher?.details?.admissionFee || 0,
              annualCharges: currentVoucher?.details?.annualCharges || 0,
              securityCard: currentVoucher?.details?.securityCard || 0,
              paperFund: currentVoucher?.details?.paperFund || 0,
              otherDues: currentVoucher?.details?.otherDues || 0,
              monthlyFee: currentVoucher?.details?.monthlyFee || 0,
              monthlyFeeMonth: currentVoucher?.details?.monthlyFeeMonth,
              monthlyFeeYear: currentVoucher?.details?.monthlyFeeYear,
            }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Admission Fee (Rs.)"
                  name="admissionFee"
                  rules={[
                    { required: true, message: "Please enter admission fee" },
                    {
                      validator: (_, value) =>
                        value > 0
                          ? Promise.resolve()
                          : Promise.reject("Amount must be greater than 0"),
                    },
                  ]}
                >
                  <InputNumber style={{ width: "100%" }} min={1} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Annual Charges (Rs.)" name="annualCharges">
                  <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Security Card Fee (Rs.)" name="securityCard">
                  <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Paper Fund (Rs.)" name="paperFund">
                  <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Other Dues (Rs.)" name="otherDues">
                  <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Monthly Fee (Rs.)" name="monthlyFee">
                  <InputNumber style={{ width: "100%" }} min={0} />
                </Form.Item>
              </Col>
            </Row>

            {admissionForm.getFieldValue("monthlyFee") > 0 && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Month for Monthly Fee"
                    name="monthlyFeeMonth"
                    rules={[
                      {
                        required: admissionForm.getFieldValue("monthlyFee") > 0,
                        message: "Please select month",
                      },
                    ]}
                  >
                    <Select placeholder="Select month">
                      {months.map((_, i) => (
                        <Option key={i + 1} value={i + 1}>
                          {moment().month(i).format("MMMM")}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Year for Monthly Fee"
                    name="monthlyFeeYear"
                    rules={[
                      {
                        required: admissionForm.getFieldValue("monthlyFee") > 0,
                        message: "Please select year",
                      },
                    ]}
                  >
                    <Select placeholder="Select year">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Option key={i} value={moment().year() - 2 + i}>
                          {moment().year() - 2 + i}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            )}
          </Form>
        ) : (
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              amount: currentVoucher?.amount || 0,
              month: currentVoucher?.month,
              year: currentVoucher?.year,
            }}
          >
            <Form.Item
              label="Amount (Rs.)"
              name="amount"
              rules={[
                { required: true, message: "Please enter amount" },
                {
                  validator: (_, value) =>
                    value > 0
                      ? Promise.resolve()
                      : Promise.reject("Amount must be greater than 0"),
                },
              ]}
            >
              <InputNumber style={{ width: "100%" }} min={1} />
            </Form.Item>
            <Form.Item
              label="Month"
              name="month"
              rules={[{ required: true, message: "Please select month" }]}
            >
              <Select>
                {months.map((_, i) => (
                  <Option key={i + 1} value={i + 1}>
                    {moment().month(i).format("MMMM")}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Year"
              name="year"
              rules={[{ required: true, message: "Please select year" }]}
            >
              <Select>
                {Array.from({ length: 5 }, (_, i) => (
                  <Option key={i} value={moment().year() - 2 + i}>
                    {moment().year() - 2 + i}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        )}
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        visible={deleteConfirmVisible}
        onOk={confirmDeleteVoucher}
        onCancel={() => setDeleteConfirmVisible(false)}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this voucher?</p>
        <p>
          <strong>Voucher Number:</strong> {currentVoucher?.voucherNumber}
        </p>
        <p>
          <strong>Amount:</strong> Rs. {currentVoucher?.amount}
        </p>
        {currentVoucher?.isPaid && (
          <Alert
            message="Warning"
            description="This voucher is marked as paid. Deleting it may affect your records."
            type="warning"
            showIcon
          />
        )}
      </Modal>
      {/* Print Options Modal */}
      {/* Print Options Modal */}
      {/* Print Options Modal */}
      <Modal
        title="Print Vouchers"
        visible={printModalVisible}
        onCancel={() => setPrintModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setPrintModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={() =>
              printAllVouchers(printUnpaidOnly, printAdmissionOnly)
            }
          >
            Print Selected Vouchers
          </Button>,
        ]}
        width={1000} // Increased width to accommodate more columns
      >
        <Row gutter={16}>
          <Col span={24}>
            <Card title="Print Options">
              <Checkbox
                checked={printUnpaidOnly}
                onChange={(e) => setPrintUnpaidOnly(e.target.checked)}
              >
                Print Unpaid Vouchers Only
              </Checkbox>
              <br />
              <Checkbox
                checked={printAdmissionOnly}
                onChange={(e) => setPrintAdmissionOnly(e.target.checked)}
              >
                Print Admission Vouchers Only
              </Checkbox>
            </Card>
          </Col>
        </Row>

        {/* Monthly Vouchers Section */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={8}>
            <Card
              hoverable
              onClick={() => printAllVouchers(false, false)}
              className="text-center"
            >
              <PrinterOutlined className="text-3xl mb-3" />
              <Title level={4}>Print All Vouchers</Title>
              <Text type="secondary">{filteredVouchers.length} vouchers</Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              hoverable
              onClick={() => printAllVouchers(true, false)}
              className="text-center"
            >
              <PrinterOutlined className="text-3xl mb-3" />
              <Title level={4}>Print Unpaid Vouchers</Title>
              <Text type="secondary">
                {filteredVouchers.filter((v) => !v.isPaid).length} vouchers
              </Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              hoverable
              onClick={() => printAllVouchers(false, true)}
              className="text-center"
            >
              <PrinterOutlined className="text-3xl mb-3" />
              <Title level={4}>Print Admission Vouchers</Title>
              <Text type="secondary">
                {
                  filteredVouchers.filter((v) => v.feeType === "admission")
                    .length
                }{" "}
                vouchers
              </Text>
            </Card>
          </Col>
        </Row>

        {/* New Monthly Vouchers Section */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={8}>
            <Card
              hoverable
              onClick={() => printAllMonthlyVouchers(false)}
              className="text-center"
            >
              <PrinterOutlined className="text-3xl mb-3" />
              <Title level={4}>Print All Monthly Vouchers</Title>
              <Text type="secondary">
                {filteredVouchers.filter((v) => v.feeType === "monthly").length}{" "}
                vouchers
              </Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              hoverable
              onClick={() => printAllMonthlyVouchers(true)}
              className="text-center"
            >
              <PrinterOutlined className="text-3xl mb-3" />
              <Title level={4}>Print Paid Monthly Vouchers</Title>
              <Text type="secondary">
                {
                  filteredVouchers.filter(
                    (v) => v.feeType === "monthly" && v.isPaid
                  ).length
                }{" "}
                vouchers
              </Text>
            </Card>
          </Col>
          <Col span={8}>
            <Card
              hoverable
              onClick={() => printAllMonthlyVouchers(false, true)}
              className="text-center"
            >
              <PrinterOutlined className="text-3xl mb-3" />
              <Title level={4}>Print Unpaid Monthly Vouchers</Title>
              <Text type="secondary">
                {
                  filteredVouchers.filter(
                    (v) => v.feeType === "monthly" && !v.isPaid
                  ).length
                }{" "}
                vouchers
              </Text>
            </Card>
          </Col>
        </Row>

        {/* All Students Unpaid Vouchers Section */}
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card
              hoverable
              onClick={printAllStudentsUnpaidVouchers}
              className="text-center"
              style={{ backgroundColor: '#fff7ed', borderColor: '#f97316' }}
            >
              <FireOutlined className="text-3xl mb-3" style={{ color: '#f97316' }} />
              <Title level={3} style={{ color: '#ea580c' }}>
                Print All Students Unpaid Vouchers
              </Title>
              <Text type="secondary" style={{ fontSize: '15px' }}>
                Print complete unpaid fee summary for all students in this class<br />
                <Text strong style={{ color: '#f97316' }}>Each student on a separate page</Text>
              </Text>
            </Card>
          </Col>
        </Row>
      </Modal>

      {/* Generate Paper Fund Modal */}
      <Modal
        title="Generate Paper Fund Vouchers"
        visible={paperFundModalVisible}
        onCancel={() => setPaperFundModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setPaperFundModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleGeneratePaperFund}
            icon={<FileTextOutlined />}
            style={{ background: '#2F5DAA', borderColor: '#2F5DAA' }}
          >
            Generate Vouchers
          </Button>,
        ]}
      >
        <Form form={paperFundForm} layout="vertical" initialValues={{ year: moment().year(), amount: 500 }}>
          <Form.Item
            label="Select Class"
            name="classId"
            rules={[{ required: true, message: "Please select a class" }]}
          >
            <Select placeholder="Choose a class..." size="large">
              {classes.map((cls) => (
                <Option key={cls._id} value={cls._id}>
                  {cls.grade} - {cls.section}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Year"
            name="year"
            rules={[{ required: true, message: "Please select a year" }]}
          >
            <Select size="large">
              {Array.from({ length: 5 }, (_, i) => (
                <Option key={i} value={moment().year() - 2 + i}>
                  {moment().year() - 2 + i}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Amount per Student (Rs.)"
            name="amount"
            rules={[
              { required: true, message: "Please enter amount" },
              {
                validator: (_, value) =>
                  value > 0
                    ? Promise.resolve()
                    : Promise.reject("Amount must be greater than 0"),
              },
            ]}
          >
            <InputNumber style={{ width: "100%" }} min={1} size="large" />
          </Form.Item>

          <Card title="Generation Summary" size="small">
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Fee Type:</Text>
                <Text className="block">Paper Fund (Annual)</Text>
              </Col>
            </Row>
          </Card>

          <Alert
            message="Paper fund vouchers are generated once per year. Students who already have a paper fund voucher for the selected year will be skipped."
            type="info"
            showIcon
            className="mt-4"
          />
        </Form>
      </Modal>

      <PartialPaymentModal
        visible={partialPaymentModalVisible}
        onCancel={() => setPartialPaymentModalVisible(false)}
        voucher={selectedVoucher}
        student={selectedStudent}
        refreshData={fetchClassSummary}
      />
      </div>
    </div>
  );
};

export default ClassFeeSummaryPage;

