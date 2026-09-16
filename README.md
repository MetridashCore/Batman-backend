# Batman Backend

A thin HTTP layer over the **Razorpay** and **Stripe** APIs: it validates
incoming requests, calls the provider, and normalises the response.

## Requirements

- Node.js 26 (see [`.nvmrc`](.nvmrc))
- [pnpm](https://pnpm.io/)

## Local setup

```bash
pnpm install
cp .env.example .env   # then fill in the values
pnpm dev
```

`pnpm dev` runs the TypeScript sources directly with Node's built-in type
stripping and reloads on change.

The app refuses to start if a required variable is missing, and names the
offenders — see [`src/config/env.ts`](src/config/env.ts) for the full schema.

| Variable | Required | Notes |
| --- | --- | --- |
| `RAZORPAY_KEY_ID` | yes | |
| `RAZORPAY_KEY_SECRET` | yes | |
| `STRIPE_SECRET` | yes | |
| `OAUTH_TOKEN` | no | Razorpay partner OAuth; the key pair is used when unset |
| `BASE_URL` | no | Stripe redirect origin. Defaults to `http://localhost:8000` |
| `SENTRY_DSN` | no | Error reporting is disabled when unset |
| `PORT` | no | Defaults to `8000` |
| `NODE_ENV` | no | Defaults to `development` |

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run with watch mode |
| `pnpm build` | Type-check and emit to `dist/` |
| `pnpm start` | Run the built output |
| `pnpm typecheck` | Type-check sources *and* tests, no emit |
| `pnpm test` | Run the test suite |

## Layout

```
src/
  index.ts          Entrypoint: loads env, starts the server, handles signals
  app.ts            Builds the Express app (no port binding, so tests can drive it)
  routes/
    index.ts        The entire API surface, in one route table
    razorpay/       One module per Razorpay resource
    stripe/
  middleware/       Security, logging, 404, and the central error handler
  providers/        Configured Razorpay and Stripe clients
  config/env.ts     Validated, typed environment - the only reader of process.env
  http/             Cross-cutting helpers: ApiError, schema builders, money
```

Two conventions carry most of the weight:

**Handlers do not catch errors.** Express 5 forwards rejections from async
handlers to the error middleware, so a route is just parse → call → respond.
Everything funnels through
[`middleware/error-handler.ts`](src/middleware/error-handler.ts), which maps a
`ZodError` to `400`, an [`ApiError`](src/http/api-error.ts) to its own status, an
upstream provider 4xx to that status, and anything else to `500`.

**Nothing reads `process.env` except `config/env.ts`.** Importing `env` gives
values that are already present and correctly typed, which is why no module
needs `process.env.FOO!`.

### Adding a resource

Add `src/routes/<provider>/<resource>.ts` exporting an Express router, then mount
it in [`src/routes/index.ts`](src/routes/index.ts). Parse the body with a Zod
schema built from the helpers in [`src/http/schema.ts`](src/http/schema.ts), and
let errors throw.

## API

All routes live under `/api/<provider>/<resource>`, plus `GET /health`.

Amounts are accepted in **major units** (rupees, dollars) and converted to minor
units before reaching the provider. The one exception is payment capture, which
takes paise directly because it must match an existing authorisation exactly.

### Razorpay

| Method | Path |
| --- | --- |
| `GET` | `/api/razorpay/accounts/:accountId` |
| `POST` | `/api/razorpay/accounts` |
| `GET` | `/api/razorpay/customers` |
| `POST` | `/api/razorpay/customers` |
| `GET` | `/api/razorpay/customers/:customerId` |
| `GET` | `/api/razorpay/customers/:customerId/tokens` |
| `GET` | `/api/razorpay/customers/:customerId/tokens/:tokenId` |
| `GET` | `/api/razorpay/fund-accounts/:customerId` |
| `POST` | `/api/razorpay/fund-accounts/:customerId` |
| `GET` | `/api/razorpay/invoices` |
| `GET` | `/api/razorpay/invoices/:invoiceId` |
| `POST` | `/api/razorpay/invoices` |
| `GET` | `/api/razorpay/items` |
| `GET` | `/api/razorpay/items/:itemId` |
| `POST` | `/api/razorpay/items` |
| `PUT` | `/api/razorpay/items/:itemId` |
| `DELETE` | `/api/razorpay/items/:itemId` |
| `GET` | `/api/razorpay/orders` |
| `POST` | `/api/razorpay/orders` |
| `POST` | `/api/razorpay/orders/banking/upi` |
| `GET` | `/api/razorpay/orders/:orderId` |
| `GET` | `/api/razorpay/orders/:orderId/payments` |
| `GET` | `/api/razorpay/payments` |
| `GET` | `/api/razorpay/payments/:paymentId` |
| `GET` | `/api/razorpay/payments/:paymentId/card` |
| `POST` | `/api/razorpay/payments/:paymentId/capture` |
| `POST` | `/api/razorpay/payments/:paymentId/otp/generate` |
| `POST` | `/api/razorpay/payments/:paymentId/otp/submit` |
| `POST` | `/api/razorpay/payments/:paymentId/otp/resend` |
| `GET` | `/api/razorpay/tokens/:tokenId` |
| `DELETE` | `/api/razorpay/tokens/:tokenId` |

### Stripe

| Method | Path |
| --- | --- |
| `POST` | `/api/stripe/checkout` |

### Errors

Failures return the matching HTTP status and a consistent body:

```json
{
  "error": {
    "message": "Validation failed",
    "issues": [{ "field": "name", "message": "Name is required" }]
  }
}
```

## Testing

```bash
pnpm test
```

The default suite stubs both provider clients, so it needs no credentials and
makes no network calls. It covers routing, validation, and error mapping.

`tests/live/` talks to the real Razorpay API and is skipped unless you opt in:

```bash
RUN_LIVE_TESTS=1 pnpm test
```

## Docker

```bash
cp .env.example .env   # compose reads it via env_file
docker compose up -d --build
```

The image builds with pnpm, ships only production dependencies and the compiled
`dist/`, runs as the unprivileged `node` user, and health-checks `/health`.

## Known gaps

- **No authentication.** Every endpoint is open, including ones that move money.
  This needs an auth layer before any public deployment.
- **No rate limiting.**
- **No webhook handling**, so payment state is only observable by polling.
