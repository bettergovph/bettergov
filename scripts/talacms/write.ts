import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { Ajv } from 'ajv';
import * as prettier from 'prettier';
import type { Candidate, ServiceRecordRef } from './categories';

export type { Candidate } from './categories';

export interface PreparedFile {
  path: string;
  text: string;
  changed: boolean;
}

const REPO_ROOT = process.cwd();
const SERVICES_DIR = 'src/data/services';

const abs = (relOrAbs: string) =>
  path.isAbsolute(relOrAbs) ? relOrAbs : path.join(REPO_ROOT, relOrAbs);

export function readJson(relPath: string): unknown {
  return JSON.parse(fs.readFileSync(abs(relPath), 'utf8'));
}

const SERVICES_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const servicesFail = (message: string): never => {
  throw new Error(`[sync:services] ${message}`);
};

/**
 * Only the fields the cross-validator needs. Deliberately NOT `.strict()` —
 * a committed record carries ten fields and all of them are legitimate.
 */
const CommittedRecordSchema = z.object({
  category: z.object({
    name: z.string().min(1),
    slug: z.string().regex(SERVICES_SLUG_PATTERN),
  }),
  subcategory: z.object({
    name: z.string().min(1),
    slug: z.string().regex(SERVICES_SLUG_PATTERN),
  }),
});

/**
 * Pure so the malformed-input cases can be exercised without a filesystem.
 * A malformed committed file must fail with a prefixed, fail-closed error
 * rather than an incidental TypeError deep inside map construction.
 */
export function parseServiceRecordsFile(
  fileName: string,
  value: unknown
): ServiceRecordRef[] {
  const parsed = z.array(CommittedRecordSchema).safeParse(value);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map(i => `${i.path.join('.') || '/'} ${i.message}`)
      .join('; ');
    servicesFail(
      `committed ${SERVICES_DIR}/${fileName} is malformed: ${detail}`
    );
  }
  return parsed.data!.map(r => ({
    category: { name: r.category.name, slug: r.category.slug },
    subcategory: { name: r.subcategory.name, slug: r.subcategory.slug },
  }));
}

/** The on-disk service file set, in codepoint order. */
export function readServiceFileNames(): string[] {
  return fs
    .readdirSync(abs(SERVICES_DIR))
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Every committed service record's category/subcategory pair AND display
 * names. Under `--only=categories` the committed records are the
 * name-agreement counterparty, so the names are not optional.
 */
export function readServiceRecords(): ServiceRecordRef[] {
  const dir = abs(SERVICES_DIR);
  return readServiceFileNames().flatMap(file => {
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    } catch {
      servicesFail(`committed ${SERVICES_DIR}/${file} is not valid JSON`);
    }
    return parseServiceRecordsFile(file, raw);
  });
}

const ajv = new Ajv({ allErrors: true, strict: false });

function validateAgainstSchema(candidate: Candidate): void {
  const schema = readJson(candidate.schemaPath) as { $id?: string };
  // Re-`compile`ing a schema with the same `$id` throws on the second call
  // (e.g. two candidates in one run, or a test preparing the same file
  // twice) — reuse the already-compiled validator for that id instead.
  const validate =
    (schema.$id && ajv.getSchema(schema.$id)) || ajv.compile(schema);
  if (!validate(candidate.data)) {
    const detail = (validate.errors ?? [])
      .map(e => `${e.instancePath || '/'} ${e.message}`)
      .join('; ');
    throw new Error(
      `[sync] generated ${candidate.path} does not satisfy ${candidate.schemaPath}: ${detail}`
    );
  }
}

/**
 * Canonicalizes with the repository's own Prettier config, seeded from a
 * 2-space-indented `JSON.stringify`. Prettier's JSON printer doesn't
 * re-derive line breaks from scratch — it keeps a short array inline (so
 * `"numbers": ["911"]` stays on one line) but preserves an already-expanded
 * object's line breaks (so each subcategory entry stays multi-line, matching
 * the committed files). A flat, unindented `JSON.stringify(data)` would lose
 * that object expansion and never converge with the committed formatting.
 */
async function canonicalize(data: unknown, filePath: string): Promise<string> {
  const config = await prettier.resolveConfig(abs(filePath));
  return prettier.format(JSON.stringify(data, null, 2), {
    ...config,
    parser: 'json',
    filepath: abs(filePath),
  });
}

export async function prepare(candidate: Candidate): Promise<PreparedFile> {
  validateAgainstSchema(candidate);
  const text = await canonicalize(candidate.data, candidate.path);
  const current = fs.existsSync(abs(candidate.path))
    ? fs.readFileSync(abs(candidate.path), 'utf8')
    : null;
  return { path: candidate.path, text, changed: text !== current };
}

/**
 * Writes each changed file via a uniquely-named temp file in the same
 * directory, then renames it into place.
 *
 * `rename` is atomic per file. It is NOT a transaction across files: if a
 * later rename fails or the process dies mid-phase, the result is a mixed
 * snapshot — one file new, one old. That is visible and recoverable in
 * `git status` / `git checkout`, and is asserted by a test rather than
 * papered over. Every validation failure happens before this function runs.
 *
 * `io` exists only so tests can inject failing write/rename operations.
 */
export interface WriteIo {
  write?: (target: string, text: string) => void;
  rename?: (from: string, to: string) => void;
}

export async function commitFiles(
  files: PreparedFile[],
  io: WriteIo = {}
): Promise<void> {
  const write =
    io.write ?? ((target, text) => fs.writeFileSync(target, text, 'utf8'));
  const rename = io.rename ?? fs.renameSync;
  const changed = files.filter(f => f.changed);
  const temps: string[] = [];

  try {
    for (const file of changed) {
      const target = abs(file.path);
      const temp = path.join(
        path.dirname(target),
        `.${path.basename(target)}.${process.pid}.${Math.random()
          .toString(36)
          .slice(2)}.tmp`
      );
      // Registered BEFORE the write: a write that throws partway (ENOSPC,
      // permissions) still leaves a file behind, and an unregistered path
      // cannot be cleaned up by the `finally` below.
      temps.push(temp);
      write(temp, file.text);
    }

    for (let i = 0; i < changed.length; i += 1) {
      rename(temps[i], abs(changed[i].path));
      temps[i] = '';
    }
  } finally {
    for (const temp of temps) {
      if (temp && fs.existsSync(temp)) fs.rmSync(temp, { force: true });
    }
  }
}
