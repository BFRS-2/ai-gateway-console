import objectToQueryString from "src/utils/objectToGetParams";
import { callGetApi, callPostApi, callPutApi } from "../callApi";

type MemberRole = "admin" | "owner" | "member";
type AccessType = "read" | "write" | "admin"; // adjust if your backend defines differently

interface AddMemberBase {
  email: string;
  role: MemberRole;
}

interface AddAdminMember extends AddMemberBase {
  role: "admin";
}

interface AddOwnerMember extends AddMemberBase {
  role: "owner";
  organization_id: string;
}

interface AddProjectMember extends AddMemberBase {
  role: "member";
  organization_id: string;
  project_id: string;
  access_type?: AccessType;
}

type AddMemberPayload = AddAdminMember | AddOwnerMember | AddProjectMember;

const ENDPOINT = "/api/v1/members/add";

const userManagementService = {
  /**
   * Add a member with different scopes based on role
   *
   * - admin → only email + role
   * - owner → email + role + organization_id
   * - member → email + role + organization_id + project_id + access_type
   */

  listUsers : (body?: { name?: string; page?: number; limit?: number, organization_id : string, project_id: string }) => {
    const params: { [key: string]: string | number | boolean } = {};
    if (body?.name !== undefined && body.name !== null && body.name !== "") params.name = body.name;
    if (body?.page !== undefined) params.page = body.page;
    if (body?.limit !== undefined) params.limit = body.limit;
    if (body?.organization_id !== undefined && body.organization_id !== null && body.organization_id !== "")
      params.organization_id = body.organization_id;
    if (body?.project_id !== undefined && body.project_id !== null && body.project_id !== "")
      params.project_id = body.project_id;

    const query = Object.keys(params).length ? objectToQueryString(params) : "";
    return callGetApi("/api/v1/users" + query);
  },
  addMember: (payload: AddMemberPayload) => {
    return callPostApi(ENDPOINT, payload);
  },

  /**
   * (optional) small helpers if you want them separate
   */
  addAdmin: (email: string) => {
    return callPostApi(ENDPOINT, {
      email,
      role: "admin",
    });
  },

  addOwner: (email: string, organizationId: string) => {
    return callPostApi(ENDPOINT, {
      email,
      role: "owner",
      organization_id: organizationId,
    });
  },

  addProjectMember: (
    email: string,
    organizationId: string,
    projectId: string,
    accessType: AccessType = "read"
  ) => {
    return callPostApi(ENDPOINT, {
      email,
      role: "member",
      organization_id: organizationId,
      project_id: projectId,
      access_type: accessType,
    });
  },

   updatePassword: (oldPassword: string, newPassword: string) =>
    callPutApi("/api/v1/users/update", {
      update_password: { old: oldPassword, new: newPassword },
    }),
};

export default userManagementService;