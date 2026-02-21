import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

interface SearchResult {
  file_id: number;
  filename: string;
  snippet: string;
}

interface HighlightedSnippetProps {
  snippet: string;
}

/**
 * Render a snippet string that may contain <mark>…</mark> tags as JSX,
 * highlighting matched terms in yellow.
 */
function HighlightedSnippet({ snippet }: HighlightedSnippetProps) {
  const parts = snippet.split(/(<mark>.*?<\/mark>)/g);
  return (
    <Typography variant="body2" component="p" sx={{ mt: 1, lineHeight: 1.8 }}>
      {parts.map((part, i) => {
        if (part.startsWith("<mark>")) {
          const text = part.replace(/<\/?mark>/g, "");
          return (
            <mark
              key={i}
              style={{
                backgroundColor: "#fff176",
                borderRadius: 2,
                padding: "0 2px",
              }}
            >
              {text}
            </mark>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </Typography>
  );
}

export default function SearchResults() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setSearched(true);

    try {
      const { data } = await axios.get<SearchResult[]>("/api/search/", {
        params: { q: query, limit: 20 },
      });
      setResults(data);
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? String(err.response.data.detail)
          : "Search failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box component="form" onSubmit={handleSearch} sx={{ display: "flex", gap: 1, mb: 3 }}>
        <TextField
          fullWidth
          label="Search by keyword"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 120 }}>
          {loading ? <CircularProgress size={20} color="inherit" /> : "Search"}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {searched && !loading && results.length === 0 && !error && (
        <Alert severity="info">No results found for "{query}".</Alert>
      )}

      {results.map((result, idx) => (
        <Card key={idx} variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600}>
              {result.filename}
            </Typography>
            <HighlightedSnippet snippet={result.snippet} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
