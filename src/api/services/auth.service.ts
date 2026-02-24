import urls from "../urls";
import { callPostApi, callGetApi } from "../callApi";
import objectToQueryString from "src/utils/objectToGetParams";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Organization {
  id: string;
  name: string;
  // extend with fields returned by your backend
}

export interface UserInfo {
  email: string;
  id: string;
  is_admin: boolean;
  name: string;
  organizations: Organization[];
  project_permissions: string[];
}
export type SetPasswordBody = {
  email: string;
  password: string;
  // If you later add invite tokens: invite_token?: string;
};

export type ForgotPasswordBody = {
  email: string;
};

export type ResetPasswordBody = {
  token: string;
  password: string;
};

const authService = {
  login: (payload: LoginRequest) => callPostApi(urls.LOGIN, payload),
  getUserInfo: () =>
    callGetApi(urls.USER_INFO) as Promise<{
      success: boolean;
      data: { user: UserInfo };
      status_code: number;
    }>,
  setPassword: (body: SetPasswordBody) =>
    callPostApi("/api/v1/users/set-password", body),
  forgotPassword: (body: ForgotPasswordBody) =>
    callPostApi("/api/v1/auth/forgot-password", body),
  resetPassword: (body: ResetPasswordBody) =>
    callPostApi("/api/v1/auth/reset-password", body),
  getUserPermissionForProjectOrg: (
    organization_id : string,
    project_id : string
  ) => {
    return callGetApi(
      `/api/v1/users/permissions${objectToQueryString({
        organization_id,
        project_id,
      })}`
    ) as Promise<{
      success: boolean;
      data: { role: string; access: string };
      status_code: number;
    }>;
  },
};

export default authService;
