import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { classifyResults, createReport } from './report-service-links.js';

const source = 'src/data/services/example.json';

function result(url, status, line) {
  return { url, status, span: { line, column: 13 } };
}

test('classifies only strong dead-link signals as hard failures', () => {
  const classification = classifyResults({
    total: 12,
    unique: 12,
    successful: 1,
    success_map: {
      [source]: [
        result(
          'https://example.com/redirect',
          { code: 200, text: '200 OK' },
          1
        ),
      ],
    },
    error_map: {
      [source]: [
        result(
          'https://example.com/missing',
          { code: 404, text: '404 Not Found' },
          2
        ),
        result('https://example.com/gone', { code: 410, text: '410 Gone' }, 3),
        result(
          'https://missing.invalid',
          { text: 'DNS error: no records found' },
          4
        ),
        result(
          'https://example.com/blocked',
          { code: 403, text: '403 Forbidden' },
          5
        ),
        result(
          'https://example.com/error',
          { code: 500, text: '500 Server Error' },
          6
        ),
        result(
          'https://example.com/tls',
          { text: 'SSL certificate not trusted' },
          7
        ),
        result(
          'https://example.com/reset',
          { text: 'Network error: Connection reset by peer' },
          8
        ),
        result(
          'https://example.com/malformed',
          { text: 'Invalid HTTP response format' },
          9
        ),
        result(
          'https://example.com/handshake',
          { text: 'Network error: received fatal alert: HandshakeFailure' },
          10
        ),
        result(
          'https://example.com/unreachable',
          {
            text: 'Connection failed. Check network connectivity and firewall settings',
          },
          11
        ),
      ],
    },
    timeout_map: {
      [source]: [result('https://example.com/slow', { text: 'Timeout' }, 12)],
    },
    redirect_map: {
      [source]: [
        {
          origin: 'https://example.com/redirect',
          redirects: [{ url: 'https://example.com/final', code: 301 }],
        },
      ],
    },
  });

  assert.equal(classification.hardFailures.length, 3);
  assert.equal(classification.manualReview.length, 2);
  assert.equal(classification.automationWarnings.length, 6);
  assert.equal(classification.redirectWarnings.length, 1);
  assert.equal(classification.redirectWarnings[0].span.line, 1);
  assert.ok(
    classification.manualReview.some(
      item => item.url === 'https://example.com/unreachable'
    )
  );
  assert.ok(
    classification.automationWarnings.some(
      item => item.url === 'https://example.com/blocked'
    )
  );
});

test('creates a report with separate action and informational sections', () => {
  const report = createReport(
    classifyResults({
      total: 3,
      unique: 3,
      successful: 0,
      error_map: {
        [source]: [
          result(
            'https://example.com/missing',
            { code: 404, text: '404 Not Found' },
            2
          ),
          result(
            'https://example.com/blocked',
            { code: 403, text: '403 Forbidden' },
            3
          ),
          result(
            'https://example.com/unreachable',
            { text: 'Connection failed' },
            4
          ),
        ],
      },
    })
  );

  assert.match(report, /Hard Failures \(1\)/);
  assert.match(report, /Needs Manual Review \(1\)/);
  assert.match(report, /Automation-Limited Observations \(1\)/);
  assert.match(
    report,
    /Manual-review items open an issue without failing it\./
  );
});

test('reads Lychee JSON from stdin and writes the report to stdout', () => {
  const scriptPath = fileURLToPath(
    new URL('./report-service-links.js', import.meta.url)
  );
  const run = spawnSync(process.execPath, [scriptPath], {
    encoding: 'utf8',
    input: JSON.stringify({
      total: 1,
      unique: 1,
      successful: 0,
      error_map: {
        [source]: [
          result(
            'https://example.com/blocked',
            { code: 403, text: '403 Forbidden' },
            1
          ),
        ],
      },
    }),
  });

  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /Automation-Limited Observations \(1\)/);
});
