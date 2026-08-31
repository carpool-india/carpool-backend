import axios, { AxiosError } from "axios";
import { supabase } from "./supabase";

export const serviceUrls = {
  booking: import.meta.env.VITE_BOOKING_SERVICE_URL ?? "http://localhost:3002",
  safety: import.meta.env.VITE_SAFETY_SERVICE_URL ?? "http://localhost:3006",
  payment: import.meta.env.VITE_PAYMENT_SERVICE_URL ?? "http://localhost:3003",
};

export const api = axios.create({ timeout: 15000 });

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message = error.response?.data?.message ?? error.message ?? "Request failed";
    return Promise.reject(new Error(message));
  }
);

export async function bookingGet<T>(path: string): Promise<T> {
  const { data } = await api.get<T>(`${serviceUrls.booking}${path}`);
  return data;
}

export async function bookingPatch<T>(path: string, body: unknown): Promise<T> {
  const { data } = await api.patch<T>(`${serviceUrls.booking}${path}`, body);
  return data;
}

export async function bookingPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await api.post<T>(`${serviceUrls.booking}${path}`, body);
  return data;
}

export async function safetyGet<T>(path: string): Promise<T> {
  const { data } = await api.get<T>(`${serviceUrls.safety}${path}`);
  return data;
}

export async function safetyPatch<T>(path: string, body: unknown): Promise<T> {
  const { data } = await api.patch<T>(`${serviceUrls.safety}${path}`, body);
  return data;
}

export async function paymentGet<T>(path: string): Promise<T> {
  const { data } = await api.get<T>(`${serviceUrls.payment}${path}`);
  return data;
}

export async function paymentPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await api.post<T>(`${serviceUrls.payment}${path}`, body);
  return data;
}

export async function paymentPatch<T>(path: string, body: unknown): Promise<T> {
  const { data } = await api.patch<T>(`${serviceUrls.payment}${path}`, body);
  return data;
}

export async function safetyPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await api.post<T>(`${serviceUrls.safety}${path}`, body);
  return data;
}
