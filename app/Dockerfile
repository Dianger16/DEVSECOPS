FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --ignore-scripts

FROM node:18-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
CMD ["node", "index.js"]