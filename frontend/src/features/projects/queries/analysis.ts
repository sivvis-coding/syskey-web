import axios from "axios";

export interface AnalysisRow {
  file_id: number;
  filename: string;
  keyword: string;
  count: number;
}

export interface AnalysisResponse {
  project_id: number;
  rows: AnalysisRow[];
  analyzed_at: string | null;
  is_stale: boolean;
}

export async function fetchAnalysis(
  projectId: number,
): Promise<AnalysisResponse> {
  const { data } = await axios.get<AnalysisResponse>(
    `/api/projects/${projectId}/analysis`,
  );
  return data;
}

export async function runAnalysis(
  projectId: number,
): Promise<AnalysisResponse> {
  const { data } = await axios.post<AnalysisResponse>(
    `/api/projects/${projectId}/analysis`,
  );
  return data;
}
