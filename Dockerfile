# Imagem da plataforma de propostas (Next.js + Prisma).
# Etapas: deps -> build -> runner (enxuta) e "ferramentas" (migrações/seed).

# Imagem Debian completa: já traz OpenSSL (exigido pelo Prisma) e certificados,
# então a montagem não depende de baixar pacotes do Debian.
FROM node:22-bookworm AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate && npm run build

# Usada pelo serviço "migrar" do docker-compose: aplica migrações e dados iniciais
FROM build AS ferramentas
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

FROM base AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 UPLOAD_DIR=/app/uploads
RUN groupadd -r app && useradd -r -g app app && mkdir -p /app/uploads && chown app:app /app/uploads
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
