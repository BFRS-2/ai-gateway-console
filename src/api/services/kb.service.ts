// src/api/services/kb.service.ts

import { callPostApi, callGetApi } from "../callApi";
import API_Error from "../errors/api_error";
import FE_Error from "../errors/fe_error";

const BASE = "/api/v1/kb";

export interface KBItem {
  _id: string;
  file_name: string;
  file_path: string;
  chunking_size: number;
  overlapping_size: number;
  status: string;
  message: string;
}

export interface KBInitResult {
  success: boolean;
  status_code?: number;
  data?: KBItem;
  error?: API_Error | FE_Error | null;
}

export interface KBStatusData {
  file_name: string;
  chunking_size: number;
  overlapping_size: number;
  status: "pending" | "processing" | "completed" | "failed" | "started";
  collection_name: string | null;
  chunks_created: number | null;
  csv_rows_processed: number | null;
  csv_columns: string[] | null;
  jsonl_path: string | null;
  error: string | null;
}
export interface KBStatusResult {
  success: boolean;
  status_code?: number;
  data?: KBStatusData;
  error?: API_Error | FE_Error | null;
}

async function initKnowledgebase(form: FormData): Promise<KBInitResult> {
  return callPostApi(`${BASE}/init`, form);
}

async function getKbStatus(projectId: string): Promise<KBStatusResult> {
  return callGetApi(`${BASE}/status/${projectId}`);
}

const kbService = {
  initKnowledgebase,
  getKbStatus
  //   getKnowledgebaseList,
};

export default kbService;
