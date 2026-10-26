# AKG ALGO — PocketBase container image.
# The repo's bin/pocketbase is a static Go binary, so a minimal Alpine base is enough.
# Security hooks (pb_hooks) and migrations (pb_migrations) are baked in; pb_data,
# pb_public and private_downloads are runtime volumes (see docker-compose.yml).
FROM alpine:3.20

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

COPY bin/pocketbase /app/pocketbase
COPY pb_migrations /app/pb_migrations
COPY pb_hooks /app/pb_hooks

RUN chmod +x /app/pocketbase && mkdir -p /app/pb_data /app/pb_public /app/private_downloads

EXPOSE 8090

# Never run without --hooksDir: the payment validation, license issuance and
# gated downloads all live in pb_hooks.
CMD ["/app/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/app/pb_data", "--publicDir=/app/pb_public", "--hooksDir=/app/pb_hooks"]
