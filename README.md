# 🛒 OpenCart E2E Automation Framework

End-to-end browser automation for the OpenCart demo store, built with **Playwright**, **TypeScript**, and **playwright-bdd**. Test scenarios are written in Gherkin and implemented with step definitions and page objects.

---

## 📌 Table of Contents

- [📖 Overview](#-overview)
- [🧰 Tech Stack](#-tech-stack)
- [🗂 Project Structure](#-project-structure)
- [🚀 Setup Instructions](#-setup-instructions)
- [▶️ How to Run Tests](#️-how-to-run-tests)
- [📊 Reporting](#-reporting)
- [🔁 CI/CD Pipeline](#-cicd-pipeline)
- [📧 Email Report Integration](#-email-report-integration)
- [🔐 Credential Security](#-credential-security)
- [🤝 Contribution](#-contribution)
- [✅ Conclusion](#-conclusion)

---

## 📖 Overview

This framework automates key customer workflows on the OpenCart demo site:

- Account registration and login, including invalid and duplicate signup cases
- Address book management
- Logout
- Shopping cart add/remove
- Checkout and order confirmation

Scenarios are maintained as Gherkin feature files. `playwright-bdd` generates Playwright tests from those features before execution.

---

## 🧰 Tech Stack

| Tool | Purpose |
| --- | --- |
| TypeScript | Test and framework implementation |
| Playwright Test | Browser automation, execution, and built-in reporting |
| playwright-bdd | Gherkin feature and step-definition integration |
| Node.js and npm | Runtime and dependency management |
| Monocart Reporter | Test execution summary report |
| Custom Extent-style reporter | Detailed HTML report with test steps and attachments |
| Harness CI | Cloud pipeline execution and JUnit report collection |

---

## 🗂 Project Structure

```text
ank_OpencartFramework/
├── .harness/
│   └── pipeline.yaml                    # Harness CI pipeline
├── src/
│   ├── main/com/opencart/
│   │   ├── config/
│   │   │   └── qaConfig.properties       # Non-secret test and SMTP defaults
│   │   ├── driver/
│   │   │   └── fixtures.ts              # Playwright fixtures
│   │   └── helpers/
│   │       ├── emailgeneration.ts        # Email summary and report attachment
│   │       ├── extentreportmanager.ts    # Custom HTML reporter
│   │       ├── testdata.ts               # Test data helpers
│   │       └── utilities.ts              # Shared config utilities
│   └── test/com/opencart/
│       ├── features/                     # Gherkin scenarios
│       ├── pageobject/                   # Page Object Model classes
│       └── steps/                        # Gherkin step definitions
├── playwright.config.ts                  # Browser, reporter, video, and trace settings
├── package.json
└── README.md
```
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/330c1f9f-5be4-4298-9a93-86196ff9bb21" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/c1c641c0-278f-4919-b5df-0306a979f8a5" />
<img width="1919" height="571" alt="image" src="https://github.com/user-attachments/assets/77205bb1-259d-4626-b9fa-74aa52218021" />

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js and npm
- A reachable OpenCart test site
- Playwright browser binaries for local execution

### Install dependencies and browsers

```bash
npm ci
npx playwright install
```

---

## ▶️ How to Run Tests

Generate Playwright tests from the Gherkin feature files, then run the suite:

```bash
npx bddgen test
npx playwright test
```

The local default browser is configured in `src/main/com/opencart/config/qaConfig.properties`. Supported values include `chromium`, `chrome`, `firefox`, `edge`, a comma-separated list, or `all`. Override the configured browser with `BROWSER`, for example:

```bash
BROWSER=chromium npx bddgen test
BROWSER=chromium npx playwright test --project=chromium
```

The browser runs headed locally by default. Set `PW_HEADLESS=true` to run headless, or `PW_HEADLESS=false` to explicitly request headed mode:

```bash
PW_HEADLESS=true BROWSER=chromium npx playwright test --project=chromium
```

List tests without executing them:

```bash
npx bddgen test
npx playwright test --list
```

---

## 📊 Reporting

The Playwright configuration produces:

- Playwright HTML report in `playwright-report/`
- Monocart HTML report in `monocart-report/index.html`
- Custom Extent-style HTML report in `extent-report/index.html`
- JUnit XML in `test-results/junit.xml`
- Playwright screenshots, videos, and traces in `test-results/`

Open the Playwright HTML report locally with:

```bash
npx playwright show-report
```

Video and trace recording are enabled in `playwright.config.ts`. Harness currently collects the JUnit report; the video and trace files are generated in the CI workspace but are not configured as downloadable Harness artifacts.

- Playwright HTML report

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/4ad7cb71-da08-4c4d-8d83-39df62717bc4" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/550618d7-4219-4203-b75d-c489874aee49" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/81aca23b-3e50-43dd-8e25-ddcd0aa79df1" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/7d3e086b-b639-4a9e-b160-0ce8fc726e30" />

- Monocart HTML report

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/88c4a412-da41-4ae3-8565-1f8faa39eaa7" />

- Custom Extent-style HTML report

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/2eebe482-8ca3-493b-8662-924c02465d2c" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/c70807b4-acb6-4cbf-8431-ba323ab388cb" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/f21cb044-30d9-4815-988e-28d529a11b2a" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/a71e0663-6b63-4500-b3d0-05527be4a062" />

- JUnit XML

<img width="1212" height="963" alt="image" src="https://github.com/user-attachments/assets/ee2a5036-0ab5-42a3-b093-9a5afcb905e2" />

- Playwright screenshots, videos, and traces

<img width="561" height="204" alt="image" src="https://github.com/user-attachments/assets/e0abeddb-cb50-4d09-b664-940cc9e9d73d" />

---

## 🔁 CI/CD Pipeline

The Harness pipeline is defined in `.harness/pipeline.yaml`. It installs the locked npm dependencies, generates the BDD tests, runs Chromium in headless mode, and publishes JUnit results to Harness.

Harness sets `PW_HEADLESS=true` and `BROWSER=chromium` for CI. This avoids requiring a visible display on the cloud runner. The pipeline also enables report email and reads its email credentials from Harness project secrets.

The test suite uses the public OpenCart demo store and includes checkout workflows that place an order. Consider this before enabling frequent or automatic pipeline triggers.

<img width="1920" height="1080" alt="image-1791035435532" src="https://github.com/user-attachments/assets/ef1e3aab-04cd-4413-b387-ff54512be733" />
<img width="1920" height="1080" alt="image-1791035452171" src="https://github.com/user-attachments/assets/508e8c57-7517-47fb-9744-e4e8bd34661f" />
<img width="1920" height="1080" alt="image-1791035504854" src="https://github.com/user-attachments/assets/99f8d570-00d0-4f1f-ab83-a4b9f521d8a6" />
<img width="1920" height="1080" alt="image-1791035516897" src="https://github.com/user-attachments/assets/284673b9-36f1-4bf7-82cd-acb32f8ba0ba" />

---

## 📧 Email Report Integration

When email is enabled, the custom reporter sends an HTML test summary after it creates `extent-report/index.html`. The email includes the custom report as an attachment.

### Local email setup

Provide the SMTP username, app password, and recipient through environment variables. For Gmail, use an App Password rather than your normal account password.

```bash
export EMAIL_SEND=true
export SMTP_USER="your-sender@example.com"
export EMAIL_TO="recipient@example.com"
read -r -s -p "SMTP app password: " SMTP_PASSWORD
echo
export SMTP_PASSWORD

npx bddgen test && npx playwright test
```

Email remains disabled if `EMAIL_SEND` is not set to `true`. SMTP host, port, TLS mode, and subject have non-secret defaults in `qaConfig.properties`; environment variables can override them.

### Harness email setup

Create these as **Text** secrets in the Harness `Opencart` project. The identifiers must match exactly:

| Harness secret identifier | Value |
| --- | --- |
| `smtp_user` | SMTP account username |
| `smtp_password` | Gmail App Password or the SMTP provider's equivalent |
| `email_to` | Report recipient address |

The Run step in `.harness/pipeline.yaml` maps the secrets to the environment variables expected by the email helper:

```yaml
EMAIL_SEND: "true"
SMTP_USER: <+secrets.getValue("smtp_user")>
SMTP_PASSWORD: <+secrets.getValue("smtp_password")>
EMAIL_TO: <+secrets.getValue("email_to")>
```

After a successful pipeline run, check the Run step logs for `Report email sent to ...` and confirm the report email arrived with `index.html` attached.

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/346682a0-afe5-4d5d-aa91-9f0a055fcfc6" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/a6c31b96-0dcf-4191-9f66-150701db7430" />

---

## 🔐 Credential Security

- Never commit SMTP passwords, app passwords, or other credentials to the repository.
- Keep local credentials in environment variables and CI credentials in Harness secrets.
- If a credential is exposed, revoke it with the email provider and create a replacement. Update the local environment and Harness secret with that replacement.
- Removing a credential from a later commit does not erase copies from Git history; coordinate any history cleanup with repository collaborators. History cleanup does not replace credential revocation.

---

## 🤝 Contribution

1. Fork the repository.
2. Create a feature branch.
3. Make and validate your changes.
4. Commit and push the branch.
5. Open a pull request with a summary of the changes.

---

## ✅ Conclusion

This framework combines readable Gherkin scenarios with Playwright browser automation, page objects, multiple HTML reports, email summaries, and Harness CI execution. It is intended to make OpenCart customer workflows repeatable and their results easy to review.

> 🎯 *Automate clearly. Report reliably. Improve continuously.*
