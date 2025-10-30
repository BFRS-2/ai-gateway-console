import { createSlice } from "@reduxjs/toolkit";
import { UserInfo } from "src/api/services/auth.service";

interface Consent {
  status: "PENDING" | "APPROVED" | "REJECTED"; // Assuming possible statuses
}

const initialState: {
  currUser: UserInfo | null;
} = { currUser: null };
export const userSlice = createSlice({
  name: "user_slice",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currUser = action.payload;
    },
  },
});
export const { setUser } = userSlice.actions;

export default userSlice.reducer;
