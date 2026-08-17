import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchStaffById, paySalary } from "../../store/slices/staffSlice";
import { motion } from "framer-motion";
import { Spin, Input, Modal } from "antd";
import toast from "react-hot-toast";
import moment from "moment";
import SalarySlip from "../components/SalarySlip";
import { isReadOnlyRole } from "../../utils/permissions";
import {
  FaMoneyBill,
  FaPrint,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const StaffDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { staffDetails, status, salaryPaymentStatus } = useSelector(
    (state) => state.staff
  );
  const { user } = useSelector((state) => state.auth);
  const isReadOnly = isReadOnlyRole(user?.role);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [amount, setAmount] = useState("");
  const [printMonth, setPrintMonth] = useState("");

  useEffect(() => {
    dispatch(fetchStaffById(id)).then(() => setLoading(false));
  }, [dispatch, id]);

  const currentYear = moment().year();
  const months = moment.months();

  const isSalaryPaid = (monthName) => {
    const monthIndex = months.indexOf(monthName);
    return staffDetails?.salaryHistory?.some(
      (payment) =>
        payment.month === monthIndex + 1 &&
        payment.year === currentYear &&
        payment.isPaid
    );
  };

  const getSalaryPayment = (monthName) => {
    const monthIndex = months.indexOf(monthName);
    return staffDetails?.salaryHistory?.find(
      (payment) =>
        payment.month === monthIndex + 1 && payment.year === currentYear
    );
  };

  const totalSalaryPaid = staffDetails?.salaryHistory
    ?.filter((payment) => payment.isPaid)
    .reduce((total, payment) => total + payment.amount, 0);

  const handlePaySalary = async () => {
    if (!amount || isNaN(amount)) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      const monthIndex = months.indexOf(selectedMonth);
      const resultAction = await dispatch(
        paySalary({
          id,
          month: monthIndex + 1,
          year: currentYear,
          amount: parseFloat(amount),
        })
      );

      if (paySalary.fulfilled.match(resultAction)) {
        toast.success("Salary paid successfully!");
        setIsPaymentModalVisible(false);
        setAmount("");
        dispatch(fetchStaffById(id));
      }
    } catch (error) {
      toast.error(error.message || "Failed to pay salary");
    }
  };

  const handlePrint = (month) => {
    const payment = getSalaryPayment(month);
    if (!payment) {
      toast.error("No payment record found for this month");
      return;
    }

    setPrintMonth(month);
    setTimeout(() => {
      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Salary Slip - ${month} ${currentYear}</title>
            <style>
              @media print {
                @page {
                  size: A4;
                  margin: 1cm;
                }
                body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                }
                .header {
                  text-align: center;
                  margin-bottom: 20px;
                  border-bottom: 2px solid #000;
                  padding-bottom: 10px;
                }
                .details {
                  margin: 20px 0;
                }
                .footer {
                  margin-top: 30px;
                  border-top: 2px solid #000;
                  padding-top: 10px;
                  text-align: center;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 20px 0;
                }
                th, td {
                  border: 1px solid #ddd;
                  padding: 8px;
                  text-align: left;
                }
                th {
                  background-color: #f2f2f2;
                }
              }
            </style>
          </head>
          <body>
            ${document.getElementById("printable-salary-slip").innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }, 100);
  };

  if (loading || status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-4 sm:p-6 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen"
    >
      <div className="max-w-7xl 2xl:max-w-full mx-auto">
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card p-4 sm:p-6 mb-6 sm:mb-8"
      >
        <h1 className="text-center text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
          {staffDetails.name}
        </h1>
        <hr className="border-t-2 border-gray-200 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">Name</p>
            <p className="text-lg font-semibold">{staffDetails.name}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">Role</p>
            <p className="text-lg font-semibold">{staffDetails.role}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">Phone</p>
            <p className="text-lg font-semibold">{staffDetails.phone}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">Address</p>
            <p className="text-lg font-semibold">{staffDetails.address}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">Education</p>
            <p className="text-lg font-semibold">{staffDetails.education}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">Salary</p>
            <p className="text-lg font-semibold">{staffDetails.salary} PKR</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-600">Total Salary Paid</p>
            <p className="text-lg font-semibold">{totalSalaryPaid} PKR</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-card p-4 sm:p-6"
      >
        <h2 className="text-center text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
          Salary Payment Status ({currentYear})
        </h2>
        <hr className="border-t-2 border-gray-200 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {months.map((month, index) => {
            const paid = isSalaryPaid(month);
            const payment = getSalaryPayment(month);

            return (
              <motion.div
                key={month}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gray-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-center mb-4">
                  <p className="text-lg font-semibold">{month}</p>
                  {paid ? (
                    <FaCheckCircle className="text-green-500 text-xl" />
                  ) : (
                    <FaTimesCircle className="text-red-500 text-xl" />
                  )}
                </div>
                <div className="flex justify-center">
                  {!paid ? (
                    !isReadOnly && (
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition-all"
                        onClick={() => {
                          setSelectedMonth(month);
                          setAmount(staffDetails.salary);
                          setIsPaymentModalVisible(true);
                        }}
                      >
                        <FaMoneyBill />
                        <span>Pay Salary</span>
                      </button>
                    )
                  ) : (
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-600 transition-all"
                      onClick={() => handlePrint(month)}
                    >
                      <FaPrint />
                      <span>Print Slip</span>
                    </button>
                  )}
                </div>
                {paid && (
                  <div className="mt-2 text-center text-sm text-gray-600">
                    Paid: {payment.amount} PKR
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>
      </div>

      <Modal
        title={`Pay Salary for ${selectedMonth} ${currentYear}`}
        open={isPaymentModalVisible}
        onCancel={() => setIsPaymentModalVisible(false)}
        onOk={handlePaySalary}
        confirmLoading={salaryPaymentStatus === "loading"}
        okText="Confirm Payment"
        cancelText="Cancel"
        className="rounded-lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Amount (PKR)</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full"
            />
          </div>
          <p className="text-gray-600">
            Staff's default salary: {staffDetails.salary} PKR
          </p>
        </div>
      </Modal>

      <div id="printable-salary-slip" style={{ display: "none" }}>
        {printMonth && (
          <SalarySlip
            staffDetails={staffDetails}
            month={printMonth}
            year={currentYear}
            payment={getSalaryPayment(printMonth)}
          />
        )}
      </div>
    </motion.div>
  );
};

export default StaffDetails;

