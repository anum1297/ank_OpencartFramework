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

The default site URL and product are in `qaConfig.properties`. Optional environment variables:

| Variable | Purpose |
| --- | --- |
| `INVALID_LOGIN_EMAIL` | Override the safe, invalid email used by the invalid-login scenario. |
| `INVALID_LOGIN_PASSWORD` | Override the safe, invalid password used by the invalid-login scenario. |
| `EMAIL_SEND` | Set to `true` to enable sending the execution report by email. |
| `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_TO` | SMTP credentials and recipient, required when email reporting is enabled. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `EMAIL_FROM` | Optional SMTP and sender configuration. |

Keep credentials and real customer data in environment variables, never in committed files. The duplicate-signup scenario creates a fresh test customer, logs out, then attempts to register again with that same generated email, so it does not need a pre-existing account or Harness secret.

Set `HEADED=true` to run Playwright browsers in headed mode. On a headless Linux CI worker, provide a virtual display, for example with `xvfb-run -a`. Harness Cloud has no interactive desktop to watch live; use the recorded Playwright video, screenshot, and trace attachments in the reports to inspect the run.

## Reports and artifacts

Playwright HTML, Monocart, and the custom Extent-style report are configured in `playwright.config.ts`. Test results, traces, videos, generated reports, and local dependencies are excluded from Git.

## Harness CI

The Harness pipeline and its generated input sets are in `.harness/`. It generates Playwright tests from the Gherkin features with `npx bddgen test`, then runs them headed under Xvfb on Harness Cloud with Chromium and publishes JUnit results. A test summary is sent by email, with the custom HTML report attached, after each run.

For email, create three Harness Secret Text entries in the `Opencart` project with identifiers `opencart_smtp_user`, `opencart_smtp_password`, and `opencart_report_email_to`. Set them to the Gmail sender address, a Gmail App Password (not the account password), and the report recipient address. The pipeline passes secrets through Harness expressions; do not commit or paste their values into source files or chat. To use another SMTP provider, update `SMTP_HOST` and `SMTP_PORT` in the pipeline and its security requirements.

The onboarding flow may enable push and pull-request triggers. This end-to-end suite changes data on the public demo store, and checkout places an order. Keep automatic triggers disabled until you have confirmed repeated runs are appropriate for that test site.
