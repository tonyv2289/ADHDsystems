// ============================================
// DATA IMPORT SERVICE
// CSV import for tasks, habits, clients, etc.
// ============================================

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

// ==========================================
// TYPES
// ==========================================

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  data: any[];
}

export interface TaskImport {
  title: string;
  description?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low' | 'someday';
  dueDate?: string; // ISO date string or natural language
  estimatedMinutes?: number;
  tags?: string; // comma-separated
  status?: 'pending' | 'completed';
}

export interface HabitImport {
  name: string;
  icon?: string;
  color?: string;
  frequency?: 'daily' | 'weekdays' | 'weekends';
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  xpPerCompletion?: number;
}

export interface ClientImport {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  hourlyRate?: number;
  notes?: string;
}

export interface PropertyImport {
  address: string;
  type?: 'rental' | 'primary';
  monthlyRent?: number;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  notes?: string;
}

// ==========================================
// FILE PICKER
// ==========================================

export async function pickCSVFile(): Promise<string | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/csv', 'text/comma-separated-values', 'application/csv'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const fileUri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(fileUri);
    return content;
  } catch (error) {
    console.error('Error picking CSV file:', error);
    return null;
  }
}

// ==========================================
// CSV PARSING
// ==========================================

export function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.split('\n');
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

function csvRowToObject(headers: string[], row: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((header, index) => {
    obj[header.toLowerCase().replace(/\s+/g, '_')] = row[index] || '';
  });
  return obj;
}

// ==========================================
// TASK IMPORT
// ==========================================

export async function importTasksFromCSV(csvContent: string): Promise<ImportResult> {
  const rows = parseCSV(csvContent);
  if (rows.length < 2) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['CSV file is empty or has no data rows'],
      data: [],
    };
  }

  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const dataRows = rows.slice(1);

  const imported: TaskImport[] = [];
  const errors: string[] = [];
  let skipped = 0;

  // Required: title
  const titleIndex = headers.findIndex(h =>
    ['title', 'task', 'name', 'task_name', 'task_title'].includes(h)
  );

  if (titleIndex === -1) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['CSV must have a "title" or "task" column'],
      data: [],
    };
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const obj = csvRowToObject(headers, row);

    const title = row[titleIndex]?.trim();
    if (!title) {
      skipped++;
      continue;
    }

    try {
      const task: TaskImport = {
        title,
        description: obj.description || obj.notes || undefined,
        priority: parsePriority(obj.priority),
        dueDate: obj.due_date || obj.due || obj.deadline || undefined,
        estimatedMinutes: obj.estimated_minutes || obj.duration || obj.time
          ? parseInt(obj.estimated_minutes || obj.duration || obj.time)
          : undefined,
        tags: obj.tags || obj.labels || undefined,
        status: obj.status === 'completed' || obj.status === 'done' || obj.completed === 'true'
          ? 'completed'
          : 'pending',
      };

      imported.push(task);
    } catch (error) {
      errors.push(`Row ${i + 2}: ${error}`);
      skipped++;
    }
  }

  return {
    success: true,
    imported: imported.length,
    skipped,
    errors,
    data: imported,
  };
}

function parsePriority(value: string | undefined): TaskImport['priority'] {
  if (!value) return 'medium';
  const lower = value.toLowerCase();

  if (['critical', 'urgent', 'asap', '1', 'p1'].includes(lower)) return 'critical';
  if (['high', 'important', '2', 'p2'].includes(lower)) return 'high';
  if (['medium', 'normal', '3', 'p3'].includes(lower)) return 'medium';
  if (['low', '4', 'p4'].includes(lower)) return 'low';
  if (['someday', 'maybe', 'backlog', '5', 'p5'].includes(lower)) return 'someday';

  return 'medium';
}

// ==========================================
// HABIT IMPORT
// ==========================================

export async function importHabitsFromCSV(csvContent: string): Promise<ImportResult> {
  const rows = parseCSV(csvContent);
  if (rows.length < 2) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['CSV file is empty or has no data rows'],
      data: [],
    };
  }

  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const dataRows = rows.slice(1);

  const imported: HabitImport[] = [];
  const errors: string[] = [];
  let skipped = 0;

  const nameIndex = headers.findIndex(h =>
    ['name', 'habit', 'habit_name', 'title'].includes(h)
  );

  if (nameIndex === -1) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['CSV must have a "name" or "habit" column'],
      data: [],
    };
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const obj = csvRowToObject(headers, row);

    const name = row[nameIndex]?.trim();
    if (!name) {
      skipped++;
      continue;
    }

    try {
      const habit: HabitImport = {
        name,
        icon: obj.icon || obj.emoji || '✅',
        color: obj.color || '#6366f1',
        frequency: parseFrequency(obj.frequency),
        timeOfDay: parseTimeOfDay(obj.time_of_day || obj.time),
        xpPerCompletion: obj.xp || obj.xp_per_completion
          ? parseInt(obj.xp || obj.xp_per_completion)
          : 20,
      };

      imported.push(habit);
    } catch (error) {
      errors.push(`Row ${i + 2}: ${error}`);
      skipped++;
    }
  }

  return {
    success: true,
    imported: imported.length,
    skipped,
    errors,
    data: imported,
  };
}

function parseFrequency(value: string | undefined): HabitImport['frequency'] {
  if (!value) return 'daily';
  const lower = value.toLowerCase();

  if (['daily', 'every day', 'everyday'].includes(lower)) return 'daily';
  if (['weekdays', 'weekday', 'work days', 'workdays'].includes(lower)) return 'weekdays';
  if (['weekends', 'weekend'].includes(lower)) return 'weekends';

  return 'daily';
}

