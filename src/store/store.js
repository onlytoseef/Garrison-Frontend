import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import classReducer from "./slices/classSlice";
import studentReducer from "./slices/studentSlice";
import staffReducer from "./slices/staffSlice";
import authReducer from "./slices/authSlice";
import examReducer from "./slices/examSlice";
import resultReducer from "./slices/resultSlice";
import feeReducer from "./slices/feeSlice";

const store = configureStore({
  reducer: {
    users: userReducer,
    classes: classReducer,
    students: studentReducer,
    staff: staffReducer,
    auth: authReducer,
    exams: examReducer,
    results: resultReducer,
    fees: feeReducer,
  },
});

export default store;
