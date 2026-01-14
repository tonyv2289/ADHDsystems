// ============================================
// DOMAINS & PROJECTS
// Multi-context life management for high-achievers
// Clients, Properties, Job, Family - all in one system
// ============================================

// ==========================================
// DOMAIN TYPES
// ==========================================

export type DomainType = 'client' | 'property' | 'job' | 'personal' | 'family';

export interface Domain {
  id: string;
  userId: string;
  type: DomainType;
  name: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: Date;
  archivedAt?: Date;

  // Quick stats
  openTasks: number;
  completedTasks: number;
  lastActivityAt?: Date;
}

// ==========================================
// CLIENTS (Consulting Business)
// ==========================================

export type ClientStatus = 'prospect' | 'active' | 'paused' | 'churned';
export type BillingCycle = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'project';
export type BillingType = 'retainer' | 'hourly' | 'project' | 'milestone';

export interface Client extends Domain {
  type: 'client';

  // Business info
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;

  // Relationship
  status: ClientStatus;
  startDate: Date;
  endDate?: Date;
  contractUrl?: string;

  // Billing
  billing: ClientBilling;

  // Communication
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  communicationChannel: 'email' | 'slack' | 'phone' | 'meetings';

  // Value tracking
  lifetimeValue: number;
  healthScore: number; // 1-100, based on engagement, payments, etc.
}

export interface ClientBilling {
  type: BillingType;
  cycle: BillingCycle;
  rate: number; // hourly rate or retainer amount
  currency: string;

  // Retainer specifics
  retainerHours?: number; // included hours per cycle
  overageRate?: number; // rate for hours over retainer

  // Tracking
  hoursThisCycle: number;
  hoursTotal: number;
  lastInvoiceDate?: Date;
  nextInvoiceDate?: Date;
  outstandingAmount: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  userId: string;

  // Invoice details
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;

  // Line items
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;

  // Status
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

  // Payment
  paymentMethod?: string;
  paymentUrl?: string;
  notes?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taskIds?: string[]; // linked tasks
}

export interface TimeEntry {
  id: string;
  userId: string;
  clientId: string;
  taskId?: string;
  projectId?: string;

  description: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes

  billable: boolean;
  billed: boolean;
  invoiceId?: string;

  rate: number;
  amount: number;
}

// ==========================================
// PROPERTIES (Real Estate)
// ==========================================

export type PropertyType = 'rental' | 'primary' | 'vacation' | 'commercial';
export type PropertyStatus = 'occupied' | 'vacant' | 'maintenance' | 'listed';

export interface Property extends Domain {
  type: 'property';

  // Property info
  propertyType: PropertyType;
  address: Address;
  status: PropertyStatus;
  purchaseDate?: Date;
  purchasePrice?: number;

  // Financials
  financials: PropertyFinancials;

  // Tenant info (for rentals)
  tenant?: Tenant;

  // Maintenance
  lastInspectionDate?: Date;
  nextInspectionDate?: Date;
  maintenanceItems: MaintenanceItem[];
}

export interface Address {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface PropertyFinancials {
  // Income
  monthlyRent?: number;
  securityDeposit?: number;

  // Expenses
  monthlyMortgage?: number;
  monthlyHOA?: number;
  monthlyInsurance?: number;
  annualPropertyTax?: number;
  monthlyUtilities?: number;

  // Calculated
  monthlyNetIncome?: number;
  annualCashFlow?: number;
  capRate?: number;

