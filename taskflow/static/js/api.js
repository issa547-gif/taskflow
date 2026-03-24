/**
 * TaskFlow API Client
 * Handles JWT auth, automatic token refresh, and all API calls.
 */

const API = (() => {
  const BASE = '/api';
  const STORAGE = {
    access:  'tf_access',
    refresh: 'tf_refresh',
    user:    'tf_user',
  };

  /* ── Token helpers ─────────────────────────── */
  const getAccess  = () => localStorage.getItem(STORAGE.access);
  const getRefresh = () => localStorage.getItem(STORAGE.refresh);
  const getUser    = () => { try { return JSON.parse(localStorage.getItem(STORAGE.user)); } catch { return null; } };

  const saveTokens = (access, refresh) => {
    localStorage.setItem(STORAGE.access, access);
    if (refresh) localStorage.setItem(STORAGE.refresh, refresh);
  };

  const saveUser = (user) => localStorage.setItem(STORAGE.user, JSON.stringify(user));

  const clearAuth = () => {
    localStorage.removeItem(STORAGE.access);
    localStorage.removeItem(STORAGE.refresh);
    localStorage.removeItem(STORAGE.user);
  };

  const isLoggedIn = () => !!getAccess();

  /* ── Token refresh ─────────────────────────── */
  let _refreshPromise = null;

  const refreshAccessToken = async () => {
    if (_refreshPromise) return _refreshPromise;

    _refreshPromise = (async () => {
      const refresh = getRefresh();
      if (!refresh) throw new Error('No refresh token');

      const res = await fetch(`${BASE}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (!res.ok) {
        clearAuth();
        window.location.href = '/login/';
        throw new Error('Session expired');
      }

      const data = await res.json();
      saveTokens(data.access, data.refresh || refresh);
      return data.access;
    })();

    _refreshPromise.finally(() => { _refreshPromise = null; });
    return _refreshPromise;
  };

  /* ── Core fetch wrapper ────────────────────── */
  const request = async (path, options = {}, retry = true) => {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, { ...options, headers });

    // Token expired → refresh and retry once
    if (res.status === 401 && retry) {
      try {
        await refreshAccessToken();
        return request(path, options, false);
      } catch {
        return res;
      }
    }

    return res;
  };

  const json = async (path, options = {}) => {
    const res = await request(path, options);
    let data;
    try { data = await res.json(); } catch { data = {}; }
    if (!res.ok) throw { status: res.status, data };
    return data;
  };

  /* ── Auth endpoints ────────────────────────── */
  const auth = {
    register: async (payload) => {
      const data = await json('/auth/register/', {
        method: 'POST', body: JSON.stringify(payload),
      });
      saveTokens(data.tokens.access, data.tokens.refresh);
      saveUser(data.user);
      return data;
    },

    login: async (email, password) => {
      const data = await json('/auth/login/', {
        method: 'POST', body: JSON.stringify({ email, password }),
      });
      saveTokens(data.access, data.refresh);
      saveUser(data.user);
      return data;
    },

    logout: async () => {
      const refresh = getRefresh();
      try {
        await json('/auth/logout/', { method: 'POST', body: JSON.stringify({ refresh }) });
      } finally {
        clearAuth();
        window.location.href = '/login/';
      }
    },

    me: () => json('/auth/me/'),

    updateProfile: (payload) => json('/auth/me/', { method: 'PATCH', body: JSON.stringify(payload) }),

    changePassword: (payload) => json('/auth/change-password/', { method: 'POST', body: JSON.stringify(payload) }),
  };

  /* ── Task endpoints ────────────────────────── */
  const tasks = {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return json(`/tasks/${qs ? '?' + qs : ''}`);
    },

    get: (id) => json(`/tasks/${id}/`),

    create: (payload) => json('/tasks/', { method: 'POST', body: JSON.stringify(payload) }),

    update: (id, payload) => json(`/tasks/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }),

    delete: (id) => json(`/tasks/${id}/`, { method: 'DELETE' }),

    stats: () => json('/tasks/stats/'),

    togglePin: (id) => json(`/tasks/${id}/pin/`, { method: 'POST' }),
  };

  return { auth, tasks, isLoggedIn, getUser, saveUser };
})();

/* ── Toast notification system ──────────────── */
const Toast = (() => {
  let container;

  const init = () => {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  };

  const show = (message, type = 'info', duration = 3500) => {
    if (!container) init();

    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s, transform 0.3s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(10px)';
      setTimeout(() => toast.remove(), 350);
    }, duration);
  };

  return {
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error'),
    info:    (msg) => show(msg, 'info'),
  };
})();

/* ── Auth guard: redirect if not logged in ── */
const requireAuth = () => {
  if (!API.isLoggedIn()) {
    window.location.href = '/login/';
    return false;
  }
  return true;
};

/* ── Form helpers ───────────────────────────── */
const FormHelper = {
  clearErrors: (form) => {
    form.querySelectorAll('.form-error').forEach(el => el.remove());
    form.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(el => {
      el.style.borderColor = '';
    });
  },

  showErrors: (form, errors) => {
    FormHelper.clearErrors(form);
    Object.entries(errors).forEach(([field, messages]) => {
      const input = form.querySelector(`[name="${field}"]`);
      if (input) {
        input.style.borderColor = 'var(--red)';
        const err = document.createElement('p');
        err.className = 'form-error';
        err.textContent = Array.isArray(messages) ? messages[0] : messages;
        input.parentNode.insertBefore(err, input.nextSibling);
      }
    });
    // Show non-field errors
    const nonField = errors.non_field_errors || errors.detail;
    if (nonField) Toast.error(Array.isArray(nonField) ? nonField[0] : nonField);
  },

  setLoading: (btn, loading) => {
    if (loading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.textContent;
      btn.textContent = '';
      btn.classList.add('btn-loading');
      btn.style.position = 'relative';
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.originalText || btn.textContent;
      btn.classList.remove('btn-loading');
    }
  },
};
