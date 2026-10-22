import type { Env } from './types';

/**
 * Pre-launch gate for the public hostname.
 *
 * While the portal is being prepared, every page and asset request that
 * arrives on the public domain gets a "coming soon" page instead of the
 * site, so nothing leaks before the launch. The API routes keep working
 * on every hostname. Other hostnames — the staging and preview Workers on
 * *.workers.dev, local development — are untouched.
 *
 * Launch-day switch: set the `COMING_SOON` variable on the Worker to `off`
 * to open the public domain without a code change (wrangler.jsonc has
 * `keep_vars`, so a dashboard variable survives deploys). `on` forces the
 * gate on any hostname, which is how to preview the page on staging.
 */

export const COMING_SOON_HOSTS = new Set(['www.gov.ph', 'gov.ph']);

/** Brand assets the placeholder page itself needs. Nothing else is served. */
export const COMING_SOON_ASSETS = new Set([
  '/coat-of-arms.svg',
  '/coat-of-arms-480.png',
  '/logos/png/apple-touch-icon.png',
  '/og-image.png',
]);

const WORKER_ROUTE = /^\/(api\/|weather$|forex$)/;

export function isComingSoon(hostname: string, env: Env): boolean {
  const override = env.COMING_SOON?.trim().toLowerCase();
  if (override === 'off') return false;
  if (override === 'on') return true;
  return COMING_SOON_HOSTS.has(hostname.toLowerCase());
}

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

const PAGE_CSP = [
  "default-src 'none'",
  "img-src 'self'",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

export const COMING_SOON_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>GOV.PH — Coming soon</title>
    <link rel="icon" type="image/svg+xml" href="/coat-of-arms.svg" />
    <link rel="apple-touch-icon" sizes="180x180" href="/logos/png/apple-touch-icon.png" />
    <meta property="og:title" content="GOV.PH — Coming soon" />
    <meta property="og:description" content="The proposed portal of the Republic of the Philippines is being prepared for launch." />
    <meta property="og:image" content="/og-image.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet" />
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 100%; }
      body {
        display: flex; flex-direction: column; min-height: 100vh; min-height: 100dvh;
        background: #ffffff; color: #2b3a55;
        font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        border-top: 6px solid #0b4fd9;
      }
      main {
        flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
        text-align: center; padding: 48px 24px; max-width: 40rem; margin: 0 auto;
      }
      img { width: 160px; height: 160px; }
      .eyebrow {
        margin: 32px 0 0; font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #8a95aa;
      }
      h1 {
        margin: 8px 0 0; font-family: Figtree, Inter, sans-serif; font-weight: 700;
        font-size: 56px; letter-spacing: -0.02em; line-height: 1; color: #08286e;
      }
      .lede { margin: 20px 0 0; font-family: Figtree, Inter, sans-serif; font-weight: 600; font-size: 22px; line-height: 1.35; color: #0c1b33; }
      p { margin: 12px 0 0; font-size: 17px; line-height: 1.6; max-width: 34rem; }
      a { color: #0b4fd9; }
      footer {
        padding: 20px 24px; border-top: 1px solid #dbe3ef;
        font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #8a95aa; text-align: center;
      }
      @media (max-width: 480px) { h1 { font-size: 44px; } .lede { font-size: 19px; } img { width: 128px; height: 128px; } }
    </style>
  </head>
  <body>
    <main>
      <img src="/coat-of-arms-480.png" alt="Coat of Arms of the Republic of the Philippines" width="160" height="160" />
      <p class="eyebrow">Republic of the Philippines</p>
      <h1>GOV.PH</h1>
      <p class="lede">The proposed portal of the Republic of the Philippines is being prepared for launch.</p>
      <p>Government services, agencies, hotlines, and information will be available here soon.</p>
      <p>For government concerns in the meantime, call the Contact Center ng Bayan at <strong>8888</strong>, or visit the <a href="https://www.officialgazette.gov.ph">Official Gazette</a>.</p>
    </main>
    <footer>© ${new Date().getFullYear()} Republic of the Philippines</footer>
  </body>
</html>
`;

/**
 * The response for a gated request, or `null` when the request should be
 * handled normally.
 */
export async function comingSoonResponse(
  request: Request,
  env: Env
): Promise<Response | null> {
  const url = new URL(request.url);
  if (!isComingSoon(url.hostname, env)) return null;

  const path = url.pathname;

  if (COMING_SOON_ASSETS.has(path) && env.ASSETS) {
    return env.ASSETS.fetch(request);
  }

  if (path === '/robots.txt') {
    return new Response('User-agent: *\nDisallow: /\n', {
      status: 200,
      headers: {
        ...SECURITY_HEADERS,
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  // The API stays up for the apps that already use it.
  if (WORKER_ROUTE.test(path)) return null;

  return new Response(COMING_SOON_HTML, {
    status: 200,
    headers: {
      ...SECURITY_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': PAGE_CSP,
    },
  });
}
