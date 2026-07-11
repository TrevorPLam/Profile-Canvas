import { setBaseUrl, customFetch } from '@workspace/api-client-react';

/**
 * Mobile API client configuration
 *
 * This module configures the API client for the mobile app with:
 * - Base URL from environment variable
 * - Cookie-based session management (credentials: include)
 *
 * NOTE: React Native's fetch does not automatically handle cookies like browsers do.
 * For production apps, consider using a cookie manager library like:
 * - expo-cookies (requires dev build)
 * - @preeternal/react-native-cookie-manager (requires dev build)
 *
 * For development with Expo Go, cookies may not persist across requests.
 * The backend uses HTTP-only cookies for session management.
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Configure the base URL for all API requests
setBaseUrl(API_BASE_URL);

/**
 * Typed fetch wrapper for API requests
 *
 * Automatically includes credentials (cookies) for session management.
 * Use this for all API calls to the backend.
 */
export async function apiFetch<T = unknown>(
  input: RequestInfo | URL,
  options?: RequestInit
): Promise<T> {
  return customFetch<T>(input, {
    ...options,
    credentials: 'include',
  });
}

/**
 * Get the configured API base URL
 */
export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
