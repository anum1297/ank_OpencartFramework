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
npx bddgen test
npx playwright test
```

The default browser is configured in `src/main/com/opencart/config/qaConfig.properties`. Set `browser` to `chromium`, `chrome`, `firefox`, `edge`, a comma-separated list, or `all`.
Set `BROWSER` in the environment to override that file setting, for example `BROWSER=chromium`.

List discovered scenarios without executing them:

```sh
npx bddgen test
npx playwright test --list
```

## Test configuration

The default site URL, product, and non-secret SMTP settings are in `src/main/com/opencart/config/qaConfig.properties`. Email is disabled unless `EMAIL_SEND=true` is set. To enable local report emails, provide credentials through environment variables:

```sh
export EMAIL_SEND=true
export SMTP_USER="your-sender@example.com"
export SMTP_PASSWORD="your-smtp-app-password"
export EMAIL_TO="recipient@example.com"
npx bddgen test && npx playwright test
```

The message is sent after the custom Extent-style report is generated and includes that report as an attachment. Environment variables override the corresponding non-secret properties. Do not put `SMTP_PASSWORD`, `SMTP_USER`, or recipient addresses in tracked files.

| Variable | Purpose |
| --- | --- |
| `INVALID_LOGIN_EMAIL` | Override the safe, invalid email used by the invalid-login scenario. |
| `INVALID_LOGIN_PASSWORD` | Override the safe, invalid password used by the invalid-login scenario. |
| `EMAIL_SEND` | Set to `true` to enable email; defaults to `false`. |
| `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_TO` | SMTP account username, app password, and report recipient; required when enabled. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Optional SMTP host, port, and TLS setting; default values are in `qaConfig.properties`. |
| `EMAIL_FROM`, `EMAIL_SUBJECT` | Optional message sender and subject; sender defaults to `SMTP_USER`. |
| `PW_HEADLESS` | Set to `true` for headless execution; defaults to headed locally. Harness sets this automatically. |

## Manual credential rotation

If an OpenCart report-email app password has been exposed, manually revoke it with the email provider and create a replacement before enabling email. Use the replacement as the local `SMTP_PASSWORD` environment variable and as the Harness `smtp_password` secret; never add it to this repository. If the exposed credential was reused elsewhere, replace it there too. Git-history cleanup can remove old copies from the repository, but it does not invalidate a credential and must be coordinated with anyone using the repository. Credential rotation is a one-time response to exposure (or your normal security-policy interval), not a step required for every test run.

## Harness email setup

The Harness pipeline enables report email and reads these project secrets using the matching identifiers below. Create each as a Harness text secret in the `Opencart` project before running the pipeline:

| Harness secret identifier | Value |
| --- | --- |
| `smtp_user` | SMTP account username |
| `smtp_password` | Newly rotated SMTP app password |
| `email_to` | Report recipient address |

The pipeline injects these only into the test step's environment. SMTP host, port, TLS, sender, and subject use the non-secret defaults in `qaConfig.properties` unless overridden with environment variables.

Keep credentials and real customer data in environment variables, never in committed files. The duplicate-signup scenario creates a fresh test customer, logs out, then attempts to register again with that same generated email, so it does not need a pre-existing account or Harness secret.

## Reports and artifacts

Playwright HTML, Monocart, and the custom Extent-style report are configured in `playwright.config.ts`. Test results, traces, videos, generated reports, and local dependencies are excluded from Git.

## Harness CI

The Harness pipeline and its generated input sets are in `.harness/`. It generates Playwright tests from the Gherkin features with `npx bddgen test`, then runs them on Harness Cloud with Chromium and publishes JUnit results.

The onboarding flow may enable push and pull-request triggers. This end-to-end suite changes data on the public demo store, and checkout places an order. Keep automatic triggers disabled until you have confirmed repeated runs are appropriate for that test site.
