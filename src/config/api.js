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

  // Roster export. Returns a file, not JSON — request it with
  // responseType: "blob". Takes ?format=xlsx|csv and an optional ?classId.
  STUDENTS_EXPORT: `${API_BASE_URL}/api/students/export`,

  // Fees — payments and outstanding balances, mirrored from the office's Excel.
  // Nothing here creates a payment; :kind is "payments" or "dues".
  FEES: `${API_BASE_URL}/api/fees`,
  FEES_STUDENT: (id) => `${API_BASE_URL}/api/fees/student/${id}`,
  FEES_CLEAR_DUES: `${API_BASE_URL}/api/fees/dues`,
  FEES_IMPORT_PREVIEW: (kind) =>
    `${API_BASE_URL}/api/fees/import/${kind}/preview`,
  FEES_IMPORT_COMMIT: (kind) =>
    `${API_BASE_URL}/api/fees/import/${kind}/commit`,

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
  // Teacher dashboard "Needs Attention" feed — per class, what is outstanding
  // today (attendance / diary / exam marks), scoped to their assignments.
  TEACHER_ATTENTION: `${API_BASE_URL}/api/teacher/attention`,

  // Activity logs
  LOGS: `${API_BASE_URL}/api/logs`,
  LOGS_SUMMARY: `${API_BASE_URL}/api/logs/summary`,

  // Database backup and restore — super admin only. BACKUP returns a file, so
  // request it with responseType: "blob".
  BACKUP: `${API_BASE_URL}/api/backup`,
  BACKUP_SUMMARY: `${API_BASE_URL}/api/backup/summary`,
  BACKUP_RESTORE: `${API_BASE_URL}/api/backup/restore`,

  // Grade-wise master subjects — super admin only. Define per grade, then assign
  // to class sections across all campuses.
  SUBJECT_GRADES: `${API_BASE_URL}/api/subjects/grades`,
  SUBJECT_ASSIGN: `${API_BASE_URL}/api/subjects/assign`,
  SUBJECTS: `${API_BASE_URL}/api/subjects`,
  SUBJECT_BY_ID: (id) => `${API_BASE_URL}/api/subjects/${id}`,
  SUBJECTS_FOR_GRADE: (gradeKey) =>
    `${API_BASE_URL}/api/subjects/${encodeURIComponent(gradeKey)}`,
  SUBJECT_SECTIONS: (gradeKey) =>
    `${API_BASE_URL}/api/subjects/${encodeURIComponent(gradeKey)}/sections`,

  // Campuses (super admin)
  CAMPUSES: `${API_BASE_URL}/api/campuses`,  CAMPUS_OVERVIEW: `${API_BASE_URL}/api/campus-overview`,
  TOTAL_STUDENTS: `${API_BASE_URL}/api/total-students`,

  // Academic heads — cross-campus, grade-band-scoped role. Managed by the super
  // admin (create / list / change band / reset password / revoke).
  ACADEMIC_HEADS: `${API_BASE_URL}/api/academic-heads`,
  ACADEMIC_HEAD_BY_ID: (id) => `${API_BASE_URL}/api/academic-heads/${id}`,
  ACADEMIC_HEAD_RESET_PASSWORD: (id) =>
    `${API_BASE_URL}/api/academic-heads/${id}/reset-password`,
  
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
  // Bulk staff import: preview validates and reports, commit writes.
  STAFF_IMPORT_PREVIEW: `${API_BASE_URL}/api/staff/import/preview`,
  STAFF_IMPORT_COMMIT: `${API_BASE_URL}/api/staff/import/commit`,
  
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
  // Teaching schedule for one class: subjects -> assigned teachers + in-charge.
  CLASS_SCHEDULE: (id) => `${API_BASE_URL}/api/class/${id}/schedule`,
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
  // Per-subject marks entry — the teacher path. Saves one subject's column
  // without disturbing the others; also usable by admins.
  RESULT_SUBJECT_MARKS: (examId) =>
    `${API_BASE_URL}/api/result/subject/${examId}`,
  CLASS_RESULTS: (examId) => `${API_BASE_URL}/api/result/class/${examId}`,
  STUDENT_RESULT: (examId, studentId) => `${API_BASE_URL}/api/result/student/${examId}/${studentId}`,
  STUDENT_RESULT_HISTORY: (studentId) => `${API_BASE_URL}/api/result/student-history/${studentId}`,

  // Exam administration (super admin, cross-campus). Creates one exam for a
  // grade and fans it out across every campus's sections; marks entry and
  // publishing happen here too. Reuses SUBJECT_GRADES / SUBJECT_SECTIONS /
  // SUBJECTS_FOR_GRADE for the grade → subjects → sections pickers.
  EXAM_ADMIN_BATCHES: `${API_BASE_URL}/api/exam-admin/batches`,
  EXAM_ADMIN_BATCH: `${API_BASE_URL}/api/exam-admin/batch`,
  EXAM_ADMIN_BATCH_PUBLISH: (batchId) =>
    `${API_BASE_URL}/api/exam-admin/batch/${batchId}/publish`,
  EXAM_ADMIN_BATCH_BY_ID: (batchId) =>
    `${API_BASE_URL}/api/exam-admin/batch/${batchId}`,
  EXAM_ADMIN_MARKS_SHEET: (examId) =>
    `${API_BASE_URL}/api/exam-admin/exam/${examId}/marks-sheet`,
  EXAM_ADMIN_SAVE_MARKS: (examId) =>
    `${API_BASE_URL}/api/exam-admin/exam/${examId}/marks`,
  EXAM_ADMIN_EXAM_PUBLISH: (examId) =>
    `${API_BASE_URL}/api/exam-admin/exam/${examId}/publish`,

  // Parent
  PARENT_DASHBOARD: `${API_BASE_URL}/api/parent/dashboard`,
  PARENT_RESULTS: `${API_BASE_URL}/api/parent/results`,
  PARENT_FEES: `${API_BASE_URL}/api/parent/fees`,
  PARENT_ATTENDANCE: `${API_BASE_URL}/api/parent/attendance`,
  PARENT_DIARY: `${API_BASE_URL}/api/parent/diary`,
  PARENT_RESOURCES: `${API_BASE_URL}/api/parent/resources`,
  PARENT_NOTIFICATIONS: `${API_BASE_URL}/api/parent/notifications`,
  PARENT_NOTIFICATIONS_READ: `${API_BASE_URL}/api/parent/notifications/read-all`,
};

export default API_BASE_URL;
