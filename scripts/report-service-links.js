import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HARD_STATUS_CODES = new Set([404, 410]);
const ACCESS_STATUS_CODES = new Set([401, 403, 429]);
const DNS_ERROR_PATTERN =
  /dns error|failed to lookup address|name or service not known|no records found|nodename nor servname/i;
const AUTOMATION_LIMIT_PATTERN =
  /certificate|\btls\b|\bssl\b|handshake|connection (?:reset|aborted)|invalid http response|incomplete message|timed? out|timeout/i;

function flattenResultMap(resultMap = {}) {
  return Object.entries(resultMap).flatMap(([source, results]) =>
    results.map(result => ({ ...result, source }))
  );
}

function locationKey(source, url) {
  return `${source}\0${url}`;
}

export function classifyResults(results) {
  const errors = flattenResultMap(results.error_map);
  const timeouts = flattenResultMap(results.timeout_map);
  const successes = flattenResultMap(results.success_map);
  const locations = new Map(
    [...successes, ...errors, ...timeouts].map(result => [
      locationKey(result.source, result.url),
      result.span,
    ])
  );

  const hardFailures = errors.filter(result => {
    const code = result.status?.code;
    const description = `${result.status?.text ?? ''} ${result.status?.details ?? ''}`;
    return HARD_STATUS_CODES.has(code) || DNS_ERROR_PATTERN.test(description);
  });
  const remainingErrors = errors.filter(
    result => !hardFailures.includes(result)
  );
  const automationWarnings = [
    ...remainingErrors.filter(result => {
      const description = `${result.status?.text ?? ''} ${result.status?.details ?? ''}`;
      return (
        ACCESS_STATUS_CODES.has(result.status?.code) ||
        AUTOMATION_LIMIT_PATTERN.test(description)
      );
    }),
    ...timeouts,
  ];
  const manualReview = remainingErrors.filter(
    result => !automationWarnings.includes(result)
  );
  const redirectWarnings = Object.entries(results.redirect_map ?? {}).flatMap(
    ([source, redirects]) =>
      redirects.map(redirect => ({
        ...redirect,
        source,
        span: locations.get(locationKey(source, redirect.origin)),
      }))
  );

  return {
    summary: {
      total: results.total ?? 0,
      unique: results.unique ?? 0,
      successful: results.successful ?? 0,
    },
    hardFailures,
    manualReview,
    automationWarnings,
    redirectWarnings,
  };
}

function formatLocation(result) {
  const line = result.span?.line;
  const label = line ? `${result.source}:${line}` : result.source;
  const repository = process.env.GITHUB_REPOSITORY;
  const revision = process.env.GITHUB_SHA;

  if (!repository || !revision) {
    return `\`${label}\``;
  }

  const serverUrl = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
  const lineAnchor = line ? `#L${line}` : '';
  return `[${label}](${serverUrl}/${repository}/blob/${revision}/${result.source}${lineAnchor})`;
}

function formatResult(result, checkbox = false) {
  const marker = checkbox ? '- [ ]' : '-';
  const status =
    result.status?.text ?? result.status?.details ?? 'Unknown error';
  return `${marker} <${result.url}> | ${status} | ${formatLocation(result)}`;
}

function formatRedirect(result) {
  const chain = result.redirects
    .map(redirect => `[${redirect.code}] <${redirect.url}>`)
    .join(' -> ');
  return `- <${result.origin}> -> ${chain} | ${formatLocation(result)}`;
}

function formatSection(title, description, entries, formatter) {
  const lines = [`## ${title}`, '', description, ''];
  if (entries.length === 0) {
    lines.push('None.');
  } else {
    lines.push(...entries.map(formatter));
  }
  return lines.join('\n');
}

export function createReport(classification) {
  const {
    summary,
    hardFailures,
    manualReview,
    automationWarnings,
    redirectWarnings,
  } = classification;
  const informationalCount =
    automationWarnings.length + redirectWarnings.length;

  return [
    '# Service Link Check',
    '',
    '| Result | Count |',
    '| --- | ---: |',
    `| Total links | ${summary.total} |`,
    `| Unique links | ${summary.unique} |`,
    `| Successful checks | ${summary.successful} |`,
    `| Hard failures | ${hardFailures.length} |`,
    `| Needs manual review | ${manualReview.length} |`,
    `| Informational observations | ${informationalCount} |`,
    '',
    formatSection(
      `Hard Failures (${hardFailures.length})`,
      'These responses strongly indicate dead links and fail the workflow.',
      hardFailures,
      result => formatResult(result, true)
    ),
    '',
    formatSection(
      `Needs Manual Review (${manualReview.length})`,
      'These failures are inconclusive but may indicate broken links. They open an issue without failing the workflow.',
      manualReview,
      result => formatResult(result, true)
    ),
    '',
    formatSection(
      `Automation-Limited Observations (${automationWarnings.length})`,
      'Access restrictions, TLS compatibility errors, timeouts, connection resets, and malformed responses are informational and require no immediate action.',
      automationWarnings,
      result => formatResult(result)
    ),
    '',
    formatSection(
      `Redirects (${redirectWarnings.length})`,
      'Redirect destinations are recorded for reference and require no immediate action.',
      redirectWarnings,
      result => formatRedirect(result)
    ),
    '',
    'Hard failures fail the workflow. Manual-review items open an issue without failing it. Informational observations require no immediate action.',
    '',
  ].join('\n');
}

function main() {
  const [, , inputPath, outputPath] = process.argv;
  const input = !inputPath || inputPath === '-' ? 0 : inputPath;
  const results = JSON.parse(fs.readFileSync(input, 'utf8'));
  const classification = classifyResults(results);
  const report = createReport(classification);

  if (outputPath && outputPath !== '-') {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, report);
  }
  process.stdout.write(report);

  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `hard_failure_count=${classification.hardFailures.length}\nmanual_review_count=${classification.manualReview.length}\n`
    );
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
  }

  if (classification.hardFailures.length > 0) {
    process.exitCode = 2;
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  main();
}
