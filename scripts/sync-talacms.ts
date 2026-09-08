import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { createTalaCmsClient, type TalaCmsClient } from './talacms/client';
import { fetchCategories, shapeCategories } from './talacms/categories';
import { buildCriticalHotlines } from './talacms/hotlines';
import {
  crossValidate,
  fetchServices,
  shapeServices,
  type RawService,
} from './talacms/services';
import {
  assertNoCrossModelSlugCollisions,
  buildDepartmentsCandidate,
  buildExecutiveCandidate,
  fetchDepartments,
  fetchExecutive,
} from './talacms/directory';
import {
  commitFiles,
  prepare,
  readServiceFileNames,
  readServiceRecords,
  readTaxonomy,
  removeStaleServiceFiles,
  type Candidate,
  type PreparedFile,
} from './talacms/write';
import type { ServiceRecordRef, Taxonomy } from './talacms/categories';

export const DATASETS = [
  'categories',
  'hotlines',
  'services',
  'departments',
  'executive',
] as const;
type DatasetName = (typeof DATASETS)[number];

interface Deps {
  createClient: () => TalaCmsClient;
  prepare: (candidate: Candidate) => Promise<PreparedFile>;
  commitFiles: (files: PreparedFile[]) => Promise<void>;
  readServiceRecords: () => ServiceRecordRef[];
  readServiceFileNames: () => string[];
  readTaxonomy: () => Taxonomy;
  removeStaleServiceFiles: (
    before: string[],
    generated: string[]
  ) => { removed: string[]; failed: string[] };
  log: (message: string) => void;
}

const defaultDeps: Deps = {
  createClient: () => createTalaCmsClient(),
  prepare,
  commitFiles,
  readServiceRecords,
  readServiceFileNames,
  readTaxonomy,
  removeStaleServiceFiles,
  log: message => console.log(message),
};

const USAGE = `Usage: npm run cms:fetch [-- --dry-run] [-- --only=${DATASETS.join('|')}]

Exit codes: 0 success, 1 failure, 3 drift detected (--dry-run only).`;

interface Options {
  dryRun: boolean;
  selected: DatasetName[];
}

function parseArgs(argv: string[]): Options {
  let dryRun = false;
  let selected: DatasetName[] = [...DATASETS];

  for (const arg of argv) {
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg.startsWith('--only=')) {
      const value = arg.slice('--only='.length);
      if (!(DATASETS as readonly string[]).includes(value)) {
        throw new Error(
          `unknown dataset "${value}" — expected one of: ${DATASETS.join(', ')}`
        );
      }
      selected = [value as DatasetName];
      continue;
    }
    throw new Error(`unrecognized argument "${arg}"`);
  }

  return { dryRun, selected };
}

const byCodepoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const toRecordRef = (s: RawService): ServiceRecordRef => ({
  category: { name: s.category.category, slug: s.category.slug },
  subcategory: { name: s.subcategory.name, slug: s.subcategory.slug },
});

/**
 * §6.10, owned here because the orchestrator is the only component that sees
 * every candidate. Two candidates sharing a path would otherwise both be
 * prepared, both reported in the status lines, and written in sequence with
 * the last one silently winning. Exported so the gate can be tested directly:
 * no valid pipeline input can construct a duplicate, which is exactly the
 * point of having it.
 */
export function assertUniquePaths(candidates: Candidate[]): void {
  const seen = new Set<string>();
  for (const candidate of candidates) {
    if (seen.has(candidate.path)) {
      throw new Error(
        `[sync] two candidates would write ${candidate.path}; refusing to write either`
      );
    }
    seen.add(candidate.path);
  }
}