function parseTimeOfDay(value: string | undefined): HabitImport['timeOfDay'] {
  if (!value) return 'anytime';
  const lower = value.toLowerCase();

  if (['morning', 'am', 'early'].includes(lower)) return 'morning';
  if (['afternoon', 'midday', 'noon'].includes(lower)) return 'afternoon';
  if (['evening', 'night', 'pm', 'late'].includes(lower)) return 'evening';

  return 'anytime';
}

// ==========================================
// CLIENT IMPORT
// ==========================================

export async function importClientsFromCSV(csvContent: string): Promise<ImportResult> {
  const rows = parseCSV(csvContent);
  if (rows.length < 2) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['CSV file is empty or has no data rows'],
      data: [],
    };
  }

  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const dataRows = rows.slice(1);

  const imported: ClientImport[] = [];
  const errors: string[] = [];
  let skipped = 0;

  const nameIndex = headers.findIndex(h =>
    ['name', 'client', 'client_name', 'company'].includes(h)
  );

  if (nameIndex === -1) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['CSV must have a "name" or "client" column'],
      data: [],
    };
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const obj = csvRowToObject(headers, row);

    const name = row[nameIndex]?.trim();
    if (!name) {
      skipped++;
      continue;
    }

    try {
      const client: ClientImport = {
        name,
        email: obj.email || undefined,
        phone: obj.phone || obj.phone_number || undefined,
        company: obj.company || obj.organization || undefined,
        hourlyRate: obj.hourly_rate || obj.rate
          ? parseFloat(obj.hourly_rate || obj.rate)
          : undefined,
        notes: obj.notes || obj.description || undefined,
      };

      imported.push(client);
    } catch (error) {
      errors.push(`Row ${i + 2}: ${error}`);
      skipped++;
    }
  }

  return {
    success: true,
    imported: imported.length,
    skipped,
    errors,
    data: imported,
  };
}

// ==========================================
// PROPERTY IMPORT
// ==========================================

export async function importPropertiesFromCSV(csvContent: string): Promise<ImportResult> {
  const rows = parseCSV(csvContent);
  if (rows.length < 2) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['CSV file is empty or has no data rows'],
      data: [],
    };
  }

  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const dataRows = rows.slice(1);

  const imported: PropertyImport[] = [];
  const errors: string[] = [];
  let skipped = 0;

  const addressIndex = headers.findIndex(h =>
    ['address', 'property', 'property_address', 'location'].includes(h)
  );

  if (addressIndex === -1) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['CSV must have an "address" or "property" column'],
      data: [],
    };
  }

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const obj = csvRowToObject(headers, row);

    const address = row[addressIndex]?.trim();
    if (!address) {
      skipped++;
      continue;
    }

    try {
      const property: PropertyImport = {
        address,
        type: obj.type === 'primary' ? 'primary' : 'rental',
        monthlyRent: obj.monthly_rent || obj.rent
          ? parseFloat(obj.monthly_rent || obj.rent)
          : undefined,
        tenantName: obj.tenant_name || obj.tenant || undefined,
        tenantEmail: obj.tenant_email || undefined,
        tenantPhone: obj.tenant_phone || undefined,
        notes: obj.notes || obj.description || undefined,
      };

      imported.push(property);
    } catch (error) {
      errors.push(`Row ${i + 2}: ${error}`);
      skipped++;
    }
  }

  return {
    success: true,
    imported: imported.length,
    skipped,
    errors,
    data: imported,
  };
}

// ==========================================
// SAMPLE CSV TEMPLATES
// ==========================================

export const CSV_TEMPLATES = {
  tasks: `title,description,priority,due_date,estimated_minutes,tags
"Review Q1 budget","Check all expense reports",high,2025-02-01,30,"finance,review"
"Email John about project","Follow up on timeline",medium,2025-01-25,10,"email,project"
"Schedule dentist appointment","Annual checkup",low,,5,"personal,health"`,

  habits: `name,icon,frequency,time_of_day,xp
"Morning Meditation",🧘,daily,morning,15
"Exercise",💪,weekdays,morning,25
"Read 20 pages",📚,daily,evening,20
"Review finances",💰,weekdays,afternoon,30`,

  clients: `name,email,company,hourly_rate,notes
"John Smith",john@example.com,"Acme Corp",150,"Web development project"
"Sarah Johnson",sarah@startup.io,"TechStartup",175,"Ongoing consulting"
"Mike Williams",mike@agency.com,"Creative Agency",125,"Monthly retainer"`,

  properties: `address,type,monthly_rent,tenant_name,tenant_email,notes
"123 Main St, Apt 1",rental,1500,"Bob Johnson",bob@email.com,"Lease expires June 2025"
"456 Oak Ave",rental,1800,"Alice Smith",alice@email.com,"New tenant as of Jan 2025"
"789 Home Lane",primary,,,,"Primary residence"`,
};

// ==========================================
// EXPORT FUNCTIONS
// ==========================================

export function generateCSV(data: Record<string, any>[], headers?: string[]): string {
  if (data.length === 0) return '';

  const keys = headers || Object.keys(data[0]);
  const rows = [keys.join(',')];

  for (const item of data) {
    const values = keys.map(key => {
      const value = item[key];
      if (value === null || value === undefined) return '';
      const str = String(value);
      // Escape quotes and wrap in quotes if contains comma or quote
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    });
    rows.push(values.join(','));
  }

  return rows.join('\n');
}
