# HomeTest Service

[![CI/CD Pull Request](https://github.com/nhs-england-tools/repository-template/actions/workflows/cicd-1-pull-request.yaml/badge.svg)](https://github.com/nhs-england-tools/repository-template/actions/workflows/cicd-1-pull-request.yaml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=repository-template&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=repository-template)

The HomeTest Service is a service that provides a central hub for ordering home tests for NHS patients.

This repository contains the full stack, including the frontend, backend lambdas, and infrastructure-as-code.

## Table of Contents

- [Repository Template](#repository-template)
  - [Table of Contents](#table-of-contents)
  - [Setup](#setup)
    - [Prerequisites](#prerequisites)
    - [Configuration](#configuration)
  - [Usage](#usage)
    - [Testing](#testing)
  - [Design](#design)
    - [Diagrams](#diagrams)
    - [Modularity](#modularity)
  - [Contributing](#contributing)
  - [Contacts](#contacts)
  - [Licence](#licence)

## Setup

Clone the repository

```shell
git clone https://github.com/NHSDigital/hometest-service.git
cd hometest-service
```

### Prerequisites

The following software packages, or their equivalents, are expected to be installed and configured:

- [Docker](https://www.docker.com/) container runtime or a compatible tool, e.g. [Podman](https://podman.io/),
- [Node v24](https://nodejs.org/en) LTS,
- A tool version manager:
  - [nvm](https://github.com/nvm-sh/nvm) version manager. This repo contains a [`.nvmrc`](./.nvmrc) file, to make the runtime version consistent.
  - [asdf](https://asdf-vm.com/) or [mise](https://mise.jdx.dev) (reads [`.tool-versions`](./.tool-versions))

#### Version Manager configuration

If you are using `asdf` or `mise`, you can set it up so that it reads the `.nvmrc` file and makes nvm redundant.

##### asdf

ASDF can read the `.nvmrc` file by following the [instructions](https://github.com/asdf-vm/asdf-nodejs?tab=readme-ov-file#nvmrc-and-node-version-support).

##### mise

Mise can read the `.nvmrc` file by following the [instructions](https://mise.jdx.dev/configuration.html#idiomatic-version-files).

### Configuration

Install dependencies for the root, lambdas, and tests:

```shell
npm install && npm --prefix ./lambdas install
```

## Usage

### Local Development

To spin up the entire local environment (LocalStack, Postgres, and the Next.js Frontend):

```shell
npm start
```

This command:
1. Starts the Docker containers defined in [`local-environment/docker-compose.yml`](./local-environment/docker-compose.yml).
2. Bootstraps and deploys the CDK stacks to LocalStack.
3. Starts the frontend on [http://localhost:3000](http://localhost:3000).

To stop the environment:

```shell
npm run stop
```


### Frontend

The frontend is a Next.js application located in the `/frontend` directory.


### Infrastructure

Infrastructure is managed via AWS CDK (v2) in the `/infra` directory. For local development, we use `cdklocal` which is installed as a dev dependency.

## Testing

We use [Playwright](https://playwright.dev/) for end-to-end testing, located in the `/tests` directory.

## Design

### Architecture

The service follows a serverless-first architecture on AWS:
- **Frontend**: Next.js (React)
- **Backend**: AWS Lambda (Node.js/TypeScript)
- **Database**: PostgreSQL (managed via Docker locally)
- **Infrastructure**: AWS CDK

System diagrams and design documents can be found in the [`/docs`](./docs) and [`/architecture`](./architecture) folders.

## Contributing

Describe or link templates on how to raise an issue, feature request or make a contribution to the codebase. Reference the other documentation files, like

- Environment setup for contribution, i.e. `CONTRIBUTING.md`
- Coding standards, branching, linting, practices for development and testing
- Release process, versioning, changelog
- Backlog, board, roadmap, ways of working
- High-level requirements, guiding principles, decision records, etc.

## Contacts

Provide a way to contact the owners of this project. It can be a team, an individual or information on the means of getting in touch via active communication channels, e.g. opening a GitHub discussion, raising an issue, etc.

## Licence

> The [LICENCE.md](./LICENCE.md) file will need to be updated with the correct year and owner

Unless stated otherwise, the codebase is released under the MIT License. This covers both the codebase and any sample code in the documentation.

Any HTML or Markdown documentation is [© Crown Copyright](https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/) and available under the terms of the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
