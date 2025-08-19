import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  IconButton,
  Button,
  Card,
  CardContent,
  CardActions,
  Pagination,
} from "@mui/material";
import {
  Delete,
  Download,
  PlayArrow,
  Image,
  VideoLibrary,
} from "@mui/icons-material";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { videoService } from "../services/api";
import { Video, PaginatedResponse } from "../types";

interface VideoListProps {
  refresh: boolean;
  onRefreshComplete: () => void;
}

export const VideoList: React.FC<VideoListProps> = ({
  refresh,
  onRefreshComplete,
}) => {
  const [videos, setVideos] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string>("");

  const fetchVideos = async (currentPage: number = 1) => {
    try {
      setLoading(true);
      const data = await videoService.getVideos(currentPage, 12);
      setVideos(data);
      setError("");
    } catch (err: any) {
      setError("Erro ao carregar vídeos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(page);
  }, [page]);

  useEffect(() => {
    if (refresh) {
      fetchVideos(page);
      onRefreshComplete();
    }
  }, [refresh, onRefreshComplete, page]);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja deletar este vídeo?")) return;

    try {
      setDeleting(id);
      await videoService.deleteVideo(id);
      fetchVideos(page);
    } catch (err: any) {
      setError("Erro ao deletar vídeo");
    } finally {
      setDeleting("");
    }
  };

  const handleDownload = async (video: Video) => {
    try {
      const urls = await videoService.getDownloadUrls(video.id);

      if (urls.originalUrl) {
        window.open(urls.originalUrl, "_blank");
      }
    } catch (err: any) {
      setError("Erro ao gerar URL de download");
    }
  };

  const getStatusColor = (
    status: string
  ): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "failed":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "uploading":
        return "Enviando";
      case "processing":
        return "Processando";
      case "completed":
        return "Concluído";
      case "failed":
        return "Falhou";
      default:
        return status;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading && !videos) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!videos || videos.data.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <VideoLibrary sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
        <Typography variant="h6" color="textSecondary">
          Nenhum vídeo encontrado
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Faça o upload do seu primeiro vídeo!
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">
          Histórico de Processamento ({videos.total} vídeos)
        </Typography>
        <Button onClick={() => fetchVideos(page)} disabled={loading}>
          Atualizar
        </Button>
      </Box>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: 3,
        }}
      >
        {videos.data.map((video) => (
          <Card
            key={video.id}
            sx={{ height: "100%", display: "flex", flexDirection: "column" }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="flex-start"
                mb={2}
              >
                <Typography
                  variant="h6"
                  component="div"
                  noWrap
                  title={video.originalName}
                >
                  {video.originalName}
                </Typography>
                <Chip
                  label={getStatusText(video.status)}
                  color={getStatusColor(video.status)}
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="textSecondary" gutterBottom>
                {formatFileSize(Number(video.fileSize))}
              </Typography>

              {video.duration && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Duração: {formatDuration(video.duration)}
                </Typography>
              )}

              {video.width && video.height && (
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Resolução: {video.width}x{video.height}
                </Typography>
              )}

              <Typography variant="body2" color="textSecondary" gutterBottom>
                {format(new Date(video.createdAt), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </Typography>

              {video.processingError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {video.processingError}
                </Alert>
              )}
            </CardContent>
            <CardActions>
              <Box
                display="flex"
                gap={1}
                width="100%"
                justifyContent="space-between"
              >
                <Box>
                  {video.status === "completed" && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(video)}
                        title="Download Original"
                      >
                        <Download />
                      </IconButton>
                      {video.lowResUrl && (
                        <IconButton
                          size="small"
                          title="Versão Baixa Resolução"
                          onClick={() => window.open(video.lowResUrl, "_blank")}
                        >
                          <PlayArrow />
                        </IconButton>
                      )}
                      {video.thumbnailUrl && (
                        <IconButton
                          size="small"
                          title="Thumbnail"
                          onClick={() =>
                            window.open(video.thumbnailUrl, "_blank")
                          }
                        >
                          <Image />
                        </IconButton>
                      )}
                    </>
                  )}
                </Box>
                <IconButton
                  size="small"
                  onClick={() => handleDelete(video.id)}
                  disabled={deleting === video.id}
                  color="error"
                >
                  {deleting === video.id ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Delete />
                  )}
                </IconButton>
              </Box>
            </CardActions>
          </Card>
        ))}
      </Box>
      {videos.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={videos.totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};
