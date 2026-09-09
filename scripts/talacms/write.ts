import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { Ajv } from 'ajv';
import * as prettier from 'prettier';
import type { Candidate, ServiceRecordRef, Taxonomy } from './categories';

export type { Candidate, Taxonomy } from './categories';

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

/**
 * The on-disk service file set, in codepoint order. `dir` defaults to the
 * real services directory; tests pass a temporary one so this never depends
 * on generated, gitignored data being present in the checkout.
 */
export function readServiceFileNames(dir: string = SERVICES_DIR): string[] {
  return fs
    .readdirSync(abs(dir))
    .filter(f => f.endsWith('.json'))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * Every previously-generated service record's category/subcategory pair AND
 * display names. Under `--only=categories` this is the name-agreement
 * counterparty, so the names are not optional.
 *
 * `src/data/services/*.json` is generated build output, not committed — an
 * empty result here is ambiguous between "this checkout was never synced (or
 * left with a corrupted/partial snapshot)" and "TalaCMS genuinely has zero
 * services", and silently treating it as the latter would let
 * `--only=categories` pass a rename it exists to catch. At least one
 * taxonomy category always exists (fetchCategories fails closed on zero),
 * and a full sync's shapeServices always writes one file per taxonomy
 * category with at least one record somewhere across the set (the CMS
 * services query itself fails closed on zero results), so any successful
 * prior full sync leaves at least one file AND at least one record here.
 * Both zero files and zero aggregate records — the latter reachable from
 * one or more files that individually parse but each contain `[]` — fail
 * the same way.
 */
export function readServiceRecords(
  dir: string = SERVICES_DIR
): ServiceRecordRef[] {
  const names = readServiceFileNames(dir);
  if (names.length === 0) {
    servicesFail(
      `no generated service files found under ${dir} — run a full sync first; ` +
        '--only=categories needs previously generated Services data to validate against.'
    );
  }
  const target = abs(dir);
  const records = names.flatMap(file => {
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(path.join(target, file), 'utf8'));
    } catch {
      servicesFail(`generated ${dir}/${file} is not valid JSON`);
    }
    return parseServiceRecordsFile(file, raw);
  });
  if (records.length === 0) {
    servicesFail(
      `generated service files under ${dir} contain zero records combined ` +
        '— run a full sync first; --only=categories needs previously generated ' +
        'Services data to validate against.'
    );
  }
  return records;
}

/**
 * Schema-equivalence with src/data/schema/service_categories.schema.json,
 * reproduced field by field. `.strict()` matters specifically: a stray key in
 * the committed file would otherwise be tolerated here while `prepare()`
 * rejects the generated file for the same thing — an asymmetry that would be
 * confusing to debug.
 */
const CommittedTaxonomySchema = z
  .object({
    categories: z
      .array(
        z
          .object({
            category: z.string().min(1),
            slug: z.string().regex(SERVICES_SLUG_PATTERN),
            subcategories: z
              .array(
                z
                  .object({
                    name: z.string().min(1),
                    slug: z.string().regex(SERVICES_SLUG_PATTERN),
                  })
                  .strict()
              )
              .min(1),
          })
          .strict()
      )
      .min(1),
  })
  .strict();

/**
 * Schema-equivalence plus the two uniqueness rules JSON Schema cannot express.
 * Subcategory slugs are unique WITHIN a parent, never globally — they
 * legitimately repeat across parents.
 */
export function parseTaxonomy(value: unknown): Taxonomy {
  const parsed = CommittedTaxonomySchema.safeParse(value);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map(i => `${i.path.join('.') || '/'} ${i.message}`)
      .join('; ');
    servicesFail(
      `committed src/data/service_categories.json is malformed: ${detail}`
    );
  }

  const seenCategories = new Set<string>();
  for (const c of parsed.data!.categories) {
    if (seenCategories.has(c.slug)) {
      servicesFail(
        `committed taxonomy has a duplicate category slug "${c.slug}"`
      );
    }
    seenCategories.add(c.slug);
    if (c.category.trim() === '') {
      servicesFail(
        `committed taxonomy category "${c.slug}" has a blank display name`
      );
    }
    const seenSubs = new Set<string>();
    for (const s of c.subcategories) {
      if (seenSubs.has(s.slug)) {
        servicesFail(
          `committed taxonomy has a duplicate subcategory slug "${s.slug}" under "${c.slug}"`
        );
      }
      seenSubs.add(s.slug);
      if (s.name.trim() === '') {
        servicesFail(
          `committed taxonomy subcategory "${c.slug}/${s.slug}" has a blank display name`
        );
      }
    }
  }

  return parsed.data!;
}

/**
 * Reads and JSON-parses a committed file, converting a missing file or
 * invalid JSON into a prefixed, fail-closed error instead of letting a raw
 * `SyntaxError`/`ENOENT` escape. Exported so the failure path is testable
 * without corrupting the real committed taxonomy file.
 */
export function readJsonOrFail(relPath: string): unknown {
  try {
    return readJson(relPath);
  } catch {
    servicesFail(`committed ${relPath} is not valid JSON`);
  }
}

/** The committed taxonomy, validated before any consumer builds a map from it. */
export function readTaxonomy(): Taxonomy {
  return parseTaxonomy(readJsonOrFail('src/data/service_categories.json'));
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

/**
 * Deletes top-level `{dir}/*.json` files that existed before this
 * run but are not part of the newly generated candidate set — e.g. when a
 * category/region is retired in a CMS. Never touches any `{dir}/schema/**` or
 * other subdirectories: `before` and `generated` both come from the same
 * file-listing logic, which only ever lists top-level `.json` files, so
 * subdirectories (not `.json` files) can never appear in either list.
 *
 * Callers MUST only invoke this after the corresponding commit operation
 * has already succeeded for a full sync — never before validation, never on
 * any failure path, and never for an isolated partial run that does not see
 * the complete picture needed to know what's genuinely stale.
 *
 * Deletion is best-effort and per-file: one failure doesn't stop the rest,
 * and doesn't undo the (already-committed) write phase, whose atomicity
 * guarantees are unaffected. Every attempt — success or failure — is logged,
 * so a partial cleanup is always visible rather than silently incomplete.
 */
export function removeStaleFiles(
  dir: string,
  before: string[],
  generated: string[],
  io: {
    unlink?: (target: string) => void;
    log?: (message: string) => void;
  } = {}
): { removed: string[]; failed: string[] } {
  const unlink = io.unlink ?? ((target: string) => fs.unlinkSync(target));
  const log = io.log ?? (message => console.log(message));
  const generatedSet = new Set(generated);
  const stale = before
    .filter(f => !generatedSet.has(f))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

  const removed: string[] = [];
  const failed: string[] = [];
  for (const file of stale) {
    const relPath = `${dir}/${file}`;
    try {
      unlink(abs(relPath));
      removed.push(file);
      log(`  removed stale ${relPath}`);
    } catch (error) {
      failed.push(file);
      log(`  ✖ failed to remove stale ${relPath}: ${(error as Error).message}`);
    }
  }
  return { removed, failed };
}

/**
 * Convenience wrapper for `removeStaleFiles` that defaults `dir` to the
 * services directory. See `removeStaleFiles` for behavior and guarantees.
 */
export function removeStaleServiceFiles(
  before: string[],
  generated: string[],
  io: {
    dir?: string;
    unlink?: (target: string) => void;
    log?: (message: string) => void;
  } = {}
): { removed: string[]; failed: string[] } {
  return removeStaleFiles(io.dir ?? SERVICES_DIR, before, generated, io);
}
