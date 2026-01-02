/**
 * Google Calendar OAuth token management
 * Handles storing, retrieving, and refreshing Google Calendar OAuth tokens
 */

import { supabaseAnalyticsClient } from "../analytics/supabase/client";
import {
  ConfigurationError,
  ExternalAPIError,
} from "../analytics/shared/errors";

const INTEGRATION_NAME = "google_calendar";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
const GOOGLE_CALENDAR_API_BASE = "https://www.googleapis.com/calendar/v3";

export interface GoogleCalendarTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  scope: string;
}

export interface GoogleCalendarTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
  creator?: {
    email?: string;
    displayName?: string;
  };
  attendees?: Array<{
    email?: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  htmlLink?: string;
  status?: string;
  recurringEventId?: string;
  // Added to track which calendar the event came from
  calendarId?: string;
  calendarName?: string;
}

/**
 * Store Google Calendar OAuth tokens in the database
 */
export async function storeGoogleCalendarTokens(
  tokenResponse: GoogleCalendarTokenResponse,
  existingRefreshToken?: string
): Promise<void> {
  try {
    if (!supabaseAnalyticsClient.isConfigured()) {
      throw new ConfigurationError(
        "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
      );
    }

    const supabase = supabaseAnalyticsClient.getClient();

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    const tokenData = {
      integration_name: INTEGRATION_NAME,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || existingRefreshToken || null,
      token_type: tokenResponse.token_type,
      scope: tokenResponse.scope,
      expires_at: expiresAt.toISOString(),
    };

    // Upsert token (replace if exists)
    const { error } = await supabase
      .from("integration_tokens")
      .upsert(tokenData, {
        onConflict: "integration_name",
      });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to store Google Calendar tokens: ${(error as Error).message}`
    );
  }
}

/**
 * Retrieve Google Calendar OAuth tokens from the database
 * Returns null if no tokens are stored
 */
export async function getGoogleCalendarTokens(): Promise<GoogleCalendarTokens | null> {
  try {
    if (!supabaseAnalyticsClient.isConfigured()) {
      return null; // Gracefully handle missing Supabase config
    }

    const supabase = supabaseAnalyticsClient.getClient();

    const { data, error } = await supabase
      .from("integration_tokens")
      .select("*")
      .eq("integration_name", INTEGRATION_NAME)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - no token stored yet
        return null;
      }
      // Handle table not existing (migration not run yet)
      if (
        error.message?.includes("Could not find the table") ||
        error.code === "42P01"
      ) {
        throw new Error(
          `Database migration required: The 'integration_tokens' table does not exist.`
        );
      }
      throw new Error(
        `Failed to retrieve Google Calendar OAuth tokens: ${error.message}`
      );
    }

    if (!data) {
      return null;
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      token_type: data.token_type,
      expires_at: data.expires_at,
      scope: data.scope,
    };
  } catch (error) {
    console.error("Error retrieving Google Calendar tokens:", error);
    return null;
  }
}

/**
 * Check if the current access token is expired or about to expire
 */
export function isTokenExpired(expiresAt: string): boolean {
  const expirationTime = new Date(expiresAt).getTime();
  const now = Date.now();
  // Consider token expired if it expires within the next 5 minutes
  const bufferMs = 5 * 60 * 1000;
  return expirationTime - now < bufferMs;
}

/**
 * Refresh Google Calendar OAuth access token using refresh token
 */
export async function refreshGoogleCalendarToken(): Promise<GoogleCalendarTokens> {
  try {
    const currentTokens = await getGoogleCalendarTokens();

    if (!currentTokens || !currentTokens.refresh_token) {
      throw new ConfigurationError(
        "No refresh token available. Re-authenticate with Google Calendar."
      );
    }

    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new ConfigurationError(
        "GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET must be set"
      );
    }

    // Exchange refresh token for new access token
    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: currentTokens.refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ExternalAPIError(
        "Google Calendar",
        `Token refresh failed: ${response.status} ${errorText}`
      );
    }

    const tokenResponse: GoogleCalendarTokenResponse = await response.json();

    // Store the new tokens (preserve existing refresh token if not provided)
    await storeGoogleCalendarTokens(tokenResponse, currentTokens.refresh_token);

    // Return the updated tokens
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);

    return {
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token || currentTokens.refresh_token,
      token_type: tokenResponse.token_type,
      expires_at: expiresAt.toISOString(),
      scope: tokenResponse.scope,
    };
  } catch (error) {
    if (
      error instanceof ConfigurationError ||
      error instanceof ExternalAPIError
    ) {
      throw error;
    }
    throw new ExternalAPIError(
      "Google Calendar",
      `Failed to refresh token: ${(error as Error).message}`
    );
  }
}

/**
 * Get valid Google Calendar access token, refreshing if necessary
 */
export async function getValidGoogleCalendarToken(): Promise<string | null> {
  try {
    const tokens = await getGoogleCalendarTokens();

    if (!tokens) {
      return null;
    }

    // Check if token needs refresh
    if (isTokenExpired(tokens.expires_at)) {
      const refreshedTokens = await refreshGoogleCalendarToken();
      return refreshedTokens.access_token;
    }

    return tokens.access_token;
  } catch (error) {
    console.error("Error getting valid Google Calendar token:", error);
    return null;
  }
}

/**
 * Revoke Google Calendar OAuth token and delete from database
 */
export async function revokeGoogleCalendarToken(): Promise<void> {
  try {
    const tokens = await getGoogleCalendarTokens();

    if (!tokens) {
      return; // Nothing to revoke
    }

    // Revoke token with Google
    try {
      const response = await fetch(
        `${GOOGLE_REVOKE_ENDPOINT}?token=${tokens.access_token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (!response.ok && response.status !== 400) {
        // 400 means token is already invalid, which is fine
        console.warn(`Google Calendar token revocation returned ${response.status}`);
      }
    } catch (error) {
      // Continue even if revocation fails - still delete from database
      console.error("Error revoking token with Google:", error);
    }

    // Delete token from database
    if (!supabaseAnalyticsClient.isConfigured()) {
      throw new ConfigurationError("Supabase is not configured");
    }

    const supabase = supabaseAnalyticsClient.getClient();

    const { error } = await supabase
      .from("integration_tokens")
      .delete()
      .eq("integration_name", INTEGRATION_NAME);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to revoke Google Calendar token: ${(error as Error).message}`
    );
  }
}

/**
 * Check if Google Calendar OAuth is configured and connected
 */
export async function isGoogleCalendarConnected(): Promise<boolean> {
  const tokens = await getGoogleCalendarTokens();
  return tokens !== null;
}

/**
 * Fetch calendar metadata to get the calendar name
 */
async function fetchCalendarMetadata(
  calendarId: string,
  accessToken: string
): Promise<{ id: string; name: string }> {
  try {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return { id: calendarId, name: calendarId };
    }

    const data = await response.json();
    return { id: calendarId, name: data.summary || calendarId };
  } catch {
    return { id: calendarId, name: calendarId };
  }
}

/**
 * Fetch events from a single Google Calendar
 */
async function fetchEventsFromCalendar(
  calendarId: string,
  calendarName: string,
  startDate: Date,
  endDate: Date,
  accessToken: string
): Promise<GoogleCalendarEvent[]> {
  const params = new URLSearchParams({
    timeMin: startDate.toISOString(),
    timeMax: endDate.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to fetch events from calendar ${calendarId}: ${response.status} ${errorText}`);
    // Return empty array instead of throwing - allows other calendars to still work
    return [];
  }

  const data = await response.json();
  const events: GoogleCalendarEvent[] = data.items || [];
  
  // Add calendar metadata to each event
  return events.map((event) => ({
    ...event,
    calendarId,
    calendarName,
  }));
}

