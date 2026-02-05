"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { DashboardContent } from "src/layouts/dashboard";
import kbService, { KBStatusData } from "src/api/services/kb.service";
import agentBuilderService, {
  AgentSetupPayload,
} from "src/api/services/agentBuilder.service";
import serviceManagementService from "src/api/services/serviceManagement.service";
import { RootState } from "src/stores/store";
import {
  ModelRow,
  ProviderRow,
} from "src/sections/dashboard/serviceComponents/dynamicServiceForm";
import {
  AgentListItem,
  BuilderConfig,
  ToolingConfig,
  WidgetConfig,
} from "./types";
import { defaultConfig, steps } from "./constants";
import { mapServiceValidationErrors } from "./helpers";
import {
  buildIntegrationSnippet,
  devConfig,
  normalizeWidgetConfig,
  widgetScriptUrl,
} from "./widgetConfig";
import AgentNodeStep from "./components/AgentNodeStep";
import ServiceStep from "./components/ServiceStep";
import ToolsStep from "./components/ToolsStep";
import PreviewStep from "./components/PreviewStep";
import useProjectSelection from "./hooks/useProjectSelection";
import useServiceFieldErrors from "./hooks/useServiceFieldErrors";

export function AgentBuilderPage() {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const selectedOrg = useSelector(
    (state: RootState) => state.orgProject.selectedOrganizationProject
  );
  const projectOptions = selectedOrg?.projects || [];
  const projectsLoaded = selectedOrg !== null;
  const { projectId, setProjectId } = useProjectSelection({
    projectOptions,
    organizationId: selectedOrg?.organizationId,
  });
  const [activeStep, setActiveStep] = useState(0);
  const [config, setConfig] = useState<BuilderConfig>(defaultConfig);
  const [previewConfig, setPreviewConfig] = useState<WidgetConfig>(devConfig);
  const [agentId, setAgentId] = useState("");
  const [models, setModels] = useState<ModelRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [providersError, setProvidersError] = useState<string | null>(null);

  const [serviceSaving, setServiceSaving] = useState(false);
  const {
    fieldErrors: serviceFieldErrors,
    setFieldErrors: setServiceFieldErrors,
    clearFieldError: clearServiceFieldError,
    resetFieldErrors,
  } = useServiceFieldErrors();
  const [kbLoading, setKbLoading] = useState(false);
  const [kbStatus, setKbStatus] = useState<KBStatusData | null>(null);
  const [kbSelectionTouched, setKbSelectionTouched] = useState(false);
  const [mcpChecking, setMcpChecking] = useState(false);
  const [toolsSaved, setToolsSaved] = useState(false);
  const [agentSaving, setAgentSaving] = useState(false);
  const [previewSubmitting, setPreviewSubmitting] = useState(false);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [showListView, setShowListView] = useState(true);
  const [agentList, setAgentList] = useState<AgentListItem[]>([]);
  const [agentConfigLoading, setAgentConfigLoading] = useState(false);
  const loadedAgentConfigRef = useRef<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setAgentConfigLoading(false);
      return;
    }
    setKbStatus(null);
    setKbSelectionTouched(false);
    setToolsSaved(false);
    setShowListView(true);
    setAgentList([]);
    setAgentConfigLoading(false);
    setActiveStep(0);
    setAgentId("");
    setPreviewConfig(devConfig);
    setConfig(defaultConfig);
    resetFieldErrors();
  }, [projectId]);

  const applyAgentConfig = useCallback((payload: Record<string, unknown>) => {
    if (!payload || typeof payload !== "object") {
      setConfig(defaultConfig);
      setPreviewConfig(devConfig);
      setAgentId("");
      setKbStatus(null);
      setToolsSaved(false);
      return;
    }

    const nextAgentId =
      (payload as any)?.id ||
      (payload as any)?.agent_id ||
      (payload as any)?.agentId ||
      "";
    const nextAgentName =
      (payload as any)?.name || (payload as any)?.agent_name || "";
    const nextSystemPrompt =
      (payload as any)?.system_prompt || (payload as any)?.systemPrompt || "";
    const nextReviewerPrompt =
      (payload as any)?.reviewer_prompt ||
      (payload as any)?.reviewerPrompt ||
      "";
    const nextMaxSteps =
      (payload as any)?.max_steps || (payload as any)?.maxSteps || 0;
    const nextMcpUrl =
      (payload as any)?.mcp_url || (payload as any)?.mcpUrl || "";
    const nextKbCollection =
      (payload as any)?.kb_collection || (payload as any)?.kbCollection || "";
    const nextUiConfig =
      (payload as any)?.ui_config || (payload as any)?.uiConfig || null;

    setConfig((prev) => ({
      ...prev,
      agent: {
        ...prev.agent,
        name: nextAgentName || prev.agent.name,
        systemPrompt: nextSystemPrompt || prev.agent.systemPrompt,
        reviewerPrompt:
          nextReviewerPrompt !== ""
            ? nextReviewerPrompt
            : prev.agent.reviewerPrompt,
        maxSteps:
          Number(nextMaxSteps) > 0 ? Number(nextMaxSteps) : prev.agent.maxSteps,
      },
      tools: {
        ...prev.tools,
        kb: {
          ...prev.tools.kb,
          file: null,
          collectionName: nextKbCollection || prev.tools.kb.collectionName,
          selection: nextKbCollection ? "existing" : prev.tools.kb.selection,
          status: nextKbCollection ? "ready" : prev.tools.kb.status,
        },
        mcp: {
          ...prev.tools.mcp,
          url: nextMcpUrl || prev.tools.mcp.url,
          status: nextMcpUrl ? "valid" : prev.tools.mcp.status,
        },
      },
    }));

    if (nextKbCollection) {
      setKbStatus({
        file_name: "",
        chunking_size: 0,
        overlapping_size: 0,
        status: "completed",
        collection_name: nextKbCollection,
        chunks_created: null,
        csv_rows_processed: null,
        csv_columns: null,
        jsonl_path: null,
        error: null,
      });
    } else {
      setKbStatus(null);
    }

    if (nextUiConfig) {
      setPreviewConfig(normalizeWidgetConfig(nextUiConfig));
    } else {
      setPreviewConfig(devConfig);
    }

    if (nextAgentId) {
      setAgentId(nextAgentId);
    } else {
      setAgentId("");
    }
    setToolsSaved(true);
  }, []);

  const buildAgentList = useCallback((payload: unknown) => {
    if (!payload || typeof payload !== "object") return [] as AgentListItem[];
    const items = Array.isArray(payload) ? payload : [payload];
    return items
      .map((item) => {
        const id =
          (item as any)?.id ||
          (item as any)?.agent_id ||
          (item as any)?.agentId ||
          "";
        const name =
          (item as any)?.name || (item as any)?.agent_name || "Untitled agent";
        if (!id && !name) return null;
        return {
          id: String(id),
          name: String(name),
          raw: item as Record<string, unknown>,
        };
      })
      .filter(Boolean) as AgentListItem[];
  }, []);

  useEffect(() => {
    if (!projectId || loadedAgentConfigRef.current === projectId) return;
    let isActive = true;

    const loadAgentConfig = async () => {
      setAgentConfigLoading(true);
      setShowListView(true);
      try {
        const res = await agentBuilderService.getAgentConfig(projectId);
        if (!isActive) return;
        const errorPayload = (res as any)?.error;
        if (errorPayload) {
          const errorStatus = errorPayload?.status;
          const errorMessage =
            errorPayload?.payload?.message ||
            errorPayload?.payload?.detail ||
            errorPayload?.payload?.error ||
            "";
          const notFound =
            errorStatus === 404 || /not found/i.test(String(errorMessage));
          if (notFound) {
            setConfig(defaultConfig);
            setPreviewConfig(devConfig);
            setAgentId("");
            setKbStatus(null);
            setAgentList([]);
            setShowListView(true);
            loadedAgentConfigRef.current = projectId;
            return;
          }
          enqueueSnackbar("Unable to load agent config", { variant: "error" });
          return;
        }

        const payload = (res as any)?.data ?? (res as any)?.config ?? res;
        const list = buildAgentList(payload);
        if (!list.length) {
          setConfig(defaultConfig);
          setPreviewConfig(devConfig);
          setAgentId("");
          setKbStatus(null);
          setAgentList([]);
          setShowListView(true);
          loadedAgentConfigRef.current = projectId;
          return;
        }

        setAgentList(list);
        setShowListView(true);
        applyAgentConfig(list[0].raw);
        loadedAgentConfigRef.current = projectId;
      } catch (error) {
        if (!isActive) return;
        enqueueSnackbar("Unable to load agent config", { variant: "error" });
      } finally {
        if (isActive) {
          setAgentConfigLoading(false);
        }
      }
    };

    loadAgentConfig();

    return () => {
      isActive = false;
    };
  }, [applyAgentConfig, buildAgentList, enqueueSnackbar, projectId]);

  useEffect(() => {
    let isActive = true;

    const loadModels = async () => {
      setModelsLoading(true);
      setModelsError(null);
      try {
        const res = await serviceManagementService.getAllModels();

        if (!isActive) return;
        if (res?.success) {
          const allowedModels = res.data?.filter((model: ModelRow) => {
            return model.allowed_services.includes("Agent Builder");
          });
          setModels(allowedModels || []);
        } else {
          setModels([]);
          setModelsError("Unable to load models");
        }
      } catch (error) {
        if (!isActive) return;
        setModels([]);
        setModelsError("Unable to load models");
      } finally {
        if (isActive) setModelsLoading(false);
      }
    };

    const loadProviders = async () => {
      setProvidersLoading(true);
      setProvidersError(null);
      try {
        const res = await serviceManagementService.getAllProviders();
        if (!isActive) return;
        if (res?.success) {
          setProviders(res.data || []);
        } else {
          setProviders([]);
          setProvidersError("Unable to load providers");
        }
      } catch (error) {
        if (!isActive) return;
        setProviders([]);
        setProvidersError("Unable to load providers");
      } finally {
        if (isActive) setProvidersLoading(false);
      }
    };

    loadModels();
    loadProviders();
    return () => {
      isActive = false;
    };
  }, [widgetScriptUrl]);

  const updateConfig = (updater: (prev: BuilderConfig) => BuilderConfig) => {
    setConfig((prev) => updater(prev));
  };

  const refreshKbStatus = async () => {
    if (!projectId) return;
    setKbLoading(true);
    try {
      const res = await kbService.getKbStatus(projectId);
      if (res?.data) {
        setKbStatus(res.data);
        updateConfig((prev) => ({
          ...prev,
          tools: {
            ...prev.tools,
            kb: {
              ...prev.tools.kb,
              status:
                res?.data?.status === "completed"
                  ? "ready"
                  : res?.data?.status === "failed"
                  ? "failed"
                  : res?.data?.status === "pending" ||
                    res?.data?.status === "started"
                  ? "processing"
                  : "processing",
              collectionName:
                prev.tools.kb.selection === "new" &&
                Boolean(prev.tools.kb.status)
                  ? res?.data?.collection_name || prev.tools.kb.collectionName
                  : prev.tools.kb.collectionName,
              selection:
                res?.data?.collection_name && !kbSelectionTouched
                  ? "existing"
                  : prev.tools.kb.selection,
            },
          },
        }));
      }
    } catch (error) {
      enqueueSnackbar("Unable to fetch KB status", { variant: "error" });
    } finally {
      setKbLoading(false);
    }
  };

  useEffect(() => {
    if (activeStep !== 1 || !projectId) return;
    refreshKbStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, projectId]);

  const handleUploadKb = async () => {
    if (!projectId) {
      enqueueSnackbar("Select a project first", { variant: "warning" });
      return;
    }
    if (!config.tools.kb.file) {
      enqueueSnackbar("Select a file to upload", { variant: "warning" });
      return;
    }
    setKbLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", config.tools.kb.file);
      formData.append("project_id", projectId);
      formData.append("chunking_size", String(config.tools.kb.chunkingSize));
      formData.append(
        "overlapping_size",
        String(config.tools.kb.overlappingSize)
      );

      const res = await kbService.initKnowledgebase(formData);
      if ((res as any)?.error) {
        enqueueSnackbar("KB upload failed", { variant: "error" });
      } else {
        enqueueSnackbar("KB upload started", { variant: "success" });
        updateConfig((prev) => ({
          ...prev,
          tools: {
            ...prev.tools,
            kb: {
              ...prev.tools.kb,
              status: "processing",
            },
          },
        }));
        await refreshKbStatus();
      }
    } catch (error) {
      enqueueSnackbar("KB upload failed", { variant: "error" });
    } finally {
      setKbLoading(false);
    }
  };

  const handleKbSelectionChange = (
    selection: ToolingConfig["kb"]["selection"]
  ) => {
    setKbSelectionTouched(true);
    updateConfig((prev) => ({
      ...prev,
      tools: {
        ...prev.tools,
        kb: {
          ...prev.tools.kb,
          selection,
          collectionName:
            selection === "new" ? "" : prev.tools.kb.collectionName,
          status: selection === "new" ? undefined : prev.tools.kb.status,
        },
      },
    }));
  };

  const handleCheckMcp = async () => {
    if (!config.tools.mcp.url.trim()) {
      enqueueSnackbar("Add a MCP URL to check", { variant: "warning" });
      return false;
    }
    setMcpChecking(true);
    updateConfig((prev) => ({
      ...prev,
      tools: {
        ...prev.tools,
        mcp: { ...prev.tools.mcp, status: "checking" },
      },
    }));
    try {
      const res = await agentBuilderService.checkMcpStatus({
        url: config.tools.mcp.url.trim(),
      });
      const ok = Boolean((res as any)?.success) || !(res as any)?.error;
      updateConfig((prev) => ({
        ...prev,
        tools: {
          ...prev.tools,
          mcp: {
            ...prev.tools.mcp,
            status: ok ? "valid" : "invalid",
          },
        },
      }));
      enqueueSnackbar(ok ? "MCP connection looks good" : "MCP check failed", {
        variant: ok ? "success" : "error",
      });
      return !!ok;
    } catch (error) {
      updateConfig((prev) => ({
        ...prev,
        tools: {
          ...prev.tools,
          mcp: {
            ...prev.tools.mcp,
            status: "invalid",
          },
        },
      }));
      enqueueSnackbar("MCP check failed", { variant: "error" });
      return false;
    } finally {
      setMcpChecking(false);
    }
  };

  const existingKbCollection = kbStatus?.collection_name || "";
  const selectedKbCollection =
    config.tools.kb.selection === "existing"
      ? existingKbCollection
      : config.tools.kb.collectionName;
  const hasKbCollection = Boolean(selectedKbCollection);
  const hasKbIngestionInProgress =
    config.tools.kb.status === "processing" ||
    kbStatus?.status === "pending" ||
    kbStatus?.status === "started" ||
    kbStatus?.status === "processing" ||
    (kbLoading && Boolean(config.tools.kb.file));
  const hasValidMcp = config.tools.mcp.status === "valid";

  const submitServiceSetup = async (showToast = true) => {
    if (!projectId) {
      if (showToast) {
        enqueueSnackbar("Select a project first", { variant: "warning" });
      }
      return false;
    }
    setServiceSaving(true);
    resetFieldErrors();
    try {
      const payload = {
        service_id: config.service.serviceId,
        config: {
          default_model: config.service.defaultModel,
          backup_model: config.service.backupModel,
          default_provider: config.service.defaultProvider,
          backup_provider: config.service.backupProvider,
          allowed_models: config.service.allowedModels,
          temperature: config.service.temperature,
        },
        limits: {
          daily: config.service.limits.daily,
          monthly: config.service.limits.monthly,
        },
        service_alert_limit: {
          daily: config.service.serviceAlertLimit.daily,
          monthly: config.service.serviceAlertLimit.monthly,
        },
        enabled: true,
      };

      const res = await agentBuilderService.addProjectService(
        projectId,
        payload
      );
      const errorPayload =
        (res as any)?.error?.payload ??
        (res as any)?.error ??
        (res as any)?.payload ??
        null;
      const validationErrors =
        (res as any)?.errors || errorPayload?.errors || null;
      if (validationErrors && typeof validationErrors === "object") {
        const mapped = mapServiceValidationErrors(
          validationErrors as Record<string, unknown>
        );
        if (Object.keys(mapped).length) {
          setServiceFieldErrors(mapped);
        }
      }
      const ok = Boolean((res as any)?.success) || !(res as any)?.error;
      if (showToast) {
        enqueueSnackbar(ok ? "Service config saved" : "Service config failed", {
          variant: ok ? "success" : "error",
        });
      }
      return ok;
    } catch (error) {
      if (showToast) {
        enqueueSnackbar("Service config failed", { variant: "error" });
      }
      return false;
    } finally {
      setServiceSaving(false);
    }
  };

  const submitAgentSetup = async (includeTools: boolean, showToast = true) => {
    if (!projectId) {
      if (showToast) {
        enqueueSnackbar("Select a project first", { variant: "warning" });
      }
      return false;
    }
    if (
      includeTools &&
      hasValidMcp === false &&
      hasKbCollection === false &&
      hasKbIngestionInProgress === false
    ) {
      if (showToast) {
        enqueueSnackbar(
          "Add MCP or Knowledge Base before setting up the agent",
          {
            variant: "warning",
          }
        );
        return false;
      }
      return false;
    }

    const payload: any = buildAgentSetupPayload({
      includeUiConfig: false,
      includeTools,
      includeGraphJson: includeTools,
    });

    setAgentSaving(true);
    try {
      const res = await agentBuilderService.setupAgent(payload as any);
      const ok = Boolean((res as any)?.success) || !(res as any)?.error;
      const returnedAgentId =
        (res as any)?.data?.id ||
        (res as any)?.data?.agent_id ||
        (res as any)?.data?.agentId ||
        (res as any)?.id ||
        (res as any)?.agent_id ||
        (res as any)?.agentId ||
        "";
      if (returnedAgentId) {
        setAgentId(returnedAgentId);
      }
      if (showToast) {
        enqueueSnackbar(ok ? "Tool setup saved" : "Tool setup failed", {
          variant: ok ? "success" : "error",
        });
      }
      return ok;
    } catch (error) {
      if (showToast) {
        enqueueSnackbar("Tool setup failed", { variant: "error" });
      }
      return false;
    } finally {
      setAgentSaving(false);
    }
  };

  const buildAgentSetupPayload = ({
    includeUiConfig,
    includeTools,
    includeGraphJson = includeTools,
  }: {
    includeUiConfig: boolean;
    includeTools: boolean;
    includeGraphJson?: boolean;
  }) => {
    const payload: Record<string, unknown> = {
      project_id: projectId,
      name: config.agent.name,
      system_prompt: config.agent.systemPrompt,
      max_steps: config.agent.maxSteps,
    };

    if (includeGraphJson) {
      const graphJson = {
        nodes: {
          agent: {
            id: "agent",
            type: "llm",
            description: "Main agent node",
          },
          tool: {
            id: "tool",
            type: "tool",
            description: "Executes tool calls",
          },
        },
        edges: [] as Array<{ from: string; to: string }>,
        entry_point: "agent",
        state_schema: {},
      };

      if (includeTools && hasValidMcp) {
        // graphJson.nodes.push({ id: "tool", type: "tool", config: {} });
        graphJson.edges.push({ from: "agent", to: "tool" });
      }

      payload.graph_json = graphJson;
    }
    if (includeTools && hasValidMcp) {
      payload.mcp_url = config.tools.mcp.url.trim();
    }
    if (includeTools && hasKbCollection) {
      payload.kb_collection = selectedKbCollection;
    }
    if (includeUiConfig) {
      payload.ui_config = previewConfig;
    }

    return payload;
  };

  const submitPreviewConfig = async () => {
    if (!projectId) {
      enqueueSnackbar("Select a project first", { variant: "warning" });
      return;
    }
    setPreviewSubmitting(true);
    try {
      const payload = buildAgentSetupPayload({
        includeUiConfig: true,
        includeTools: true,
        includeGraphJson: true,
      });
      const res = await agentBuilderService.setupAgent(payload as any);
      const ok = Boolean((res as any)?.success) || !(res as any)?.error;
      const returnedAgentId =
        (res as any)?.data?.id ||
        (res as any)?.data?.agent_id ||
        (res as any)?.data?.agentId ||
        (res as any)?.id ||
        (res as any)?.agent_id ||
        (res as any)?.agentId ||
        "";
      if (returnedAgentId) {
        setAgentId(returnedAgentId);
      }
      if (ok) {
        const nextAgentId = returnedAgentId || agentId;
        if (nextAgentId) {
          const agentRaw = {
            id: nextAgentId,
            name: config.agent.name,
            system_prompt: config.agent.systemPrompt,
            reviewer_prompt: config.agent.reviewerPrompt,
            max_steps: config.agent.maxSteps,
            mcp_url: hasValidMcp ? config.tools.mcp.url.trim() : "",
            kb_collection: hasKbCollection ? selectedKbCollection : "",
            ui_config: previewConfig,
          };
          setAgentList((prev) => {
            const existingIndex = prev.findIndex(
              (item) => item.id === String(nextAgentId)
            );
            const nextItem = {
              id: String(nextAgentId),
              name: config.agent.name || "Agent",
              raw: agentRaw,
            };
            if (existingIndex >= 0) {
              const nextList = [...prev];
              nextList[existingIndex] = nextItem;
              return nextList;
            }
            return [...prev, nextItem];
          });
        }
      }
      enqueueSnackbar(
        ok ? "Preview config saved" : "Preview config save failed",
        {
          variant: ok ? "success" : "error",
        }
      );
      if (ok) {
        setDeployModalOpen(true);
      }
    } catch (error) {
      enqueueSnackbar("Preview config save failed", { variant: "error" });
    } finally {
      setPreviewSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      const ok = await submitServiceSetup(false);
      if (!ok) {
        enqueueSnackbar("Agent settings failed", { variant: "error" });
        return;
      }
      const agentOk = await submitAgentSetup(false, false);
      if (!agentOk) {
        enqueueSnackbar("Agent settings failed", { variant: "error" });
        return;
      }
      enqueueSnackbar("Agent settings saved", { variant: "success" });
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
      return;
    }
    if (activeStep === 1) {
      if (config.tools.mcp.url.trim()) {
        const ok = await handleCheckMcp();
        if (!ok) return;
      }
      if (!hasKbCollection && !hasValidMcp && !hasKbIngestionInProgress) {
        enqueueSnackbar("Add MCP or Knowledge Base to continue", {
          variant: "warning",
        });
        return;
      }
      const ok = await submitAgentSetup(true);
      if (!ok) return;
      setToolsSaved(true);
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
      return;
    }
    if (activeStep === 2) {
      await submitPreviewConfig();
    }
  };

  const stepIsValid = (stepIndex: number) => {
    if (stepIndex === 0) {
      return Boolean(
        projectId &&
          config.service.serviceId.trim() &&
          config.agent.name.trim() &&
          config.agent.systemPrompt.trim() &&
          config.agent.maxSteps > 0
      );
    }
    if (stepIndex === 1) {
      return hasKbCollection || hasValidMcp || hasKbIngestionInProgress;
    }
    return true;
  };

  const isLastStep = activeStep === steps.length - 1;
  const stepBusy =
    serviceSaving ||
    agentSaving ||
    previewSubmitting ||
    (activeStep === 1 && mcpChecking);
  const nextDisabled = !stepIsValid(activeStep) || stepBusy;
  const nextTooltip =
    activeStep === 1 &&
    !hasKbCollection &&
    !hasValidMcp &&
    !hasKbIngestionInProgress
      ? "You cannot proceed until either KB upload is started or MCP is connected."
      : "";
  const isLoading = !projectsLoaded || agentConfigLoading;
  const deployedAgentId = agentId;
  const deploymentSnippet = useMemo(
    () => buildIntegrationSnippet(deployedAgentId),
    [deployedAgentId]
  );

  const handleCopyDeploySnippet = async () => {
    try {
      await navigator.clipboard.writeText(deploymentSnippet);
      enqueueSnackbar("Widget code copied", { variant: "success" });
    } catch (error) {
      enqueueSnackbar("Unable to copy widget code", { variant: "error" });
    }
  };

  const handleCloseDeployModal = () => {
    setDeployModalOpen(false);
    setActiveStep(0);
    setShowListView(true);
  };

  const handleEditAgent = (agent: AgentListItem) => {
    applyAgentConfig(agent.raw);
    setShowListView(false);
    setActiveStep(0);
  };

  const handleCreateAgent = () => {
    setConfig(defaultConfig);
    setPreviewConfig(devConfig);
    setAgentId("");
    setKbStatus(null);
    setToolsSaved(false);
    resetFieldErrors();
    setShowListView(false);
    setActiveStep(0);
  };

  return (
    <>
      <DashboardContent maxWidth="xl">
        <Card
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            boxShadow: theme.customShadows?.z24,
            overflow: "visible",
          }}
        >
          <Stack spacing={3}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
            >
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  Agent Builder
                </Typography>
                <Typography color="text.secondary">
                  Build and configure your agents by providing details,
                  connecting data, and defining behavior.
                </Typography>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <FormControl size="small" sx={{ minWidth: 220 }}>
                  <InputLabel id="project-select-label">Project</InputLabel>
                  <Select
                    labelId="project-select-label"
                    label="Project"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value as string)}
                  >
                    {projectOptions.map((project) => (
                      <MenuItem key={project.id} value={project.id}>
                        {project.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>

            {!projectOptions.length && projectsLoaded && (
              <Alert severity="warning">
                Select an organization with at least one project to continue.
              </Alert>
            )}

            {showListView ? (
              <Card sx={{ p: 2.5, borderRadius: 2 }}>
                <Stack spacing={2}>
                  <Stack spacing={1.5}>
                    {isLoading ? (
                      <>
                        <Skeleton variant="rounded" height={72} />
                        <Skeleton variant="rounded" height={72} />
                      </>
                    ) : agentList.length === 0 ? (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: `1px dashed ${alpha(
                            theme.palette.divider,
                            0.4
                          )}`,
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          justifyContent="space-between"
                        >
                          <Stack spacing={0.5}>
                            <Typography variant="subtitle1">
                              No agent found
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Start creating the agent to continue.
                            </Typography>
                          </Stack>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleCreateAgent}
                          >
                            Create agent
                          </Button>
                        </Stack>
                      </Box>
                    ) : (
                      agentList.map((agent, index) => (
                        <Box
                          key={agent.id || `${agent.name}-${index}`}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            border: `1px solid ${alpha(
                              theme.palette.common.white,
                              theme.palette.mode === "dark" ? 0.24 : 0.6
                            )}`,
                          }}
                        >
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            justifyContent="space-between"
                          >
                            <Stack spacing={0.5}>
                              <Typography variant="subtitle1">
                                {agent.name}
                              </Typography>
                              {agent.id && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  ID: {agent.id}
                                </Typography>
                              )}
                            </Stack>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleEditAgent(agent)}
                            >
                              Edit
                            </Button>
                          </Stack>
                        </Box>
                      ))
                    )}
                  </Stack>
                </Stack>
              </Card>
            ) : (
              <>
                <Stepper activeStep={activeStep} alternativeLabel>
                  {steps.map((label, index) => (
                    <Step key={label} completed={activeStep > index}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                <Box>
                  {activeStep === 0 && (
                    <Stack spacing={2.5}>
                      <AgentNodeStep config={config} onChange={updateConfig} />
                      <ServiceStep
                        config={config}
                        onChange={updateConfig}
                        projectId={projectId}
                        serviceSaving={serviceSaving}
                        models={models}
                        providers={providers}
                        modelsLoading={modelsLoading}
                        providersLoading={providersLoading}
                        modelsError={modelsError}
                        providersError={providersError}
                        fieldErrors={serviceFieldErrors}
                        onClearFieldError={clearServiceFieldError}
                      />
                    </Stack>
                  )}
                  {activeStep === 1 && (
                    <ToolsStep
                      config={config}
                      onChange={updateConfig}
                      kbStatus={kbStatus}
                      kbLoading={kbLoading}
                      existingKbCollection={existingKbCollection}
                      onSelectKb={handleKbSelectionChange}
                      onUploadKb={handleUploadKb}
                      onCheckKb={refreshKbStatus}
                      onCheckMcp={handleCheckMcp}
                      mcpChecking={mcpChecking}
                      mcpSaved={toolsSaved && hasValidMcp}
                      onDirty={() => setToolsSaved((prev) => (prev ? false : prev))}
                    />
                  )}
                  {activeStep === 2 && (
                    <PreviewStep
                      config={previewConfig}
                      onChange={setPreviewConfig}
                      agentId={agentId}
                    />
                  )}
                </Box>

                <Divider
                  sx={{ borderColor: alpha(theme.palette.divider, 0.3) }}
                />

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", sm: "center" }}
                >
                  <Button
                    startIcon={<KeyboardArrowLeftIcon />}
                    variant="text"
                    onClick={() =>
                      setActiveStep((prev) => Math.max(0, prev - 1))
                    }
                    disabled={activeStep === 0}
                  >
                    Back
                  </Button>
                  <Tooltip title={nextTooltip} arrow disableInteractive={!nextTooltip}>
                    <span>
                      <Button
                        endIcon={
                          isLastStep ? (
                            <RocketLaunchIcon />
                          ) : (
                            <KeyboardArrowRightIcon />
                          )
                        }
                        variant="contained"
                        onClick={handleNext}
                        disabled={nextDisabled}
                      >
                        {isLastStep
                          ? previewSubmitting
                            ? "Deploying..."
                            : "Deploy Agent"
                          : stepBusy
                          ? "Working..."
                          : "Next"}
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
              </>
            )}
          </Stack>
        </Card>
      </DashboardContent>
      <Dialog
        open={deployModalOpen}
        onClose={handleCloseDeployModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Agent deployed</DialogTitle>
        <DialogContent dividers sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="body1">
                Your agent has been deployed successfully.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can come back here again to edit the agent.
              </Typography>
            </Stack>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="subtitle2">Widget code</Typography>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={handleCopyDeploySnippet}
              >
                Copy code
              </Button>
            </Stack>
            <TextField
              value={deploymentSnippet}
              multiline
              minRows={6}
              fullWidth
              InputProps={{ readOnly: true, sx: { fontFamily: "monospace" } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeployModal} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AgentBuilderPage;
