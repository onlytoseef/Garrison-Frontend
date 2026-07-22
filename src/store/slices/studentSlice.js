import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";

export const fetchStudents = createAsyncThunk(
  "students/fetchAll",
  async ({ page = 1, limit = 2000, search = "", classId = "" } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);
    if (search) params.append('search', search);
    if (classId) params.append('classId', classId);
    
    const response = await axios.get(`${API_ENDPOINTS.STUDENTS}?${params.toString()}`);
    return response.data; // Now returns { students, pagination }
  }
);

export const fetchTotalStudents = createAsyncThunk(
  "students/fetchTotal",
  async () => {
    const response = await axios.get(API_ENDPOINTS.TOTAL_STUDENTS);
    return response.data.total;
  }
);

export const addStudent = createAsyncThunk(
  "students/add",
  async (studentData, { rejectWithValue }) => {
    try {
      // No explicit Content-Type: when studentData is a FormData, axios sets the
      // correct multipart boundary automatically (needed for the photo upload).
      const response = await axios.post(API_ENDPOINTS.ADD_STUDENT, studentData);
      return response.data.student;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateStudent = createAsyncThunk(
  "students/update",
  async ({ id, studentData }) => {
    const response = await axios.put(API_ENDPOINTS.UPDATE_STUDENT(id), studentData);
    return response.data.student;
  }
);

export const deleteStudent = createAsyncThunk(
  "students/deleteStudent",
  async (studentId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(API_ENDPOINTS.DELETE_STUDENT(studentId));
      return studentId;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const studentsSlice = createSlice({
  name: "students",
  initialState: {
    students: [],
    totalStudents: 0,
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      pages: 0,
      hasMore: false
    },
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.students = action.payload.students || action.payload; // Handle both formats
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })
      .addCase(fetchTotalStudents.fulfilled, (state, action) => {
        state.totalStudents = action.payload;
      })
      .addCase(addStudent.fulfilled, (state, action) => {
        state.students.push(action.payload);
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        state.students = state.students.map((student) =>
          student.studentId === action.payload.studentId
            ? action.payload
            : student
        );
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.students = state.students.filter(
          (student) => student.studentId !== action.payload
        );
      })
      .addCase(deleteStudent.rejected, (state, action) => {
        console.error("Failed to delete student:", action.payload);
      });
  },
});

export default studentsSlice.reducer;
