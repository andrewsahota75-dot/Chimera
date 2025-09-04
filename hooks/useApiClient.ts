import { useState, useEffect } from 'react';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface ApiClient {
  get: <T = any>(url: string, params?: any) => Promise<AxiosResponse<T>>;
  post: <T = any>(url: string, data?: any) => Promise<AxiosResponse<T>>;
  put: <T = any>(url: string, data?: any) => Promise<AxiosResponse<T>>;
  delete: <T = any>(url: string) => Promise<AxiosResponse<T>>;
}

export interface ApiError {
  message: string;
  statusCode: number;
  timestamp: string;
}

const baseURL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3001/api'
  : '/api';

export const useApiClient = (token?: string): {
  client: ApiClient;
  isConnected: boolean;
  error: string | null;
} => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [client] = useState<AxiosInstance>(() => {
    const instance = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    instance.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    instance.interceptors.response.use(
      (response) => {
        setIsConnected(true);
        setError(null);
        return response;
      },
      (error) => {
        setIsConnected(false);
        
        if (error.response) {
          const apiError: ApiError = error.response.data?.error || {
            message: error.response.statusText,
            statusCode: error.response.status,
            timestamp: new Date().toISOString()
          };
          setError(apiError.message);
        } else if (error.request) {
          setError('Network error - unable to connect to server');
        } else {
          setError(error.message);
        }
        
        return Promise.reject(error);
      }
    );

    return instance;
  });

  // Test connection on mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        await client.get('/health');
        setIsConnected(true);
        setError(null);
      } catch (err) {
        setIsConnected(false);
        // Error is handled by interceptor
      }
    };

    testConnection();
  }, [client]);

  return {
    client,
    isConnected,
    error
  };
};