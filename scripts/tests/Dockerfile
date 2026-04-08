FROM ubuntu:24.04
RUN apt-get update && apt-get install -y \
    git \
    curl \
    ca-certificates \
    docker-cli \
    npm \
    && rm -rf /var/lib/apt/lists/*

RUN curl https://mise.run | sh

RUN npm install -g playwright
RUN npx playwright install-deps
