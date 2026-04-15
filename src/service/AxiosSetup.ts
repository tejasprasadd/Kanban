import axios, { type AxiosInstance } from "axios";

export const dummyJsonApi: AxiosInstance = axios.create({
  baseURL: process.env.BUN_PUBLIC_DUMMY_JSON_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});