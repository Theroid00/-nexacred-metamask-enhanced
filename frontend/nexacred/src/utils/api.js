/**
 * Shared API Helper for NexaCred.
 * Automatically appends Authorization JWT headers and dispatches logout events on 401.
 */
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = url.startsWith('http') ? url : `${apiUrl}${cleanUrl}`;

  const fetchOptions = {
    ...options,
    headers,
  };

  const response = await fetch(fullUrl, fetchOptions);

  if (response.status === 401) {
    console.warn("Session expired or unauthorized (401). Logging out user.");
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-unauthorized'));
  }

  return response;
}
