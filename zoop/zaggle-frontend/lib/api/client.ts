"use client";

import axios from "axios";
import { clearSessionTokens, getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from "@/lib/auth";

const baseURL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1` : "/api";

export const apiClient = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  }
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function flushQueue(error: unknown, token?: string) {
  failedQueue.forEach((request) => {
    if (token) {
      request.resolve(token);
      return;
    }

    request.reject(error);
  });

  failedQueue = [];
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original?._retry) {
      const refresh = getRefreshToken();
      if (!refresh) {
        clearSessionTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(original));
            },
            reject
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${baseURL}/auth/token/refresh/`, {
          refresh
        });
        const token = response.data.access as string;
        const nextRefresh = (response.data.refresh as string | undefined) ?? refresh;

        setAccessToken(token);
        setRefreshToken(nextRefresh);
        original.headers.Authorization = `Bearer ${token}`;
        flushQueue(null, token);

        return apiClient(original);
      } catch (refreshError) {
        clearSessionTokens();
        flushQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
