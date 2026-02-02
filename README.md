# HomeTest Service

The HomeTest Service is a service that provides a central hub for ordering home tests for NHS
patients.

This repository contains the full stack, including the frontend, backend lambdas, and
infrastructure-as-code.

## Table of Contents

- [HomeTest Service](#hometest-service)
  - [Table of Contents](#table-of-contents)
  - [Setup](#setup)
    - [Prerequisites](#prerequisites)
      - [Version Manager configuration](#version-manager-configuration)
        - [asdf](#asdf)
        - [mise](#mise)
    - [Configuration](#configuration)
  - [Usage](#usage)
    - [Local Development](#local-development)
    - [Frontend](#frontend)
    - [Local Infrastructure](#local-infrastructure)
  - [Testing](#testing)
  - [Design](#design)
    - [Architecture](#architecture)
  - [Contributing](#contributing)
  - [Licence](#licence)

## Setup

Clone the repository

```shell
git clone https://github.com/NHSDigital/hometest-service.git
cd hometest-service
```

### Prerequisites

The following software packages, or their equivalents, are expected to be installed and configured:

- [Docker](https://www.docker.com/)
- [Node v24](https://nodejs.org/en) LTS,
- A tool version manager:
<<<<<<< HEAD
  - [nvm](https://github.com/nvm-sh/nvm) version manager. This repository contains a [`.nvmrc`](./.nvmrc) file, to make the runtime version consistent.
  - [asdf](https://asdf-vm.com/) or [mise](https://mise.jdx.dev) (reads [`.tool-versions`](./.tool-versions))
=======
  - [nvm](https://github.com/nvm-sh/nvm) version manager. This repository contains a [
    `.nvmrc`](./.nvmrc) file, to make the runtime version consistent.
  - [asdf](https://asdf-vm.com/) or [mise](https://mise.jdx.dev) (reads [
    `.tool-versions`](./.tool-versions))
- [Terraform](https://developer.hashicorp.com/terraform). The version is specified in [.tool-versions].
  - Local development uses Terraform to deploy to LocalStack.
>>>>>>> 864ad17a3b4e1531463fd34a9efad3e89735061b

#### Version Manager configuration

If you are using `asdf` or `mise`, you can set it up so that it reads the `.nvmrc` file and makes
nvm redundant.

##### asdf

ASDF can read the `.nvmrc` file by following
the [instructions](https://github.com/asdf-vm/asdf-nodejs?tab=readme-ov-file#nvmrc-and-node-version-support).

##### mise

Mise can read the `.nvmrc` file by following
the [instructions](https://mise.jdx.dev/configuration.html#idiomatic-version-files).

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
2. Bootstraps LocalStack [via Terraform](local-environment/infra), and deploys the lambdas to it from the `/lambdas` directory.
3. Starts the frontend on [http://localhost:3000](http://localhost:3000).

To stop the environment:

```shell
npm run stop
```

### Frontend

The frontend is a Next.js application located in the `/ui` directory.

- When creating a new page, use the PageLayout component found in `/ui/src/components`.
- To create a new route, create a directory with the name of your route in `/ui/src/app`, and add a `page.tsx` file within.

### Local Infrastructure

Local infrastructure is managed via Terraform in the [`/local-environment/infra`](./local-environment/infra) directory.

## Testing

We use [Playwright](https://playwright.dev/) for end-to-end testing, located in the `/tests`
directory.

## Design

### Architecture

The service follows a serverless-first architecture on AWS:

- **Frontend**: Next.js (React)
- **Backend**: AWS Lambda (Node.js/TypeScript)
- **Database**: PostgreSQL (managed via Docker locally)
- **Infrastructure**: Terraform

System diagrams and design documents can be found in the [`/docs`](./docs) and [`/architecture`](./architecture) folders.

## Contributing

View the [contributing guidelines](./CONTRIBUTING.md).

## Licence

> The [LICENCE.md](./LICENCE.md) file will need to be updated with the correct year and owner

Unless stated otherwise, the codebase is released under the MIT License. This covers both the
codebase and any sample code in the documentation.

Any HTML or Markdown documentation
is [© Crown Copyright](https://www.nationalarchives.gov.uk/information-management/re-using-public-sector-information/uk-government-licensing-framework/crown-copyright/)
and available under the terms of
the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/).
