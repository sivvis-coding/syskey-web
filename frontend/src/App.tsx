import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import KeyIcon from "@mui/icons-material/Key";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import {
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Link,
  Typography,
} from "@mui/material";
import { useState } from "react";
import FileUpload from "./features/files/file-upload";
import KeywordSetup from "./features/keywords/keyword-setup";
import {
  useCreateProject,
  useDeleteProject,
  useUpdateProjectKeywords,
} from "./features/projects/hooks/use-projects-mutations";
import { useProjectsQuery } from "./features/projects/hooks/use-projects-query";
import ProjectDashboard from "./features/projects/project-dashboard";
import { Project } from "./types";

type ProjectView = "menu" | "keywords" | "upload";

const MENU_ITEMS: {
  view: ProjectView;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    view: "keywords",
    label: "Keywords",
    description: "Add or remove the keywords used to classify documents.",
    icon: <KeyIcon sx={{ fontSize: 40, color: "primary.main" }} />,
  },
  {
    view: "upload",
    label: "Upload Files",
    description: "Upload documents to be indexed and classified.",
    icon: <UploadFileIcon sx={{ fontSize: 40, color: "primary.main" }} />,
  },
];

export default function App() {
  const { data: projects = [], isPending: loading } = useProjectsQuery();
  const createMutation = useCreateProject();
  const deleteMutation = useDeleteProject();
  const updateKeywordsMutation = useUpdateProjectKeywords();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectView, setProjectView] = useState<ProjectView>("menu");

  // ── Project actions ──────────────────────────────────────────────────────
  const handleCreateProject = async (name: string) => {
    const project = await createMutation.mutateAsync(name);
    openProject(project);
  };

  const openProject = (project: Project) => {
    setSelectedProject(project);
    setProjectView("menu");
  };

  const handleBackToDashboard = () => {
    setSelectedProject(null);
    setProjectView("menu");
  };

  const handleDeleteProject = async (project: Project) => {
    await deleteMutation.mutateAsync(project.id);
  };

  const handleKeywordsChange = async (keywords: string[]) => {
    if (!selectedProject) return;
    const updated = await updateKeywordsMutation.mutateAsync({
      id: selectedProject.id,
      keywords,
    });
    setSelectedProject(updated);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        🔑 syskey-web
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Upload documents, search by keyword, and classify with tags.
      </Typography>

      <Divider sx={{ my: 3 }} />

      {/* ── Loading state ── */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ── Dashboard view ── */}
      {!loading && !selectedProject && (
        <ProjectDashboard
          projects={projects}
          onCreateProject={handleCreateProject}
          onSelectProject={openProject}
          onDeleteProject={handleDeleteProject}
        />
      )}

      {/* ── Project view ── */}
      {!loading && selectedProject && (
        <>
          {/* Breadcrumb nav */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <Button
              size="small"
              startIcon={<ArrowBackIcon />}
              onClick={
                projectView === "menu"
                  ? handleBackToDashboard
                  : () => setProjectView("menu")
              }
              variant="text"
              sx={{ textTransform: "none", px: 0, mr: 1 }}
            />
            <Breadcrumbs>
              <Link
                underline="hover"
                color="text.secondary"
                sx={{ cursor: "pointer" }}
                onClick={handleBackToDashboard}
              >
                Projects
              </Link>
              {projectView === "menu" ? (
                <Typography color="text.primary" fontWeight={600}>
                  {selectedProject.name}
                </Typography>
              ) : (
                <Link
                  underline="hover"
                  color="text.secondary"
                  sx={{ cursor: "pointer" }}
                  onClick={() => setProjectView("menu")}
                >
                  {selectedProject.name}
                </Link>
              )}
              {projectView !== "menu" && (
                <Typography color="text.primary" fontWeight={600}>
                  {MENU_ITEMS.find((m) => m.view === projectView)?.label}
                </Typography>
              )}
            </Breadcrumbs>
          </Box>

          {/* ── Project menu ── */}
          {projectView === "menu" && (
            <>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {selectedProject.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                What would you like to do?
              </Typography>
              <Grid container spacing={2}>
                {MENU_ITEMS.map((item) => (
                  <Grid item xs={12} sm={6} key={item.view}>
                    <Card variant="outlined">
                      <CardActionArea
                        onClick={() => setProjectView(item.view)}
                        sx={{ p: 1 }}
                      >
                        <CardContent sx={{ textAlign: "center", py: 3 }}>
                          {item.icon}
                          <Typography
                            variant="subtitle1"
                            fontWeight={600}
                            sx={{ mt: 1 }}
                          >
                            {item.label}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            {item.description}
                          </Typography>
                          {item.view === "keywords" &&
                            selectedProject.keywords.length > 0 && (
                              <Typography
                                variant="caption"
                                color="primary"
                                display="block"
                                sx={{ mt: 1 }}
                              >
                                {selectedProject.keywords.length} keyword
                                {selectedProject.keywords.length !== 1
                                  ? "s"
                                  : ""}{" "}
                                configured
                              </Typography>
                            )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}

          {/* ── Keywords section ── */}
          {projectView === "keywords" && (
            <KeywordSetup
              keywords={selectedProject.keywords}
              onChange={handleKeywordsChange}
            />
          )}

          {/* ── Upload section ── */}
          {projectView === "upload" && <FileUpload />}
        </>
      )}
    </Container>
  );
}
