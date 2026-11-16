# Rumbo's server image (PUB-01, PUB-02): the page and the API, run as the unprivileged `node` user.
FROM node:24.21.0-alpine3.24
WORKDIR /app
COPY servidor/package.json servidor/package-lock.json servidor/
RUN cd servidor && npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY servidor/*.mjs servidor/esquema.sql servidor/
COPY index.html manifest.webmanifest ./
COPY iconos/*.png iconos/
ENV NODE_ENV=production PORT=8080
USER node
EXPOSE 8080
CMD ["node", "servidor/servidor.mjs"]
