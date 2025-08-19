import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Paper,
  IconButton,
} from "@mui/material";
import { CloudUpload, VideoFile, Close } from "@mui/icons-material";
import { videoService } from "../services/api";

interface VideoUploadProps {
  onUploadSuccess: () => void;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({
  onUploadSuccess,
}) => {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setError("");
      setSuccess("");
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [".mp4", ".avi", ".mov", ".mkv", ".webm"],
    },
    maxSize: 100 * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const response = await videoService.uploadVideo(selectedFile);
      setSuccess(`Vídeo enviado com sucesso! ID: ${response.videoId}`);
      setSelectedFile(null);
      onUploadSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro durante o upload");
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError("");
    setSuccess("");
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" gutterBottom>
        Upload de Vídeo
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {!selectedFile ? (
        <Paper
          {...getRootProps()}
          sx={{
            border: "2px dashed",
            borderColor: isDragActive ? "primary.main" : "grey.300",
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: isDragActive ? "action.hover" : "background.paper",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              borderColor: "primary.main",
              backgroundColor: "action.hover",
            },
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {isDragActive
              ? "Solte o vídeo aqui..."
              : "Arraste um vídeo aqui, ou clique para selecionar"}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Formatos aceitos: MP4, AVI, MOV, MKV, WEBM (máx. 100MB)
          </Typography>
        </Paper>
      ) : (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box display="flex" alignItems="center" gap={2}>
              <VideoFile color="primary" />
              <Box>
                <Typography variant="subtitle1">{selectedFile.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {formatFileSize(selectedFile.size)}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={removeFile} color="error">
              <Close />
            </IconButton>
          </Box>
        </Paper>
      )}

      {selectedFile && (
        <Box>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading}
            startIcon={<CloudUpload />}
            fullWidth
            size="large"
          >
            {uploading ? "Enviando..." : "Fazer Upload"}
          </Button>
          {uploading && <LinearProgress sx={{ mt: 2 }} />}
        </Box>
      )}
    </Box>
  );
};
