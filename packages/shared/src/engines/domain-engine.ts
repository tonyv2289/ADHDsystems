// ============================================
// DOMAIN ENGINE
// Multi-context life management
// Clients, Properties, Job, Family - context switching
// ============================================

// Simple ID generator that works in React Native
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
import {
  Domain,
  DomainType,
  Client,
  ClientStatus,
  ClientBilling,
  BillingType,
  BillingCycle,
  Property,
  PropertyType,
  PropertyFinancials,
  Job,
  Project,
  ProjectStatus,
  TimeEntry,
  Invoice,
  InvoiceLineItem,
  MaintenanceItem,
  Tenant,
  FinancialSummary,
  DomainDashboard,
  ActivityItem,
} from '../types/domains';
import { Task } from '../types';
import { differenceInDays, startOfMonth, endOfMonth, addDays } from 'date-fns';

// ==========================================
// DOMAIN CREATION
// ==========================================

export function createClient(
  userId: string,
  input: {
    companyName: string;
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    billingType: BillingType;
    billingCycle: BillingCycle;
    rate: number;
    retainerHours?: number;
    color?: string;
  }
): Client {
  return {
    id: generateId(),
    userId,
    type: 'client',
    name: input.companyName,
    companyName: input.companyName,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: input.contactPhone,
    color: input.color || getRandomColor(),
    icon: '💼',
    isActive: true,
    createdAt: new Date(),
    openTasks: 0,
    completedTasks: 0,
    status: 'active',
    startDate: new Date(),
    billing: {
      type: input.billingType,
      cycle: input.billingCycle,
      rate: input.rate,
      currency: 'USD',
      retainerHours: input.retainerHours,
      overageRate: input.rate * 1.25, // 25% premium for overage
      hoursThisCycle: 0,
      hoursTotal: 0,
      outstandingAmount: 0,
    },
    communicationChannel: 'email',
    lifetimeValue: 0,
    healthScore: 100,
  };
}

export function createProperty(
  userId: string,
  input: {
    name: string;
    propertyType: PropertyType;
    address: {
      street: string;
      unit?: string;
      city: string;
      state: string;
      zip: string;
    };
    monthlyRent?: number;
    monthlyMortgage?: number;
    color?: string;
  }
): Property {
  return {
    id: generateId(),
    userId,
    type: 'property',
    name: input.name,
    propertyType: input.propertyType,
    address: { ...input.address, country: 'USA' },
    status: input.propertyType === 'primary' ? 'occupied' : 'vacant',
    color: input.color || getRandomColor(),
    icon: input.propertyType === 'rental' ? '🏠' : '🏡',
    isActive: true,
    createdAt: new Date(),
    openTasks: 0,
    completedTasks: 0,
    financials: {
      monthlyRent: input.monthlyRent,
      monthlyMortgage: input.monthlyMortgage,
      rentDueDay: 1,
      outstandingRent: 0,
    },
    maintenanceItems: [],
  };
}

export function createJob(
  userId: string,
  input: {
    companyName: string;
    title: string;
    isRemote: boolean;
    workDays?: number[];
    color?: string;
  }
): Job {
  return {
    id: generateId(),
    userId,
    type: 'job',
    name: input.companyName,
    companyName: input.companyName,
    title: input.title,
    workDays: input.workDays || [1, 2, 3, 4, 5], // Mon-Fri default
    workStartTime: '09:00',
    workEndTime: '17:00',
    isRemote: input.isRemote,
    color: input.color || getRandomColor(),
    icon: '💻',
    isActive: true,
    createdAt: new Date(),
    startDate: new Date(),
    openTasks: 0,
    completedTasks: 0,
    projects: [],
  };
}

