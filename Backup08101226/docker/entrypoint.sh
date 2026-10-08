#!/bin/sh
set -eu

DATA_DIR=${DATA_DIR:-"$(pwd)/data"}
export DATA_DIR
mkdir -p "$DATA_DIR"
chmod 700 "$DATA_DIR"
if [ ! -s "$DATA_DIR/key.pem" ] || [ ! -s "$DATA_DIR/cert.pem" ]; then
  openssl req -x509 -newkey rsa:3072 \
    -keyout "$DATA_DIR/key.pem" \
    -out "$DATA_DIR/cert.pem" \
    -sha256 -days 825 -nodes \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
  chmod 600 "$DATA_DIR/key.pem"
  chmod 644 "$DATA_DIR/cert.pem"
fi

exec node server.js
