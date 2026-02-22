import BarChartIcon from "@mui/icons-material/BarChart";
import DownloadIcon from "@mui/icons-material/Download";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useAnalysisQuery } from "./hooks/use-analysis-query";
import { useRunAnalysis } from "./hooks/use-run-analysis";

type FileSortDir = "asc" | "desc";

interface Props {
  projectId: number;
}

function cellBg(count: number): string {
  if (count === 0) return "transparent";
  if (count < 3) return "#fff3e0"; // amber-50
  if (count < 10) return "#e8f5e9"; // green-50
  return "#fce4ec"; // red-50
}

function cellColor(count: number): string {
  if (count === 0) return "text.disabled";
  if (count < 3) return "#e65100"; // amber-900
  if (count < 10) return "#1b5e20"; // green-900
  return "#b71c1c"; // red-900
}

export default function ProjectAnalysis({ projectId }: Props) {
  const { data, isLoading, isError } = useAnalysisQuery(projectId);
  const runMutation = useRunAnalysis(projectId);

  const running = runMutation.isPending;

  const [fileSortDir, setFileSortDir] = useState<FileSortDir>("desc");
  const [fileSortKeyword, setFileSortKeyword] = useState<
    string | "filename" | "total"
  >("total");
  const [csvAnchor, setCsvAnchor] = useState<null | HTMLElement>(null);

  // Derive unique keywords and files from the flat rows
  const { keywords, pivotRows } = useMemo(() => {
    if (!data?.rows.length) return { keywords: [], pivotRows: [] };

    const kwSet = new Set<string>();
    const fileMap = new Map<
      number,
      { filename: string; counts: Map<string, number> }
    >();

    for (const row of data.rows) {
      kwSet.add(row.keyword);
      if (!fileMap.has(row.file_id)) {
        fileMap.set(row.file_id, { filename: row.filename, counts: new Map() });
      }
      fileMap.get(row.file_id)!.counts.set(row.keyword, row.count);
    }

    const kws = Array.from(kwSet).sort();

    let rows = Array.from(fileMap.entries()).map(
      ([file_id, { filename, counts }]) => ({
        file_id,
        filename,
        counts,
        total: Array.from(counts.values()).reduce((s, c) => s + c, 0),
      }),
    );

    // Sort rows
    rows.sort((a, b) => {
      let cmp = 0;
      if (fileSortKeyword === "total") {
        cmp = a.total - b.total;
      } else if (fileSortKeyword === "filename") {
        cmp = a.filename.localeCompare(b.filename);
      } else {
        cmp =
          (a.counts.get(fileSortKeyword) ?? 0) -
          (b.counts.get(fileSortKeyword) ?? 0);
      }
      return fileSortDir === "asc" ? cmp : -cmp;
    });

    return { keywords: kws, pivotRows: rows };
  }, [data, fileSortDir, fileSortKeyword]);

  const totalMatches = useMemo(
    () => (data?.rows ?? []).reduce((s, r) => s + r.count, 0),
    [data],
  );

  const handleSort = (key: string) => {
    if (key === fileSortKeyword) {
      setFileSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setFileSortKeyword(key);
      setFileSortDir("desc");
    }
  };

  const exportCsv = (sep: string) => {
    const escapeCell = (v: string | number) =>
      typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : String(v);
    const header = ["File", ...keywords, "Total"].map(escapeCell).join(sep);
    const dataRows = pivotRows.map((row) =>
      [
        row.filename,
        ...keywords.map((kw) => row.counts.get(kw) ?? 0),
        row.total,
      ]
        .map(escapeCell)
        .join(sep),
    );
    const footer = [
      "Total",
      ...keywords.map((kw) =>
        pivotRows.reduce((s, r) => s + (r.counts.get(kw) ?? 0), 0),
      ),
      totalMatches,
    ]
      .map(escapeCell)
      .join(sep);
    const csv = [header, ...dataRows, footer].join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <>
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          Failed to load analysis.
        </Alert>
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={() => runMutation.mutate()}
        >
          Retry
        </Button>
      </>
    );
  }

  // Never been run for this project
  if (!data?.analyzed_at) {
    return (
      <Box sx={{ textAlign: "center", py: 6 }}>
        <BarChartIcon sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Click the button below to cross-match all project keywords against
          every indexed file.
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={
            running ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <PlayArrowIcon />
            )
          }
          disabled={running}
          onClick={() => runMutation.mutate()}
          sx={{ mt: 2 }}
        >
          {running ? "Running…" : "Run Analysis"}
        </Button>
      </Box>
    );
  }

  if (!data?.rows.length) {
    return (
      <>
        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          No data to analyse. Make sure the project has keywords and indexed
          files.
        </Alert>
        <Button
          variant="outlined"
          startIcon={
            running ? <CircularProgress size={14} /> : <PlayArrowIcon />
          }
          disabled={running}
          onClick={() => runMutation.mutate()}
        >
          {running ? "Running…" : "Run Again"}
        </Button>
      </>
    );
  }

  return (
    <Box>
      {/* Stale warning */}
      {data.is_stale && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={
                running ? (
                  <CircularProgress size={14} color="inherit" />
                ) : (
                  <PlayArrowIcon />
                )
              }
              disabled={running}
              onClick={() => runMutation.mutate()}
            >
              {running ? "Running…" : "Run Again"}
            </Button>
          }
        >
          The analysis may be outdated — keywords or files have changed since it
          was last run.
        </Alert>
      )}

      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 2,
          flexWrap: "wrap",
        }}
      >
        <BarChartIcon color="primary" />
        <Typography variant="subtitle1" fontWeight={600}>
          Keyword analysis
        </Typography>
        <Chip
          label={`${totalMatches} total matches`}
          size="small"
          color="primary"
          variant="outlined"
        />
        <Chip
          label={`${pivotRows.length} file${pivotRows.length !== 1 ? "s" : ""} · ${keywords.length} keyword${keywords.length !== 1 ? "s" : ""}`}
          size="small"
          variant="outlined"
        />
        {data.analyzed_at && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            Last run {new Date(data.analyzed_at).toLocaleString()}
          </Typography>
        )}
        <Button
          size="small"
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={(e) => setCsvAnchor(e.currentTarget)}
          sx={{ ml: "auto" }}
        >
          Export CSV
        </Button>
        <Menu
          anchorEl={csvAnchor}
          open={Boolean(csvAnchor)}
          onClose={() => setCsvAnchor(null)}
        >
          <MenuItem
            onClick={() => {
              exportCsv(",");
              setCsvAnchor(null);
            }}
          >
            Comma (,)
          </MenuItem>
          <MenuItem
            onClick={() => {
              exportCsv(";");
              setCsvAnchor(null);
            }}
          >
            Semicolon (;)
          </MenuItem>
        </Menu>
        <Button
          size="small"
          variant="outlined"
          startIcon={
            running ? <CircularProgress size={14} /> : <PlayArrowIcon />
          }
          disabled={running}
          onClick={() => runMutation.mutate()}
        >
          {running ? "Running…" : "Run Again"}
        </Button>
      </Box>

      {/* Pivot grid */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ overflowX: "auto" }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {/* File column header */}
              <TableCell
                sx={{
                  fontWeight: 700,
                  minWidth: 200,
                  position: "sticky",
                  left: 0,
                  zIndex: 3,
                  bgcolor: "background.paper",
                }}
                sortDirection={
                  fileSortKeyword === "filename" ? fileSortDir : false
                }
              >
                <TableSortLabel
                  active={fileSortKeyword === "filename"}
                  direction={
                    fileSortKeyword === "filename" ? fileSortDir : "asc"
                  }
                  onClick={() => handleSort("filename")}
                >
                  File
                </TableSortLabel>
              </TableCell>

              {/* One column per keyword */}
              {keywords.map((kw) => (
                <TableCell
                  key={kw}
                  align="center"
                  sx={{ fontWeight: 700, minWidth: 110 }}
                  sortDirection={fileSortKeyword === kw ? fileSortDir : false}
                >
                  <TableSortLabel
                    active={fileSortKeyword === kw}
                    direction={fileSortKeyword === kw ? fileSortDir : "desc"}
                    onClick={() => handleSort(kw)}
                  >
                    <Tooltip title={kw} placement="top">
                      <Typography
                        variant="caption"
                        fontWeight={700}
                        noWrap
                        sx={{ maxWidth: 100, display: "block" }}
                      >
                        {kw}
                      </Typography>
                    </Tooltip>
                  </TableSortLabel>
                </TableCell>
              ))}

              {/* Total column */}
              <TableCell
                align="center"
                sx={{
                  fontWeight: 700,
                  minWidth: 80,
                  borderLeft: "2px solid",
                  borderColor: "divider",
                }}
                sortDirection={
                  fileSortKeyword === "total" ? fileSortDir : false
                }
              >
                <TableSortLabel
                  active={fileSortKeyword === "total"}
                  direction={fileSortKeyword === "total" ? fileSortDir : "desc"}
                  onClick={() => handleSort("total")}
                >
                  Total
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {pivotRows.map((row) => (
              <TableRow key={row.file_id} hover>
                {/* Filename cell — sticky */}
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 0,
                    bgcolor: "background.paper",
                    zIndex: 1,
                    maxWidth: 260,
                  }}
                >
                  <Tooltip title={row.filename} placement="right">
                    <Typography variant="body2" noWrap sx={{ maxWidth: 240 }}>
                      {row.filename}
                    </Typography>
                  </Tooltip>
                </TableCell>

                {/* Count cells */}
                {keywords.map((kw) => {
                  const count = row.counts.get(kw) ?? 0;
                  return (
                    <TableCell
                      key={kw}
                      align="center"
                      sx={{
                        bgcolor: cellBg(count),
                        transition: "background 0.2s",
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={count > 0 ? 700 : 400}
                        sx={{ color: cellColor(count) }}
                      >
                        {count > 0 ? count : "–"}
                      </Typography>
                    </TableCell>
                  );
                })}

                {/* Total cell */}
                <TableCell
                  align="center"
                  sx={{
                    borderLeft: "2px solid",
                    borderColor: "divider",
                    bgcolor: row.total > 0 ? "#e3f2fd" : "transparent",
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    color={row.total > 0 ? "primary.main" : "text.disabled"}
                  >
                    {row.total > 0 ? row.total : "–"}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}

            {/* Totals footer row */}
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell
                sx={{
                  fontWeight: 700,
                  position: "sticky",
                  left: 0,
                  bgcolor: "action.hover",
                  zIndex: 1,
                }}
              >
                Total
              </TableCell>
              {keywords.map((kw) => {
                const kwTotal = pivotRows.reduce(
                  (s, r) => s + (r.counts.get(kw) ?? 0),
                  0,
                );
                return (
                  <TableCell key={kw} align="center" sx={{ fontWeight: 700 }}>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      color={kwTotal > 0 ? "text.primary" : "text.disabled"}
                    >
                      {kwTotal > 0 ? kwTotal : "–"}
                    </Typography>
                  </TableCell>
                );
              })}
              <TableCell
                align="center"
                sx={{
                  borderLeft: "2px solid",
                  borderColor: "divider",
                  fontWeight: 700,
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color="primary.main"
                >
                  {totalMatches}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* Legend */}
      <Box sx={{ display: "flex", gap: 2, mt: 1.5, flexWrap: "wrap" }}>
        {[
          { bg: "#fff3e0", color: "#e65100", label: "1–2 matches" },
          { bg: "#e8f5e9", color: "#1b5e20", label: "3–9 matches" },
          { bg: "#fce4ec", color: "#b71c1c", label: "10+ matches" },
        ].map(({ bg, label }) => (
          <Box
            key={label}
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <Box
              sx={{
                width: 14,
                height: 14,
                bgcolor: bg,
                border: "1px solid #ccc",
                borderRadius: 0.5,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
