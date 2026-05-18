FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

# No fijar VITE_* aquí: en Compose el navegador debe usar `/api` (proxy → `api:8008`). Si se bakea 127.0.0.1:8008,
# el bundle pide al host y suele disparar "Network Error" o CORS según cómo abras el front.

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
