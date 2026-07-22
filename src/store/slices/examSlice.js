import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";

export const fetchExams = createAsyncThunk(
  "exams/fetchAll",
  async (params = {}) => {
    const response = await axios.get(API_ENDPOINTS.EXAMS, { params });
    return response.data;
  }
);

export const fetchExamById = createAsyncThunk("exams/fetchById", async (id) => {
  const response = await axios.get(API_ENDPOINTS.EXAM_BY_ID(id));
  return response.data;
});

export const addExam = createAsyncThunk(
  "exams/add",
  async (examData, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_ENDPOINTS.ADD_EXAM, examData);
      return response.data.exam;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const updateExam = createAsyncThunk(
  "exams/update",
  async ({ id, examData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(API_ENDPOINTS.UPDATE_EXAM(id), examData);
      return response.data.exam;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const publishExam = createAsyncThunk(
  "exams/publish",
  async ({ id, publish }, { rejectWithValue }) => {
    try {
      const response = await axios.put(API_ENDPOINTS.PUBLISH_EXAM(id), { publish });
      return response.data.exam;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const deleteExam = createAsyncThunk("exams/delete", async (id) => {
  await axios.delete(API_ENDPOINTS.DELETE_EXAM(id));
  return id;
});

const examSlice = createSlice({
  name: "exams",
  initialState: {
    exams: [],
    selectedExam: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedExam: (state) => {
      state.selectedExam = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExams.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.loading = false;
        state.exams = action.payload;
      })
      .addCase(fetchExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(fetchExamById.fulfilled, (state, action) => {
        state.selectedExam = action.payload;
      })

      .addCase(addExam.fulfilled, (state, action) => {
        state.exams.unshift(action.payload);
      })

      .addCase(updateExam.fulfilled, (state, action) => {
        const idx = state.exams.findIndex((e) => e._id === action.payload._id);
        if (idx !== -1) state.exams[idx] = action.payload;
      })

      .addCase(publishExam.fulfilled, (state, action) => {
        const idx = state.exams.findIndex((e) => e._id === action.payload._id);
        if (idx !== -1) state.exams[idx].status = action.payload.status;
      })

      .addCase(deleteExam.fulfilled, (state, action) => {
        state.exams = state.exams.filter((e) => e._id !== action.payload);
      });
  },
});

export const { clearSelectedExam } = examSlice.actions;
export default examSlice.reducer;
