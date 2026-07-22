import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

// Fetch student fee summary
export const useStudentFeeSummary = (studentId) => {
  return useQuery({
    queryKey: ["studentFee", studentId],
    queryFn: async () => {
      const { data } = await axios.get(API_ENDPOINTS.STUDENT_FEE_SUMMARY(studentId));
      return data;
    },
    enabled: !!studentId,
    staleTime: 2 * 60 * 1000, // 2 minutes (fees change frequently)
  });
};

// Generate fee voucher
export const useGenerateFeeVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (voucherData) => {
      const { data } = await axios.post(API_ENDPOINTS.GENERATE_FEE_VOUCHER, voucherData);
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate student fee summary
      queryClient.invalidateQueries({ queryKey: ["studentFee", variables.studentId] });
    },
  });
};

// Mark fee as paid
export const useMarkFeePaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ voucherNumber, studentId }) => {
      const { data } = await axios.patch(API_ENDPOINTS.MARK_FEE_PAID, {
        voucherNumber,
        studentId,
      });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["studentFee", variables.studentId] });
    },
  });
};

// Delete fee voucher
export const useDeleteFeeVoucher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ voucherNumber, studentId }) => {
      await axios.delete(API_ENDPOINTS.DELETE_FEE_VOUCHER, {
        data: { voucherNumber, studentId },
      });
      return { voucherNumber, studentId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ queryKey: ["studentFee", variables.studentId] });
    },
  });
};

// Record partial payment
export const usePartialPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (paymentData) => {
      const { data } = await axios.post(API_ENDPOINTS.PARTIAL_PAYMENT, paymentData);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["studentFee", variables.studentId] });
    },
  });
};
