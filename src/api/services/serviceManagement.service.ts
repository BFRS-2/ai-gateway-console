import urls from "../urls";
import { callGetApi } from "../callApi";
import objectToQueryString from "src/utils/objectToGetParams";
import { Service } from "src/sections/dashboard/serviceComponents/types";
import { ModelRow, ProviderRow } from "src/sections/dashboard/serviceComponents/dynamicServiceForm";

export interface ModelInfo {
  name: string;
  provider: string;
  // any other model metadata
}

const serviceManagementService = {
  getAllServices: (projectId : string) => callGetApi(urls.GET_ALL_SERVICES + objectToQueryString({
    project_id : projectId
  })) as Promise<{success: boolean; data:Service[], status_code: number}>,
  getAllModels: () => callGetApi(urls.GET_ALL_MODELS) as Promise<{success: boolean; data: ModelRow[], status_code: number}>,
  getAllProviders: () => callGetApi(urls.GET_ALL_PROVIDERS) as Promise<{success: boolean; data: ProviderRow[], status_code: number}>,
  getModelsByProvider: (provider: string) => callGetApi(`${urls.GET_MODELS_BY_PROVIDER}/${provider}`) as Promise<ModelInfo[]>,
};

export default serviceManagementService;
