import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useFileUpload } from "./hooks/use-file-upload";

export default function FileUpload() {
  const mutation = useFileUpload();

  const errorMessage = mutation.error
    ? axios.isAxiosError(mutation.error) &&
      mutation.error.response?.data?.detail
      ? String(mutation.error.response.data.detail)
      : "Upload failed. Please try again."
    : null;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length) await mutation.mutateAsync(acceptedFiles);
    },
    [mutation],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <Box>
      <Paper
        {...getRootProps()}
        variant="outlined"
        sx={{
          p: 4,
          textAlign: "center",
          cursor: "pointer",
          borderStyle: "dashed",
          borderColor: isDragActive ? "primary.main" : "grey.400",
          bgcolor: isDragActive ? "primary.50" : "background.paper",
          transition: "all 0.2s",
          "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
        }}
      >
        <input {...getInputProps()} />
        <UploadFileIcon sx={{ fontSize: 48, color: "primary.main", mb: 1 }} />
        <Typography variant="h6">
          {isDragActive
            ? "Drop files here…"
            : "Drag & drop files, or click to select"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supports any file type. Text files will be indexed for search.
        </Typography>
      </Paper>

      {mutation.isPending && <LinearProgress sx={{ mt: 2 }} />}

      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {(mutation.data ?? []).length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Uploaded {mutation.data!.length} file(s):
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {mutation.data!.map((f) => (
              <Chip
                key={f.id}
                label={`${f.filename} (${(f.size_bytes / 1024).toFixed(1)} KB)`}
                color="success"
                variant="outlined"
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
