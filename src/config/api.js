// API Base URL Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  UPDATE_PASSWORD: `${API_BASE_URL}/api/auth/update-password`,
  
  // Students
  STUDENTS: `${API_BASE_URL}/api/students`,
  ADD_STUDENT: `${API_BASE_URL}/api/add-student`,
  STUDENT_BY_ID: (id) => `${API_BASE_URL}/api/student/${id}`,
  DELETE_STUDENT: (id) => `${API_BASE_URL}/api/student/${id}`,
  UPDATE_STUDENT: (id) => `${API_BASE_URL}/api/student/${id}`,
  UPDATE_STUDENT_STATUS: (id) =>
    `${API_BASE_URL}/api/student/${id}/status`,
  RESET_PARENT_PASSWORD: (id) =>
    `${API_BASE_URL}/api/student/${id}/reset-parent-password`,

  // Bulk import: preview validates and reports, commit actually writes.
  IMPORT_PREVIEW: `${API_BASE_URL}/api/students/import/preview`,
  IMPORT_COMMIT: `${API_BASE_URL}/api/students/import/commit`,

  // Teachers — logins and class assignments
  TEACHERS: `${API_BASE_URL}/api/teachers`,
  TEACHER_CREATE_LOGIN: (staffId) =>
    `${API_BASE_URL}/api/teacher/${staffId}/create-login`,
  TEACHER_RESET_PASSWORD: (staffId) =>
    `${API_BASE_URL}/api/teacher/${staffId}/reset-password`,
  TEACHER_CLASSES: (staffId) =>
    `${API_BASE_URL}/api/teacher/${staffId}/classes`,
  TEACHER_REVOKE_LOGIN: (staffId) =>
    `${API_BASE_URL}/api/teacher/${staffId}/login`,
  TEACHER_MY_CLASSES: `${API_BASE_URL}/api/teacher/my-classes`,

  // Activity logs
  LOGS: `${API_BASE_URL}/api/logs`,
  LOGS_SUMMARY: `${API_BASE_URL}/api/logs/summary`,

  // Campuses (super admin)
  CAMPUSES: `${API_BASE_URL}/api/campuses`,
  CAMPUS_OVERVIEW: `${API_BASE_URL}/api/campus-overview`,
  TOTAL_STUDENTS: `${API_BASE_URL}/api/total-students`,
  
  // Classes
  CLASSES: `${API_BASE_URL}/api/classes`,
  ADD_CLASS: `${API_BASE_URL}/api/add-class`,
  CLASS: (id) => `${API_BASE_URL}/api/class/${id}`,
  DELETE_CLASS: (id) => `${API_BASE_URL}/api/delete-class/${id}`,
  UPDATE_CLASS: (id) => `${API_BASE_URL}/api/class/${id}`,
  TOTAL_CLASSES: `${API_BASE_URL}/api/classes/total`,
  PROMOTE_STUDENTS: `${API_BASE_URL}/api/promote-students`,
  
  // Staff
  STAFF: `${API_BASE_URL}/api/staff`,
  ADD_STAFF: `${API_BASE_URL}/api/staff`,
  STAFF_BY_ID: (id) => `${API_BASE_URL}/api/staff/${id}`,
  DELETE_STAFF: (id) => `${API_BASE_URL}/api/staff/${id}`,
  UPDATE_STAFF: (id) => `${API_BASE_URL}/api/staff/${id}`,
  TOTAL_STAFF: `${API_BASE_URL}/api/staff/total`,
  
  // Users
  USERS: `${API_BASE_URL}/api/users`,
  ADD_USER: `${API_BASE_URL}/api/users/add`,
  DELETE_USER: (id) => `${API_BASE_URL}/api/users/${id}`,
  UPDATE_USER: (id) => `${API_BASE_URL}/api/users/${id}`,
  
  // Attendance
  ATTENDANCE: `${API_BASE_URL}/api/attendance`,
  MARK_ATTENDANCE: `${API_BASE_URL}/api/attendance/mark`,
  ATTENDANCE_STATS: `${API_BASE_URL}/api/attendance/stats`,
  MARK_CLASS_ATTENDANCE: `${API_BASE_URL}/api/attendance/mark-class`,
  CLASS_ATTENDANCE: `${API_BASE_URL}/api/attendance/class-attendance`,
  
  // Dashboard
  DASHBOARD_SUMMARY: `${API_BASE_URL}/api/dashboard-summary`,
  
  WHATSAPP_CLASS_MESSAGE: `${API_BASE_URL}/api/whatsapp/class-message`,

  // Diary
  CLASS_SUBJECTS: (id) => `${API_BASE_URL}/api/class/${id}/subjects`,
  DIARY: `${API_BASE_URL}/api/diary`,
  DIARY_BULK: `${API_BASE_URL}/api/diary/bulk`,
  DIARY_BY_ID: (id) => `${API_BASE_URL}/api/diary/${id}`,

  // Resources
  RESOURCES: `${API_BASE_URL}/api/resources`,
  RESOURCE_BY_ID: (id) => `${API_BASE_URL}/api/resources/${id}`,

  // Exams
  EXAMS: `${API_BASE_URL}/api/exams`,
  ADD_EXAM: `${API_BASE_URL}/api/exam`,
  EXAM_BY_ID: (id) => `${API_BASE_URL}/api/exam/${id}`,
  UPDATE_EXAM: (id) => `${API_BASE_URL}/api/exam/${id}`,
  PUBLISH_EXAM: (id) => `${API_BASE_URL}/api/exam/${id}/publish`,
  DELETE_EXAM: (id) => `${API_BASE_URL}/api/exam/${id}`,

  // Results
  BULK_ENTER_MARKS: (examId) => `${API_BASE_URL}/api/result/bulk/${examId}`,
  CLASS_RESULTS: (examId) => `${API_BASE_URL}/api/result/class/${examId}`,
  STUDENT_RESULT: (examId, studentId) => `${API_BASE_URL}/api/result/student/${examId}/${studentId}`,
  STUDENT_RESULT_HISTORY: (studentId) => `${API_BASE_URL}/api/result/student-history/${studentId}`,

  // Parent
  PARENT_DASHBOARD: `${API_BASE_URL}/api/parent/dashboard`,
  PARENT_RESULTS: `${API_BASE_URL}/api/parent/results`,
  PARENT_ATTENDANCE: `${API_BASE_URL}/api/parent/attendance`,
  PARENT_DIARY: `${API_BASE_URL}/api/parent/diary`,
  PARENT_RESOURCES: `${API_BASE_URL}/api/parent/resources`,
  PARENT_NOTIFICATIONS: `${API_BASE_URL}/api/parent/notifications`,
  PARENT_NOTIFICATIONS_READ: `${API_BASE_URL}/api/parent/notifications/read-all`,
};

export default API_BASE_URL;