  // Tracking
  lastRentReceived?: Date;
  rentDueDay: number; // 1-31
  outstandingRent: number;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  leaseStart: Date;
  leaseEnd: Date;
  monthlyRent: number;
  securityDeposit: number;
  paymentHistory: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  date: Date;
  amount: number;
  type: 'rent' | 'deposit' | 'fee' | 'refund';
  method: 'check' | 'transfer' | 'cash' | 'venmo' | 'zelle';
  status: 'pending' | 'received' | 'late' | 'partial';
  notes?: string;
}

export interface MaintenanceItem {
  id: string;
  propertyId: string;
  title: string;
  description?: string;
  category: 'hvac' | 'plumbing' | 'electrical' | 'appliance' | 'structural' | 'cosmetic' | 'landscaping' | 'other';
  priority: 'emergency' | 'urgent' | 'normal' | 'low';
  status: 'reported' | 'scheduled' | 'in_progress' | 'completed';
  reportedDate: Date;
  scheduledDate?: Date;
  completedDate?: Date;
  cost?: number;
  vendor?: string;
  taskIds: string[]; // linked tasks
}

// ==========================================
// JOB (W2 Employment)
// ==========================================

export interface Job extends Domain {
  type: 'job';

  companyName: string;
  title: string;
  department?: string;
  managerName?: string;

  // Work schedule
  workDays: number[]; // 0-6, Sunday = 0
  workStartTime: string;
  workEndTime: string;
  isRemote: boolean;
  officeLocation?: string;

  // Key dates
  startDate: Date;
  reviewDate?: Date; // next performance review
  ptoDaysRemaining?: number;

  // Projects within job
  projects: JobProject[];
}

export interface JobProject {
  id: string;
  jobId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'on_hold';
  deadline?: Date;
  stakeholders: string[];
  taskIds: string[];
}

// ==========================================
// PERSONAL & FAMILY
// ==========================================

export interface PersonalDomain extends Domain {
  type: 'personal';
  category: 'health' | 'finance' | 'learning' | 'hobbies' | 'social' | 'admin';
}

export interface FamilyDomain extends Domain {
  type: 'family';
  members: FamilyMember[];
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: 'spouse' | 'child' | 'parent' | 'sibling' | 'other';
  birthDate?: Date;
}

// ==========================================
// PROJECTS (Cross-domain)
// ==========================================

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface Project {
  id: string;
  userId: string;
  domainId: string; // which domain this belongs to
  domainType: DomainType;

  name: string;
  description?: string;
  status: ProjectStatus;

  startDate?: Date;
  targetDate?: Date;
  completedDate?: Date;

  // Tasks
  taskIds: string[];
  completedTaskIds: string[];

  // Budget (for client projects or property renovations)
  budget?: number;
  spent?: number;

  // Team/stakeholders
  stakeholders?: string[];

  // Progress
  progressPercent: number;

  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// DASHBOARD AGGREGATES
// ==========================================

export interface DomainDashboard {
  domain: Domain;
  upcomingTasks: number;
  overdueTasks: number;
  todayTasks: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  domainId: string;
  type: 'task_completed' | 'task_created' | 'payment_received' | 'invoice_sent' | 'maintenance_logged' | 'note_added';
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface FinancialSummary {
  // Client revenue
  monthlyRecurringRevenue: number;
  outstandingInvoices: number;
  revenueThisMonth: number;
  revenueThisYear: number;

  // Property income
  monthlyRentalIncome: number;
  monthlyPropertyExpenses: number;
  netPropertyIncome: number;
  outstandingRent: number;

  // Combined
  totalMonthlyIncome: number;
  totalMonthlyExpenses: number;
  netMonthlyIncome: number;
}

export interface WeeklyReview {
  id: string;
  userId: string;
  weekOf: Date;

  // By domain
  domainSummaries: {
    domainId: string;
    domainName: string;
    domainType: DomainType;
    tasksCompleted: number;
    tasksCreated: number;
    hoursLogged?: number;
    revenueGenerated?: number;
    highlights: string[];
    concerns: string[];
  }[];

  // Overall
  totalTasksCompleted: number;
  totalHoursWorked: number;
  energyAverage: number;
  streakMaintained: boolean;

  // Reflection
  wins: string[];
  challenges: string[];
  nextWeekPriorities: string[];

  completedAt?: Date;
}
