import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  deleteProject,
  updateProjectKeywords,
} from "../mutations/projects";
import { PROJECTS_QUERY_KEY } from "./use-projects-query";

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createProject(name),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteProject(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY }),
  });
}

export function useUpdateProjectKeywords() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, keywords }: { id: number; keywords: string[] }) =>
      updateProjectKeywords(id, keywords),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY }),
  });
}
