import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { API_CONFIG } from "../../config/api.config";
import { secureStorage } from "../storage/secure-storage";
import { ApiError, ApiResponse } from "../../types/api.types";

// ─── Auto-logout callback (registered by auth.store to avoid circular imports) ───
type LogoutCallback = () => void;
let _onAuthExpired: LogoutCallback | null = null;

export const registerLogoutCallback = (cb: LogoutCallback) => {
  _onAuthExpired = cb;
};

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await secureStorage.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // If data is FormData, let the browser set the Content-Type with boundary
        if (config.data instanceof FormData && config.headers) {
          delete config.headers["Content-Type"];
        }

        console.log("🚀 [API Request]", {
          url: config.url,
          isFormData: config.data instanceof FormData,
          contentType: config.headers["Content-Type"],
        });

        return config;
      },
      (error) => {
        console.error("❌ [API] Request error:", error);
        return Promise.reject(error);
      },
    );

    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        console.error(
          `❌ [API] ${error.response?.status || "NO_RESPONSE"} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`,
          {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
          },
        );

        // Don't try token refresh for login/register — 401 means wrong credentials, not expired token
        const isAuthEndpoint =
          originalRequest.url?.includes("/auth/login") ||
          originalRequest.url?.includes("/auth/register");
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !isAuthEndpoint
        ) {
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await secureStorage.getRefreshToken();

            // If no refresh token, clear storage and reject
            if (!refreshToken) {
              console.log("⚠️ [API] No refresh token found, clearing storage");
              await secureStorage.clearAll();
              _onAuthExpired?.(); // ← trigger auto-logout
              const err = this.handleError(error);
              this.failedQueue.forEach((prom) => prom.reject(err));
              this.failedQueue = [];
              return Promise.reject(err);
            }

            const response = await this.client.post("/auth/refresh", {
              refreshToken,
            });
            const { accessToken } = response.data.data;

            await secureStorage.setAccessToken(accessToken);

            this.failedQueue.forEach((prom) => prom.resolve(accessToken));
            this.failedQueue = [];

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            console.log("⚠️ [API] Token refresh failed, clearing storage");
            this.failedQueue.forEach((prom) => prom.reject(refreshError));
            this.failedQueue = [];
            await secureStorage.clearAll();
            _onAuthExpired?.(); // ← trigger auto-logout on refresh failure
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      },
    );
  }

  private handleError(error: AxiosError): ApiError {
    if (error.response) {
      const data = error.response.data as any;
      // Server can send error message in either 'message' or 'error' field
      const errorMessage = data?.message || data?.error || "An error occurred";

      return {
        message: errorMessage,
        errors: data?.errors,
        statusCode: error.response.status,
      };
    } else if (error.request) {
      return {
        message: "No response from server. Please check your connection.",
        statusCode: 0,
      };
    } else {
      return {
        message: error.message || "An unexpected error occurred",
        statusCode: 0,
      };
    }
  }

  async get<T>(url: string, params?: any): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data);
    return response.data;
  }

  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();
