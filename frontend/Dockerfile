FROM node:22-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM deps AS build

COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.output ./.output
COPY package*.json ./

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]