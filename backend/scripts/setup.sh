#!/bin/bash

echo "🚀 Configurando ambiente de desenvolvimento..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker."
    exit 1
fi

# Subir containers
echo "📦 Iniciando containers Docker..."
docker-compose up -d

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 15

# Verificar se PostgreSQL está pronto
until docker-compose exec postgres pg_isready -U postgres; do
  echo "⏳ Aguardando PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL está pronto!"

# Verificar se Redis está pronto
until docker-compose exec redis redis-cli ping; do
  echo "⏳ Aguardando Redis..."
  sleep 2
done

echo "✅ Redis está pronto!"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo "📥 Instalando dependências..."
    npm install
fi

echo "🎉 Ambiente configurado com sucesso!"
echo ""
echo "Para iniciar o servidor de desenvolvimento:"
echo "npm run start:dev"
echo ""
echo "Para ver logs dos containers:"
echo "docker-compose logs -f"
echo ""
echo "Para parar os containers:"
echo "docker-compose down"