const TOKEN_KEY = 'gql_profile_jwt';
const SIGNIN_URL = 'https://learn.reboot01.com/api/auth/signin';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// jwt payload is base64url, not base64. replace chars and pad before atob.
export function decodeJwtPayload(token) {
  const base64url = token.split('.')[1];
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
  return JSON.parse(atob(padded));
}

export async function login(identifier, password) {
  const credentials = btoa(`${identifier}:${password}`);

  const response = await fetch(SIGNIN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `login failed (${response.status})`);
  }

  const body = await response.text();
  // the api sometimes wraps the jwt in quotes, strip them
  const token = body.trim().replace(/^"|"$/g, '');

  if (!token || token.split('.').length !== 3) {
    throw new Error('unexpected response from server');
  }

  saveToken(token);
  return token;
}

export function logout() {
  clearToken();
}
