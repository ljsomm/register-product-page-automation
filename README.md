## Register Product Automation

#### Introduction

This repository contains a base automation that reads products from a CSV file and registers them into a Strapi CMS through browser automation using Playwright.

### Tech Stack

- **TypeScript**: main language, compiled with `Webpack`
- **Playwright**: browser automation for interacting with the Strapi admin UI
- **Strapi 5**: headless CMS used as the product registraton backend (`sample-product-register-cms/`)
- **Zod**: runtime schema validation for product data
- **Pino**: structured logging with configurable log levels via `LOG_LEVEL` environment variable
- **dotenv**: environment variable management
- **ESLint + Prettier**: code linting and formatting
- **Husky + lint-staged**: pre-commit hooks to enforce code quality

### How to run

#### Docker (preferred)

Just run:
```bash
docker-compose up --build
```
This spins up both the Strapi CMS and the automation in isolated containers. The compose file uses a **healthcheck** on the CMS service so the automation only starts after Strapi is fully ready to accept requests (no manual steps needed)

Once it finishes, you can verify the products were created by opening [http://localhost:1337/admin](http://localhost:1337/admin) and logging in with the credentials from `docker-compose.yaml` (default: `admin@gmail.com` / `@Admin123`). Navigate to **Content Manager → Product** to confirm the records are there.

#### Local

1. Start the Strapi CMS:
```bash
cd sample-product-register-cms && npm run develop
```

2. Copy `.env.example` to `.env` and fill in your credentials and CSV path.

3. Build and run:
```bash
npm run build && npm start
```

### Approaches and good practices followed

#### Hexagonal Architecture

The project follows hexagonal architecture (aka ports and adapters) to keep the domain logic completely decoupled from external systems. This means swapping the CSV source for an API or replacing Playwright with direct Strapi API calls requires zero changes to the core business logic.

<!-- ![Hexagonal Architecture Diagram]() -->

**Inbound port**: defines what the application can do:
- [`src/ports/in/product.port.ts`](src/ports/in/product.port.ts): `IProductPort` with `registerAllFoundProducts()` and `findAll()`

**Outbound ports**: define what the application needs from the outside world:
- [`src/ports/out/product-read.port.ts`](src/ports/out/product-read.port.ts): `IProductReadPort` for reading products
- [`src/ports/out/product-write.port.ts`](src/ports/out/product-write.port.ts): `IProductWritePort` for writing products
- [`src/ports/out/secret-read.port.ts`](src/ports/out/secret-read.port.ts): `ISecretReadPort` for reading secrets/credentials

**Adapters** implement those ports:
- [`src/adapters/csv/product.adapter.ts`](src/adapters/csv/product.adapter.ts): reads and parses the CSV file
- [`src/adapters/playwright-strapi/product.adapter.ts`](src/adapters/playwright-strapi/product.adapter.ts): drives the Strapi admin UI via Playwright
- [`src/adapters/environment/secret.adapter.ts`](src/adapters/environment/secret.adapter.ts): reads secrets from environment variables

<!-- ![Adapters flow diagram]() -->

#### Domain-centric validation with Zod

The product entity ([`src/domain/entity/product.entity.ts`](src/domain/entity/product.entity.ts)) is the single source of truth for both the TypeScript type and the runtime validation schema, using `z.infer` to derive the type from the Zod schema. Validation happens inside the use case ([`src/domain/use-cases/product-register.use-case.ts`](src/domain/use-cases/product-register.use-case.ts)) before any product reaches an adapter, so invalid data never touches external systems.

#### Composition root

All dependency wiring lives in [`src/index.ts`](src/index.ts). Adapters are instantiated and injected into the use case here, keeping every other module unaware of concrete implementations.

#### Login resilience

The Playwright base adapter ([`src/adapters/playwright-strapi/base.adapter.ts`](src/adapters/playwright-strapi/base.adapter.ts)) includes a retry mechanism for the Strapi login flow. It handles rate-limit responses and invalid credentials gracefully, retrying up to 3 times with a configurable delay.

#### Structured logging

Logging is handled by Pino ([`src/utils/logger.ts`](src/utils/logger.ts)) with pino-pretty for human-readable output. The log level is controlled via the `LOG_LEVEL` env var and defaults to `info`.
