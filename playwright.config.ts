import { defineConfig } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { Utilities } from './src/main/com/opencart/helpers/utilities';

const browserOptions = {
    chromium: { browserName: 'chromium', launchOptions: { args: ['--start-maximized'] as string[] } },
    chrome: { browserName: 'chromium', channel: 'chrome', launchOptions: { args: ['--start-maximized'] as string[] } },
    firefox: { browserName: 'firefox' },
    edge: { browserName: 'chromium', channel: 'msedge', launchOptions: { args: ['--start-maximized'] as string[] } },
} as const;

const browserConfig = process.env.BROWSER?.trim().toLowerCase()
    || new Utilities().getProperty('browser')?.trim().toLowerCase()
    || 'chromium';
const configuredBrowsers = browserConfig === 'all'
    ? ['chrome', 'firefox', 'edge']
    : browserConfig.split(',').map((browser) => browser.trim());
const browserProjects = [...new Set(configuredBrowsers.map((browser) => browser === 'msedge' ? 'edge' : browser))]
    .map((browser) => {
        if (!Object.prototype.hasOwnProperty.call(browserOptions, browser)) {
            throw new Error(`Unsupported browser "${browser}". Use chromium, chrome, firefox, edge, or all.`);
        }

        return {
            name: browser,
            use: browserOptions[browser as keyof typeof browserOptions],
        };
    });

const testDir = defineBddConfig({
    features: 'src/test/com/opencart/features/*.feature',
    steps: [
        'src/test/com/opencart/steps/*.ts',
        'src/main/com/opencart/driver/fixtures.ts',
    ],
});

export default defineConfig({
    testDir,
    fullyParallel: false,
    workers: 1,
    projects: browserProjects,
    reporter: [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['monocart-reporter', {
            name: 'OpenCart E2E Report',
            outputFile: './monocart-report/index.html',
        }],
        ['./src/main/com/opencart/helpers/extentreportmanager.ts'],
    ],
    use: {
        headless: false,
        viewport: null,
        screenshot: 'on',
        video: 'on',
        trace: 'on',
    },
})