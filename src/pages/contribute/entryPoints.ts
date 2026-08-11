/**
 * The entry-point index behind /contribute.
 *
 * Contributing to BetterGov is not contributing to one repository. Every
 * destination below already exists somewhere on this site or on GitHub; what
 * did not exist was a single place that routes between them. This page is an
 * index, not a new surface, so it duplicates no CTA and asserts no priority.
 *
 * Two rules keep it evergreen, which matters because it has no dedicated
 * owner:
 *
 *   1. Ordering is by COMMITMENT, lowest first. Ranking by "what the project
 *      needs most" would need a curator and would rot the moment nobody
 *      curates it.
 *   2. No counts, no dates, no live data. A link cannot go stale the way a
 *      rendered issue count can.
 */

export type Mode =
  | 'community'
  | 'report'
  | 'ideas'
  | 'code'
  | 'review'
  | 'project';

/** How a destination must be rendered. Derived from the href so it cannot drift. */
export type LinkKind = 'internal' | 'external' | 'email';

export const linkKind = (href: string): LinkKind => {
  if (href.startsWith('mailto:')) return 'email';
  return href.startsWith('/') ? 'internal' : 'external';
};

export interface EntryPointAction {
  action: string;
  href: string;
}

export interface EntryPoint extends EntryPointAction {
  id: string;
  /** Ascending commitment. Drives display order. */
  commitment: 1 | 2 | 3 | 4 | 5;
  mode: Mode;
  modeLabel: string;
  /** "Is this you?" is the router's actual job. */
  who: string;
  /**
   * Second channel for the same job. Reporting and ideas both accept GitHub or
   * Discord, because forcing a GitHub account on someone who only wants to say
   * "this number is wrong" loses the report. The primary is the channel that
   * leaves a durable record; the alternate is the lower-friction one.
   */
  alt?: EntryPointAction;
  /** Small muted note. Must be evergreen: no counts, no dates. */
  note?: string;
}

const REPO = 'https://github.com/bettergovph/bettergov';

export const ENTRY_POINTS: EntryPoint[] = [
  {
    id: 'discord',
    commitment: 1,
    mode: 'community',
    modeLabel: 'Community',
    who: 'You want to see what people are working on before committing to anything.',
    action: 'Join the Discord',
    href: '/discord',
    note: 'Everything else starts here. No technical skill needed.',
  },
  {
    id: 'email',
    commitment: 1,
    mode: 'community',
    modeLabel: 'Email',
    who: 'You would rather write to a person than join a chat server.',
    action: 'Email the volunteers',
    href: 'mailto:volunteers@bettergov.ph',
    note: 'Goes to the volunteer team. Good for offers of help that do not fit a form.',
  },
  {
    id: 'report',
    commitment: 2,
    mode: 'report',
    modeLabel: 'Report',
    who: 'You spotted something wrong. A broken page, outdated info, a wrong number.',
    action: 'Open a bug report',
    href: `${REPO}/issues/new?template=bug_report.md`,
    alt: { action: 'or say it in Discord', href: '/discord' },
    note: 'GitHub keeps a record others can pick up. Discord works if you have no account.',
  },
  {
    id: 'ideas',
    commitment: 2,
    mode: 'ideas',
    modeLabel: 'Ideas',
    who: 'You have an idea for something BetterGov should build.',
    action: 'Share an idea',
    href: '/ideas',
    alt: { action: 'or talk it through in Discord', href: '/discord' },
    note: 'The form files it as a GitHub issue. Discord is better for half-formed ideas.',
  },
  {
    id: 'data',
    commitment: 3,
    mode: 'code',
    modeLabel: 'Data',
    who: 'You can fix or add government data: directories, hotlines, services.',
    action: 'Browse the data files',
    href: `${REPO}/tree/main/src/data`,
    note: 'Plain JSON. Edit on GitHub without cloning anything.',
  },
  {
    id: 'code',
    commitment: 4,
    mode: 'code',
    modeLabel: 'Code',
    who: 'You write code and want a scoped first task.',
    action: 'Find a good first issue',
    href: `${REPO}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`,
    note: 'Read CONTRIBUTING.md first. It covers setup and the PR flow.',
  },
  {
    id: 'review',
    commitment: 4,
    mode: 'review',
    modeLabel: 'Review',
    who: 'You can read code and give feedback, often more useful than writing more.',
    action: 'Review an open pull request',
    href: `${REPO}/pulls`,
    note: 'Reviews are the scarcest thing in most open-source projects.',
  },
  {
    id: 'sibling',
    commitment: 4,
    mode: 'project',
    modeLabel: 'Other projects',
    who: 'This repo is one of many. Another BetterGov project may fit you better.',
    action: 'Browse all BetterGov projects',
    href: '/projects',
    note: 'Each project has its own repository and its own open issues.',
  },
  {
    id: 'register',
    commitment: 5,
    mode: 'project',
    modeLabel: 'Your project',
    who: 'You are building your own civic tech project and want it listed here.',
    action: 'Ask about listing your project',
    // Deliberately routes to a human: the registry (public/api/projects.json,
    // repoType: "community") is real and schema-enforced, but the submission
    // path is undocumented. Pointing at /projects would be a dead end — it
    // lists projects but never says how to get listed.
    href: '/discord',
    alt: {
      action: 'or email the volunteers',
      href: 'mailto:volunteers@bettergov.ph',
    },
    note: 'Community projects are listed alongside the official ones.',
  },
];

export interface Intro {
  eyebrow: string;
  heading: string;
  standfirst: string;
}

/**
 * The list's own framing. It must not restate the hero headline above it, and
 * it carries full context because this page can be arrived at cold from a
 * search engine rather than from the pages that would otherwise explain it.
 */
export const INTRO: Intro = {
  eyebrow: 'Ways to help',
  heading: 'Every way in, easiest first',
  standfirst:
    'BetterGov.ph is a volunteer-led, open-source civic tech project. Pick the first one that sounds like you. Nothing here needs permission to start.',
};
