"use client";

import { ReactNode } from "react";
// src/redux/Provider.tsx
import { Provider } from "react-redux";
import { store } from "src/stores/store";


interface ReduxProviderProps {
  children: ReactNode;
}

const ReduxProvider = ({ children }: ReduxProviderProps) => <Provider store={store}>{children}</Provider>;

export default ReduxProvider;
