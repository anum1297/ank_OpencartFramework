import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { Reporter, TestCase, TestResult, TestStep } from '@playwright/test/reporter';
import { sendReportEmail } from './emailgeneration';

type ReportStatus = 'passed' | 'failed' | 'flaky' | 'skipped';

const REPORT_NAME = process.env.EXTENT_REPORT_NAME || 'OpenCart Automation Test Report';
const DOCUMENT_TITLE = process.env.EXTENT_DOCUMENT_TITLE || 'Execution Report';
const REPORT_THEME = 'dark';

interface ReportStep {
	title: string;
	category: string;
	duration: number;
	failed: boolean;
	error?: string;
	children: ReportStep[];
}

interface ReportAttachment {
	name: string;
	contentType: string;
	href: string;
}

interface ReportTest {
	id: number;
	title: string;
	file: string;
	project: string;
	status: ReportStatus;
	duration: number;
	retry: number;
	startedAt: string;
	endedAt: string;
	steps: ReportStep[];
	errors: string[];
	attachments: ReportAttachment[];
}

const escapeHtml = (value: string) => value
	.replaceAll('&', '&amp;')
	.replaceAll('<', '&lt;')
	.replaceAll('>', '&gt;')
	.replaceAll('"', '&quot;')
	.replaceAll("'", '&#39;');

const safeFilename = (value: string) => value
	.replace(/[^a-zA-Z0-9._-]+/g, '-')
	.replace(/^-+|-+$/g, '')
	.slice(0, 80) || 'attachment';

const mapStep = (step: TestStep): ReportStep => ({
	title: step.title,
	category: step.category,
	duration: step.duration,
	failed: Boolean(step.error),
	error: step.error?.message,
	children: step.steps.map(mapStep),
});

const flattenSteps = (steps: ReportStep[]): ReportStep[] => steps.flatMap((step) => [step, ...flattenSteps(step.children)]);

const visibleStatus = (result: TestResult): ReportStatus => {
	if (result.status === 'skipped') return 'skipped';
	if (result.status !== 'passed') return 'failed';
	return result.retry > 0 ? 'flaky' : 'passed';
};

const formatTimestamp = (timestamp: string | Date) => new Intl.DateTimeFormat('en-US', {
	weekday: 'long',
	month: 'long',
	day: '2-digit',
	year: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	second: '2-digit',
	hour12: true,
	timeZoneName: 'short',
}).format(new Date(timestamp));

const formatClockTime = (timestamp: string) => new Intl.DateTimeFormat('en-US', {
	hour: 'numeric',
	minute: '2-digit',
	second: '2-digit',
	hour12: true,
}).format(new Date(timestamp));