/**
 * The stage pipeline. Stages 1 and 2 are independent and order-free; which of
 * them run, and which sides stage 3 validates against, is the run-mode matrix
 * in §6.0 of the design spec. A gate whose inputs a mode does not have is not
 * applied — no weaker substitute, and never a query for an unselected dataset.
 *
 * Isolation contract: for an unselected dataset nothing is queried from
 * TalaCMS, nothing is prepared, compared, reported or written. Explicitly
 * documented committed cross-validation inputs MAY be read.
 */
async function buildCandidates(
  selected: Set<DatasetName>,
  client: TalaCmsClient,
  deps: Deps
): Promise<Candidate[]> {
  // Stages 1 and 2 — fetch only what this run selected.
  const rawServices = selected.has('services')
    ? await fetchServices(client)
    : null;
  const rawCategories = selected.has('categories')
    ? await fetchCategories(client)
    : null;

  // Stage 3 — one cross-validation, over whichever sides the mode selects,
  // before either candidate is shaped.
  let taxonomy: Taxonomy | null = null;
  if (rawServices || rawCategories) {
    taxonomy = rawCategories
      ? { categories: rawCategories.allServiceCategories }
      : deps.readTaxonomy();
    const records = rawServices
      ? rawServices.allGovernmentServices.map(toRecordRef)
      : deps.readServiceRecords();

    crossValidate({
      taxonomy,
      records,
      // §6.5 needs `position`, which exists only on candidate records.
      ordering: rawServices
        ? rawServices.allGovernmentServices.map(s => ({
            position: s.position,
            categorySlug: s.category.slug,
          }))
        : null,
    });
  }

  // Departments and Executive: two independent fetches, each issued only when
  // its own dataset is selected — see the isolation contract in this
  // function's doc comment. Neither model is ever queried on behalf of the
  // other, not even to discard the result.
  const rawDepartments = selected.has('departments')
    ? await fetchDepartments(client)
    : null;
  const rawExecutive = selected.has('executive')
    ? await fetchExecutive(client)
    : null;

  // Stage 4 — shaping is pure. Candidate order is fixed: categories, hotlines,
  // then services in path-codepoint order, then departments, then executive,
  // so preparation order, the `~ changed / unchanged` status lines and
  // commitFiles' rename order are all reproducible, including under partial
  // failure.
  const candidates: Candidate[] = [];
  if (rawCategories) candidates.push(shapeCategories(rawCategories));
  if (selected.has('hotlines')) {
    candidates.push(await buildCriticalHotlines(client));
  }
  if (rawServices) {
    candidates.push(
      ...shapeServices(
        rawServices,
        taxonomy!.categories.map(c => c.slug)
      ).sort((a, b) => byCodepoint(a.path, b.path))
    );
  }

  const departmentsCandidate = rawDepartments
    ? buildDepartmentsCandidate(rawDepartments)
    : null;
  const executiveCandidate = rawExecutive
    ? buildExecutiveCandidate(rawExecutive)
    : null;

  // §6.0 run-mode matrix: a gate whose inputs a mode does not have is not
  // applied — no weaker substitute, and never a read of another model's
  // committed file. Only a run carrying at least two candidates can compare.
  const directoryCandidates = [departmentsCandidate, executiveCandidate].filter(
    (c): c is Candidate => c !== null
  );
  if (directoryCandidates.length > 1) {
    assertNoCrossModelSlugCollisions(directoryCandidates);
  }

  for (const candidate of directoryCandidates) candidates.push(candidate);

  // Stage 5 — §6.10. This function returns before `run` prepares anything, so
  // the gate is structurally ahead of the first `prepare` call.
  assertUniquePaths(candidates);

  return candidates;
}

/**
 * §6.6/§6.8 replacement: after a successful FULL sync only, delete top-level
 * src/data/services/*.json files that existed before this run but fell out
 * of the freshly generated candidate set (a category retired in TalaCMS).
 * Never runs for an isolated `--only=` mode, which doesn't see the complete
 * generated set and can't safely judge staleness, and never runs before a
 * write has actually succeeded.
 *
 * Returns whether cleanup fully succeeded. A failed deletion is not a soft
 * problem: cms.ts globs every top-level file in src/data/services/, so a
 * stale file left behind after its category was retired from the taxonomy
 * would still be bundled into the build. `run()` treats that as a failed
 * sync, not a successful one with a warning.
 */
