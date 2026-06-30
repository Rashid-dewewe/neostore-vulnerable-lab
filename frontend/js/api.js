const API_BASE = '/api';

const Auth = {
  getToken() { 
    return localStorage.getItem('neostore_token'); 
  },
  setSession(token, user) {
    localStorage.setItem('neostore_token', token);
    localStorage.setItem('neostore_user', JSON.stringify(user));
    console.log('Session stored:', { token, user });
  },
  getUser() {
    try { 
      const user = JSON.parse(localStorage.getItem('neostore_user')); 
      console.log('Retrieved user:', user);
      return user;
    } catch { 
      return null; 
    }
  },
  logout() {
    localStorage.removeItem('neostore_token');
    localStorage.removeItem('neostore_user');
    window.location.href = '/index.html';
  },
  isLoggedIn() { 
    const token = this.getToken();
    const user = this.getUser();
    return !!token && !!user; 
  },
  isAdmin() {
    const user = this.getUser();
    return user && (user.role === 'admin' || user.role === 'support');
  }
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
  const data = isJson ? await res.json() : null;
  
  if (!res.ok) {
    throw new Error(data && data.error ? data.error : 'System execution anomaly.');
  }
  return data;
}

function money(num) {
  return '$' + Number(num).toFixed(2);
}

function toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `fixed bottom-5 right-5 px-4 py-2.5 rounded shadow text-xs font-medium transition-all transform translate-y-0 z-50`;
  if (type === 'error') {
    t.style.background = 'var(--color-error-container)';
    t.style.color = 'var(--color-on-error-container)';
  } else {
    t.style.background = 'var(--color-success-container)';
    t.style.color = 'var(--color-success)';
  }
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

function renderNav() {
  const navEl = document.getElementById('site-nav');
  if (!navEl) return;
  const user = Auth.getUser();
  const loggedIn = Auth.isLoggedIn();
  const isStaff = user && (user.role === 'admin' || user.role === 'support');

  navEl.innerHTML = `
    <div class=\"max-w-7xl mx-auto flex items-center justify-between px-6 py-4\">
      <a href=\"/index.html\" class=\"font-display font-bold text-xl tracking-tight\" style=\"color:var(--color-on-surface)\">
        Neo<span style=\"color:var(--color-primary)\">Store</span>
      </a>
      <div class=\"flex items-center gap-5 text-sm font-medium\">
        <a href=\"/index.html\" class=\"hover:text-[var(--color-primary)]\">Shop</a>
        <a href=\"/cart.html\" class=\"hover:text-[var(--color-primary)]\">Cart</a>
        ${loggedIn ? `<a href=\"/orders.html\" class=\"hover:text-[var(--color-primary)]\">Orders</a>` : ''}
        ${loggedIn ? `<a href=\"/profile.html\" class=\"hover:text-[var(--color-primary)]\">Profile</a>` : ''}
        ${isStaff ? `<a href=\"/admin/dashboard.html\" class=\"font-mono text-xs badge badge-neutral\" style=\"background:var(--color-primary);color:white;\">ADMIN</a>` : ''}
        ${loggedIn
          ? `<button id=\"nav-logout\" class=\"btn-secondary !py-1.5 !px-3 text-xs\">Log out (${user ? user.full_name.split(' ')[0] : 'User'})</button>`
          : `<a href=\"/login.html\" class=\"btn-primary !py-1.5 !px-3 text-xs\">Log in</a>`}
      </div>
    </div>`;

  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());
}