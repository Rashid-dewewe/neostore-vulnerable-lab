// NeoStore Lab - shared frontend helpers.
// NOTE: storing the JWT in localStorage (instead of an httpOnly cookie) is
// itself a deliberate, realistic weak point for this lab - it makes the
// token readable by any JS running on the page, which matters if you go on
// to chain in an XSS finding elsewhere in the app.
const API_BASE = '/api';

const Auth = {
  getToken() { return localStorage.getItem('neostore_token'); },
  setSession(token, user) {
    localStorage.setItem('neostore_token', token);
    localStorage.setItem('neostore_user', JSON.stringify(user));
  },
  getUser() {
    try { return JSON.parse(localStorage.getItem('neostore_user')); } catch { return null; }
  },
  logout() {
    localStorage.removeItem('neostore_token');
    localStorage.removeItem('neostore_user');
    window.location.href = '/index.html';
  },
  isLoggedIn() { return !!this.getToken(); },
};

async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const token = Auth.getToken();
  const finalHeaders = { 'Content-Type': 'application/json', ...headers };
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function money(n) {
  return `$${Number(n).toFixed(2)}`;
}

function toast(msg, kind = 'info') {
  const el = document.createElement('div');
  el.textContent = msg;
  const colors = {
    info: 'background:#0041c8;color:#fff;',
    error: 'background:#ba1a1a;color:#fff;',
    success: 'background:#1a7f37;color:#fff;',
  };
  el.style.cssText = `position:fixed;bottom:20px;right:20px;padding:12px 18px;border-radius:6px;
    font-family:Inter,sans-serif;font-size:14px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,0.15);${colors[kind]}`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

function renderNav(activePage = '') {
  const navEl = document.getElementById('site-nav');
  if (!navEl) return;
  const user = Auth.getUser();
  const loggedIn = Auth.isLoggedIn();
  const isStaff = user && (user.role === 'admin' || user.role === 'support');

  navEl.innerHTML = `
    <div class="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
      <a href="/index.html" class="font-display font-bold text-xl tracking-tight" style="color:var(--color-on-surface)">
        Neo<span style="color:var(--color-primary)">Store</span>
      </a>
      <div class="flex items-center gap-5 text-sm font-medium">
        <a href="/index.html" class="hover:text-[var(--color-primary)]">Shop</a>
        <a href="/cart.html" class="hover:text-[var(--color-primary)]">Cart</a>
        ${loggedIn ? `<a href="/orders.html" class="hover:text-[var(--color-primary)]">Orders</a>` : ''}
        ${loggedIn ? `<a href="/profile.html" class="hover:text-[var(--color-primary)]">Profile</a>` : ''}
        ${isStaff ? `<a href="/admin/dashboard.html" class="hover:text-[var(--color-primary)] font-mono text-xs badge badge-neutral">ADMIN</a>` : ''}
        ${loggedIn
          ? `<button id="nav-logout" class="btn-secondary !py-1.5 !px-3 text-xs">Log out (${user.full_name.split(' ')[0]})</button>`
          : `<a href="/login.html" class="btn-primary !py-1.5 !px-3 text-xs">Log in</a>`}
      </div>
    </div>`;
  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());
}

function requireLoginOrRedirect() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}
