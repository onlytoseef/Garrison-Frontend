import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { API_ENDPOINTS } from "../../config/api";

export const bulkEnterMarks = createAsyncThunk(
  "results/bulkEnter",
  async ({ examId, entries }, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_ENDPOINTS.BULK_ENTER_MARKS(examId), {
        entries,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

// The teacher path: save marks for ONE subject's column. The backend merges it
// into the result without touching any other subject's marks. One call per
// subject the teacher owns.
export const enterSubjectMarks = createAsyncThunk(
  "results/enterSubject",
  async ({ examId, subjectName, entries }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        API_ENDPOINTS.RESULT_SUBJECT_MARKS(examId),
        { subjectName, entries }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const fetchClassResults = createAsyncThunk(
  "results/fetchClass",
  async (examId) => {
    const response = await axios.get(API_ENDPOINTS.CLASS_RESULTS(examId));
    return response.data;
  }
);

export const fetchStudentResult = createAsyncThunk(
  "results/fetchStudent",
  async ({ examId, studentId }) => {
    const response = await axios.get(
      API_ENDPOINTS.STUDENT_RESULT(examId, studentId)
    );
    return response.data;
  }
);

const resultSlice = createSlice({
  name: "results",
  initialState: {
    classResults: [],
    classSummary: null,
    currentExam: null,
    studentResult: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearResults: (state) => {
      state.classResults = [];
      state.classSummary = null;
      state.currentExam = null;
      state.studentResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bulkEnterMarks.pending, (state) => {
        state.saving = true;
      })
      .addCase(bulkEnterMarks.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(bulkEnterMarks.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message;
      })

      .addCase(enterSubjectMarks.pending, (state) => {
        state.saving = true;
      })
      .addCase(enterSubjectMarks.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(enterSubjectMarks.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message;
      })

      .addCase(fetchClassResults.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchClassResults.fulfilled, (state, action) => {
        state.loading = false;
        state.classResults = action.payload.results;
        state.classSummary = action.payload.summary;
        state.currentExam = action.payload.exam;
      })
      .addCase(fetchClassResults.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(fetchStudentResult.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStudentResult.fulfilled, (state, action) => {
        state.loading = false;
        state.studentResult = action.payload;
      })
      .addCase(fetchStudentResult.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearResults } = resultSlice.actions;
export default resultSlice.reducer;
