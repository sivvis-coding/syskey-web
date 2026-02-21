import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import FolderIcon from "@mui/icons-material/Folder";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Project } from "../../types";

interface ProjectDashboardProps {
  projects: Project[];
  onCreateProject: (name: string) => void;
  onSelectProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
}

export default function ProjectDashboard({
  projects,
  onCreateProject,
  onSelectProject,
  onDeleteProject,
}: ProjectDashboardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmProject, setConfirmProject] = useState<Project | null>(null);

  const isDuplicate = (name: string) =>
    projects.some(
      (p) => p.name.trim().toLowerCase() === name.trim().toLowerCase(),
    );

  const handleCreate = () => {
    const name = projectName.trim();
    if (!name) {
      setNameError("Project name cannot be empty.");
      return;
    }
    if (isDuplicate(name)) {
      setNameError(`A project named "${name}" already exists.`);
      return;
    }
    onCreateProject(name);
    setProjectName("");
    setNameError(null);
    setDialogOpen(false);
  };

  const handleClose = () => {
    setDialogOpen(false);
    setProjectName("");
    setNameError(null);
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a project to configure keywords and upload files, or create a
            new one.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          New Project
        </Button>
      </Box>

      {projects.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 8,
            border: "1px dashed",
            borderColor: "grey.300",
            borderRadius: 2,
          }}
        >
          <FolderIcon sx={{ fontSize: 56, color: "grey.400", mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            No projects yet. Create one to get started.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card
                variant="outlined"
                sx={{ height: "100%", position: "relative" }}
              >
                <Tooltip title="Delete project">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmProject(project);
                    }}
                    sx={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      zIndex: 1,
                      color: "grey.500",
                      "&:hover": { color: "error.main" },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <CardActionArea
                  onClick={() => onSelectProject(project)}
                  sx={{ height: "100%", p: 1 }}
                >
                  <CardContent>
                    <FolderIcon sx={{ color: "primary.main", mb: 1 }} />
                    <Typography variant="subtitle1" fontWeight={600} noWrap>
                      {project.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                    >
                      Created{" "}
                      {new Date(project.created_at).toLocaleDateString()}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mt: 0.5 }}
                    >
                      {project.keywords.length > 0
                        ? `${project.keywords.length} keyword${project.keywords.length !== 1 ? "s" : ""}`
                        : "No keywords yet"}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Confirm Delete Dialog */}
      <Dialog
        open={!!confirmProject}
        onClose={() => setConfirmProject(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete project?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete{" "}
            <strong>{confirmProject?.name}</strong>? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmProject(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (confirmProject) onDeleteProject(confirmProject);
              setConfirmProject(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Project Dialog */}
      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xs" fullWidth>
        <DialogTitle>New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Project name"
            value={projectName}
            onChange={(e) => {
              const value = e.target.value;
              setProjectName(value);
              if (value.trim() && isDuplicate(value))
                setNameError(
                  `A project named "${value.trim()}" already exists.`,
                );
              else setNameError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            error={!!nameError}
            helperText={nameError ?? " "}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!!nameError}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