/**
 * Fetch events from Google Calendar for a given date range
 * Supports multiple calendars via comma-separated GOOGLE_CALENDAR_IDS env var
 */
export async function fetchGoogleCalendarEvents(
  startDate: Date,
  endDate: Date
): Promise<GoogleCalendarEvent[]> {
  const accessToken = await getValidGoogleCalendarToken();

  if (!accessToken) {
    throw new ConfigurationError("Google Calendar is not connected");
  }

  // Support both single calendar (GOOGLE_CALENDAR_ID) and multiple calendars (GOOGLE_CALENDAR_IDS)
  const singleCalendarId = process.env.GOOGLE_CALENDAR_ID;
  const multipleCalendarIds = process.env.GOOGLE_CALENDAR_IDS;
  
  let calendarIds: string[];
  
  if (multipleCalendarIds) {
    // Parse comma-separated calendar IDs
    calendarIds = multipleCalendarIds.split(",").map((id) => id.trim()).filter(Boolean);
  } else if (singleCalendarId) {
    calendarIds = [singleCalendarId];
  } else {
    calendarIds = ["primary"];
  }

  // Fetch calendar metadata for all calendars
  const calendarMetadata = await Promise.all(
    calendarIds.map((id) => fetchCalendarMetadata(id, accessToken))
  );

  // Fetch events from all calendars in parallel
  const eventPromises = calendarMetadata.map(({ id, name }) =>
    fetchEventsFromCalendar(id, name, startDate, endDate, accessToken)
  );

  const allEventsArrays = await Promise.all(eventPromises);
  
  // Flatten and sort by start time
  const allEvents = allEventsArrays.flat();
  allEvents.sort((a, b) => {
    const aStart = a.start.dateTime || a.start.date || "";
    const bStart = b.start.dateTime || b.start.date || "";
    return aStart.localeCompare(bStart);
  });

  return allEvents;
}

