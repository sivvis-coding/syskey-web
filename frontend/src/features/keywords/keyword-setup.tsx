import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import KeyIcon from "@mui/icons-material/Key";
import {
  Alert,
  Box,
  Button,
  Chip,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { KeyboardEvent, useRef, useState } from "react";

interface KeywordSetupProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
}

export default function KeywordSetup({
  keywords: initialKeywords,
  onChange,
}: KeywordSetupProps) {
  // Local state owns the list — initialized from props on mount.
  // This avoids race conditions when onChange triggers async API calls.
  const [keywords, setKeywords] = useState(initialKeywords);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  // Always keep a ref to the latest onChange so async handlers never call a stale closure
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const update = (next: string[]) => {
    setKeywords(next);
    onChangeRef.current(next);
  };

  const addKeyword = () => {
    const value = input.trim().toLowerCase();
    if (!value) return;

    if (keywords.includes(value)) {
      setError(`"${value}" is already in the list.`);
      return;
    }

    update([...keywords, value]);
    setInput("");
    setError(null);
  };

  const removeKeyword = (kw: string) => {
    update(keywords.filter((k) => k !== kw));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  const handleExport = () => {
    const blob = new Blob([keywords.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keywords.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset before async so the ref stays valid

    const text = await file.text();
    const incoming = text
      .split("\n")
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l.length > 0);

    const merged = [...keywords];
    for (const kw of incoming) {
      if (!merged.includes(kw)) merged.push(kw);
    }

    update(merged);
  };

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Typography variant="h6" fontWeight={600}>
          Configure Keywords
        </Typography>
        <Stack direction="row" gap={1}>
          <Tooltip title="Import from .txt (one keyword per line)">
            <Button
              size="small"
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={() => importRef.current?.click()}
            >
              Import
            </Button>
          </Tooltip>
          <Tooltip title="Export keywords as .txt">
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExport}
                disabled={keywords.length === 0}
              >
                Export
              </Button>
            </span>
          </Tooltip>
          <input
            ref={importRef}
            type="file"
            accept=".txt,text/plain"
            style={{ display: "none" }}
            onChange={handleImport}
          />
        </Stack>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Add the keywords that will be used to classify and search your
        documents. Press <strong>Enter</strong> or click the icon to add a
        keyword.
      </Typography>

      <TextField
        fullWidth
        label="New keyword"
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
        placeholder="e.g. invoice, contract, report…"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <KeyIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment
              position="end"
              onClick={addKeyword}
              sx={{
                cursor: "pointer",
                color: input.trim() ? "primary.main" : "action.disabled",
              }}
            >
              <AddCircleOutlineIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 1 }}
      />

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {keywords.length > 0 ? (
        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 1 }}
          >
            {keywords.length} keyword{keywords.length !== 1 ? "s" : ""}{" "}
            configured
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {keywords.map((kw) => (
              <Chip
                key={kw}
                label={kw}
                color="primary"
                variant="outlined"
                onDelete={() => removeKeyword(kw)}
              />
            ))}
          </Stack>
        </Paper>
      ) : (
        <Alert severity="info" sx={{ mt: 1 }}>
          Add at least one keyword to continue to the next step.
        </Alert>
      )}
    </Box>
  );
}
