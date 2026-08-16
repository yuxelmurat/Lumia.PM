<p align="center">
  <a href="https://lumiapm.com">
    <img src="https://raw.githubusercontent.com/yuxelmurat/Lumia.PM/main/apps/web/public/logo/logo.png" alt="Lumia.PM logo" width="120" />
  </a>
</p>

<h1 align="center">Lumia.PM</h1>

<p align="center">
  Project management built for interior architecture and design studios.
</p>

<div align="center">

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/yuxelmurat/Lumia.PM/ci.yml?branch=main)](https://github.com/yuxelmurat/Lumia.PM/actions)

</div>

<div align="center">
  <h3>
    <a href="https://lumiapm.com">Website</a>
    <span> | </span>
    <a href="apps/docs">Documentation</a>
    <span> | </span>
    <a href="https://lumiapm.com/about">Contact</a>
  </h3>
</div>

<p align="center">
  <img src="https://raw.githubusercontent.com/yuxelmurat/Lumia.PM/main/apps/site/public/images/hero.png" alt="Lumia.PM dashboard" />
</p>

## Why Lumia.PM?

Interior architecture and design studios don't run projects like software teams do. A render goes through rounds of revision, a client needs to approve it without ever touching a "real" project management tool, and every studio has its own brand it wants that client-facing moment to carry.

Lumia.PM is built around that workflow: plan projects and run tasks with your team internally, then share a branded, client-facing link so a client can review renders, leave pinned feedback on a specific spot in an image, and approve or request changes — without ever seeing your internal workspace.

**What makes it different:**
- **Client approval built in** — a branded link, not a login your client needs
- **Version history on renders** — see every revision, not just the latest upload
- **Clean interface** that focuses on your work, not the tool
- **Self-hosted** so your data stays yours
- **Open source** with a permissive MIT license

## Getting Started

### Quick Start with Docker Compose

The fastest way to try Lumia.PM is with Docker Compose. This sets up Lumia.PM and PostgreSQL with a single combined container:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env_file:
      - .env
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U lumiapm -d lumiapm"]
      interval: 10s
      timeout: 5s
      retries: 5

  lumiapm:
    build:
      context: .
      dockerfile: Dockerfile.lumiapm
    ports:
      - "5173:5173"
    env_file:
      - .env
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

Save this as `compose.yml`, copy `.env.sample` to `.env`, uncomment `KANEO_CLIENT_URL=http://localhost:5173`, and set `POSTGRES_PASSWORD=<password>` and `AUTH_SECRET=<output of openssl rand -hex 32>`, run `docker compose up -d`, and open [http://localhost:5173](http://localhost:5173).

In Docker Compose, the bundled container reaches PostgreSQL at the service hostname `postgres`.
If you run the API on your host instead of inside Compose, use `localhost` or set `DATABASE_URL` explicitly.

> **Note:** environment variables still use the `KANEO_*` prefix internally (e.g. `KANEO_CLIENT_URL`) — see [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for the full list and why.

### Development Setup

For development, see our [Environment Setup Guide](ENVIRONMENT_SETUP.md) for detailed instructions on configuring environment variables and troubleshooting common issues like CORS problems.

### Configuration

Lumia.PM requires several environment variables to be configured. The Docker Compose setup above handles the database automatically, but you'll need to configure environment variables for the API and web services. See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for complete configuration instructions, including database setup for non-Docker deployments and advanced settings.

## Kubernetes Deployment

If you're running Kubernetes, we provide a comprehensive Helm chart. Check out the [Helm chart documentation](./charts/lumiapm/README.md) for detailed installation instructions, production configuration examples, TLS setup, and more.

## Development

Want to hack on Lumia.PM? See our [Environment Setup Guide](ENVIRONMENT_SETUP.md) for detailed instructions on configuring environment variables and troubleshooting common issues like CORS problems.

Quick start:
```bash
# Clone and install dependencies
git clone https://github.com/yuxelmurat/Lumia.PM.git
cd Lumia.PM
pnpm install

# Create a .env file in the root with required environment variables
# See ENVIRONMENT_SETUP.md for detailed instructions

# Start development servers
pnpm dev
```

For contributing guidelines, code structure, and development best practices, check out our [contributing guide](CONTRIBUTING.md).

## MCP Server

Lumia.PM ships a built-in HTTP MCP endpoint at `/api/mcp` so AI tools like Claude, Cursor, and other MCP clients can manage your tasks, projects, and labels. A stdio client package is also available on npm (`npx -y @kaneo/mcp`) — the package name is a legacy of this project's origins as a fork of [Kaneo](https://github.com/usekaneo/kaneo) and has not been republished under a new name.

## Community

- **[GitHub Issues](https://github.com/yuxelmurat/Lumia.PM/issues)** - Bug reports and feature requests
- **[Documentation](apps/docs)** - Setup guides and API docs
- **Email** - [help@lumiapm.com](mailto:help@lumiapm.com)

## Contributing

We're always looking for help, whether that's:
- Reporting bugs or suggesting features
- Improving documentation
- Contributing code

Check out [CONTRIBUTING.md](CONTRIBUTING.md) for the details on how to get involved.

## About

Lumia.PM is a product of Lumia.app, a software brand built by Murat Yüksel. Read more on the [about page](https://lumiapm.com/about).

This project started as a fork of [Kaneo](https://github.com/usekaneo/kaneo), an open source project management platform originally created by Andrej Acevski, under the MIT license. The `LICENSE` file's original copyright notice is preserved as required by that license; a handful of internal package names under the `@kaneo/*` npm scope (`packages/mcp`, `packages/planka-import`, and the workspace packages in `apps/`) are also unchanged, since renaming a published npm package or workspace scope is a breaking change on its own and out of scope for this rebrand.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with ❤️ by <a href="https://lumiapm.com/about">Murat Yüksel</a> and <a href="https://github.com/yuxelmurat/Lumia.PM/graphs/contributors">contributors</a>
</p>
