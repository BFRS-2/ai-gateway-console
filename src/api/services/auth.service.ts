import urls from "../urls";
import { callPostApi, callGetApi } from "../callApi";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
  roles?: string[];
  // extend with fields returned by your backend
}

const authService = {
  login: (payload: LoginRequest) => callPostApi(urls.LOGIN, payload),
  getUserInfo: () => callGetApi(urls.USER_INFO) as Promise<UserInfo>,
};

export default authService;
