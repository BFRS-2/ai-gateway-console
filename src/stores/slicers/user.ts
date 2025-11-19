import { createSlice } from "@reduxjs/toolkit";
import { set } from "nprogress";
import { UserInfo } from "src/api/services/auth.service";

interface Consent {
  status: "PENDING" | "APPROVED" | "REJECTED"; // Assuming possible statuses
}

const initialState: {
  currUser: UserInfo | null;
  userPermission : "read" | "write" | null
  userRole : "admin" | "owner" | "member" | null
} = { currUser: null, userPermission: null, userRole: null };
export const userSlice = createSlice({
  name: "user_slice",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.currUser = action.payload;
    },
    setUserPermissionAndRole : (state, action) => {
      state.userPermission = action.payload.access;
      state.userRole = action.payload.role;
    }
  },
});
export const { setUser, setUserPermissionAndRole } = userSlice.actions;

export default userSlice.reducer;
