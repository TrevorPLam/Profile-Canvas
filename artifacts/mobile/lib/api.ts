import { setBaseUrl, customFetch } from '@workspace/api-client-react';

/**
 * Mobile API client configuration
 *
 * This module configures the API client for the mobile app with:
 * - Base URL from environment variable
 * - Cookie-based session management (credentials: include)
 *
 * IMPORTANT: React Native's fetch does not automatically handle cookies like browsers do.
 * For production builds, you MUST use a cookie manager library:
 * - expo-cookies (requires dev build): https://docs.expo.dev/versions/latest/sdk/cookies/
 * - @react-native-cookies/cookies (requires dev build)
 *
 * SETUP INSTRUCTIONS:
 * 1. Install cookie manager: npx expo install expo-cookies
 * 2. Add to app.json plugins: ["expo-cookies"]
 * 3. Create a development build (not Expo Go)
 * 4. Initialize cookies in your app entry point
 *
 * For development with Expo Go, cookies will not persist across requests.
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
  return await customFetch<T>(input, {
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
