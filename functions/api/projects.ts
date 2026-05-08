import { Env, Project } from '../types';
import projectsData from '../../src/data/projects.json';

const VALID_STATUSES = ['active', 'development', 'archived'] as const;
type ProjectStatus = (typeof VALID_STATUSES)[number];

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequest(context: {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
}): Promise<Response> {
  const url = new URL(context.request.url);
  const params = url.searchParams;

  const search = params.get('search')?.trim().toLowerCase() ?? null;
  const statusParam = params.get('status');
  const pageParam = params.get('page');
  const limitParam = params.get('limit');

  if (
    statusParam !== null &&
    !VALID_STATUSES.includes(statusParam as ProjectStatus)
  ) {
    return jsonResponse(
      {
        error: `Invalid status value. Allowed values: ${VALID_STATUSES.join(', ')}`,
      },
      400
    );
  }

  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(limitParam ?? '20', 10) || 20)
  );

  let projects = projectsData as Project[];

  if (statusParam) {
    projects = projects.filter(p => p.status === statusParam);
  }

  if (search) {
    projects = projects.filter(
      p =>
        p.title.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
    );
  }

  const total = projects.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * limit;

  return jsonResponse({
    data: projects.slice(offset, offset + limit),
    meta: {
      total,
      page: safePage,
      limit,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPrevPage: safePage > 1,
    },
  });
}
