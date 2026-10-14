const API_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export async function apiRequest(endpoint, options = {}) {
  const { token, headers, ...fetchOptions } = options;

  const authToken =
    token || localStorage.getItem('clinicqueue_token');

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(authToken
        ? { Authorization: `Bearer ${authToken}` }
        : {}),
      ...headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationErrors = data.errors
      ? Object.values(data.errors).flat().join(' ')
      : '';

    throw new Error(
      validationErrors || data.message || 'Request failed.'
    );
  }

  return data;
}