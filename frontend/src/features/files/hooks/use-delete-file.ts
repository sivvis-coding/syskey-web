import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PROJECTS_QUERY_KEY } from "../../projects/hooks/use-projects-query";
import { deleteFile } from "../mutations/files";
import { FILES_QUERY_KEY } from "./use-files-query";

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (fileId: number) => deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FILES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}
