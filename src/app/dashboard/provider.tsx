"use client";

import { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "src/stores/store";
import { SnackbarProvider } from "notistack";

interface ReduxProviderProps {
  children: ReactNode;
}

export default function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <SnackbarProvider
        maxSnack={1}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {children}
      </SnackbarProvider>
    </Provider>
  );
}
