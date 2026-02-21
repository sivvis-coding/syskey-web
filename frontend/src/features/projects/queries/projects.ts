import axios from "axios";
import { Project } from "../../../types";

const BASE = "/api/projects";

export async function fetchProjects(): Promise<Project[]> {
  const { data } = await axios.get<Project[]>(`${BASE}/`);
  return data;
}
