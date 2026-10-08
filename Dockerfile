FROM node:22-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl python3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY public ./public
COPY tools ./tools
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod 755 /usr/local/bin/entrypoint.sh \
    && mkdir -p /app/data \
    && chown node:node /app/data

USER node
ENV HOST=127.0.0.1
ENV DATA_DIR=/app/data

VOLUME ["/app/data"]
EXPOSE 4005

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
