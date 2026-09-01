import axios, { AxiosError } from "axios";
import Constants from "expo-constants";
import { useAuthStore } from "../store/authStore";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

// Render's free tier spins services down after 15 min idle; the next
// request has to wait for a cold start, which can take 15-20+ seconds.
export const api = axios.create({
  timeout: 30000,
});

export const serviceUrls = {
  booking: extra.BOOKING_SERVICE_URL ?? process.env.EXPO_PUBLIC_BOOKING_SERVICE_URL ?? "http://localhost:3002",
  matching: extra.MATCHING_SERVICE_URL ?? process.env.EXPO_PUBLIC_MATCHING_SERVICE_URL ?? "http://localhost:8001",
  payment: extra.PAYMENT_SERVICE_URL ?? process.env.EXPO_PUBLIC_PAYMENT_SERVICE_URL ?? "http://localhost:3003",
  notification: extra.NOTIFICATION_SERVICE_URL ?? process.env.EXPO_PUBLIC_NOTIFICATION_SERVICE_URL ?? "http://localhost:3005",
  safety: extra.SAFETY_SERVICE_URL ?? process.env.EXPO_PUBLIC_SAFETY_SERVICE_URL ?? "http://localhost:3006",
  centrifugoWs:
    extra.CENTRIFUGO_WS_URL ??
    process.env.EXPO_PUBLIC_CENTRIFUGO_WS_URL ??
    "ws://localhost:8010/connection/websocket",
};

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().sessionToken;
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

export async function bookingPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await api.post<T>(`${serviceUrls.booking}${path}`, body);
  return data;
}

export async function bookingDelete<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await api.delete<T>(`${serviceUrls.booking}${path}`, { data: body });
  return data;
}

export async function matchingPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await api.post<T>(`${serviceUrls.matching}${path}`, body);
  return data;
}

export async function paymentPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await api.post<T>(`${serviceUrls.payment}${path}`, body);
  return data;
}

export async function paymentGet<T>(path: string): Promise<T> {
  const { data } = await api.get<T>(`${serviceUrls.payment}${path}`);
  return data;
}

export async function safetyPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await api.post<T>(`${serviceUrls.safety}${path}`, body);
  return data;
}

export async function notificationPost<T>(path: string, body: unknown): Promise<T> {
  const { data } = await api.post<T>(`${serviceUrls.notification}${path}`, body);
  return data;
}
