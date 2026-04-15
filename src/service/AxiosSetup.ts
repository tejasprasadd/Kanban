import axios, { type AxiosInstance } from "axios";
import "dotenv/config";

export const dummyJsonApi: AxiosInstance = axios.create({
  baseURL: process.env.DUMMY_JSON_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});