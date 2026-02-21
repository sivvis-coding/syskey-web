import { useMutation } from "@tanstack/react-query";
import { uploadFiles } from "../mutations/files";

export function useFileUpload() {
  return useMutation({
    mutationFn: (files: File[]) => uploadFiles(files),
  });
}
