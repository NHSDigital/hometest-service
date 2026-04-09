FROM kukymbr/goose-docker:3.27.0 AS goose-builder

# RUN go install github.com/pressly/goose/v3/cmd/goose@v3.27.0

FROM postgres:17.7

COPY --from=goose-builder /bin/goose /usr/local/bin/goose
COPY db-migrate.sh /usr/local/bin/db-migrate.sh

RUN chmod +x /usr/local/bin/goose /usr/local/bin/db-migrate.sh

ENTRYPOINT ["bash", "/usr/local/bin/db-migrate.sh"]
