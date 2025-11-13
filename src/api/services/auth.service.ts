import urls from "../urls";
import { callPostApi, callGetApi } from "../callApi";

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
};

export default authService;
