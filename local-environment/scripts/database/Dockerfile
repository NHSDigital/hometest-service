FROM golang:1.26.1-alpine AS goose-builder

RUN go install github.com/pressly/goose/v3/cmd/goose@v3.27.0

FROM postgres:18.1

COPY --from=goose-builder /go/bin/goose /usr/local/bin/goose
COPY db-migrate.sh /usr/local/bin/db-migrate.sh

RUN chmod +x /usr/local/bin/goose /usr/local/bin/db-migrate.sh

ENTRYPOINT ["bash", "/usr/local/bin/db-migrate.sh"]
