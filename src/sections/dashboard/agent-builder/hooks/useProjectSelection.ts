import { useEffect, useMemo, useState } from "react";

type ProjectOption = { id: string };

export default function useProjectSelection({
  projectOptions,
  organizationId,
}: {
  projectOptions: ProjectOption[];
  organizationId?: string | null;
}) {
  const projectStorageKey = useMemo(
    () => `agent_builder_project_id:${organizationId || "default"}`,
    [organizationId]
  );
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    if (!projectOptions.length) {
      setProjectId("");
      return;
    }
    setProjectId((prev) => {
      const prevValid = prev && projectOptions.some((p) => p.id === prev);
      if (prevValid) return prev;
      const storedId =
        typeof window !== "undefined"
          ? localStorage.getItem(projectStorageKey)
          : null;
      const storedValid =
        storedId && projectOptions.some((p) => p.id === storedId);
      if (storedValid) return storedId as string;
      return projectOptions[0].id;
    });
  }, [projectOptions, projectStorageKey]);

  useEffect(() => {
    if (!projectId || typeof window === "undefined") return;
    localStorage.setItem(projectStorageKey, projectId);
  }, [projectId, projectStorageKey]);

  return { projectId, setProjectId };
}
