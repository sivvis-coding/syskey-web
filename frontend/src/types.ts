export interface ProjectFile {
  id: number;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  project_id: number | null;
}

export interface Project {
  id: number;
  name: string;
  created_at: string; // ISO string from API
  keywords: string[];
  files: ProjectFile[];
}
