import axios from "axios";

export interface UploadedFile {
  id: number;
  filename: string;
  content_type: string | null;
  size_bytes: number;
  project_id: number | null;
}

export async function fetchFiles(): Promise<UploadedFile[]> {
  const { data } = await axios.get<UploadedFile[]>("/api/files/");
  return data;
}

export async function uploadFiles(
  files: File[],
  projectId?: number,
): Promise<UploadedFile[]> {
  const nonPdf = files.filter(
    (f) =>
      f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf"),
  );
  if (nonPdf.length > 0) {
    throw new Error(
      `Only PDF files are allowed: ${nonPdf.map((f) => f.name).join(", ")}`,
    );
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (projectId !== undefined) {
    formData.append("project_id", String(projectId));
  }

  const { data } = await axios.post<UploadedFile[]>(
    "/api/files/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function deleteFile(fileId: number): Promise<void> {
  await axios.delete(`/api/files/${fileId}`);
}
