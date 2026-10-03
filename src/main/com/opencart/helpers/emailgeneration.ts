import nodemailer from 'nodemailer';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { Utilities } from './utilities';

type TestStatus = 'passed' | 'failed' | 'flaky' | 'skipped';

export interface EmailTestResult {
	title: string;
	status: TestStatus;
}

const escapeHtml = (value: string) => value
	.replaceAll('&', '&amp;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;')
	.replaceAll('"', '&quot;')
	.replaceAll("'", '&#39;');

const buildHtmlList = (tests: EmailTestResult[]) => {
	if (!tests.length) return '<i>None</i>';
	return `<ul>${tests.map((test) => `<li>${escapeHtml(test.title)}</li>`).join('')}</ul>`;
};

export const sendReportEmail = async (
	tests: EmailTestResult[],
	reportPath: string,
): Promise<boolean> => {
	const properties = new Utilities().readProperties();
	const emailSendSetting = (process.env.EMAIL_SEND ?? properties.emailSend ?? 'false').trim().toLowerCase();
	if (emailSendSetting !== 'true' && emailSendSetting !== 'false') {
		throw new Error('EMAIL_SEND must be either true or false.');
	}
	if (emailSendSetting === 'false') {
		console.info('Report email disabled. Set EMAIL_SEND=true to enable it.');
		return false;
	}

	const SMTP_USER = process.env.SMTP_USER?.trim();
	const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
	const EMAIL_TO = process.env.EMAIL_TO?.trim();
	if (!SMTP_USER || !SMTP_PASSWORD || !EMAIL_TO) {
		const missing = [
			!SMTP_USER && 'SMTP_USER',
			!SMTP_PASSWORD && 'SMTP_PASSWORD',
			!EMAIL_TO && 'EMAIL_TO',
		].filter(Boolean);
		throw new Error(`Report email is enabled, but these settings are missing: ${missing.join(', ')}.`);
	}

	const host = process.env.SMTP_HOST || properties.SMTP_HOST || 'smtp.gmail.com';
	const port = Number(process.env.SMTP_PORT || properties.SMTP_PORT || 587);
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error('SMTP_PORT must be a valid port number.');
	}
	const secureSetting = (process.env.SMTP_SECURE ?? properties.SMTP_SECURE)?.trim().toLowerCase();
	if (secureSetting !== undefined && secureSetting !== 'true' && secureSetting !== 'false') {
		throw new Error('SMTP_SECURE must be either true or false.');
	}
	const secure = secureSetting === undefined ? port === 465 : secureSetting === 'true';

	const counts = {
		total: tests.length,
		passed: tests.filter((test) => test.status === 'passed').length,
		failed: tests.filter((test) => test.status === 'failed').length,
		flaky: tests.filter((test) => test.status === 'flaky').length,
		skipped: tests.filter((test) => test.status === 'skipped').length,
	};
	const statusText = counts.failed > 0 ? 'Failed' : counts.flaky > 0 ? 'Flaky' : 'Passed';
	const statusColor = counts.failed > 0 ? '#c62828' : counts.flaky > 0 ? '#b26a00' : '#218838';
	const report = path.resolve(reportPath);
	await access(report);

	const transporter = nodemailer.createTransport({
		host,
		port,
		secure,
		auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
	});

	const html = `
		<h3>${escapeHtml(process.env.EXTENT_PROJECT || 'OpenCart')} Automation Test Summary</h3>
		<table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif">
			<thead><tr style="background:#f2f2f2"><th>Project</th><th>Suite</th><th>Total</th><th>Passed</th><th>Failed</th><th>Flaky</th><th>Skipped</th><th>Status</th></tr></thead>
			<tbody><tr>
				<td>${escapeHtml(process.env.EXTENT_PROJECT || 'OpenCart')}</td>
				<td>${escapeHtml(process.env.TEST_SUITE || 'Playwright suite')}</td>
				<td>${counts.total}</td><td>${counts.passed}</td><td>${counts.failed}</td><td>${counts.flaky}</td><td>${counts.skipped}</td>
				<td style="color:${statusColor}"><b>${statusText}</b></td>
			</tr></tbody>
		</table>
		<h4>Passed test cases</h4>${buildHtmlList(tests.filter((test) => test.status === 'passed'))}
		<h4>Failed test cases</h4>${buildHtmlList(tests.filter((test) => test.status === 'failed'))}
		<h4>Flaky test cases</h4>${buildHtmlList(tests.filter((test) => test.status === 'flaky'))}
		<h4>Skipped test cases</h4>${buildHtmlList(tests.filter((test) => test.status === 'skipped'))}
		<p>The full execution report is attached.</p>`;

	await transporter.sendMail({
		from: process.env.EMAIL_FROM || properties.EMAIL_FROM || SMTP_USER,
		to: EMAIL_TO,
		subject: process.env.EMAIL_SUBJECT || properties.EMAIL_SUBJECT || 'OpenCart Automation - Test Execution Summary',
		html,
		attachments: [{ filename: path.basename(report), path: report }],
	});

	console.info(`Report email sent to ${EMAIL_TO}.`);
	return true;
};
