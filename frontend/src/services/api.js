const BASE_URL = 'http://localhost:8000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

// AUTH
export const signup = (body) =>
  fetch(`${BASE_URL}/auth/signup`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse);

export const login = (body) =>
  fetch(`${BASE_URL}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse);

// TASKS
export const getTasks = () =>
  fetch(`${BASE_URL}/tasks`, { headers: getHeaders() }).then(handleResponse);

export const createTask = (body) =>
  fetch(`${BASE_URL}/tasks`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse);

export const updateTaskStatus = (id, status) =>
  fetch(`${BASE_URL}/tasks/${id}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status }) }).then(handleResponse);

// TASK ASSIGNMENTS
export const assignTask = (body) =>
  fetch(`${BASE_URL}/task-assignments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(body) }).then(handleResponse);

// USERS (for assignment dropdown — extend if your backend supports it)
export const getUsers = () =>
  fetch(`${BASE_URL}/users`, { headers: getHeaders() }).then(handleResponse);

// STORIES (for task creation dropdown)
export const getStories = () =>
  fetch(`${BASE_URL}/stories`, { headers: getHeaders() }).then(handleResponse);
