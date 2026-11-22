
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

store.subscribe(() => {
  const authState = store.getState().auth;

  if (authState.isAuthenticated) {
    localStorage.setItem("auth", JSON.stringify(authState));
  } else {
    localStorage.removeItem("auth");
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
