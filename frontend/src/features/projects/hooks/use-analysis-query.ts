import { useQuery } from "@tanstack/react-query";
import { fetchAnalysis } from "../queries/analysis";

export function analysisQueryKey(projectId: number) {
  return ["analysis", projectId] as const;
}

export function useAnalysisQuery(projectId: number) {
  return useQuery({
    queryKey: analysisQueryKey(projectId),
    queryFn: () => fetchAnalysis(projectId),
  });
}
