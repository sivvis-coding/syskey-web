import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runAnalysis } from "../queries/analysis";
import { analysisQueryKey } from "./use-analysis-query";

export function useRunAnalysis(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => runAnalysis(projectId),
    onSuccess: (data) => {
      // Update the cache directly with the fresh result — no extra GET needed
      queryClient.setQueryData(analysisQueryKey(projectId), data);
    },
  });
}
