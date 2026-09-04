import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { createTalaCmsClient, type TalaCmsClient } from './talacms/client';
import { buildCategories } from './talacms/categories';
import { buildCriticalHotlines } from './talacms/hotlines';
import {
  commitFiles,
  prepare,
  readJson,
  readServiceRecords,
  type Candidate,
  type PreparedFile,
} from './talacms/write';
import type { ServiceRecordRef } from './talacms/categories';

const DATASETS = ['categories', 'hotlines'] as const;
type DatasetName = (typeof DATASETS)[number];

interface Deps {
  createClient: () => TalaCmsClient;
  prepare: (candidate: Candidate) => Promise<PreparedFile>;
  commitFiles: (files: PreparedFile[]) => Promise<void>;
  readJson: (relPath: string) => unknown;
  readServiceRecords: () => ServiceRecordRef[];
  log: (message: string) => void;
}

const defaultDeps: Deps = {
  createClient: () => createTalaCmsClient(),
  prepare,
  commitFiles,
  readJson,
  readServiceRecords,
  log: message => console.log(message),
};

const USAGE = `Usage: npm run cms:fetch [-- --dry-run] [-- --only=categories|hotlines]

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

/**
 * Every phase operates on the selected set alone: an unselected dataset is
 * never queried and its file is never opened.
 */
async function buildCandidate(
  dataset: DatasetName,
  client: TalaCmsClient,
  deps: Deps
): Promise<Candidate> {
  if (dataset === 'categories') {
    return buildCategories(client, deps.readServiceRecords());
  }
  return buildCriticalHotlines(
    client,
    deps.readJson('src/data/philippines_hotlines.json')
  );
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

  const prepared: PreparedFile[] = [];

  // Fetch and validate everything before any write. A failure here leaves
  // both files exactly as they were.
  try {
    // Created first, and it validates configuration eagerly — no local file is
    // opened until the credentials are known to be usable.
    const client = deps.createClient();
    for (const dataset of options.selected) {
      const candidate = await buildCandidate(dataset, client, deps);
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
