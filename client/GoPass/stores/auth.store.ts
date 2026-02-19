import { create } from "zustand";
import { User, AuthTokens } from "../types/auth.types";
import { secureStorage } from "../services/storage/secure-storage";
import { authService } from "../services/api/auth.service";
import { registerLogoutCallback } from "../services/api/client";

interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;

  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  mockLogin: (email: string) => Promise<void>;
  mockRegister: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setTokens: (tokens) => set({ tokens }),

  setLoading: (loading) => set({ isLoading: loading }),

  login: async (email, password) => {
    try {
      set({ isLoading: true });

      const response = await authService.login({ email, password });
      const { user, tokens } = response as any;
      console.log("🔑 [AUTH] Tokens received:", {
        hasAccessToken: !!tokens?.accessToken,
        hasRefreshToken: !!tokens?.refreshToken,
      });

      await secureStorage.setAccessToken(tokens.accessToken);
      await secureStorage.setRefreshToken(tokens.refreshToken);
      await secureStorage.setUserData(JSON.stringify(user));

      set({
        user: user,
        tokens: tokens,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error("❌ [AUTH] Login failed:", {
        message: error.message,
        statusCode: error.statusCode,
        errors: error.errors,
        fullError: JSON.stringify(error, null, 2),
      });
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    try {
      set({ isLoading: true });
      set({ isLoading: true });

      const response = await authService.register(data);
      const { user, tokens } = response as any;
      console.log("🔑 [AUTH] Tokens received:", {
        hasAccessToken: !!tokens?.accessToken,
        hasRefreshToken: !!tokens?.refreshToken,
      });

      await secureStorage.setAccessToken(tokens.accessToken);
      await secureStorage.setRefreshToken(tokens.refreshToken);
      await secureStorage.setUserData(JSON.stringify(user));

      set({
        user: user,
        tokens: tokens,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error("❌ [AUTH] Registration failed:", {
        message: error.message,
        statusCode: error.statusCode,
        errors: error.errors,
        fullError: JSON.stringify(error, null, 2),
      });
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      // JWT is stateless, so logout is client-side only
      // We just clear the stored tokens and user data
      await secureStorage.clearAll();
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error("❌ [AUTH] Logout error:", error);
      // Even if clearing storage fails, reset the state
      set({
        user: null,
        tokens: null,
        isAuthenticated: false,
      });
    }
  },

  loadStoredAuth: async () => {
    try {
      set({ isLoading: true });
      const [accessToken, refreshToken, userDataString] = await Promise.all([
        secureStorage.getAccessToken(),
        secureStorage.getRefreshToken(),
        secureStorage.getUserData(),
      ]);

      if (accessToken && refreshToken && userDataString) {
        const user = JSON.parse(userDataString);
        set({
          user,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 0,
          },
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error("Load stored auth error:", error);
      await secureStorage.clearAll();
    } finally {
      set({ isLoading: false });
    }
  },

  mockLogin: async (email: string) => {
    set({ isLoading: true });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: "1",
      name: "Test User",
      email: email,
      phone: "+1234567890",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockTokens: AuthTokens = {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresIn: 3600,
    };

    set({
      user: mockUser,
      tokens: mockTokens,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  // Synchronous force-logout — called by the API client when token expires
  // Does NOT call the API (no async) — storage was already cleared by client.ts
  forceLogout: () => {
    console.log("🔒 [AUTH] Token expired — forcing logout");
    set({ user: null, tokens: null, isAuthenticated: false });
  },

  mockRegister: async (data: any) => {
    set({ isLoading: true });
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const mockUser: User = {
      id: "1",
      name: data.name,
      email: data.email,
      phone: data.phone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const mockTokens: AuthTokens = {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      expiresIn: 3600,
    };

    set({
      user: mockUser,
      tokens: mockTokens,
      isAuthenticated: true,
      isLoading: false,
    });
  },
}));

// Register the logout callback so the API client can trigger it on token expiry.
// This runs once when the module is first imported — no circular deps because
// client.ts does NOT import from auth.store.ts.
registerLogoutCallback(() => {
  useAuthStore.getState().forceLogout();
});
