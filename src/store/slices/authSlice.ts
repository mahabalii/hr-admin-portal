
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "../../types/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface LoginPayload {
  user: User;
  token: string;
}

const savedAuth = localStorage.getItem("auth");

const initialState: AuthState = savedAuth
  ? JSON.parse(savedAuth)
  : {
      user: null,
      token: null,
      isAuthenticated: false,
    };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<LoginPayload>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;

      localStorage.setItem(
        "auth",
        JSON.stringify(state)
      );
    },

    clearUser: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      localStorage.removeItem("auth");
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;

export default authSlice.reducer;
