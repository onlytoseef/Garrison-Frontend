// Front-end permission helpers.
//
// A principal has read-only access: they may open every page and read all data,
// but they cannot add, edit, delete, upload or import anything. The campus admin
// (role 'admin') is the writer. The real enforcement is the backend guard
// (middleware/auth.js `blockReadOnlyRoles`, wired into campusGuard); these helpers
// just hide controls so the UI never offers an action that would only 403.
//
// One source of truth for the role list — if another read-only role is ever added,
// change it here, not across a dozen pages.
export const READ_ONLY_ROLES = ["principal"];

export const isReadOnlyRole = (role) => READ_ONLY_ROLES.includes(role);
