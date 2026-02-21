import { useState } from "react";
import { Box, Container, Typography, Divider, Tab, Tabs } from "@mui/material";
import FileUpload from "./components/FileUpload";
import SearchResults from "./components/SearchResults";

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState(0);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        🔑 syskey-web
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Upload documents, search by keyword, and classify with tags.
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 1 }}>
        <Tab label="Upload Files" />
        <Tab label="Search" />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <FileUpload />
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <SearchResults />
      </TabPanel>
    </Container>
  );
}
