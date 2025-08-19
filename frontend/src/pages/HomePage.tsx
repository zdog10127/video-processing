import React, { useState } from "react";
import { Container, Box, Divider } from "@mui/material";
import { VideoUpload } from "../components/VideoUpload";
import { VideoList } from "../components/VideoList";

export const HomePage: React.FC = () => {
  const [refreshList, setRefreshList] = useState(false);

  const handleUploadSuccess = () => {
    setRefreshList(true);
  };

  const handleRefreshComplete = () => {
    setRefreshList(false);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box>
        <VideoUpload onUploadSuccess={handleUploadSuccess} />
        <Divider sx={{ my: 4 }} />
        <VideoList
          refresh={refreshList}
          onRefreshComplete={handleRefreshComplete}
        />
      </Box>
    </Container>
  );
};
