import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";

/**
 * Fee state. Read-mostly: the only writes are the two Excel imports, which
 * happen in a modal and end with a refetch rather than a patch — an import can
 * touch any row on any page, so patching in place would be a guess.
 *
 * Shaped like studentSlice (status string + pagination object) because the fee
 * list is paginated the same way and the Fees page reuses that page's markup.
 */
export const fetchFees = createAsyncThunk(
  "fees/fetchAll",
  async ({ page = 1, limit = 50, search = "", classId = "" } = {}) => {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("limit", limit);
    if (search) params.append("search", search);
    if (classId) params.append("classId", classId);

    const response = await axios.get(`${API_ENDPOINTS.FEES}?${params}`);
    return response.data; // { students, pagination, summary }
  }
);

export const fetchStudentFees = createAsyncThunk(
  "fees/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_ENDPOINTS.FEES_STUDENT(id));
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Could not load fee history" }
      );
    }
  }
);

export const clearDues = createAsyncThunk(
  "fees/clearDues",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.delete(API_ENDPOINTS.FEES_CLEAR_DUES);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || { message: "Could not clear dues" }
      );
    }
  }
);

const feeSlice = createSlice({
  name: "fees",
  initialState: {
    students: [],
    pagination: { page: 1, limit: 50, total: 0, pages: 0 },
    // Keys match what GET /api/fees returns, so a slow first load renders
    // zeroes rather than "undefined".
    summary: {
      totalPaid: 0,
      totalOutstanding: 0,
      studentsWithDues: 0,
      duesAsOf: null,
    },
    selected: null,
    status: "idle",
    detailStatus: "idle",
    error: null,
  },
  reducers: {
    clearSelectedFees: (state) => {
      state.selected = null;
      state.detailStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFees.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchFees.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.students = action.payload.students;
        state.pagination = action.payload.pagination;
        state.summary = action.payload.summary;
      })
      .addCase(fetchFees.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message;
      })

      .addCase(fetchStudentFees.pending, (state) => {
        state.detailStatus = "loading";
        state.selected = null;
      })
      .addCase(fetchStudentFees.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.selected = action.payload;
      })
      .addCase(fetchStudentFees.rejected, (state) => {
        state.detailStatus = "failed";
      });
  },
});

export const { clearSelectedFees } = feeSlice.actions;
export default feeSlice.reducer;
