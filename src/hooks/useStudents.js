import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

// Fetch students with pagination
export const useStudents = ({ page = 1, limit = 50, search = "", classId = "" } = {}) => {
  return useQuery({
    queryKey: ["students", page, limit, search, classId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", limit);
      if (search) params.append("search", search);
      if (classId) params.append("classId", classId);

      const { data } = await axios.get(`${API_ENDPOINTS.STUDENTS}?${params.toString()}`);
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Fetch single student
export const useStudent = (studentId) => {
  return useQuery({
    queryKey: ["student", studentId],
    queryFn: async () => {
      const { data } = await axios.get(API_ENDPOINTS.STUDENT(studentId));
      return data;
    },
    enabled: !!studentId, // Only run if studentId exists
    staleTime: 5 * 60 * 1000,
  });
};

// Fetch total students
export const useTotalStudents = () => {
  return useQuery({
    queryKey: ["totalStudents"],
    queryFn: async () => {
      const { data } = await axios.get(API_ENDPOINTS.TOTAL_STUDENTS);
      return data.total;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Add student mutation
export const useAddStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentData) => {
      const { data } = await axios.post(API_ENDPOINTS.ADD_STUDENT, studentData, {
        headers: { "Content-Type": "application/json" },
      });
      return data.student;
    },
    onSuccess: () => {
      // Invalidate and refetch students queries
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["totalStudents"] });
    },
  });
};

// Update student mutation
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, studentData }) => {
      const { data } = await axios.put(API_ENDPOINTS.UPDATE_STUDENT(id), studentData, {
        headers: { "Content-Type": "application/json" },
      });
      return data.student;
    },
    onSuccess: (_, variables) => {
      // Invalidate specific student and students list
      queryClient.invalidateQueries({ queryKey: ["student", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

// Delete student mutation
export const useDeleteStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId) => {
      await axios.delete(API_ENDPOINTS.DELETE_STUDENT(studentId));
      return studentId;
    },
    onSuccess: () => {
      // Invalidate students queries
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["totalStudents"] });
    },
  });
};
