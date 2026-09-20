import { getToken, login, logout, decodeJwtPayload } from './auth.js';

const viewLogin = document.getElementById('view-login');
const viewProfile = document.getElementById('view-profile');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');

function showLogin() {
  viewLogin.classList.remove('hidden');
  viewProfile.classList.add('hidden');
}

function showProfile() {
  viewLogin.classList.add('hidden');
  viewProfile.classList.remove('hidden');
}

function setError(msg) {
  loginError.textContent = msg;
}

function clearError() {
  loginError.textContent = '';
}

function init() {
  const token = getToken();
  if (token) {
    try {
      decodeJwtPayload(token);
    } catch {
      logout();
      showLogin();
      return;
    }
    showProfile();
  } else {
    showLogin();
  }
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const identifier = document.getElementById('identifier').value.trim();
  const password = document.getElementById('password').value;

  if (!identifier || !password) {
    setError('enter username/email and password');
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = 'logging in...';

  try {
    await login(identifier, password);
    showProfile();
  } catch (err) {
    setError(err.message || 'login failed, check your credentials');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'log in';
  }
});

init();
