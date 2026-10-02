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
	const emailSend = (process.env.EMAIL_SEND ?? properties.emailSend ?? 'false').trim().toLowerCase() === 'true';
	if (!emailSend) {
		console.info('Report email disabled. Set EMAIL_SEND=true to enable it.');
		return false;
	}

	const SMTP_USER = process.env.SMTP_USER || properties.SMTP_USER || properties.mailFrom;
	let SMTP_PASSWORD = process.env.SMTP_PASSWORD;
	const encryptedPassword = properties.SMTP_PASSWORD;
	if (!SMTP_PASSWORD && encryptedPassword) {
		if (!encryptedPassword.startsWith('v1:')) {
			throw new Error('SMTP_PASSWORD must be supplied as an environment variable. Only encrypted v1 values may be stored in qaConfig.properties.');
		}

		const decryptionKey = process.env.EMAIL_SECRET_KEY;
		if (!decryptionKey) {
			throw new Error('EMAIL_SECRET_KEY is required to decrypt SMTP_PASSWORD from qaConfig.properties.');
		}

		SMTP_PASSWORD = new Utilities().decrypt(encryptedPassword, decryptionKey);
	}
	const EMAIL_TO = process.env.EMAIL_TO || properties.EMAIL_TO || properties.mailTo;
	if (!SMTP_USER || !SMTP_PASSWORD || !EMAIL_TO) {
		const missing = [
			!SMTP_USER && 'SMTP_USER',
			!SMTP_PASSWORD && 'SMTP_PASSWORD environment variable',
			!EMAIL_TO && 'EMAIL_TO',
		].filter(Boolean);
		throw new Error(`Report email is enabled, but these settings are missing: ${missing.join(', ')}.`);
	}

	const host = process.env.SMTP_HOST || properties.SMTP_HOST || 'smtp.gmail.com';
	const port = Number(process.env.SMTP_PORT || properties.SMTP_PORT || 587);
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error('SMTP_PORT must be a valid port number.');
	}

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
		secure: (process.env.SMTP_SECURE || properties.SMTP_SECURE)?.toLowerCase() === 'true' || port === 465,
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
		from: process.env.EMAIL_FROM || properties.EMAIL_FROM || properties.mailFrom || SMTP_USER,
		to: EMAIL_TO,
		subject: process.env.EMAIL_SUBJECT || properties.EMAIL_SUBJECT || 'OpenCart Automation - Test Execution Summary',
		html,
		attachments: [{ filename: path.basename(report), path: report }],
	});

	console.info(`Report email sent to ${EMAIL_TO}.`);
	return true;
};
