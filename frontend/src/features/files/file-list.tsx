import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from "@mui/material";
import { useDeleteFile } from "./hooks/use-delete-file";
import { useFilesQuery } from "./hooks/use-files-query";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileList() {
  const { data: files = [], isPending, isError } = useFilesQuery();
  const deleteMutation = useDeleteFile();

  if (isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ mt: 1 }}>
        Could not load uploaded files.
      </Alert>
    );
  }

  if (files.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        No files uploaded yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Uploaded files ({files.length})
      </Typography>
      <List disablePadding>
        {files.map((file) => (
          <ListItem
            key={file.id}
            divider
            secondaryAction={
              <Tooltip title="Delete file">
                <span>
                  <IconButton
                    edge="end"
                    color="error"
                    size="small"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(file.id)}
                  >
                    {deleteMutation.isPending &&
                    deleteMutation.variables === file.id ? (
                      <CircularProgress size={18} color="error" />
                    ) : (
                      <DeleteIcon fontSize="small" />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
            }
            sx={{ px: 0 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <InsertDriveFileIcon color="action" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary={file.filename}
              secondary={formatBytes(file.size_bytes)}
              primaryTypographyProps={{ variant: "body2", noWrap: true }}
              secondaryTypographyProps={{ variant: "caption" }}
            />
          </ListItem>
        ))}
      </List>

      {deleteMutation.isError && (
        <Alert severity="error" sx={{ mt: 1 }}>
          Failed to delete file. Please try again.
        </Alert>
      )}
    </Box>
  );
}
