import axios from "axios";

export interface UploadedFile {
  id: number;
  filename: string;
  content_type: string | null;
  size_bytes: number;
}

export async function uploadFiles(files: File[]): Promise<UploadedFile[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const { data } = await axios.post<UploadedFile[]>(
    "/api/files/upload",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}
