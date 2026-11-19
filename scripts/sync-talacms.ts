import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { createTalaCmsClient, type TalaCmsClient } from './talacms/client';
import { fetchCategories, shapeCategories } from './talacms/categories';
import {
  applyServiceCuration,
  curateServiceReferences,
  curateTaxonomy,
  readServiceCuration,
  type ServiceCuration,
} from './talacms/curation';
import { buildCriticalHotlines } from './talacms/hotlines';
import {
  crossValidate,
  fetchServices,
  shapeServices,
  type RawService,
} from './talacms/services';
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

const DATASETS = ['categories', 'hotlines', 'services'] as const;
type DatasetName = (typeof DATASETS)[number];

interface Deps {
  createClient: () => TalaCmsClient;
  prepare: (candidate: Candidate) => Promise<PreparedFile>;
  commitFiles: (files: PreparedFile[]) => Promise<void>;
  readServiceRecords: () => ServiceRecordRef[];
  readServiceFileNames: () => string[];
  readTaxonomy: () => Taxonomy;
  readCuration?: () => ServiceCuration;
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
  readCuration: readServiceCuration,
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
  id: s.sourceId,
  slug: s.slug,
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
  deps: Deps,
  curation?: ServiceCuration
): Promise<Candidate[]> {
  // Stages 1 and 2 — fetch only what this run selected.
  let rawServices = null;
  if (selected.has('services')) {
    deps.log('  → Fetching services...');
    rawServices = await fetchServices(client);
    deps.log(
      `    ✓ Received ${rawServices.allGovernmentServices.length} services`
    );
  }

  let rawCategories = null;
  if (selected.has('categories')) {
    deps.log('  → Fetching service categories...');
    rawCategories = await fetchCategories(client);
    deps.log(
      `    ✓ Received ${rawCategories.allServiceCategories.length} categories`
    );
  }

  // Stage 3 — one cross-validation, over whichever sides the mode selects,
  // before either candidate is shaped.
  let taxonomy: Taxonomy | null = null;
  if (rawServices || rawCategories) {
    const sourceTaxonomy = rawCategories
      ? { categories: rawCategories.allServiceCategories }
      : deps.readTaxonomy();
    taxonomy = curation
      ? curateTaxonomy(sourceTaxonomy, curation)
      : sourceTaxonomy;
    const sourceRecords = rawServices
      ? rawServices.allGovernmentServices.map(toRecordRef)
      : deps.readServiceRecords();
    const records = curation
      ? curateServiceReferences(sourceRecords, taxonomy, curation)
      : sourceRecords;

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

  // Stage 4 — shaping is pure. Candidate order is fixed: categories, hotlines,
  // then services in path-codepoint order, so preparation order, the
  // `~ changed / unchanged` status lines and commitFiles' rename order are all
  // reproducible, including under partial failure.
  const candidates: Candidate[] = [];
  if (rawCategories) {
    const candidate = shapeCategories(rawCategories);
    candidates.push({ ...candidate, data: taxonomy ?? candidate.data });
  }
  if (selected.has('hotlines')) {
    deps.log('  → Fetching critical hotlines...');
    candidates.push(await buildCriticalHotlines(client));
    deps.log('    ✓ Received critical hotlines');
  }
  if (rawServices) {
    candidates.push(
      ...shapeServices(
        rawServices,
        taxonomy!.categories.map(c => c.slug)
      ).sort((a, b) => byCodepoint(a.path, b.path))
    );
  }

  if (curation && taxonomy) {
    const index = candidates.findIndex(
      c => c.path === 'src/data/service_categories.json'
    );
    if (index >= 0) {
      // The category candidate uses the same { categories } shape as Taxonomy.
      candidates[index] = { ...candidates[index], data: taxonomy };
    }
    candidates.splice(
      0,
      candidates.length,
      ...applyServiceCuration(candidates, taxonomy, curation)
    );
  }

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
    const curation = options.selected.some(dataset => dataset !== 'hotlines')
      ? deps.readCuration?.()
      : undefined;
    // Captured only now (config already validated), and before any fetch or
    // write, so a later failure never influences what "before" meant —
    // cleanup only ever compares real prior state against the newly
    // generated set.
    beforeServiceFiles = isFullSync ? deps.readServiceFileNames() : [];
    deps.log(
      `[sync] Selected datasets (${options.selected.length}): ${options.selected.join(', ')}`
    );
    candidates = await buildCandidates(
      new Set(options.selected),
      client,
      deps,
      curation
    );
    deps.log(
      `\n[sync] Preparing and formatting ${candidates.length} candidate file(s)...`
    );
    for (const candidate of candidates) {
      prepared.push(await deps.prepare(candidate));
    }
  } catch (error) {
    deps.log(`✖ sync failed: ${(error as Error).message}`);
    deps.log('  No files were written.');
    return 1;
  }

  deps.log(`\n[sync] File comparison:`);
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
