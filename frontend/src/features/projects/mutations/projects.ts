import axios from "axios";
import { Project } from "../../../types";

const BASE = "/api/projects";

export async function createProject(name: string): Promise<Project> {
  const { data } = await axios.post<Project>(`${BASE}/`, { name });
  return data;
}

export async function deleteProject(id: number): Promise<void> {
  await axios.delete(`${BASE}/${id}`);
}

export async function updateProjectKeywords(
  id: number,
  keywords: string[],
): Promise<Project> {
  const { data } = await axios.put<Project>(`${BASE}/${id}/keywords`, {
    keywords,
  });
  return data;
}
