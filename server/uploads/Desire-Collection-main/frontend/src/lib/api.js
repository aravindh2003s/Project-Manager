export const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001').replace(/\/$/, '');

const DEMO_USERS_KEY = 'desire_demo_users';
const DEMO_SESSION_KEY = 'desire_demo_session';

const safeParse = (raw, fallback) => {
  try {
    return JSON.parse(raw ?? '');
  } catch {
    return fallback;
  }
};

export const getApiErrorMessage = (error, fallback = 'Request failed') => {
  if (error?.response?.data?.detail) return error.response.data.detail;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message === 'Network Error' || !error?.response) {
    return `Cannot connect to backend at ${BACKEND_URL}. Start backend server or set REACT_APP_BACKEND_URL.`;
  }
  return fallback;
};

export const getDemoUsers = () => {
  const users = safeParse(localStorage.getItem(DEMO_USERS_KEY), []);
  return Array.isArray(users) ? users : [];
};

export const saveDemoUser = ({ name, email, password }) => {
  const users = getDemoUsers();
  const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    throw new Error('Email already registered in demo mode');
  }

  const user = {
    user_id: `demo_${Date.now()}`,
    name,
    email,
    password,
    role: 'user',
    picture: null,
    created_at: new Date().toISOString(),
    is_demo: true,
  };

  users.push(user);
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
  return user;
};

export const findDemoUser = ({ email, password }) => {
  const users = getDemoUsers();
  return users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  ) || null;
};

export const setDemoSession = (user) => {
  if (!user) return;
  const sessionUser = { ...user };
  delete sessionUser.password;
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(sessionUser));
};

export const getDemoSession = () => {
  const user = safeParse(localStorage.getItem(DEMO_SESSION_KEY), null);
  return user && typeof user === 'object' ? user : null;
};

export const clearDemoSession = () => {
  localStorage.removeItem(DEMO_SESSION_KEY);
};
