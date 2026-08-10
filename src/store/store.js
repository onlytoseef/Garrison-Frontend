import { configureStore, combineReducers } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import classReducer from "./slices/classSlice";
import studentReducer from "./slices/studentSlice";
import staffReducer from "./slices/staffSlice";
import authReducer from "./slices/authSlice";
import examReducer from "./slices/examSlice";
import resultReducer from "./slices/resultSlice";
import feeReducer from "./slices/feeSlice";
import { RESET_STATE } from "./resetState";

const appReducer = combineReducers({
  users: userReducer,
  classes: classReducer,
  students: studentReducer,
  staff: staffReducer,
  auth: authReducer,
  exams: examReducer,
  results: resultReducer,
  fees: feeReducer,
});

/**
 * Wraps the combined reducers so one action can empty the whole store.
 *
 * This exists because of campus switching. Every slice below holds data that
 * belongs to ONE campus — students, classes, staff, fees. A super admin moving
 * from Lahore to Karachi keeps the same mounted app and the same store, so
 * without this the previous campus's rows stay in memory and are rendered by
 * the next page that reads them before its own fetch resolves. In a
 * multi-tenant system that is not a stale-UI annoyance, it is one campus's
 * student data appearing under another campus's name.
 *
 * `auth` is deliberately preserved: switching campus is not signing out, and
 * dropping the token would bounce the user to the login screen.
 *
 * Passing `undefined` as the state makes every slice fall back to its own
 * initialState — no slice has to know this action exists.
 */
const rootReducer = (state, action) => {
  if (action.type === RESET_STATE) {
    return appReducer({ auth: state?.auth }, action);
  }
  return appReducer(state, action);
};

const store = configureStore({
  reducer: rootReducer,
});

export default store;
