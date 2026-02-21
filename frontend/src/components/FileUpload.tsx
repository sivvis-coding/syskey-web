import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Stack,
  Paper,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import axios from "axios";

interface UploadedFile {
  id: number;
  filename: string;
  content_type: string | null;
  size_bytes: number;
}

export default function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    setUploading(true);
    setError(null);
    setResults([]);

    const formData = new FormData();
    acceptedFiles.forEach((file) => formData.append("files", file));

    try {
      const { data } = await axios.post<UploadedFile[]>("/api/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResults(data);
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : "Upload failed. Please try again.";
      setError(message);
    } finally {
      setUploading(false);
    }
  }, []);

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
          {isDragActive ? "Drop files here…" : "Drag & drop files, or click to select"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supports any file type. Text files will be indexed for search.
        </Typography>
      </Paper>

      {uploading && <LinearProgress sx={{ mt: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {results.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Uploaded {results.length} file(s):
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {results.map((f) => (
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
