import { serviceSchemas } from "src/sections/dashboard/serviceComponents/serviceschema";
import { BuilderConfig } from "./types";

export const defaultConfig: BuilderConfig = {
  service: {
    serviceId: "69313811f2214e98ad240396",
    defaultModel: "gpt-4o",
    backupModel: "gpt-4o-mini",
    defaultProvider: "openai",
    backupProvider: "openai",
    allowedModels: ["gpt-4o", "gpt-4o-mini"],
    temperature: 0.7,
    limits: {
      daily: 100,
      monthly: 300,
    },
    serviceAlertLimit: {
      daily: 80,
      monthly: 80,
    },
  },
  tools: {
    kb: {
      file: null,
      chunkingSize: 1000,
      overlappingSize: 200,
      status: "idle",
      collectionName: "",
      selection: "new",
    },
    mcp: {
      url: "",
      status: "idle",
    },
  },
  agent: {
    name: "",
    systemPrompt:
      "You are an AI agent that helps users with their queries. Use the available tools to provide accurate responses.",
    reviewerPrompt:
      "Review tool call suggestions and ensure they are appropriate for the user's query.",
    maxSteps: 12,
  },
};

export const steps = ["Basics", "Tools", "Preview"] as const;

export const agentBuilderHelpTexts = {
  defaultModel:
    serviceSchemas["chat completion"]?.fields?.["config.default_model"]
      ?.helpText || "",
  backupModel:
    serviceSchemas["chat completion"]?.fields?.["config.backup_model"]
      ?.helpText || "",
  defaultProvider:
    serviceSchemas["chat completion"]?.fields?.["config.default_provider"]
      ?.helpText || "",
  backupProvider:
    serviceSchemas["chat completion"]?.fields?.["config.backup_provider"]
      ?.helpText || "",
  temperature:
    serviceSchemas["chat completion"]?.fields?.["config.temperature"]
      ?.helpText || "",
  dailyLimit:
    serviceSchemas["chat completion"]?.fields?.["limits.daily"]?.helpText ||
    "",
  monthlyLimit: "Maximum cost per month for this service",
  dailyAlert:
    serviceSchemas["chat completion"]?.fields?.["alerts.daily"]?.helpText ||
    "",
  monthlyAlert:
    serviceSchemas["chat completion"]?.fields?.["alerts.monthly"]?.helpText ||
    "",
};
