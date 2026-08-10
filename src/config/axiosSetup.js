import axios from "axios";
import { resetState } from "../store/resetState";

/**
 * Global axios setup. Imported once from main.jsx, before anything renders.
 *
 * Attaches to every request:
 *   Authorization: Bearer <token>   - all API routes require auth now
 *   X-Campus-Id: <uuid>             - only meaningful for a super admin who has
 *                                     opened a campus; the backend ignores it
 *                                     for everyone else and uses their own
 *                                     campus from the token
 *
 * Both are read from localStorage on each request rather than captured once, so
 * a login, logout, or campus switch takes effect immediately without a reload.
 */

export const ACTIVE_CAMPUS_KEY = "activeCampusId";

const readToken = () => {
  try {
    return JSON.parse(localStorage.getItem("authState"))?.token ?? null;
  } catch {
    return null;
  }
};

export const getActiveCampusId = () =>
  localStorage.getItem(ACTIVE_CAMPUS_KEY) || null;

/**
 * Lets main.jsx hand the store in after both modules have loaded.
 *
 * The store cannot be imported at the top of this file: main.jsx loads
 * axiosSetup before the store exists, and a static import would close the cycle
 * axiosSetup -> store -> slices -> config/api -> axiosSetup. Registering it
 * afterwards keeps the dispatch below synchronous, which matters — a dynamic
 * import() would resolve a tick later, after the navigation had already
 * rendered the next page from the stale data this is meant to clear.
 */
let storeRef = null;

export const registerStore = (store) => {
  storeRef = store;
};

/**
 * Switch (or clear) the campus a super admin is working inside.
 *
 * Changing the campus invalidates everything the store is holding: students,
 * classes, staff and fees all belong to the campus that was open. Without the
 * reset the previous campus's rows survive the switch and get rendered by the
 * next page before its own fetch resolves — Lahore's students briefly listed
 * under Karachi. The reset lives here rather than at the call sites because
 * there are several of them, and one that forgot would be the bug.
 */
export const setActiveCampusId = (campusId) => {
  const previous = getActiveCampusId();

  if (campusId) {
    localStorage.setItem(ACTIVE_CAMPUS_KEY, campusId);
  } else {
    localStorage.removeItem(ACTIVE_CAMPUS_KEY);
  }

  // Only when the campus actually changed. Re-selecting the same one — which
  // happens on a plain reload — would otherwise throw away good data and make
  // every page refetch for nothing.
  if (previous === (campusId || null)) return;

  storeRef?.dispatch(resetState());
};

export const setupAxios = () => {
  axios.interceptors.request.use((config) => {
    const token = readToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const campusId = getActiveCampusId();
    if (campusId) {
      config.headers["X-Campus-Id"] = campusId;
    }

    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;

      // An expired or invalid token means the stored session is useless. Clear
      // it and bounce to login, otherwise the app sits in a broken half-logged-in
      // state where every request fails.
      if (status === 401) {
        localStorage.removeItem("authState");
        localStorage.removeItem(ACTIVE_CAMPUS_KEY);
        if (!window.location.pathname.startsWith("/auth")) {
          window.location.href = "/auth/login";
        }
      }

      // A super admin whose selected campus went away (deleted, or storage
      // cleared) gets sent back to the campus picker instead of a dead screen.
      if (status === 400 && error.response?.data?.code === "CAMPUS_REQUIRED") {
        setActiveCampusId(null);
        if (window.location.pathname !== "/campuses") {
          window.location.href = "/campuses";
        }
      }

      return Promise.reject(error);
    }
  );
};

export default setupAxios;
