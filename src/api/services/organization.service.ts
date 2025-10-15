import urls from "../urls";
import { callGetApi, callPostApi, callPutApi, callDeleteApi } from "../callApi";

export interface OrganizationCreateBody {
  name: string;
  description?: string;
  active?: boolean;
}

export interface OrganizationUpdateBody {
  name?: string;
  description?: string;
  active?: boolean;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

const organizationService = {
  getAll: () => callGetApi(urls.GET_ORGANIZATIONS) as Promise<Organization[]>,
  getActive: () => callGetApi(`${urls.GET_ORGANIZATIONS}?active_only=true`) as Promise<Organization[]>,
  getById: (id: string) => callGetApi(`${urls.GET_ORGANIZATIONS}/${id}`) as Promise<Organization>,
  create: (body: OrganizationCreateBody) => callPostApi(urls.CREATE_ORGANIZATION, body),
  update: (id: string, body: OrganizationUpdateBody) => callPutApi(`${urls.UPDATE_ORGANIZATION}/${id}`, body),
  remove: (id: string) => callDeleteApi(`${urls.DELETE_ORGANIZATION}/${id}`),
};

export default organizationService;
