import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

// Fetch all classes
export const useClasses = () => {
  return useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await axios.get(API_ENDPOINTS.CLASSES);
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (classes don't change often)
  });
};

// Fetch single class with students
export const useClass = (classId) => {
  return useQuery({
    queryKey: ["class", classId],
    queryFn: async () => {
      const { data } = await axios.get(API_ENDPOINTS.CLASS(classId));
      return data;
    },
    enabled: !!classId,
    staleTime: 5 * 60 * 1000,
  });
};

// Add class mutation
export const useAddClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classData) => {
      const { data } = await axios.post(API_ENDPOINTS.ADD_CLASS, classData);
      return data.newClass;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};

// Delete class mutation
export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (classId) => {
      await axios.delete(API_ENDPOINTS.DELETE_CLASS(classId));
      return classId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};
