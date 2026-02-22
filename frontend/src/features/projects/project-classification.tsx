import DownloadIcon from "@mui/icons-material/Download";
import FolderOffIcon from "@mui/icons-material/FolderOff";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useAnalysisQuery } from "./hooks/use-analysis-query";
import { downloadClassificationZip } from "./queries/classification";

interface Props {
  projectId: number;
}

export default function ProjectClassification({ projectId }: Props) {
  const { data, isLoading } = useAnalysisQuery(projectId);
  const [loadingMatched, setLoadingMatched] = useState(false);
  const [loadingUnmatched, setLoadingUnmatched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async (type: "matched" | "unmatched") => {
    setError(null);
    const setLoading =
      type === "matched" ? setLoadingMatched : setLoadingUnmatched;
    setLoading(true);
    try {
      await downloadClassificationZip(projectId, type);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail ?? "Download failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data?.analyzed_at) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        Run the <strong>Analysis</strong> first. The classification export uses
        the saved analysis results to split files into matched and unmatched
        groups.
      </Alert>
    );
  }

  // Derive counts from cached analysis
  const fileTotals = new Map<number, number>();
  for (const row of data.rows) {
    fileTotals.set(row.file_id, (fileTotals.get(row.file_id) ?? 0) + row.count);
  }
  const matchedCount = Array.from(fileTotals.values()).filter(
    (v) => v > 0,
  ).length;
  const totalFiles = fileTotals.size;
  const unmatchedCount = totalFiles - matchedCount;

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Export by classification
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Based on the last analysis run on{" "}
        <strong>{new Date(data.analyzed_at).toLocaleString()}</strong>.
        {data.is_stale && (
          <> The analysis may be outdated — consider re-running it first.</>
        )}
      </Typography>

      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        {/* Matched card */}
        <Card variant="outlined" sx={{ flex: 1, minWidth: 220 }}>
          <CardContent sx={{ textAlign: "center", py: 3 }}>
            <TaskAltIcon sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Matched
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {matchedCount} file{matchedCount !== 1 ? "s" : ""} with at least
              one keyword hit
            </Typography>
            <Button
              variant="contained"
              color="success"
              startIcon={
                loadingMatched ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <DownloadIcon />
                )
              }
              disabled={loadingMatched || matchedCount === 0}
              onClick={() => handleDownload("matched")}
              fullWidth
            >
              {loadingMatched ? "Preparing…" : "Download ZIP"}
            </Button>
          </CardContent>
        </Card>

        <Divider orientation="vertical" flexItem />

        {/* Unmatched card */}
        <Card variant="outlined" sx={{ flex: 1, minWidth: 220 }}>
          <CardContent sx={{ textAlign: "center", py: 3 }}>
            <FolderOffIcon
              sx={{ fontSize: 40, color: "warning.main", mb: 1 }}
            />
            <Typography variant="subtitle1" fontWeight={600}>
              Unmatched
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {unmatchedCount} file{unmatchedCount !== 1 ? "s" : ""} with no
              keyword matches
            </Typography>
            <Button
              variant="contained"
              color="warning"
              startIcon={
                loadingUnmatched ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <DownloadIcon />
                )
              }
              disabled={loadingUnmatched || unmatchedCount === 0}
              onClick={() => handleDownload("unmatched")}
              fullWidth
            >
              {loadingUnmatched ? "Preparing…" : "Download ZIP"}
            </Button>
          </CardContent>
        </Card>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
