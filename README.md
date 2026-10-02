# OpenCart E2E Automation

End-to-end browser tests for the OpenCart demo site, written in TypeScript with Playwright Test and `playwright-bdd`. Scenarios are written in Gherkin, implemented with step definitions, and organized around page objects.

## Coverage

- Account registration and login (valid and invalid cases)
- Duplicate email registration
- Address book creation
- Logout
- Shopping cart add/remove
- Checkout and order confirmation

## Requirements

- Node.js and npm
- The browser binaries supported by Playwright
- A reachable OpenCart test site

## Setup and run

```sh
npm install
npx playwright install
npx playwright test
```

The default browser is configured in `src/main/com/opencart/config/qaConfig.properties`. Set `browser` to `chromium`, `chrome`, `firefox`, `edge`, a comma-separated list, or `all`.

List discovered scenarios without executing them:

```sh
npx playwright test --list
```

## Test configuration

The default site URL and product are in `qaConfig.properties`. Optional environment variables:

| Variable | Purpose |
| --- | --- |
| `DUPLICATE_SIGNUP_EMAIL` | An address already registered on the test site; required by the duplicate-registration scenario. |
| `INVALID_LOGIN_EMAIL` | Override the safe, invalid email used by the invalid-login scenario. |
| `INVALID_LOGIN_PASSWORD` | Override the safe, invalid password used by the invalid-login scenario. |
| `EMAIL_SEND` | Set to `true` to enable sending the execution report by email. |
| `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_TO` | SMTP credentials and recipient, required when email reporting is enabled. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `EMAIL_FROM` | Optional SMTP and sender configuration. |

Keep credentials and real customer data in environment variables, never in committed files. The duplicate-signup scenario intentionally requires a test-site email address instead of storing a personal account in the repository.

## Reports and artifacts

Playwright HTML, Monocart, and the custom Extent-style report are configured in `playwright.config.ts`. Test results, traces, videos, generated reports, and local dependencies are excluded from Git.
