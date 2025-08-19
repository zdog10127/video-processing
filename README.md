# 🎥 Sistema de Processamento de Vídeos

Sistema completo para upload, processamento e armazenamento de vídeos com geração automática de versões de baixa resolução e thumbnails.

## 📋 Visão Geral

Este projeto consiste em uma aplicação completa dividida em:

- **Backend**: API REST em NestJS com processamento assíncrono de vídeos
- **Frontend**: Interface React TypeScript responsiva para gerenciamento de vídeos
- **Storage**: Google Cloud Storage para armazenamento escalável
- **Processamento**: FFmpeg para conversão e otimização de vídeos

## 🚀 Funcionalidades

### ✅ Implementadas
- Upload de vídeos via drag & drop
- Armazenamento seguro no Google Cloud Storage
- API REST completa com documentação Swagger
- Interface responsiva com Material-UI
- Validação de arquivos (tipo, tamanho, formato)
- Sistema de status de processamento
- Listagem paginada de vídeos
- Teste de conectividade automático

### 🔄 Em Desenvolvimento
- Processamento assíncrono com filas (Bull/Redis)
- Geração de versões de baixa resolução (FFmpeg)
- Criação automática de thumbnails
- URLs de download temporárias
- Sistema de notificações em tempo real

## 🛠️ Tecnologias

### Backend
- **NestJS** - Framework Node.js
- **TypeScript** - Linguagem principal
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sistema de filas
- **TypeORM** - ORM para banco de dados
- **Bull** - Gerenciamento de filas
- **FFmpeg** - Processamento de vídeo
- **Google Cloud Storage** - Armazenamento em nuvem
- **Swagger** - Documentação da API

### Frontend
- **React** - Biblioteca de interface
- **TypeScript** - Tipagem estática
- **Material-UI** - Componentes de interface
- **React Dropzone** - Upload com drag & drop
- **Axios** - Cliente HTTP
- **date-fns** - Manipulação de datas

### Infraestrutura
- **Docker** - Containerização
- **Docker Compose** - Orquestração local
- **Google Cloud Platform** - Cloud provider
- **GitHub** - Controle de versão

## 📁 Estrutura do Projeto

```
video-processing-system/
├── backend/                    # API NestJS
│   ├── src/
│   │   ├── videos/            # Módulo de vídeos
│   │   │   ├── dto/           # Data Transfer Objects
│   │   │   ├── entities/      # Entidades do banco
│   │   │   ├── videos.controller.ts
│   │   │   ├── videos.service.ts
│   │   │   ├── videos.module.ts
│   │   │   ├── video-processing.service.ts
│   │   │   └── video.processor.ts
│   │   ├── storage/           # Módulo de armazenamento
│   │   │   ├── storage.service.ts
│   │   │   └── storage.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── uploads/               # Arquivos temporários
│   ├── gcp-key.json          # Credenciais Google Cloud
│   ├── docker-compose.yml    # Serviços locais
│   └── package.json
├── frontend/                  # Interface React
│   ├── src/
│   │   ├── components/       # Componentes reutilizáveis
│   │   │   ├── VideoUpload.tsx
│   │   │   ├── VideoList.tsx
│   │   │   └── ConnectionTest.tsx
│   │   ├── pages/           # Páginas da aplicação
│   │   │   └── HomePage.tsx
│   │   ├── services/        # Serviços de API
│   │   │   └── api.ts
│   │   ├── types/           # Interfaces TypeScript
│   │   │   └── index.ts
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## 🚦 Pré-requisitos

- **Node.js** >= 16.x
- **npm** ou **yarn**
- **Docker** e **Docker Compose**
- **FFmpeg** (para processamento)
- **Google Cloud SDK** (para produção)
- **Conta Google Cloud Platform**

## ⚡ Instalação e Configuração

### 1. Clone o Repositório

```bash
git clone https://github.com/zdog10127/video-processing.git
cd video-processing
```

### 2. Configuração do Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações
```

#### Variáveis de Ambiente (.env)

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=video_processing

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
NODE_ENV=development
PORT=3001
MAX_FILE_SIZE=104857600
ALLOWED_VIDEO_FORMATS=mp4,avi,mov,mkv,webm

