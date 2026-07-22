import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Modal, Form, InputNumber, Input, Select, Button } from "antd";
import toast from "react-hot-toast";
import { DollarOutlined } from "@ant-design/icons";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";

const PartialPaymentModal = memo(({
  visible,
  onCancel,
  voucher,
  student,
  refreshData,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // Memoize remaining amount calculation
  const remainingAmount = useMemo(() => {
    if (!voucher) return 0;
    return voucher.amount - (voucher.paidAmount || 0);
  }, [voucher]);

  useEffect(() => {
    if (voucher) {
      form.setFieldsValue({
        amount: remainingAmount,
      });
    }
  }, [voucher, remainingAmount, form]);

  const handleSubmit = useCallback(async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const paymentAmount = Number(values.amount);

      if (paymentAmount <= 0) {
        throw new Error("Amount must be greater than 0");
      }

      const requestData = {
        amount: paymentAmount,
        receivedBy: values.receivedBy,
        paymentMethod: values.paymentMethod,
        referenceNumber: values.referenceNumber || null,
        remarks: values.remarks || null,
        date: new Date().toISOString(),
      };

      const response = await axios.post(
        API_ENDPOINTS.PARTIAL_PAYMENT(student.studentId, voucher.voucherNumber),
        requestData
      );

      if (response.data?.success) {
        toast.success(`Payment of ${paymentAmount} recorded successfully`);
        form.resetFields();
        refreshData();
        onCancel();
      } else {
        throw new Error(response.data?.message || "Payment failed");
      }
    } catch (error) {
      toast.error(error.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  }, [form, voucher, student, remainingAmount, refreshData, onCancel]);

  if (!voucher) return null;

  return (
    <Modal
      title={`Partial Payment - Voucher #${voucher.voucherNumber}`}
      visible={visible}
      onCancel={onCancel}
      footer={[
        <Button key="back" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          icon={<DollarOutlined />}
        >
          Record Payment
        </Button>,
      ]}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <p>
          <strong>Student:</strong> {student?.name || "N/A"}
        </p>
        <p>
          <strong>Class:</strong> {student?.classId?.grade} -{" "}
          {student?.classId?.section}
        </p>
        <p>
          <strong>Total Amount:</strong> {voucher.amount || "0"}
        </p>
        <p>
          <strong>Paid Amount:</strong> {voucher.paidAmount || 0}
        </p>
        <p>
          <strong>Remaining Amount:</strong> {remainingAmount}
        </p>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          label="Amount to Pay"
          name="amount"
          rules={[
            { required: true, message: "Please enter amount" },
            {
              validator: (_, value) => {
                const num = Number(value);
                if (isNaN(num)) {
                  return Promise.reject("Please enter a valid number");
                }
                if (num <= 0) {
                  return Promise.reject("Amount must be greater than 0");
                }
                if (num > remainingAmount) {
                  return Promise.reject(`Cannot exceed ${remainingAmount}`);
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={1}
            max={remainingAmount}
            precision={0}
          />
        </Form.Item>

        <Form.Item
          label="Received By"
          name="receivedBy"
          initialValue="Cashier"
          rules={[{ required: true, message: "Required" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Payment Method"
          name="paymentMethod"
          initialValue="Cash"
          rules={[{ required: true, message: "Required" }]}
        >
          <Select>
            <Select.Option value="Cash">Cash</Select.Option>
            <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
            <Select.Option value="Cheque">Cheque</Select.Option>
            <Select.Option value="Online Payment">Online Payment</Select.Option>
            <Select.Option value="Other">Other</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Reference Number" name="referenceNumber">
          <Input placeholder="Optional" />
        </Form.Item>

        <Form.Item label="Remarks" name="remarks">
          <Input.TextArea rows={3} placeholder="Optional notes" />
        </Form.Item>
      </Form>
    </Modal>
  );
});

PartialPaymentModal.displayName = 'PartialPaymentModal';


export default PartialPaymentModal;

