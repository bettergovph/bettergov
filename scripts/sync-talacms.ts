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
  buildConstitutionalCandidate,
  buildDepartmentsCandidate,
  buildDiplomaticCandidate,
  buildExecutiveCandidate,
  buildLegislativeCandidate,
  fetchConstitutional,
  fetchDepartments,
  fetchDiplomatic,
  fetchExecutive,
  fetchLegislative,
} from './talacms/directory';
import {
  commitFiles,
  prepare,
  readServiceFileNames,
  readServiceRecords,
  readTaxonomy,
  removeStaleServiceFiles,
  removeStaleFiles,
  CommitFilesError,
  type Candidate,
  type PreparedFile,
} from './talacms/write';
import { buildLguCandidates, fetchLgu } from './talacms/lgu';
import type { ServiceRecordRef, Taxonomy } from './talacms/categories';

const LGU_DIR = 'src/data/directory/lgu';
const SERVICES_DIR = 'src/data/services';

export const DATASETS = [
  'categories',
  'hotlines',
  'services',
  'departments',
  'executive',
  'constitutional',
  'legislative',
  'diplomatic',
  'lgu',
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
  readLguFileNames: () => string[];
  removeStaleLguFiles: (
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
  readLguFileNames: () => readServiceFileNames(LGU_DIR),
  removeStaleLguFiles: (before, generated) =>
    removeStaleFiles(LGU_DIR, before, generated),
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

  // Departments, Executive and Constitutional: three independent fetches,
  // each issued only when its own dataset is selected — see the isolation
  // contract in this function's doc comment. No model is ever queried on
  // behalf of another, not even to discard the result.
  let rawDepartments = null;
  if (selected.has('departments')) {
    deps.log('  → Fetching executive departments...');
    rawDepartments = await fetchDepartments(client);
    deps.log(
      `    ✓ Received ${rawDepartments.allGovernmentDepartments.length} departments`
    );
  }

  let rawExecutive = null;
  if (selected.has('executive')) {
    deps.log('  → Fetching executive offices...');
    rawExecutive = await fetchExecutive(client);
    deps.log(
      `    ✓ Received ${rawExecutive.allExecutiveOffices.length} executive offices`
    );
  }

  let rawConstitutional = null;
  if (selected.has('constitutional')) {
    deps.log('  → Fetching constitutional commissions...');
    rawConstitutional = await fetchConstitutional(client);
    deps.log(
      `    ✓ Received ${rawConstitutional.allConstitutionalOffices.length} constitutional offices`
    );
  }

  // Legislative is the fourth independent fetch. Its single operation carries
  // the two member relations, so House Members and Party-list Representatives
  // need no separate query and no separate dataset selector — they are fields
  // of the chamber record in the app's data contract.
  let rawLegislative = null;
  if (selected.has('legislative')) {
    deps.log('  → Fetching legislative chambers and members...');
    rawLegislative = await fetchLegislative(client);
    deps.log(
      `    ✓ Received ${rawLegislative.allLegislativeChambers.length} legislative chambers`
    );
  }

  // Diplomatic is the sixth independent fetch, same isolation contract as the
  // five above: issued only when 'diplomatic' itself is selected, never on
  // behalf of any other dataset. One flat CMS model discriminated by
  // entityType; the shaper groups it into the file's three arrays.
  let rawDiplomatic = null;
  if (selected.has('diplomatic')) {
    deps.log('  → Fetching diplomatic entities...');
    rawDiplomatic = await fetchDiplomatic(client);
    deps.log(
      `    ✓ Received ${rawDiplomatic.allDiplomaticEntities.length} diplomatic entities`
    );
  }

  // LGU is the fifth independent fetch, same isolation contract as the four
  // above: issued only when 'lgu' itself is selected, never on behalf of any
  // other dataset.
  let rawLgu = null;
  if (selected.has('lgu')) {
    deps.log(
      '  → Fetching local government units (regions, provinces, cities, municipalities)...'
    );
    rawLgu = await fetchLgu(client);
    deps.log(`    ✓ Received ${rawLgu.length} LGU regions`);
  }

  // Stage 4 — shaping is pure. Candidate order is fixed: categories, hotlines,
  // then services in path-codepoint order, then departments, executive,
  // constitutional, legislative, diplomatic, then the 19 LGU region files
  // (themselves already path-codepoint-sorted by buildLguCandidates), so
  // preparation order, the status lines and commitFiles' rename order are all
  // reproducible, including under partial failure.
  const candidates: Candidate[] = [];
  if (rawCategories) candidates.push(shapeCategories(rawCategories));
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

  const departmentsCandidate = rawDepartments
    ? buildDepartmentsCandidate(rawDepartments)
    : null;
  const executiveCandidate = rawExecutive
    ? buildExecutiveCandidate(rawExecutive)
    : null;
  const constitutionalCandidate = rawConstitutional
    ? buildConstitutionalCandidate(rawConstitutional)
    : null;
  const legislativeCandidate = rawLegislative
    ? buildLegislativeCandidate(rawLegislative)
    : null;
  const diplomaticCandidate = rawDiplomatic
    ? buildDiplomaticCandidate(rawDiplomatic)
    : null;

  // §6.0 run-mode matrix: a gate whose inputs a mode does not have is not
  // applied — no weaker substitute, and never a read of another model's
  // committed file. Only a run carrying at least two candidates can compare.
  //
  // Diplomatic IS included, even though its `data` is an object of three
  // arrays rather than a flat array: `candidateSlugs` extracts slugs
  // shape-aware, so the grouped candidate is checked rather than throwing.
  // Its 70 mission slugs share the aggregate directory with the other models;
  // its 157 slugless consulates and organizations contribute nothing.
  //
  // LGU is still deliberately NOT included: it is not indexed by Meilisearch
  // at all, so there is no index for its slugs to collide in. This is a
  // scoping decision, no longer a shape limitation.
  const directoryCandidates = [
    departmentsCandidate,
    executiveCandidate,
    constitutionalCandidate,
    legislativeCandidate,
    diplomaticCandidate,
  ].filter((c): c is Candidate => c !== null);
  if (directoryCandidates.length > 1) {
    assertNoCrossModelSlugCollisions(directoryCandidates);
  }

  for (const candidate of directoryCandidates) candidates.push(candidate);
  if (rawLgu) candidates.push(...buildLguCandidates(rawLgu));

  // Stage 5 — §6.10. This function returns before `run` prepares anything, so
  // the gate is structurally ahead of the first `prepare` call.
  assertUniquePaths(candidates);

  return candidates;
}

/**
 * The Service file names `candidates` will write, derived the same way both
 * `cleanUpStaleServiceFiles` (for real deletion) and the dry-run drift
 * report (for detection only) need it — a single source so the two never
 * drift apart on what "generated" means. Mirrors `lguGeneratedFileNames`.
 */
function serviceGeneratedFileNames(candidates: Candidate[]): string[] {
  const prefix = `${SERVICES_DIR}/`;
  return candidates
    .filter(c => c.path.startsWith(prefix))
    .map(c => c.path.slice(prefix.length));
}

/**
 * Pure: which of `beforeServiceFiles` are NOT in this run's generated set —
 * i.e. what `cleanUpStaleServiceFiles` would remove, without removing
 * anything. Used to report stale-file drift under `--dry-run`, which must
 * write and delete nothing. Mirrors `staleLguFileNames`; like real cleanup,
 * only meaningful on a full sync (see `cleanUpStaleServiceFiles`), so
 * callers gate this on `isFullSync` the same way.
 */
function staleServiceFileNames(
  beforeServiceFiles: string[],
  candidates: Candidate[]
): string[] {
  const generated = new Set(serviceGeneratedFileNames(candidates));
  return beforeServiceFiles
    .filter(f => !generated.has(f))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
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
  const generated = serviceGeneratedFileNames(candidates);
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

/**
 * The LGU region file names `lguCandidates` will write, derived the same way
 * both `cleanUpStaleLguFiles` (for real deletion) and the dry-run drift
 * report (for detection only) need it — a single source so the two never
 * drift apart on what "generated" means.
 */
function lguGeneratedFileNames(candidates: Candidate[]): string[] {
  const prefix = `${LGU_DIR}/`;
  return candidates
    .filter(c => c.path.startsWith(prefix))
    .map(c => c.path.slice(prefix.length));
}

/**
 * Pure: which of `beforeLguFiles` are NOT in this run's generated set —
 * i.e. what `cleanUpStaleLguFiles` would remove, without removing anything.
 * Used to report stale-file drift under `--dry-run`, which must write and
 * delete nothing.
 */
function staleLguFileNames(
  beforeLguFiles: string[],
  candidates: Candidate[]
): string[] {
  const generated = new Set(lguGeneratedFileNames(candidates));
  return beforeLguFiles
    .filter(f => !generated.has(f))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * LGU's equivalent of `cleanUpStaleServiceFiles`, with one deliberate
 * difference: it runs whenever `lgu` is selected, not only on a full sync.
 * Unlike services (whose completeness depends on cross-validating against
 * categories), `fetchLgu` always fetches all four LGU collections in one
 * shot and `buildLguCandidates` always emits one candidate per CMS region
 * that exists right now — `--only=lgu` sees LGU's complete generated set
 * exactly as a full sync would, so the "only after seeing the complete
 * picture" rule is satisfied by selection alone, not by requiring every
 * other dataset too. Otherwise unchanged: only after a write phase has
 * already succeeded (or been found unnecessary), and a failed deletion
 * fails the whole sync — cms.ts globs every top-level file in
 * src/data/directory/lgu/, so a stale region file left behind after it's
 * retired from TalaCMS would still be bundled into the build.
 */
function cleanUpStaleLguFiles(
  deps: Deps,
  beforeLguFiles: string[],
  candidates: Candidate[]
): boolean {
  const generated = lguGeneratedFileNames(candidates);
  const { removed, failed } = deps.removeStaleLguFiles(
    beforeLguFiles,
    generated
  );
  if (removed.length === 0 && failed.length === 0) return true;
  deps.log(
    `\n${removed.length} stale LGU file(s) removed` +
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
  const selectedSet = new Set(options.selected);

  const prepared: PreparedFile[] = [];
  let candidates: Candidate[];
  let beforeServiceFiles: string[] = [];
  let beforeLguFiles: string[] = [];

  // Fetch and validate everything before any write. A failure here leaves
  // both files exactly as they were.
  try {
    // Created first, and it validates configuration eagerly — no local file is
    // opened until the credentials are known to be usable.
    const client = deps.createClient();
    // Captured only now (config already validated), and before any fetch or
    // write, so a later failure never influences what "before" meant —
    // cleanup only ever compares real prior state against the newly
    // generated set. LGU's "before" is captured whenever `lgu` is selected
    // at all (not only on a full sync) — see cleanUpStaleLguFiles's doc
    // comment for why `--only=lgu` alone already has complete visibility.
    beforeServiceFiles = isFullSync ? deps.readServiceFileNames() : [];
    beforeLguFiles = selectedSet.has('lgu') ? deps.readLguFileNames() : [];
    deps.log(
      `[sync] Selected datasets (${options.selected.length}): ${options.selected.join(', ')}`
    );
    candidates = await buildCandidates(new Set(options.selected), client, deps);
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
    // A stale file is drift too: it exists on disk (or would after a real
    // sync elsewhere) but wasn't produced by this run, and a real (non-dry)
    // run would remove it. Report it without removing anything — dry-run
    // must write and delete nothing. Services mirrors LGU here: gated on
    // `isFullSync` for the same reason `cleanUpStaleServiceFiles` is —
    // an isolated `--only=` run doesn't see the complete generated set and
    // can't safely judge staleness.
    const staleServices = isFullSync
      ? staleServiceFileNames(beforeServiceFiles, candidates)
      : [];
    for (const f of staleServices) {
      deps.log(`~ stale     ${SERVICES_DIR}/${f} (would be removed)`);
    }
    const staleLgu = selectedSet.has('lgu')
      ? staleLguFileNames(beforeLguFiles, candidates)
      : [];
    for (const f of staleLgu) {
      deps.log(`~ stale     ${LGU_DIR}/${f} (would be removed)`);
    }
    const totalDrift = changed.length + staleServices.length + staleLgu.length;
    deps.log(
      totalDrift > 0
        ? `\n--dry-run: ${totalDrift} file(s) would change. Nothing was written.`
        : '\n--dry-run: no changes.'
    );
    return totalDrift > 0 ? 3 : 0;
  }

  if (changed.length === 0) {
    deps.log('\nAlready up to date; nothing written.');
    if (isFullSync) {
      const servicesCleanedUp = cleanUpStaleServiceFiles(
        deps,
        beforeServiceFiles,
        candidates
      );
      if (!servicesCleanedUp) {
        deps.log(
          '✖ sync failed: one or more stale service files could not be removed.'
        );
        return 1;
      }
    }
    if (selectedSet.has('lgu')) {
      const lguCleanedUp = cleanUpStaleLguFiles(
        deps,
        beforeLguFiles,
        candidates
      );
      if (!lguCleanedUp) {
        deps.log(
          '✖ sync failed: one or more stale LGU files could not be removed.'
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
    // Only claim a clean rollback when commitFiles has actually confirmed
    // one — never assert it from a generic catch.
    if (error instanceof CommitFilesError && error.rollbackComplete) {
      deps.log('  No file was left mixed old/new; re-run the sync when ready.');
    } else if (error instanceof CommitFilesError) {
      deps.log(
        '  ROLLBACK WAS INCOMPLETE — the path(s) named above may hold new, ' +
          'unreviewed content from this failed batch and must be inspected ' +
          'and resolved manually before re-running the sync.'
      );
    } else {
      // commitFiles is expected to always throw CommitFilesError on a write
      // failure; anything else (e.g. a test double, or a bug) means
      // rollback status was never confirmed.
      deps.log(
        '  Rollback status could not be confirmed — inspect the generated ' +
          'files directly before re-running.'
      );
    }
    return 1;
  }

  if (isFullSync) {
    const servicesCleanedUp = cleanUpStaleServiceFiles(
      deps,
      beforeServiceFiles,
      candidates
    );
    if (!servicesCleanedUp) {
      deps.log(
        '✖ sync failed: one or more stale service files could not be removed.'
      );
      return 1;
    }
  }
  if (selectedSet.has('lgu')) {
    const lguCleanedUp = cleanUpStaleLguFiles(deps, beforeLguFiles, candidates);
    if (!lguCleanedUp) {
      deps.log(
        '✖ sync failed: one or more stale LGU files could not be removed.'
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