export function createProject(
  userId: string,
  domainId: string,
  domainType: DomainType,
  input: {
    name: string;
    description?: string;
    targetDate?: Date;
    budget?: number;
  }
): Project {
  return {
    id: generateId(),
    userId,
    domainId,
    domainType,
    name: input.name,
    description: input.description,
    status: 'planning',
    targetDate: input.targetDate,
    budget: input.budget,
    taskIds: [],
    completedTaskIds: [],
    progressPercent: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// ==========================================
// TIME TRACKING (for Clients)
// ==========================================

export function startTimeEntry(
  userId: string,
  clientId: string,
  description: string,
  taskId?: string
): TimeEntry {
  return {
    id: generateId(),
    userId,
    clientId,
    taskId,
    description,
    startTime: new Date(),
    duration: 0,
    billable: true,
    billed: false,
    rate: 0, // Will be set from client billing
    amount: 0,
  };
}

export function stopTimeEntry(entry: TimeEntry, clientRate: number): TimeEntry {
  const endTime = new Date();
  const duration = Math.round(
    (endTime.getTime() - entry.startTime.getTime()) / 60000
  );

  return {
    ...entry,
    endTime,
    duration,
    rate: clientRate,
    amount: (duration / 60) * clientRate,
  };
}

export function calculateCycleHours(
  entries: TimeEntry[],
  cycle: BillingCycle,
  referenceDate: Date = new Date()
): number {
  const cycleStart = getCycleStartDate(cycle, referenceDate);
  const cycleEnd = getCycleEndDate(cycle, referenceDate);

  return entries
    .filter(e =>
      e.startTime >= cycleStart &&
      e.startTime <= cycleEnd &&
      e.billable
    )
    .reduce((sum, e) => sum + e.duration, 0) / 60;
}

function getCycleStartDate(cycle: BillingCycle, reference: Date): Date {
  const date = new Date(reference);

  switch (cycle) {
    case 'weekly':
      date.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      break;
    case 'biweekly':
      date.setDate(date.getDate() - (date.getDay() + 7));
      break;
    case 'monthly':
      date.setDate(1);
      break;
    case 'quarterly':
      const quarter = Math.floor(date.getMonth() / 3);
      date.setMonth(quarter * 3, 1);
      break;
  }

  date.setHours(0, 0, 0, 0);
  return date;
}

function getCycleEndDate(cycle: BillingCycle, reference: Date): Date {
  const start = getCycleStartDate(cycle, reference);

  switch (cycle) {
    case 'weekly':
      return addDays(start, 6);
    case 'biweekly':
      return addDays(start, 13);
    case 'monthly':
      return new Date(start.getFullYear(), start.getMonth() + 1, 0);
    case 'quarterly':
      return new Date(start.getFullYear(), start.getMonth() + 3, 0);
    default:
      return addDays(start, 30);
  }
}

// ==========================================
// INVOICING
// ==========================================

export function generateInvoice(
  client: Client,
  entries: TimeEntry[],
  userId: string
): Invoice {
  const unbilledEntries = entries.filter(e =>
    e.clientId === client.id &&
    e.billable &&
    !e.billed
  );

  // Group by description or create single line item
  const lineItems: InvoiceLineItem[] = [];

  if (client.billing.type === 'retainer') {
    // Retainer invoice
    lineItems.push({
      description: `Monthly retainer - ${client.billing.retainerHours || 0} hours`,
      quantity: 1,
      rate: client.billing.rate,
      amount: client.billing.rate,
    });

    // Check for overage
    const totalHours = unbilledEntries.reduce((sum, e) => sum + e.duration, 0) / 60;
    const overageHours = Math.max(0, totalHours - (client.billing.retainerHours || 0));

    if (overageHours > 0) {
      lineItems.push({
        description: `Additional hours (${overageHours.toFixed(1)} hrs @ $${client.billing.overageRate}/hr)`,
        quantity: overageHours,
        rate: client.billing.overageRate || client.billing.rate,
        amount: overageHours * (client.billing.overageRate || client.billing.rate),
        taskIds: unbilledEntries.filter(e => e.taskId).map(e => e.taskId!),
      });
    }
  } else {
    // Hourly invoice - group by task/description
    const grouped = new Map<string, TimeEntry[]>();

    unbilledEntries.forEach(entry => {
      const key = entry.description;
      const existing = grouped.get(key) || [];
      grouped.set(key, [...existing, entry]);
    });

    grouped.forEach((groupedEntries, description) => {
      const totalMinutes = groupedEntries.reduce((sum, e) => sum + e.duration, 0);
      const hours = totalMinutes / 60;

      lineItems.push({
        description,
        quantity: hours,
        rate: client.billing.rate,
        amount: hours * client.billing.rate,
        taskIds: groupedEntries.filter(e => e.taskId).map(e => e.taskId!),
      });
    });
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

  return {
    id: generateId(),
    clientId: client.id,
    userId,
    invoiceNumber: generateInvoiceNumber(client),
    issueDate: new Date(),
    dueDate: addDays(new Date(), 30), // Net 30
    lineItems,
    subtotal,
    tax: 0, // Can be configured
    total: subtotal,
    status: 'draft',
  };
}

function generateInvoiceNumber(client: Client): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${random}`;
}

// ==========================================
// PROPERTY MANAGEMENT
// ==========================================

export function addTenant(
  property: Property,
  input: {
    name: string;
    email: string;
    phone: string;
    leaseStart: Date;
    leaseEnd: Date;
    monthlyRent: number;
    securityDeposit: number;
  }
): Property {
  const tenant: Tenant = {
    id: generateId(),
    ...input,
    paymentHistory: [],
  };

  return {
    ...property,
    tenant,
    status: 'occupied',
    financials: {
      ...property.financials,
      monthlyRent: input.monthlyRent,
      securityDeposit: input.securityDeposit,
    },
  };
}

export function recordRentPayment(
  property: Property,
  amount: number,
  method: 'check' | 'transfer' | 'cash' | 'venmo' | 'zelle'
): Property {
  if (!property.tenant) return property;

  const payment = {
    id: generateId(),
    date: new Date(),
    amount,
    type: 'rent' as const,
    method,
    status: 'received' as const,
  };

  const updatedTenant = {
    ...property.tenant,
    paymentHistory: [...property.tenant.paymentHistory, payment],
  };

  return {
    ...property,
    tenant: updatedTenant,
    financials: {
      ...property.financials,
      lastRentReceived: new Date(),
      outstandingRent: Math.max(0, property.financials.outstandingRent - amount),
    },
  };
}

export function addMaintenanceItem(
  property: Property,
  input: {
    title: string;
    description?: string;
    category: MaintenanceItem['category'];
    priority: MaintenanceItem['priority'];
  }
): { property: Property; maintenanceItem: MaintenanceItem } {
  const maintenanceItem: MaintenanceItem = {
    id: generateId(),
    propertyId: property.id,
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority,
    status: 'reported',
    reportedDate: new Date(),
    taskIds: [],
  };

  return {
    property: {
      ...property,
      maintenanceItems: [...property.maintenanceItems, maintenanceItem],
    },
    maintenanceItem,
  };
}

export function calculatePropertyCashFlow(property: Property): number {
  const { financials } = property;

  const income = financials.monthlyRent || 0;
  const expenses =
    (financials.monthlyMortgage || 0) +
    (financials.monthlyHOA || 0) +
    (financials.monthlyInsurance || 0) +
    ((financials.annualPropertyTax || 0) / 12) +
    (financials.monthlyUtilities || 0);

  return income - expenses;
}

// ==========================================
// FINANCIAL SUMMARY
// ==========================================

export function calculateFinancialSummary(
  clients: Client[],
  properties: Property[],
  invoices: Invoice[]
): FinancialSummary {
  // Client revenue
  const activeClients = clients.filter(c => c.status === 'active');
  const monthlyRecurringRevenue = activeClients
    .filter(c => c.billing.type === 'retainer')
    .reduce((sum, c) => sum + c.billing.rate, 0);

  const outstandingInvoices = invoices
    .filter(i => ['sent', 'viewed', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + i.total, 0);

  const thisMonth = startOfMonth(new Date());
  const revenueThisMonth = invoices
    .filter(i => i.paidDate && i.paidDate >= thisMonth)
    .reduce((sum, i) => sum + i.total, 0);

  const thisYear = new Date();
  thisYear.setMonth(0, 1);
  thisYear.setHours(0, 0, 0, 0);
  const revenueThisYear = invoices
    .filter(i => i.paidDate && i.paidDate >= thisYear)
    .reduce((sum, i) => sum + i.total, 0);

  // Property income
  const rentalProperties = properties.filter(p =>
    p.propertyType === 'rental' && p.status === 'occupied'
  );

  const monthlyRentalIncome = rentalProperties
    .reduce((sum, p) => sum + (p.financials.monthlyRent || 0), 0);

  const monthlyPropertyExpenses = properties.reduce((sum, p) => {
    const { financials } = p;
    return sum +
      (financials.monthlyMortgage || 0) +
      (financials.monthlyHOA || 0) +
      (financials.monthlyInsurance || 0) +
      ((financials.annualPropertyTax || 0) / 12);
  }, 0);

  const outstandingRent = rentalProperties
    .reduce((sum, p) => sum + p.financials.outstandingRent, 0);

  // Combined
  const totalMonthlyIncome = monthlyRecurringRevenue + monthlyRentalIncome;
  const totalMonthlyExpenses = monthlyPropertyExpenses; // Add other expenses as needed

  return {
    monthlyRecurringRevenue,
    outstandingInvoices,
    revenueThisMonth,
    revenueThisYear,
    monthlyRentalIncome,
    monthlyPropertyExpenses,
    netPropertyIncome: monthlyRentalIncome - monthlyPropertyExpenses,
    outstandingRent,
    totalMonthlyIncome,
    totalMonthlyExpenses,
    netMonthlyIncome: totalMonthlyIncome - totalMonthlyExpenses,
  };
}

// ==========================================
// CONTEXT SWITCHING
// ==========================================

export interface DomainContext {
  domainId: string | null;
  domainType: DomainType | null;
  domainName: string | null;
  projectId: string | null;
}

/**
 * Get tasks filtered by current domain context
 */
export function getTasksForDomain(
  tasks: Task[],
  domainId: string
): Task[] {
  return tasks.filter(t => (t as any).domainId === domainId);
}

/**
 * Smart domain suggestion based on time and day
 */
export function suggestDomain(
  domains: Domain[],
  jobs: Job[],
  currentTime: Date = new Date()
): Domain | null {
  const hour = currentTime.getHours();
  const dayOfWeek = currentTime.getDay();

  // During work hours on work days, suggest job
  const job = jobs.find(j => j.isActive);
  if (job && job.workDays.includes(dayOfWeek)) {
    const [startHour] = job.workStartTime.split(':').map(Number);
    const [endHour] = job.workEndTime.split(':').map(Number);

    if (hour >= startHour && hour < endHour) {
      return job;
    }
  }

  // Evening hours - suggest personal or family
  if (hour >= 18 || hour < 9) {
    const personalDomains = domains.filter(d =>
      d.type === 'personal' || d.type === 'family'
    );
    return personalDomains[0] || null;
  }

  // Default - return domain with most overdue tasks
  const domainWithMostUrgent = [...domains].sort((a, b) =>
    b.openTasks - a.openTasks
  )[0];

  return domainWithMostUrgent || null;
}

/**
 * Get dashboard data for a domain
 */
export function getDomainDashboard(
  domain: Domain,
  tasks: Task[],
  activities: ActivityItem[]
): DomainDashboard {
  const domainTasks = tasks.filter(t => (t as any).domainId === domain.id);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const upcomingTasks = domainTasks.filter(t =>
    t.status === 'pending' &&
    t.dueDate &&
    t.dueDate >= now
  ).length;

  const overdueTasks = domainTasks.filter(t =>
    t.status === 'pending' &&
    t.dueDate &&
    t.dueDate < now
  ).length;

  const todayTasks = domainTasks.filter(t =>
    t.status === 'pending' &&
    ((t.scheduledFor && t.scheduledFor >= today && t.scheduledFor < tomorrow) ||
     (t.dueDate && t.dueDate >= today && t.dueDate < tomorrow))
  ).length;

  const recentActivity = activities
    .filter(a => a.domainId === domain.id)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 10);

  return {
    domain,
    upcomingTasks,
    overdueTasks,
    todayTasks,
    recentActivity,
  };
}

// ==========================================
// CLIENT HEALTH SCORING
// ==========================================

export function calculateClientHealth(
  client: Client,
  timeEntries: TimeEntry[],
  invoices: Invoice[]
): number {
  let score = 100;

  // Deduct for lack of recent activity
  if (client.lastContactDate) {
    const daysSinceContact = differenceInDays(new Date(), client.lastContactDate);
    if (daysSinceContact > 30) score -= 20;
    else if (daysSinceContact > 14) score -= 10;
  } else {
    score -= 15;
  }

  // Deduct for outstanding invoices
  const clientInvoices = invoices.filter(i => i.clientId === client.id);
  const overdueInvoices = clientInvoices.filter(i => i.status === 'overdue');
  score -= overdueInvoices.length * 15;

  // Deduct for low activity
  const recentEntries = timeEntries.filter(e =>
    e.clientId === client.id &&
    differenceInDays(new Date(), e.startTime) <= 30
  );
  if (recentEntries.length === 0) score -= 10;

  // Bonus for consistent payments
  const paidOnTime = clientInvoices.filter(i =>
    i.status === 'paid' && i.paidDate && i.paidDate <= i.dueDate
  );
  if (paidOnTime.length >= 3) score += 10;

  return Math.max(0, Math.min(100, score));
}

// ==========================================
// HELPERS
// ==========================================

function getRandomColor(): string {
  const colors = [
    '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ==========================================
// ALERTS & REMINDERS
// ==========================================

export interface DomainAlert {
  id: string;
  domainId: string;
  domainType: DomainType;
  type: 'overdue_invoice' | 'rent_due' | 'lease_expiring' | 'maintenance_urgent' |
        'client_inactive' | 'follow_up_due' | 'contract_expiring';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
}

export function generateDomainAlerts(
  clients: Client[],
  properties: Property[],
  invoices: Invoice[]
): DomainAlert[] {
  const alerts: DomainAlert[] = [];

  // Client alerts
  clients.forEach(client => {
    // Overdue invoices
    const overdueInvoices = invoices.filter(i =>
      i.clientId === client.id && i.status === 'overdue'
    );
    overdueInvoices.forEach(invoice => {
      alerts.push({
        id: generateId(),
        domainId: client.id,
        domainType: 'client',
        type: 'overdue_invoice',
        severity: 'critical',
        title: `Overdue Invoice - ${client.name}`,
        message: `Invoice ${invoice.invoiceNumber} is ${differenceInDays(new Date(), invoice.dueDate)} days overdue ($${invoice.total})`,
        actionLabel: 'View Invoice',
      });
    });

    // Follow-up reminders
    if (client.nextFollowUpDate && client.nextFollowUpDate <= new Date()) {
      alerts.push({
        id: generateId(),
        domainId: client.id,
        domainType: 'client',
        type: 'follow_up_due',
        severity: 'warning',
        title: `Follow Up - ${client.name}`,
        message: `Scheduled follow-up with ${client.contactName}`,
        actionLabel: 'Contact',
      });
    }

    // Inactive client warning
    if (client.lastContactDate) {
      const daysSince = differenceInDays(new Date(), client.lastContactDate);
      if (daysSince > 30 && client.status === 'active') {
        alerts.push({
          id: generateId(),
          domainId: client.id,
          domainType: 'client',
          type: 'client_inactive',
          severity: 'warning',
          title: `Inactive Client - ${client.name}`,
          message: `No contact in ${daysSince} days`,
          actionLabel: 'Reach Out',
        });
      }
    }
  });

  // Property alerts
  properties.filter(p => p.propertyType === 'rental').forEach(property => {
    // Rent due
    const today = new Date().getDate();
    if (property.financials.rentDueDay === today || property.financials.outstandingRent > 0) {
      if (property.financials.outstandingRent > 0) {
        alerts.push({
          id: generateId(),
          domainId: property.id,
          domainType: 'property',
          type: 'rent_due',
          severity: 'warning',
          title: `Outstanding Rent - ${property.name}`,
          message: `$${property.financials.outstandingRent} outstanding`,
          actionLabel: 'Record Payment',
        });
      }
    }

    // Lease expiring
    if (property.tenant) {
      const daysUntilLeaseEnd = differenceInDays(property.tenant.leaseEnd, new Date());
      if (daysUntilLeaseEnd <= 60 && daysUntilLeaseEnd > 0) {
        alerts.push({
          id: generateId(),
          domainId: property.id,
          domainType: 'property',
          type: 'lease_expiring',
          severity: daysUntilLeaseEnd <= 30 ? 'critical' : 'warning',
          title: `Lease Expiring - ${property.name}`,
          message: `${property.tenant.name}'s lease expires in ${daysUntilLeaseEnd} days`,
          actionLabel: 'Review Lease',
        });
      }
    }

    // Urgent maintenance
    const urgentMaintenance = property.maintenanceItems.filter(m =>
      ['emergency', 'urgent'].includes(m.priority) &&
      m.status !== 'completed'
    );
    urgentMaintenance.forEach(item => {
      alerts.push({
        id: generateId(),
        domainId: property.id,
        domainType: 'property',
        type: 'maintenance_urgent',
        severity: item.priority === 'emergency' ? 'critical' : 'warning',
        title: `${item.priority === 'emergency' ? 'EMERGENCY' : 'Urgent'}: ${item.title}`,
        message: `${property.name} - ${item.category}`,
        actionLabel: 'View Details',
      });
    });
  });

  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}
