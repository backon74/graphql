import { getToken, login, logout, decodeJwtPayload } from './auth.js';
import { fetchUserData, fetchXpTransactions, fetchAuditTotals, fetchResults } from './api.js';
import { drawXpOverTime, drawAuditRatio } from './graphs.js';

const viewLogin = document.getElementById('view-login');
const viewProfile = document.getElementById('view-profile');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

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

function infoRow(label, value, big = false) {
  return `
    <div class="info-row">
      <span class="info-label">${label}</span>
      <span class="info-value${big ? ' big' : ''}">${value}</span>
    </div>
  `;
}

function formatXp(bytes) {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} kB`;
  return `${bytes} B`;
}

async function loadProfile() {
  try {
    const [userData, xpTransactions, auditTotals, results] = await Promise.all([
      fetchUserData(),
      fetchXpTransactions(),
      fetchAuditTotals(),
      fetchResults(),
    ]);

    // welcome heading above cards
    const firstName = userData.firstName
      ? userData.firstName.charAt(0).toUpperCase() + userData.firstName.slice(1)
      : null;
    const displayName = firstName || userData.login;
    document.getElementById('welcome-heading').textContent = `Welcome, ${displayName}!`;
    document.getElementById('today-date').textContent = new Date().toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    // identity section
    const identityEl = document.getElementById('identity-content');
    identityEl.classList.remove('loading');
    const memberSince = xpTransactions.length > 0
      ? new Date(xpTransactions[0].createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : 'n/a';
    identityEl.innerHTML =
      infoRow('login', userData.login) +
      infoRow('email', userData.email) +
      infoRow('member since', memberSince) +
      infoRow('id', userData.id);

    // xp section
    const totalXp = xpTransactions.reduce((sum, t) => sum + t.amount, 0);
    const xpEl = document.getElementById('xp-content');
    xpEl.classList.remove('loading');
    xpEl.innerHTML =
      infoRow('total xp', formatXp(totalXp), true) +
      infoRow('transactions', xpTransactions.length);

    // audits section
    const { totalUp, totalDown } = auditTotals;
    const ratio = totalDown > 0 ? (totalUp / totalDown).toFixed(2) : 'n/a';
    const auditsEl = document.getElementById('audits-content');
    auditsEl.classList.remove('loading');
    auditsEl.innerHTML =
      infoRow('ratio', ratio, true) +
      infoRow('xp given', formatXp(totalUp)) +
      infoRow('xp received', formatXp(totalDown));

    // projects section
    const passed = results.filter(r => r.grade >= 1);
    const failed = results.filter(r => r.grade === 0);
    const passRate = results.length > 0
      ? Math.round((passed.length / results.length) * 100)
      : 0;
    const recentPassed = passed.slice(0, 3);
    const projectsEl = document.getElementById('projects-content');
    projectsEl.classList.remove('loading');

    const recentHtml = recentPassed.map(r => {
      const date = new Date(r.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
      return infoRow(r.object.name, date);
    }).join('');

    projectsEl.innerHTML = `
      <div class="projects-stats">
        ${infoRow('completed', passed.length, true)}
        ${infoRow('failed', failed.length)}
        ${infoRow('pass rate', `${passRate}%`)}
      </div>
      ${recentPassed.length > 0 ? `
        <p class="projects-recent-label">Recently passed</p>
        <div class="projects-recent">${recentHtml}</div>
      ` : ''}
    `;

    // graphs
    drawXpOverTime(document.getElementById('graph-xp-over-time'), xpTransactions);
    drawAuditRatio(document.getElementById('graph-audit-ratio'), totalUp, totalDown);

  } catch (err) {
    // if the token is rejected by the api, fall back to login
    if (err.message.includes('401') || err.message.toLowerCase().includes('jwt') || err.message.toLowerCase().includes('unauthorized')) {
      logout();
      showLogin();
    } else {
      console.error('failed to load profile:', err);
    }
  }
}

async function init() {
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
    await loadProfile();
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
    await loadProfile();
  } catch (err) {
    setError(err.message || 'login failed, check your credentials');
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'log in';
  }
});

logoutBtn.addEventListener('click', () => {
  logout();
  showLogin();
  loginForm.reset();
  clearError();

  // reset profile content to loading state for next login
  document.getElementById('identity-content').innerHTML = 'loading...';
  document.getElementById('identity-content').classList.add('loading');
  document.getElementById('xp-content').innerHTML = 'loading...';
  document.getElementById('xp-content').classList.add('loading');
  document.getElementById('audits-content').innerHTML = 'loading...';
  document.getElementById('audits-content').classList.add('loading');
  document.getElementById('projects-content').innerHTML = 'loading...';
  document.getElementById('projects-content').classList.add('loading');
  document.getElementById('graph-xp-over-time').innerHTML = '';
  document.getElementById('graph-audit-ratio').innerHTML = '';
});

init();
