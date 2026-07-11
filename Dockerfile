# Usando a versão LTS do Node (baseada em Debian)
FROM node:20-slim

WORKDIR /app

# Instala dependências do sistema que podem ser úteis para manipulação de imagens depois
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copia os arquivos de dependências do Node (vamos criá-los em seguida)
COPY package*.json ./

# Instala os pacotes
RUN npm install

# Copia o restante do código
COPY . .

EXPOSE 3000

# Comando para rodar em modo de desenvolvimento (reinicia sozinho ao salvar o código)
CMD ["npm", "run", "dev"]