import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";

// Fetch all staff
export const fetchStaff = createAsyncThunk(
  "staff/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_ENDPOINTS.STAFF);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add Staff
export const addStaff = createAsyncThunk(
  "staff/add",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_ENDPOINTS.ADD_STAFF, formData);
      return response.data.staff;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update Staff
export const updateStaff = createAsyncThunk(
  "staff/update",
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(API_ENDPOINTS.UPDATE_STAFF(id), formData);
      return response.data.staff;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch Staff by ID
export const fetchStaffById = createAsyncThunk(
  "staff/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_ENDPOINTS.STAFF_BY_ID(id));
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete Staff
export const deleteStaff = createAsyncThunk(
  "staff/delete",
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(API_ENDPOINTS.DELETE_STAFF(id));
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Pay Salary
export const paySalary = createAsyncThunk(
  "staff/paySalary",
  async ({ id, month, year, amount }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_ENDPOINTS.STAFF}/${id}/pay-salary`, {
        month: parseInt(month),
        year: parseInt(year),
        amount: parseFloat(amount),
      });
      return {
        staffId: id,
        updatedStaff: response.data.staff || response.data,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch Total Staff Count
export const fetchTotalStaffCount = createAsyncThunk(
  "staff/fetchTotalCount",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_ENDPOINTS.TOTAL_STAFF);
      return response.data.count;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const staffSlice = createSlice({
  name: "staff",
  initialState: {
    staff: [],
    staffDetails: null,
    totalStaff: 0,
    status: "idle",
    error: null,
    salaryPaymentStatus: "idle",
  },
  reducers: {
    resetStaffState: (state) => {
      state.status = "idle";
      state.error = null;
      state.salaryPaymentStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all staff
      .addCase(fetchStaff.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStaff.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.staff = action.payload;
      })
      .addCase(fetchStaff.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch staff";
      })

      // Add staff
      .addCase(addStaff.pending, (state) => {
        state.status = "loading";
      })
      .addCase(addStaff.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.staff.push(action.payload);
      })
      .addCase(addStaff.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to add staff";
      })

      // Update staff
      .addCase(updateStaff.pending, (state) => {
        state.status = "loading";
      })
      .addCase(updateStaff.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.staff = state.staff.map((staff) =>
          staff._id === action.payload._id ? action.payload : staff
        );
      })
      .addCase(updateStaff.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to update staff";
      })

      // Delete staff
      .addCase(deleteStaff.pending, (state) => {
        state.status = "loading";
      })
      .addCase(deleteStaff.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.staff = state.staff.filter(
          (staff) => staff._id !== action.payload
        );
        state.totalStaff -= 1;
      })
      .addCase(deleteStaff.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to delete staff";
      })

      // Pay salary
      .addCase(paySalary.pending, (state) => {
        state.salaryPaymentStatus = "loading";
      })
      .addCase(paySalary.fulfilled, (state, action) => {
        state.salaryPaymentStatus = "succeeded";
        state.staff = state.staff.map((staff) =>
          staff._id === action.payload.staffId
            ? {
                ...staff,
                salaryHistory: action.payload.updatedStaff.salaryHistory,
              }
            : staff
        );
      })
      .addCase(paySalary.rejected, (state, action) => {
        state.salaryPaymentStatus = "failed";
        state.error = action.payload || "Failed to process salary payment";
      })

      // Fetch staff by ID
      .addCase(fetchStaffById.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchStaffById.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.staffDetails = action.payload;
      })
      .addCase(fetchStaffById.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch staff details";
      })

      // Fetch total staff count
      .addCase(fetchTotalStaffCount.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchTotalStaffCount.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.totalStaff = action.payload;
      })
      .addCase(fetchTotalStaffCount.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch staff count";
      });
  },
});

export const { resetStaffState } = staffSlice.actions;
export default staffSlice.reducer;
