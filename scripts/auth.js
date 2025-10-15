import { login } from "./api.js";

const USER_KEY = "userSession";

/**
 * Log in a user and store session in localStorage.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>} user data
 */
export async function loginUser(username, password) {
  try {
    const res = await login(username, password);

    if (!res.success) {
      throw new Error(res.error || "Login failed");
    }

    // Save user info to localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));

    return res.user;
  } catch (err) {
    console.error("Login error:", err.message);
    throw err;
  }
}

/**
 * Log out the user and clear stored session.
 */
export function logoutUser() {
  localStorage.removeItem(USER_KEY);
}

/**
 * Get currently logged-in user from localStorage.
 * @returns {object|null}
 */
export function getCurrentUser() {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

/**
 * Check if a user is logged in.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getCurrentUser();
}
