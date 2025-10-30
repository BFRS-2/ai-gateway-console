// src/redux/counterSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Organization } from "src/api/services/auth.service";
import { Project } from "src/api/services/project.service";
import { OrganizationWithProjects } from "src/app/dashboard/layout";

interface OrganizationProjectState {
  organizationProjects: OrganizationWithProjects[];
  selectedOrganizationProject: null | {
    organizationId: string;
    organizationName: string;
    projectId: string;
    projectName: string;
  };
  organizations: Organization[];
  projects: Project[];
}


const initialState: OrganizationProjectState = {
  organizationProjects: [],
  selectedOrganizationProject: null,
  organizations: [],
  projects: [],
};

export const organizationProjectSlice = createSlice({
  name: "organizationProject",
  initialState,
  reducers: {
    /** Set the fully built mapping: Organization[] with embedded Project[] */
    setOrganizationProjectMapping: (
      state,
      action: PayloadAction<OrganizationWithProjects[]>
    ) => {
      state.organizationProjects = action.payload;

      // keep flat caches in sync (optional; remove if not needed)
      state.organizations = action.payload.map(({ projects, ...org }) => org);
      state.projects = action.payload.flatMap((op) => op.projects);
    },

    /** Select a specific organization + project for the UI */
    selectOrganizationProject: (
      state,
      action: PayloadAction<{
        organizationId: string;
        organizationName: string;
        projectId: string;
        projectName: string;
      } | null>
    ) => {
      state.selectedOrganizationProject = action.payload;
    },
  },
});

export const {
  setOrganizationProjectMapping,
  selectOrganizationProject,
} = organizationProjectSlice.actions;

export default organizationProjectSlice.reducer;

