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
Set `BROWSER` in the environment to override that file setting, for example `BROWSER=chromium`.

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

## Harness CI

A starter Harness CI pipeline is in `.harness/pipeline.yaml`. In Harness, connect the GitHub repository, create a CI pipeline from this YAML, and replace `YOUR_ORG_ID`, `YOUR_PROJECT_ID`, and `YOUR_GITHUB_CONNECTOR` with the identifiers from your Harness account. Select the branch to run when starting the pipeline. The pipeline uses Harness Cloud and the matching Playwright Docker image, and publishes JUnit results.

In the Harness UI, create a pipeline in your project, choose the YAML editor or import the remote pipeline from this repository, then save it and run it manually on your branch. Start by running it manually. The end-to-end suite exercises a public demo store and includes customer registration and checkout/order placement; do not enable automatic pull-request or push triggers until you have confirmed the test site is appropriate for repeated runs.
