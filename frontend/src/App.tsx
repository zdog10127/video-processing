import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, AppBar, Toolbar, Typography, Box } from "@mui/material";
import { VideoLibrary } from "@mui/icons-material";
import { HomePage } from "./pages/HomePage";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <VideoLibrary sx={{ mr: 2 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Sistema de Processamento de Vídeos
              </Typography>
            </Toolbar>
          </AppBar>
          <HomePage />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
