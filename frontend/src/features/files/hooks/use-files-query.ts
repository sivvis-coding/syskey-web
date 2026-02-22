import { useQuery } from "@tanstack/react-query";
import { fetchFiles } from "../mutations/files";

export const FILES_QUERY_KEY = ["files"] as const;

export function useFilesQuery() {
  return useQuery({
    queryKey: FILES_QUERY_KEY,
    queryFn: fetchFiles,
  });
}
