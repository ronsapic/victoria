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

bool isAuditorRole(String? role) => role == 'auditor';

/// Human-readable label for [`/api/me`].role`.
String roleDisplayLabel(String? role) {
  switch (role) {
    case 'admin':
      return 'Admin (committee)';
    case 'accountant':
      return 'Accountant';
    case 'resident':
      return 'Resident';
    case 'staff':
      return 'Caretaker / staff';
    case 'auditor':
      return 'Auditor';
    default:
      return role?.isEmpty ?? true ? 'Unknown role' : role!;
  }
}

