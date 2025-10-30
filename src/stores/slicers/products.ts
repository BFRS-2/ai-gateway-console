import { createSlice } from "@reduxjs/toolkit";

const initialState = { allProducts: [], activatedProducts: [] };
export const productSlice = createSlice({
  name: "products_slice",
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.allProducts = action.payload;
    },
    setActivatedProducts: (state, action) => {
      state.activatedProducts = action.payload;
    },
  },
});
export const { setProducts, setActivatedProducts } = productSlice.actions;

export default productSlice.reducer;
