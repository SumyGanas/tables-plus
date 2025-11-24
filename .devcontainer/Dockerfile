FROM mcr.microsoft.com/devcontainers/javascript-node:20

RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    vim \
    curl \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

RUN npm install -g typescript