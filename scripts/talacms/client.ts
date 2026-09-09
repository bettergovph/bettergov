import { z } from 'zod';

/** Thrown for every TalaCMS transport or protocol failure. */
export class TalaCmsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TalaCmsError';
  }
}

export type TalaCmsClient = <T>(query: string) => Promise<T>;

const REQUEST_TIMEOUT_MS = 8000;

/**
 * `extensions` is a standard top-level GraphQL response key (tracing IDs,
 * cache metadata, etc.) — permitted alongside `data`/`errors`, not treated as
 * an unrecognized shape. `.strict()` still rejects any other unknown key, so
 * a genuinely malformed envelope (e.g. `{ nope: 1 }`) is still caught.
 */
const GraphQLEnvelopeSchema = z
  .object({
    data: z.unknown().optional(),
    errors: z.array(z.unknown()).optional(),
    extensions: z.unknown().optional(),
  })
  .strict();

function parseTalaCmsUrl(url: string | undefined): string {
  if (!url || url.trim() === '') {
    throw new TalaCmsError(
      'TalaCMS is not configured: TALACMS_API_URL is unset'
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new TalaCmsError('TALACMS_API_URL is not a valid URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new TalaCmsError('TALACMS_API_URL must use https');
  }
  return parsed.toString();
}

/**
 * A blank value is treated as unset. `.env.example` ships
 * `TALACMS_ENVIRONMENT=` with no value, and `??` would forward an empty
 * `X-Environment` header. This is config normalization, never content
 * normalization.
 */
function environmentOf(env: NodeJS.ProcessEnv): string {
  const value = env.TALACMS_ENVIRONMENT?.trim();
  return value ? value : 'production';
}

/**
 * Configuration is validated **eagerly**, when the client is created — not on
 * first use. The orchestrator creates the client before it opens any local
 * dataset file, so a missing token surfaces as a configuration error rather
 * than after a pile of unrelated file reads.
 */
export function createTalaCmsClient(
  env: NodeJS.ProcessEnv = process.env
): TalaCmsClient {
  const url = parseTalaCmsUrl(env.TALACMS_API_URL);
  const token = env.TALACMS_API_TOKEN?.trim();
  if (!token) {
    throw new TalaCmsError(
      'TalaCMS is not configured: TALACMS_API_TOKEN is unset'
    );
  }
  const environment = environmentOf(env);

  return async function query<T>(document: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    // The timeout must stay armed through response.json(): a server can send
    // headers promptly and then stall the body.
    try {
      let response: Response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Environment': environment,
          },
          body: JSON.stringify({ query: document }),
          signal: controller.signal,
        });
      } catch {
        // Deliberately does not forward the caught error: it can carry the
        // request init, and therefore the bearer token, into logs.
        throw new TalaCmsError('Failed to reach TalaCMS');
      }

      if (!response.ok) {
        throw new TalaCmsError(`TalaCMS returned HTTP ${response.status}`);
      }

      let rawBody: unknown;
      try {
        rawBody = await response.json();
      } catch {
        throw new TalaCmsError('TalaCMS returned a malformed response');
      }

      const envelope = GraphQLEnvelopeSchema.safeParse(rawBody);
      if (!envelope.success) {
        throw new TalaCmsError('TalaCMS returned an unexpected response shape');
      }
      if (envelope.data.errors) {
        throw new TalaCmsError('TalaCMS returned a GraphQL error');
      }
      if (envelope.data.data === undefined) {
        throw new TalaCmsError('TalaCMS returned no data');
      }

      return envelope.data.data as T;
    } finally {
      clearTimeout(timeout);
    }
  };
}
