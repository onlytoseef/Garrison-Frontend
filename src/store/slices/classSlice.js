import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";

export const fetchClasses = createAsyncThunk("classes/fetchAll", async () => {
  const response = await axios.get(API_ENDPOINTS.CLASSES);
  return response.data;
});

export const fetchClassById = createAsyncThunk(
  "classes/fetchById",
  async (id) => {
    const response = await axios.get(API_ENDPOINTS.CLASS(id));
    return response.data;
  }
);

export const addClass = createAsyncThunk("classes/add", async (classData) => {
  const response = await axios.post(API_ENDPOINTS.ADD_CLASS, classData);
  return response.data.newClass;
});

export const deleteClass = createAsyncThunk("classes/delete", async (id) => {
  await axios.delete(API_ENDPOINTS.DELETE_CLASS(id));
  return id;
});

const classSlice = createSlice({
  name: "classes",
  initialState: {
    classes: [],
    selectedClass: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedClass: (state) => {
      state.selectedClass = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClasses.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.loading = false;
        state.classes = action.payload;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch Single Class
      .addCase(fetchClassById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClassById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedClass = action.payload;
      })
      .addCase(fetchClassById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(addClass.fulfilled, (state, action) => {
        state.classes.push(action.payload);
      })

      .addCase(deleteClass.fulfilled, (state, action) => {
        state.classes = state.classes.filter(
          (cls) => cls._id !== action.payload
        );
      });
  },
});

export const { clearSelectedClass } = classSlice.actions;
export default classSlice.reducer;
