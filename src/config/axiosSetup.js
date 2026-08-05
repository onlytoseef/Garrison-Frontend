import axios from "axios";

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

export const setActiveCampusId = (campusId) => {
  if (campusId) {
    localStorage.setItem(ACTIVE_CAMPUS_KEY, campusId);
  } else {
    localStorage.removeItem(ACTIVE_CAMPUS_KEY);
  }
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
