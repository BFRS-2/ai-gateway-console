import { configureStore } from "@reduxjs/toolkit";

import productsReducer from "./slicers/products";
import organizationProjectSlice from "./slicers/orgProject";
import userReducer from "./slicers/user";

export const store = configureStore({
  reducer: {
    orgProject: organizationProjectSlice,
    // products: productsReducer,
    user :userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
