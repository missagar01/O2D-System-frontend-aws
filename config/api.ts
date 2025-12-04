const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "/api";

export const API_BASE_URL = DEFAULT_API_BASE_URL;

export const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_BASE_URL ||
  process.env.AUTH_BASE_URL ||
  DEFAULT_API_BASE_URL;

export const axiosConfig = {
  withCredentials: false,
};
