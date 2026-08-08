// backend origin (no trailing slash, no /api suffix)
export const API_ORIGIN: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000';

// backend origin with /api prefix, for convenience
export const API_BASE_URL = `${API_ORIGIN}/api`;
