// const DEFAULT_API_BASE_URL = "http://localhost:3007";

// export const API_BASE_URL =
//   process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

// export const AUTH_BASE_URL =
//   process.env.NEXT_PUBLIC_AUTH_BASE_URL || DEFAULT_API_BASE_URL;

// export const axiosConfig = {
//   baseURL: DEFAULT_API_BASE_URL,
//   withCredentials: false,
// };

const DEFAULT_API_BASE_URL = "http://13.233.137.112:3006";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL;

export const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_BASE_URL || DEFAULT_API_BASE_URL;

export const axiosConfig = {
  baseURL: API_BASE_URL,
  withCredentials: false,
};
