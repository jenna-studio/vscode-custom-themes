import { readFile } from "fs/promises";

// Configuration constants
const MAX_RETRIES = 3;
const API_URL = "https://api.example.com/v2";
const TIMEOUT = 5000;

/**
 * Fetches user data from the API with retry logic.
 * @param {string} userId - The user's unique identifier
 * @returns {Promise<Object>} The user data object
 */
async function fetchUserData(userId, options = {}) {
  const { retries = MAX_RETRIES, timeout = TIMEOUT } = options;
  let lastError = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`${API_URL}/users/${userId}`, {
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return { success: true, data, attempts: attempt + 1 };
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1} failed: ${error.message}`);
    }
  }

  return { success: false, error: lastError?.message, attempts: retries };
}

// A class demonstrating OOP patterns
class UserService {
  #cache = new Map();

  constructor(baseUrl = API_URL) {
    this.baseUrl = baseUrl;
    this.isConnected = false;
  }

  async getUser(id) {
    if (this.#cache.has(id)) {
      return this.#cache.get(id);
    }

    const result = await fetchUserData(id);
    if (result.success) {
      this.#cache.set(id, result.data);
    }
    return result;
  }

  get cacheSize() {
    return this.#cache.size;
  }

  static formatName(user) {
    const { firstName, lastName } = user;
    return `${firstName} ${lastName}`;
  }
}

// Array methods and arrow functions
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const evens = numbers.filter((n) => n % 2 === 0);
const doubled = evens.map((n) => n * 2);
const sum = doubled.reduce((acc, val) => acc + val, 0);

// Regex and template literals
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const isValid = emailRegex.test("hello@world.com");

// Destructuring and spread
const config = { debug: true, verbose: false, level: 42 };
const { debug, ...rest } = config;

// Switch and ternary
function getStatusMessage(code) {
  switch (code) {
    case 200:
      return "OK";
    case 404:
      return "Not Found";
    case 500:
      return "Internal Server Error";
    default:
      return code >= 400 ? "Client Error" : "Unknown";
  }
}

export { UserService, fetchUserData, getStatusMessage };
