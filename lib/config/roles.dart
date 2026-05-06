/// Aligned with Next.js `USER_ROLES` / committee access on `/api/documents/entries`.
bool isCommitteeRole(String? role) {
  if (role == null) return false;
  return role == 'admin' || role == 'auditor' || role == 'accountant';
}

/// Roles that see `/api/activity/receipt-alerts` (admin, caretaker/staff, finance).
bool seesReceiptUploadAlerts(String? role) {
  if (role == null) return false;
  return role == 'admin' || role == 'staff' || role == 'accountant';
}

bool isResident(String? role) => role == 'resident';