function cleanUpStaleServiceFiles(
  deps: Deps,
  beforeServiceFiles: string[],
  candidates: Candidate[]
): boolean {
  const generated = candidates
    .filter(c => c.path.startsWith('src/data/services/'))
    .map(c => c.path.slice('src/data/services/'.length));
  const { removed, failed } = deps.removeStaleServiceFiles(
    beforeServiceFiles,
    generated
  );
  if (removed.length === 0 && failed.length === 0) return true;
  deps.log(
    `\n${removed.length} stale service file(s) removed` +
      (failed.length > 0 ? `, ${failed.length} failed to remove` : '') +
      '.'
  );
  return failed.length === 0;
}

export async function run(
  argv: string[],
  deps: Deps = defaultDeps
): Promise<number> {
  let options: Options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    deps.log(`✖ ${(error as Error).message}\n\n${USAGE}`);
    return 1;
  }

  const isFullSync = options.selected.length === DATASETS.length;

  const prepared: PreparedFile[] = [];
  let candidates: Candidate[];
  let beforeServiceFiles: string[] = [];

  // Fetch and validate everything before any write. A failure here leaves
  // both files exactly as they were.
  try {
    // Created first, and it validates configuration eagerly — no local file is
    // opened until the credentials are known to be usable.
    const client = deps.createClient();
    // Captured only now (config already validated), and before any fetch or
    // write, so a later failure never influences what "before" meant —
    // cleanup only ever compares real prior state against the newly
    // generated set.
    beforeServiceFiles = isFullSync ? deps.readServiceFileNames() : [];
    candidates = await buildCandidates(new Set(options.selected), client, deps);
    for (const candidate of candidates) {
      prepared.push(await deps.prepare(candidate));
    }
  } catch (error) {
    deps.log(`✖ sync failed: ${(error as Error).message}`);
    deps.log('  No files were written.');
    return 1;
  }

  for (const file of prepared) {
    deps.log(`${file.changed ? '~ changed  ' : '  unchanged'} ${file.path}`);
  }

  const changed = prepared.filter(f => f.changed);

  if (options.dryRun) {
    deps.log(
      changed.length > 0
        ? `\n--dry-run: ${changed.length} file(s) would change. Nothing was written.`
        : '\n--dry-run: no changes.'
    );
    return changed.length > 0 ? 3 : 0;
  }

  if (changed.length === 0) {
    deps.log('\nAlready up to date; nothing written.');
    if (isFullSync) {
      const cleanedUp = cleanUpStaleServiceFiles(
        deps,
        beforeServiceFiles,
        candidates
      );
      if (!cleanedUp) {
        deps.log(
          '✖ sync failed: one or more stale service files could not be removed.'
        );
        return 1;
      }
    }
    return 0;
  }

  try {
    await deps.commitFiles(prepared);
  } catch (error) {
    deps.log(`✖ write phase failed: ${(error as Error).message}`);
    deps.log(
      '  Writes are atomic per file, not across files — check `git status` for a mixed snapshot.'
    );
    return 1;
  }

  if (isFullSync) {
    const cleanedUp = cleanUpStaleServiceFiles(
      deps,
      beforeServiceFiles,
      candidates
    );
    if (!cleanedUp) {
      deps.log(
        '✖ sync failed: one or more stale service files could not be removed.'
      );
      return 1;
    }
  }

  deps.log(
    `\nWrote ${changed.length} file(s). Review with \`git diff\` before committing.`
  );
  return 0;
}

// Only runs when executed directly, never when imported by a test.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  run(process.argv.slice(2)).then(code => {
    process.exitCode = code;
  });
}
