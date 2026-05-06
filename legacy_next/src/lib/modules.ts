import type { UserRole } from "./rbac";

export type ModuleKey =
  | "units"
  | "payments"
  | "financials"
  | "reports"
  | "incidents"
  | "maintenance"
  | "water"
  | "communications"
  | "documents"
  | "bookings"
  | "voting"
  | "analytics"
  | "access"
  | "compliance"
  | "vendors"
  | "budgeting"
  | "residents"
  | "parking"
  | "staff"
  | "assets"
  | "visitors"
  | "emergency"
  | "letters"
  | "projects"
  | "activity";

export type ModuleDef = {
  title: string;
  description: string;
  group: string;
  primaryFor: readonly UserRole[];
  /** Canonical app route */
  path: string;
};

export const MODULES: Record<ModuleKey, ModuleDef> = {
  analytics: {
    title: "Analytics dashboard",
    description:
      "Revenue, arrears, expenses, water trends, charts, and date filters.",
    group: "Overview",
    /** Everyone sees Overview; KPI detail is masked for residents on the home page. */
    primaryFor: ["admin", "accountant", "resident", "staff", "auditor"],
    path: "/",
  },
  units: {
    title: "Property & units",
    description:
      "Apartments, owners/tenants, floors, size, ownership share, history.",
    group: "Estate",
    primaryFor: ["admin", "staff", "resident"],
    path: "/units",
  },
  payments: {
    title: "Service charges & payments",
    description:
      "Billing, mobile money (Airtel, Tigo), bank entry, PDF invoices, reminders, defaulters.",
    group: "Finance",
    primaryFor: ["admin", "accountant", "resident"],
    path: "/payments",
  },
  financials: {
    title: "Financial management",
    description:
      "Income, expenses, budgets vs actual, monthly/quarterly/annual summaries.",
    group: "Finance",
    primaryFor: ["admin", "accountant", "auditor"],
    path: "/financials",
  },
  reports: {
    title: "Reporting",
    description:
      "Service charge, management, and audit reports — PDF/Excel, scheduled exports.",
    group: "Finance",
    primaryFor: ["admin", "accountant", "auditor"],
    path: "/reports",
  },
  incidents: {
    title: "Incidents",
    description:
      "Reports with categories, photos, status workflow, assignment, threaded comments.",
    group: "Operations",
    primaryFor: ["admin", "staff", "resident"],
    path: "/incidents",
  },
  maintenance: {
    title: "Maintenance",
    description:
      "Tickets, caretaker/contractor assignment, cost, completion, asset history.",
    group: "Operations",
    primaryFor: ["admin", "staff"],
    path: "/maintenance",
  },
  water: {
    title: "Water usage",
    description:
      "Readings, consumption, billing, anomaly alerts vs thresholds.",
    group: "Operations",
    primaryFor: ["admin", "accountant", "resident"],
    path: "/water",
  },
  communications: {
    title: "Communications",
    description:
      "Announcements, notifications, feedback and complaints.",
    group: "Community",
    primaryFor: ["admin", "resident"],
    path: "/communications",
  },
  documents: {
    title: "Documents",
    description:
      "Letters, contracts, reports — categories, search, download ACL.",
    group: "Community",
    primaryFor: ["admin", "accountant", "resident", "auditor"],
    path: "/documents",
  },
  bookings: {
    title: "Bookings",
    description:
      "Shared resources: parking, meeting rooms, facilities — calendar and approvals.",
    group: "Community",
    primaryFor: ["admin", "resident", "staff"],
    path: "/bookings",
  },
  voting: {
    title: "Voting",
    description:
      "Polls, one vote per unit, optional weights, anonymity, results archive.",
    group: "Governance",
    primaryFor: ["admin", "resident", "auditor"],
    path: "/voting",
  },
  access: {
    title: "Access & roles",
    description:
      "User directory, roles, and unit membership assignments (owner/tenant).",
    group: "Administration",
    primaryFor: ["admin"],
    path: "/access",
  },
  compliance: {
    title: "Legal & compliance",
    description: "Bylaws/constitution, deadlines, agreements, audit decisions.",
    group: "Administration",
    primaryFor: ["admin", "auditor"],
    path: "/compliance",
  },
  vendors: {
    title: "Procurement & vendors",
    description: "Vendor registry, contracts, quotations, approvals, ratings.",
    group: "Finance",
    primaryFor: ["admin", "accountant", "auditor"],
    path: "/vendors",
  },
  budgeting: {
    title: "Budgeting",
    description:
      "Yearly budgets by department, forecasts, and variance vs actual.",
    group: "Finance",
    primaryFor: ["admin", "accountant", "auditor"],
    path: "/budgeting",
  },
  residents: {
    title: "Resident profiles",
    description:
      "Contact info, occupants, vehicles, payment history, complaints.",
    group: "Community",
    primaryFor: ["admin", "staff"],
    path: "/residents",
  },
  parking: {
    title: "Parking",
    description:
      "Slots, assignments, visitor parking controls, and violation logs.",
    group: "Operations",
    primaryFor: ["admin", "staff"],
    path: "/parking",
  },
  staff: {
    title: "Staff",
    description:
      "Caretakers, security, roles/tasks, staff directory.",
    group: "Administration",
    primaryFor: ["admin"],
    path: "/staff",
  },
  assets: {
    title: "Assets & inventory",
    description:
      "Elevators, generators, pumps — schedules, condition logs.",
    group: "Administration",
    primaryFor: ["admin", "staff", "auditor"],
    path: "/assets",
  },
  visitors: {
    title: "Visitors & security",
    description:
      "Visitor log, optional QR access, security incidents.",
    group: "Administration",
    primaryFor: ["admin", "staff"],
    path: "/visitors",
  },
  emergency: {
    title: "Emergency",
    description:
      "Broadcasts, resident panic alerts, emergency contacts.",
    group: "Administration",
    primaryFor: ["admin", "resident", "staff"],
    path: "/emergency",
  },
  letters: {
    title: "Letters & notices",
    description:
      "Official letters to units or all residents, full archive.",
    group: "Community",
    primaryFor: ["admin", "resident"],
    path: "/letters",
  },
  projects: {
    title: "Progress tracking",
    description:
      "Repairs and renovations — status, timeline, updates.",
    group: "Operations",
    primaryFor: ["admin", "staff", "resident"],
    path: "/projects",
  },
  activity: {
    title: "Activity & sessions",
    description:
      "Audit trail of actions, session management (security §2).",
    group: "Administration",
    primaryFor: ["admin", "auditor"],
    path: "/activity",
  },
};

const moduleKeys = Object.keys(MODULES) as ModuleKey[];

export function isModuleKey(key: string): key is ModuleKey {
  return moduleKeys.includes(key as ModuleKey);
}

export function modulesByGroup(): Map<string, ModuleKey[]> {
  const map = new Map<string, ModuleKey[]>();
  for (const key of moduleKeys) {
    const g = MODULES[key].group;
    const list = map.get(g) ?? [];
    list.push(key);
    map.set(g, list);
  }
  return map;
}
