FROM node:18-alpine

# Instalar FFmpeg
RUN apk add --no-cache ffmpeg

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Compilar aplicação
RUN npm run build

# Expor porta
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["npm", "run", "start:prod"]