# URLs
FRONTEND_URL=http://localhost:3000

# Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=seu-projeto-id
GOOGLE_CLOUD_BUCKET=seu-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=./gcp-key.json

# Para desenvolvimento local (opcional)
# USE_LOCAL_STORAGE=true
```

### 3. Configuração do Google Cloud

```bash
# Fazer login no Google Cloud
gcloud auth login

# Configurar projeto
gcloud config set project seu-projeto-id

# Habilitar APIs
gcloud services enable storage.googleapis.com

# Criar bucket
gsutil mb -p seu-projeto-id gs://seu-bucket-name

# Criar service account
gcloud iam service-accounts create video-processor

# Dar permissões
gcloud projects add-iam-policy-binding seu-projeto-id \
    --member="serviceAccount:video-processor@seu-projeto-id.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

# Gerar chave
gcloud iam service-accounts keys create ./gcp-key.json \
    --iam-account=video-processor@seu-projeto-id.iam.gserviceaccount.com
```

### 4. Iniciar Serviços

```bash
# Iniciar PostgreSQL e Redis
docker-compose up -d

# Iniciar backend
npm run start:dev
```

### 5. Configuração do Frontend

```bash
cd ../frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
echo "REACT_APP_API_URL=http://localhost:3001/api" > .env

# Iniciar frontend
npm start
```

## 🎮 Como Usar

### 1. Acessar a Aplicação

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001/api
- **Swagger**: http://localhost:3001/api/docs

### 2. Upload de Vídeos

1. Acesse a interface web
2. Arraste um vídeo para a área de upload ou clique para selecionar
3. Aguarde o upload e processamento
4. Visualize o status na lista de vídeos

### 3. Gerenciar Vídeos

- **Visualizar**: Lista paginada com todos os vídeos
- **Status**: Acompanhe o progresso (Enviando → Processando → Concluído)
- **Download**: Baixe vídeos originais e processados
- **Excluir**: Remova vídeos indesejados

## 📊 API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/videos` | Upload de vídeo |
| GET | `/api/videos` | Listar vídeos (paginado) |
| GET | `/api/videos/:id` | Buscar vídeo por ID |
| DELETE | `/api/videos/:id` | Deletar vídeo |
| GET | `/api/videos/:id/download-url` | URLs de download |

### Exemplo de Upload

```bash
curl -X POST \
  http://localhost:3001/api/videos \
  -H "Content-Type: multipart/form-data" \
  -F "video=@exemplo.mp4"
```

### Resposta de Upload

```json
{
  "message": "Vídeo enviado com sucesso",
  "videoId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "uploading"
}
```

## 🔧 Desenvolvimento

### Scripts Disponíveis

#### Backend
```bash
npm run start:dev      # Desenvolvimento com hot-reload
npm run start:prod     # Produção
npm run build          # Build da aplicação
npm run test           # Testes unitários
npm run test:e2e       # Testes end-to-end
npm run lint           # Linting do código
```

#### Frontend
```bash
npm start              # Desenvolvimento
npm run build          # Build para produção
npm test               # Testes
npm run lint           # Linting do código
```

### Estrutura de Dados

#### Entidade Video

```typescript
interface Video {
  id: string;
  originalName: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  originalUrl: string;
  lowResUrl?: string;
  thumbnailUrl?: string;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  duration?: number;
  width?: number;
  height?: number;
  processingError?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🐳 Docker

### Desenvolvimento

```bash
# Apenas serviços (PostgreSQL + Redis)
docker-compose up -d

# Parar serviços
docker-compose down
```

### Produção

```bash
# Build e iniciar todos os serviços
docker-compose -f docker-compose.prod.yml up -d
```

## 🧪 Testes

### Testar Configuração do Google Cloud

```bash
cd backend
node test-gcp.js
```

### Testar API

```bash
# Listar vídeos
curl http://localhost:3001/api/videos

# Upload de teste
curl -X POST http://localhost:3001/api/videos \
  -F "video=@test-video.mp4"
```

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
