import axios from "axios";

export async function downloadClassificationZip(
  projectId: number,
  type: "matched" | "unmatched",
): Promise<void> {
  const response = await axios.get(
    `/api/projects/${projectId}/classification/export/${type}`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(new Blob([response.data]));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}_${projectId}.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
