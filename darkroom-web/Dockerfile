# Build with darkroom-web as context:
# docker build -t darkroom-web:stg --build-arg VITE_API_BASE_URL=https://api.example.test .
FROM node:24-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:24-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0
EXPOSE 3000

COPY --from=build /app/.output ./.output

USER node
CMD ["node", ".output/server/index.mjs"]
