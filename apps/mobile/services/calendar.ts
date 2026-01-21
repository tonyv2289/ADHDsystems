// ============================================
// CALENDAR INTEGRATION SERVICE
// Sync with Google Calendar
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// ==========================================
// TYPES
// ==========================================

export interface CalendarConfig {
  provider: 'google';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  calendarId?: string;
  isEnabled: boolean;
}

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  reminders?: number[]; // minutes before
}

export interface TaskToCalendarOptions {
  taskId: string;
  title: string;
  description?: string;
  dueDate: Date;
  estimatedMinutes: number;
  addReminder?: boolean;
}

// ==========================================
// CONFIGURATION
// ==========================================

const CALENDAR_CONFIG_KEY = 'calendar_config';

// You'll need to replace these with your own Google Cloud Console credentials
// Go to https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_IOS = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_ANDROID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';

export async function saveCalendarConfig(config: CalendarConfig): Promise<void> {
  await AsyncStorage.setItem(CALENDAR_CONFIG_KEY, JSON.stringify(config));
}

export async function getCalendarConfig(): Promise<CalendarConfig | null> {
  const stored = await AsyncStorage.getItem(CALENDAR_CONFIG_KEY);
  return stored ? JSON.parse(stored) : null;
}

export async function clearCalendarConfig(): Promise<void> {
  await AsyncStorage.removeItem(CALENDAR_CONFIG_KEY);
}

// ==========================================
// GOOGLE OAUTH
// ==========================================

export function useGoogleCalendarAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    iosClientId: GOOGLE_CLIENT_ID_IOS,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
    redirectUri: makeRedirectUri({
      scheme: 'momentum',
    }),
  });

  return { request, response, promptAsync };
}

export async function handleGoogleAuthResponse(
  response: any
): Promise<CalendarConfig | null> {
  if (response?.type === 'success') {
    const { authentication } = response;

    if (authentication?.accessToken) {
      const config: CalendarConfig = {
        provider: 'google',
        accessToken: authentication.accessToken,
        refreshToken: authentication.refreshToken,
        expiresAt: authentication.expiresIn
          ? Date.now() + authentication.expiresIn * 1000
          : undefined,
        isEnabled: true,
      };

      await saveCalendarConfig(config);
      return config;
    }
  }

  return null;
}

// ==========================================
// GOOGLE CALENDAR API
// ==========================================

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

async function getAuthHeaders(): Promise<Headers | null> {
  const config = await getCalendarConfig();
  if (!config || !config.accessToken) {
    console.log('No calendar config found');
    return null;
  }

  // Check if token is expired
  if (config.expiresAt && Date.now() > config.expiresAt) {
    console.log('Token expired, need to refresh');
    // TODO: Implement token refresh
    return null;
  }

  return new Headers({
    Authorization: `Bearer ${config.accessToken}`,
    'Content-Type': 'application/json',
  });
}

export async function getCalendars(): Promise<any[]> {
  const headers = await getAuthHeaders();
  if (!headers) return [];

  try {
    const response = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
      headers,
    });

    if (!response.ok) {
      console.error('Failed to fetch calendars:', response.status);
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return [];
  }
}

export async function createCalendarEvent(
  event: CalendarEvent,
  calendarId: string = 'primary'
): Promise<string | null> {
  const headers = await getAuthHeaders();
  if (!headers) return null;

  const eventBody = {
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: event.endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    location: event.location,
    reminders: event.reminders
      ? {
          useDefault: false,
          overrides: event.reminders.map(minutes => ({
            method: 'popup',
            minutes,
          })),
        }
      : { useDefault: true },
  };

  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      console.error('Failed to create event:', response.status);
      return null;
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return null;
  }
}

export async function updateCalendarEvent(
  eventId: string,
  event: Partial<CalendarEvent>,
  calendarId: string = 'primary'
): Promise<boolean> {
  const headers = await getAuthHeaders();
  if (!headers) return false;

  const eventBody: any = {};

  if (event.title) eventBody.summary = event.title;
  if (event.description) eventBody.description = event.description;
  if (event.location) eventBody.location = event.location;
  if (event.startTime) {
    eventBody.start = {
      dateTime: event.startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }
  if (event.endTime) {
    eventBody.end = {
      dateTime: event.endTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(eventBody),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return false;
  }
}

export async function deleteCalendarEvent(
  eventId: string,
  calendarId: string = 'primary'
): Promise<boolean> {
  const headers = await getAuthHeaders();
  if (!headers) return false;

  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: 'DELETE',
        headers,
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return false;
  }
}

export async function getUpcomingEvents(
  calendarId: string = 'primary',
  maxResults: number = 10
): Promise<any[]> {
  const headers = await getAuthHeaders();
  if (!headers) return [];

  const now = new Date().toISOString();

  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?` +
        `timeMin=${encodeURIComponent(now)}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
      { headers }
    );

    if (!response.ok) {
      console.error('Failed to fetch events:', response.status);
      return [];
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
}

// ==========================================
// TASK TO CALENDAR SYNC
// ==========================================

// Map task IDs to calendar event IDs
const TASK_CALENDAR_MAP_KEY = 'task_calendar_map';

async function getTaskCalendarMap(): Promise<Record<string, string>> {
  const stored = await AsyncStorage.getItem(TASK_CALENDAR_MAP_KEY);
  return stored ? JSON.parse(stored) : {};
}

async function saveTaskCalendarMap(map: Record<string, string>): Promise<void> {
  await AsyncStorage.setItem(TASK_CALENDAR_MAP_KEY, JSON.stringify(map));
}

export async function syncTaskToCalendar(
  options: TaskToCalendarOptions
): Promise<string | null> {
  const config = await getCalendarConfig();
  if (!config || !config.isEnabled) {
    console.log('Calendar sync not enabled');
    return null;
  }

  const startTime = new Date(options.dueDate);
  startTime.setMinutes(startTime.getMinutes() - options.estimatedMinutes);

  const event: CalendarEvent = {
    title: `📋 ${options.title}`,
    description: options.description || 'Task from Momentum',
    startTime,
    endTime: options.dueDate,
    reminders: options.addReminder ? [30, 10] : undefined,
  };

  const eventId = await createCalendarEvent(event, config.calendarId || 'primary');

  if (eventId) {
    const map = await getTaskCalendarMap();
    map[options.taskId] = eventId;
    await saveTaskCalendarMap(map);
  }

  return eventId;
}

export async function removeTaskFromCalendar(taskId: string): Promise<boolean> {
  const config = await getCalendarConfig();
  if (!config) return false;

  const map = await getTaskCalendarMap();
  const eventId = map[taskId];

  if (!eventId) {
    console.log('No calendar event found for task');
    return false;
  }

  const success = await deleteCalendarEvent(eventId, config.calendarId || 'primary');

  if (success) {
    delete map[taskId];
    await saveTaskCalendarMap(map);
  }

  return success;
}

// ==========================================
// SETUP INSTRUCTIONS
// ==========================================

export const CALENDAR_SETUP_INSTRUCTIONS = `
## How to set up Google Calendar Integration

### For Development:
1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable the Google Calendar API
4. Go to "Credentials" > "Create Credentials" > "OAuth client ID"
5. For iOS: Select "iOS" and add your bundle ID
6. For Android: Select "Android" and add your package name + SHA-1
7. For Web/Expo Go: Select "Web application"
8. Copy the client IDs and update calendar.ts

### For Users:
1. Tap "Connect Google Calendar" in Settings
2. Sign in with your Google account
3. Allow Momentum to access your calendar
4. Select which calendar to sync tasks to

Your tasks with due dates will automatically appear on your calendar!
`;
