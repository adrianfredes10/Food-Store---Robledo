FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173

ENV VITE_API_BASE_URL=http://127.0.0.1:8008

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
