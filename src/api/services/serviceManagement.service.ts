import urls from "../urls";
import { callGetApi } from "../callApi";

export interface ModelInfo {
  name: string;
  provider: string;
  // any other model metadata
}

const serviceManagementService = {
  getAllServices: () => callGetApi(urls.GET_ALL_SERVICES) as Promise<string[]>,
  getAllModels: () => callGetApi(urls.GET_ALL_MODELS) as Promise<ModelInfo[]>,
  getAllProviders: () => callGetApi(urls.GET_ALL_PROVIDERS) as Promise<string[]>,
  getModelsByProvider: (provider: string) => callGetApi(`${urls.GET_MODELS_BY_PROVIDER}/${provider}`) as Promise<ModelInfo[]>,
};

export default serviceManagementService;
