/**
 * RBAC guard helpers shared between API routes and tests.
 */
const OVERRIDE_ROLES = new Set(['manager', 'executive', 'god']);
const ORG_ADMIN_ROLES = new Set(['org_admin', 'director']);

/**
 * Return true when the given application role may perform lifecycle overrides.
 * @param {string | null | undefined} role
 */
function canOverrideLifecycle(role) {
  return OVERRIDE_ROLES.has(role || '');
}

/**
 * Throw when the provided org scope does not represent an admin/director.
 * @param {{ role?: string | null }} scope
 */
function assertOrgAdmin(scope) {
  const role = scope?.role || null;
  if (!ORG_ADMIN_ROLES.has(role)) {
    const error = new Error('Insufficient permissions');
    error.status = 403;
    throw error;
  }
  return true;
}

module.exports = {
  canOverrideLifecycle,
  assertOrgAdmin,
};
