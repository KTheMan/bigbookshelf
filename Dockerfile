FROM node:18-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN for i in 1 2 3 4 5; do npm install && break || sleep 15; done

COPY . .

RUN npm run build

CMD ["echo", "Build complete - dist/ ready for ares-package"]