const formatDuration = (duration: number) => {
	const milliseconds = Math.floor(duration % 1000).toString().padStart(3, '0');
	const seconds = Math.floor(duration / 1000) % 60;
	const minutes = Math.floor(duration / 60_000) % 60;
	const hours = Math.floor(duration / 3_600_000);
	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds}`;
};

const renderSteps = (steps: ReportStep[]): string => {
	if (!steps.length) return '<p class="empty-detail">No steps were recorded.</p>';

	return `<ol class="steps">${steps.map((step) => `
		<li class="step ${step.failed ? 'step-failed' : ''}">
			<span class="step-icon">${step.failed ? '!' : '&#10003;'}</span>
			<div class="step-content">
				<div class="step-line"><span>${escapeHtml(step.title)}</span><small>${escapeHtml(step.category)} · ${step.duration} ms</small></div>
				${step.error ? `<pre class="error-text">${escapeHtml(step.error)}</pre>` : ''}
				${step.children.length ? renderSteps(step.children) : ''}
			</div>
		</li>`).join('')}</ol>`;
};

const renderAttachments = (attachments: ReportAttachment[]): string => {
	if (!attachments.length) return '';

	return `<div class="attachments"><h4>Attachments</h4><div class="attachment-list">${attachments.map((attachment) => {
		const href = escapeHtml(attachment.href);
		const name = escapeHtml(attachment.name);
		if (attachment.contentType.startsWith('image/')) {
			return `<a class="attachment image-attachment" href="${href}" target="_blank" rel="noreferrer"><img src="${href}" alt="${name}"><span>${name}</span></a>`;
		}
		return `<a class="attachment file-attachment" href="${href}" target="_blank" rel="noreferrer">${name}<small>${escapeHtml(attachment.contentType)}</small></a>`;
	}).join('')}</div></div>`;
};

const renderSidebarTest = (test: ReportTest, index: number): string => {
	const label = test.status === 'flaky' ? 'Flaky' : test.status[0].toUpperCase() + test.status.slice(1);
	return `<button class="test-row ${index === 0 ? 'selected' : ''}" data-test-index="${index}" data-status="${test.status}" data-search="${escapeHtml(`${test.title} ${test.file}`.toLowerCase())}">
		<span class="test-row-title">${escapeHtml(test.title)}</span>
		<span class="test-row-meta">${escapeHtml(formatClockTime(test.startedAt))} / ${formatDuration(test.duration)} <b class="badge ${test.status}">${label}</b></span>
	</button>`;
};

const renderTestDetail = (test: ReportTest, index: number): string => {
	const label = test.status === 'flaky' ? 'Flaky' : test.status[0].toUpperCase() + test.status.slice(1);
	const errors = test.errors.length
		? `<section class="detail-section failure-block"><h3>Failure details</h3>${test.errors.map((error) => `<pre class="error-text">${escapeHtml(error)}</pre>`).join('')}</section>`
		: '';
	const flattenedSteps = flattenSteps(test.steps);
	const stepRows = flattenedSteps.length
		? flattenedSteps.map((step) => `<tr><td><span class="table-status ${step.failed ? 'failed' : 'passed'}">${step.failed ? 'Fail' : 'Pass'}</span></td><td>${formatDuration(step.duration)}</td><td>${escapeHtml(step.title)}${step.error ? `<pre class="error-text">${escapeHtml(step.error)}</pre>` : ''}</td></tr>`).join('')
		: '<tr><td colspan="3" class="muted">No steps were recorded.</td></tr>';

	return `<section class="test-detail" data-detail-index="${index}" ${index ? 'hidden' : ''}>
		<div class="detail-heading"><h1>${escapeHtml(test.title)}</h1><div class="detail-badges">
			<span class="time-badge started">${escapeHtml(formatTimestamp(test.startedAt))}</span>
			<span class="time-badge ended">${escapeHtml(formatTimestamp(test.endedAt))}</span>
			<span class="time-badge duration-badge">${formatDuration(test.duration)}</span>
			<span class="time-badge id-badge">#test-id=${test.id}</span>
			<span class="badge ${test.status}">${label}</span>
		</div></div>
		${renderAttachments(test.attachments)}
		${errors}
		<section class="detail-section"><h3>Execution events</h3><div class="table-scroll"><table><thead><tr><th>Status</th><th>Duration</th><th>Details</th></tr></thead><tbody>${stepRows}</tbody></table></div></section>
		<div class="detail-footer">${escapeHtml(test.file)}${test.retry ? ` · Retry ${test.retry}` : ''} · ${escapeHtml(test.project)}</div>
	</section>`;
};

const renderDashboard = (tests: ReportTest[], generatedAt: string): string => {
	const passed = tests.filter((test) => test.status === 'passed').length;
	const flaky = tests.filter((test) => test.status === 'flaky').length;
	const failed = tests.filter((test) => test.status === 'failed').length;
	const skipped = tests.filter((test) => test.status === 'skipped').length;
	const passedRatio = tests.length ? Math.round((passed / tests.length) * 360) : 0;
	const stepCount = tests.reduce((count, test) => count + test.steps.length, 0);
	const passedSteps = tests.reduce((count, test) => count + test.steps.filter((step) => !step.failed).length, 0);
	const failedSteps = stepCount - passedSteps;
	const startTime = tests.length ? tests.reduce((earliest, test) => test.startedAt < earliest ? test.startedAt : earliest, tests[0].startedAt) : generatedAt;
	const endTime = tests.length ? tests.reduce((latest, test) => test.endedAt > latest ? test.endedAt : latest, tests[0].endedAt) : generatedAt;
	const totalDuration = tests.reduce((duration, test) => duration + test.duration, 0) || 1;
	const browserNames = [...new Set(tests.map((test) => test.project))].join(', ') || process.env.BROWSER_NAME || 'Playwright';
	const environment = [
		['Project', process.env.EXTENT_PROJECT || 'OpenCart Automation'],
		['Tester', process.env.EXTENT_TESTER || 'Aniket Ajay Umare'],
		['OS', `${os.type()} ${os.release()}`],
		['Node.js', process.version],
		['Browser', browserNames],
		['Environment', process.env.TEST_ENVIRONMENT || 'QA'],
	];
	const timeline = tests.map((test) => `<span class="timeline-segment ${test.status}" style="width:${(test.duration / totalDuration) * 100}%" title="${escapeHtml(test.title)} · ${formatDuration(test.duration)}"></span>`).join('');
	const metadataRows = environment.map(([name, value]) => `<tr><td>${escapeHtml(name)}</td><td>${escapeHtml(value)}</td></tr>`).join('');
	const donutStyle = `conic-gradient(#00bd16 0deg ${passedRatio}deg, #a51ce0 ${passedRatio}deg ${passedRatio + Math.round((flaky / (tests.length || 1)) * 360)}deg, #e05243 ${passedRatio + Math.round((flaky / (tests.length || 1)) * 360)}deg ${passedRatio + Math.round(((flaky + failed) / (tests.length || 1)) * 360)}deg, #84909a ${passedRatio + Math.round(((flaky + failed) / (tests.length || 1)) * 360)}deg 360deg)`;

	return `<section id="dashboard-view" class="dashboard-view" hidden>
		<div class="dashboard-cards">
			<article class="dashboard-card"><span>Started</span><strong>${escapeHtml(formatTimestamp(startTime))}</strong></article>
			<article class="dashboard-card"><span>Ended</span><strong>${escapeHtml(formatTimestamp(endTime))}</strong></article>
			<article class="dashboard-card"><span>Tests Passed</span><strong>${passed + flaky}</strong></article>
			<article class="dashboard-card"><span>Tests Failed</span><strong>${failed}</strong></article>
		</div>
		<div class="charts-grid">
			<article class="chart-panel"><h2>Tests</h2><div class="donut-wrap"><div class="donut" style="--donut:${donutStyle}"><span>${tests.length}</span></div><span class="chart-legend"><i class="legend-pass"></i>Pass</span></div><div class="chart-caption">${passed + flaky} tests passed<br>${failed} tests failed, ${skipped} skipped, ${flaky} flaky</div></article>
			<article class="chart-panel"><h2>Step events</h2><div class="donut-wrap"><div class="donut" style="--donut:${stepCount ? `conic-gradient(#00bd16 0deg ${Math.round((passedSteps / stepCount) * 360)}deg, #e05243 ${Math.round((passedSteps / stepCount) * 360)}deg 360deg)` : 'conic-gradient(#586675 0deg 360deg)'}"><span>${stepCount}</span></div><span class="chart-legend"><i class="legend-pass"></i>Pass</span></div><div class="chart-caption">${passedSteps} events passed<br>${failedSteps} events failed</div></article>
		</div>
		<article class="chart-panel timeline-panel"><h2>Timeline</h2><div class="timeline-track">${timeline || '<span class="muted">No tests were recorded.</span>'}</div><div class="timeline-scale"><span>0</span><span>${formatDuration(totalDuration)}</span></div></article>
		<article class="chart-panel environment-panel"><h2>System/Environment</h2><div class="table-scroll"><table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody>${metadataRows}</tbody></table></div></article>
	</section>`;
};

const buildHtml = (tests: ReportTest[]): string => {
	const passed = tests.filter((test) => test.status === 'passed').length;
	const flaky = tests.filter((test) => test.status === 'flaky').length;
	const failed = tests.filter((test) => test.status === 'failed').length;
	const skipped = tests.filter((test) => test.status === 'skipped').length;
	const generatedAt = new Date().toISOString();
	const generatedLabel = formatTimestamp(generatedAt);
	const testRows = tests.length ? tests.map(renderSidebarTest).join('') : '<div class="empty-sidebar">No tests recorded</div>';
	const testDetails = tests.length ? tests.map(renderTestDetail).join('') : '<div class="empty-detail">No test details available.</div>';

	return `<!doctype html>
<html lang="en" data-theme="${REPORT_THEME}">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>${escapeHtml(DOCUMENT_TITLE)}</title>
	<style>
		:root{color-scheme:dark;font-family:Arial,Helvetica,sans-serif;background:#07111d;color:#dce4ec;font-synthesis:none;--header:#07111d;--rail:#18232f;--sidebar:#1a2633;--workspace:#243242;--line:#394857;--muted:#a8b3bf;--green:#00bd16;--cyan:#16c8d0;--red:#ff3860}
		*{box-sizing:border-box}body{margin:0;min-width:360px;min-height:100vh;background:var(--workspace)}button,input{font:inherit}
		.topbar{height:64px;display:flex;align-items:center;background:var(--header);border-bottom:1px solid #1d2934;padding:0 14px;gap:14px}
		.brand-mark{width:34px;height:34px;display:grid;place-items:center;color:#62b9ff;font-size:26px;font-weight:700}.header-search{background:none;border:0;color:#a9bacb;font-size:23px;cursor:pointer;width:36px;height:36px}
		.topbar-spacer{flex:1}.header-badges{display:flex;align-items:center;gap:12px}.header-badge{background:#13a34a;color:#fff;font-size:12px;font-weight:700;padding:6px 11px;border-radius:4px;white-space:nowrap}
		.app-shell{height:calc(100vh - 64px);min-height:520px;display:grid;grid-template-columns:64px 31% minmax(0,1fr)}
		.rail{background:var(--rail);border-right:1px solid var(--line);display:flex;flex-direction:column;align-items:center;gap:10px;padding-top:20px}
		.rail-button{width:42px;height:42px;border:0;border-radius:3px;background:transparent;color:#a6b3c0;cursor:pointer;font-size:19px}.rail-button:hover,.rail-button.active{background:#263748;color:#fff}
		.sidebar{min-width:0;background:var(--sidebar);border-right:1px solid var(--line);overflow:hidden;display:flex;flex-direction:column}.sidebar-heading{height:54px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 17px;color:#aeb9c3;border-bottom:1px solid var(--line)}
		.sidebar-heading button{border:0;background:none;color:#aeb9c3;font-size:20px;cursor:pointer}.search-box{display:none;margin:0 12px 10px}.search-box.open{display:block}.search-box input{width:100%;padding:8px;border:1px solid #455565;background:#111d28;color:#fff;border-radius:3px}
		.test-rows{overflow-y:auto;flex:1}.test-row{width:100%;min-height:72px;display:flex;flex-direction:column;align-items:flex-start;justify-content:center;gap:8px;padding:10px 15px 10px 20px;color:#dce4ec;background:transparent;border:0;border-bottom:1px solid var(--line);text-align:left;cursor:pointer}
		.test-row:hover{background:#202e3b}.test-row.selected{background:#15251e;box-shadow:inset 0 -1px #3d5849}.test-row[hidden]{display:none}.test-row-title{font-size:13px;font-weight:600;overflow-wrap:anywhere}.test-row-meta{width:100%;font-size:11px;color:#d1d9e0;display:flex;align-items:center;gap:5px;white-space:nowrap}.badge{display:inline-block;font-size:10px;font-weight:700;border-radius:4px;padding:3px 6px;background:#8dcf4f;color:#fff;white-space:nowrap}.test-row .badge{margin-left:auto}.badge.failed{background:#ff3860}.badge.flaky{background:#a51ce0}.badge.skipped{background:#758390}
		.workspace{min-width:0;overflow:auto;background:var(--workspace);padding:22px}.detail-heading{margin-bottom:14px}.detail-heading h1{font-size:18px;font-weight:600;color:#00bd77;margin:0 0 11px;overflow-wrap:anywhere}.detail-badges{display:flex;gap:5px;align-items:center;flex-wrap:wrap}.time-badge{border:1px solid #405061;padding:5px 8px;border-radius:4px;font-size:11px;font-weight:600}.time-badge.started{background:#18c5cc;color:#fff;border-color:#18c5cc}.time-badge.ended{background:#ff3860;color:#fff;border-color:#ff3860}.time-badge.duration-badge,.time-badge.id-badge{color:#dce4ec}
		.detail-section{margin-top:22px}.detail-section h3{font-size:12px;text-transform:uppercase;color:#c9d2dc;margin:0;padding:12px 9px;border:1px solid var(--line);border-bottom:0}.table-scroll{width:100%;overflow:auto}table{width:100%;border-collapse:collapse;font-size:12px}th,td{text-align:left;padding:11px 9px;border:1px solid var(--line)}th{font-size:11px;text-transform:uppercase;font-weight:600;color:#d0d9e2}td{color:#d9e1e9}.table-status{display:inline-block;border-radius:4px;padding:3px 6px;background:#8dcf4f;color:#fff;font-size:10px;font-weight:700}.table-status.failed{background:#ff3860}.muted{color:var(--muted)}
		.steps{list-style:none;margin:0;padding:0}.steps .steps{margin:7px 0 5px 12px;padding-left:12px;border-left:1px solid var(--line)}.step{display:flex;gap:8px;margin:7px 0;color:#d9e1e9;font-size:12px}.step-icon{flex:0 0 16px;width:16px;height:16px;border-radius:50%;display:grid;place-items:center;background:#168d50;color:#fff;font-size:10px}.step-failed>.step-icon{background:#ff3860}.step-content{min-width:0;flex:1}.step-line{display:flex;justify-content:space-between;gap:10px}.step-line small{color:#aab5bf;white-space:nowrap;font-size:10px}
		.attachments{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0 20px}.attachment{width:180px;min-height:112px;border:1px solid var(--line);background:#f5f7fa;color:#536170;text-decoration:none;font-size:11px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:7px}.attachment:hover{border-color:#20b5be}.image-attachment img{max-width:100%;max-height:100px;object-fit:contain}.file-attachment{background:#182532;color:#dce4ec;min-height:64px}.file-attachment small{color:#aeb9c3}.error-text{white-space:pre-wrap;overflow-wrap:anywhere;background:#2b2028;border-left:3px solid var(--red);padding:10px;margin:8px 0;color:#ffd8df;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.detail-footer{margin-top:18px;color:#9eabb7;font-size:11px}
		.dashboard-view{max-width:1540px;margin:0 auto}.dashboard-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.dashboard-card,.chart-panel{border:1px solid var(--line);background:rgba(5,15,26,.45)}.dashboard-card{min-height:116px;padding:22px}.dashboard-card span{display:block;font-size:12px;margin-bottom:10px;color:#d3dce5}.dashboard-card strong{font-weight:400;font-size:20px;overflow-wrap:anywhere}.charts-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin-top:24px}.chart-panel{padding:20px 22px}.chart-panel h2{font-size:13px;font-weight:400;margin:0 0 18px}.donut-wrap{min-height:164px;display:flex;align-items:center;justify-content:center;position:relative}.donut{width:94px;height:94px;border-radius:50%;background:var(--donut);display:grid;place-items:center;position:relative}.donut:before{content:"";position:absolute;inset:14px;border-radius:50%;background:#07111d}.donut span{position:relative;font-size:14px}.chart-legend{position:absolute;right:5%;top:50%;font-size:11px;color:#84919d}.chart-legend i{display:inline-block;width:10px;height:10px;background:#00bd16;margin-right:6px}.chart-caption{font-size:11px;line-height:1.7;border-top:1px solid var(--line);padding-top:12px;color:#d1dbe4}.timeline-panel{margin-top:24px;min-height:150px}.timeline-track{height:22px;display:flex;background:#132130;margin:48px 10px 0;overflow:hidden}.timeline-segment{height:100%;min-width:2px;background:#00bd16;border-right:1px solid #07111d}.timeline-segment.failed{background:#e05243}.timeline-segment.flaky{background:#a51ce0}.timeline-segment.skipped{background:#758390}.timeline-scale{display:flex;justify-content:space-between;font-size:11px;color:#84919d;margin:12px 10px}.environment-panel{margin-top:24px;width:min(760px,100%)}.environment-panel td:first-child{width:36%;font-weight:600;text-transform:uppercase;font-size:11px}.environment-panel td{height:40px}
		.empty-sidebar,.empty-detail{padding:22px;color:#aeb9c3;font-size:13px}.empty-sidebar{border-bottom:1px solid var(--line)}[hidden]{display:none!important}
		@media(max-width:850px){.app-shell{grid-template-columns:52px minmax(220px,34%) minmax(0,1fr)}.workspace{padding:16px}.header-badge{font-size:10px;padding:5px 7px}.dashboard-cards{grid-template-columns:repeat(2,minmax(0,1fr))}.dashboard-card{padding:16px}.dashboard-card strong{font-size:15px}}
		@media(max-width:620px){.topbar{height:auto;min-height:58px;padding:8px}.header-badges{gap:5px;flex-wrap:wrap;justify-content:flex-end}.header-badge:last-child{display:none}.app-shell{height:calc(100vh - 58px);min-height:500px;grid-template-columns:42px minmax(0,1fr)}.rail{grid-row:1;grid-column:1}.sidebar{grid-row:1;grid-column:2}.workspace{grid-row:2;grid-column:1/-1;height:calc(100vh - 280px);min-height:310px;padding:14px}.app-shell.dashboard-active{grid-template-columns:42px minmax(0,1fr)}.app-shell.dashboard-active .sidebar{display:none}.app-shell.dashboard-active .workspace{grid-column:2;height:calc(100vh - 58px)}.charts-grid{grid-template-columns:1fr;gap:12px;margin-top:12px}.dashboard-cards{gap:9px}.dashboard-card{min-height:86px;padding:12px}.dashboard-card strong{font-size:13px}.chart-panel{padding:15px}.timeline-panel{margin-top:12px}.environment-panel{margin-top:12px}.detail-badges{gap:4px}.time-badge{font-size:9px;padding:4px 5px}.attachment{width:calc(50% - 5px);min-height:95px}}
	</style>
</head>
<body>
	<header class="topbar"><div class="brand-mark" aria-hidden="true">&#9638;</div><button class="header-search" id="search-toggle" aria-label="Search tests" title="Search tests">&#9906;</button><span class="topbar-spacer"></span><div class="header-badges"><span class="header-badge">${escapeHtml(REPORT_NAME)}</span><span class="header-badge">${escapeHtml(generatedLabel)}</span></div></header>
	<div class="app-shell" id="app-shell">
		<nav class="rail" aria-label="Report views"><button class="rail-button active" data-view="tests" title="Tests" aria-label="Tests">&#9776;</button><button class="rail-button" data-view="dashboard" title="Dashboard" aria-label="Dashboard">&#9638;</button></nav>
		<aside class="sidebar" id="test-sidebar"><div class="sidebar-heading"><span>Tests (${tests.length})</span><button id="sidebar-search-toggle" aria-label="Search tests" title="Search tests">&#9906;</button></div><div class="search-box" id="search-box"><input type="search" id="test-search" placeholder="Search tests" aria-label="Search tests"></div><div class="test-rows" id="test-rows">${testRows}<div class="empty-sidebar" id="no-matches" hidden>No matching tests</div></div></aside>
		<main class="workspace"><div id="test-view">${testDetails}</div>${renderDashboard(tests, generatedAt)}</main>
	</div>
	<script>
		const appShell=document.querySelector('#app-shell');
		const testView=document.querySelector('#test-view');
		const dashboard=document.querySelector('#dashboard-view');
		const searchBox=document.querySelector('#search-box');
		const searchInput=document.querySelector('#test-search');
		const rows=[...document.querySelectorAll('.test-row')];
		const details=[...document.querySelectorAll('.test-detail')];
		const noMatches=document.querySelector('#no-matches');
		function toggleSearch(){searchBox.classList.toggle('open');if(searchBox.classList.contains('open'))searchInput.focus()}
		document.querySelector('#search-toggle').addEventListener('click',toggleSearch);
		document.querySelector('#sidebar-search-toggle').addEventListener('click',toggleSearch);
		searchInput.addEventListener('input',()=>{const query=searchInput.value.trim().toLowerCase();let visible=0;for(const row of rows){row.hidden=!row.dataset.search.includes(query);if(!row.hidden)visible++}noMatches.hidden=visible>0});
		for(const row of rows)row.addEventListener('click',()=>{for(const item of rows)item.classList.toggle('selected',item===row);for(const detail of details)detail.hidden=detail.dataset.detailIndex!==row.dataset.testIndex;testView.hidden=false;dashboard.hidden=true;appShell.classList.remove('dashboard-active');document.querySelectorAll('.rail-button').forEach(button=>button.classList.toggle('active',button.dataset.view==='tests'))});
		for(const button of document.querySelectorAll('.rail-button'))button.addEventListener('click',()=>{const showDashboard=button.dataset.view==='dashboard';dashboard.hidden=!showDashboard;testView.hidden=showDashboard;appShell.classList.toggle('dashboard-active',showDashboard);document.querySelectorAll('.rail-button').forEach(item=>item.classList.toggle('active',item===button))});
	</script>
</body>
</html>`;
};

export default class ExtentReportManager implements Reporter {
	private readonly outputDirectory = path.resolve(process.cwd(), 'extent-report');
	private readonly assetsDirectory = path.join(this.outputDirectory, 'attachments');
	private readonly tests: ReportTest[] = [];

	async onBegin() {
		await mkdir(this.assetsDirectory, { recursive: true });
	}

	async onTestEnd(test: TestCase, result: TestResult) {
		const index = this.tests.length + 1;
		const attachments: ReportAttachment[] = [];

		for (const [attachmentIndex, attachment] of result.attachments.entries()) {
			const extension = attachment.path
				? path.extname(attachment.path)
				: attachment.contentType.startsWith('image/')
					? `.${attachment.contentType.split('/')[1]}`
					: '';
			const filename = `test-${index}-${attachmentIndex}-${safeFilename(attachment.name)}${extension}`;
			const destination = path.join(this.assetsDirectory, filename);

			try {
				if (attachment.path) await copyFile(attachment.path, destination);
				else if (attachment.body) await writeFile(destination, attachment.body);
				else continue;
			} catch {
				continue;
			}

			attachments.push({
				name: attachment.name,
				contentType: attachment.contentType,
				href: `attachments/${filename}`,
			});
		}

		this.tests.push({
			id: index,
			title: test.title,
			file: path.relative(process.cwd(), test.location.file),
			project: test.parent.project()?.name || 'Default',
			status: visibleStatus(result),
			duration: result.duration,
			retry: result.retry,
			startedAt: result.startTime.toISOString(),
			endedAt: new Date(result.startTime.getTime() + result.duration).toISOString(),
			steps: result.steps.map(mapStep),
			errors: result.errors.map((error) => error.stack || error.message || 'Unknown test error'),
			attachments,
		});
	}

	async onEnd() {
		await mkdir(this.outputDirectory, { recursive: true });
		const reportPath = path.join(this.outputDirectory, 'index.html');
		await writeFile(reportPath, buildHtml(this.tests), 'utf8');
		console.log(`Extent-style report: ${reportPath}`);

		await sendReportEmail(this.tests, reportPath);
	}
}
