export type SubSection = { id: string; label: string };

export type SectionDef = {
  to: string;
  label: string;
  end?: boolean;
  subsections: SubSection[];
};

/**
 * Single source of truth for the design system's navigation: the sidebar,
 * the in-page anchor lists, and the previous/next pager all derive from
 * this. Subsection ids must match the DocSection ids on each page.
 */
export const DESIGN_SECTIONS: SectionDef[] = [
  {
    to: '/design',
    label: 'Overview',
    end: true,
    subsections: [
      { id: 'start-here', label: 'Start here' },
      { id: 'principles', label: 'Design principles' },
      { id: 'use-it', label: 'Use it in your service' },
    ],
  },
  {
    to: '/design/styles',
    label: 'Styles',
    subsections: [
      { id: 'typography', label: 'Typography' },
      { id: 'colour', label: 'Colour' },
      { id: 'layout', label: 'Layout' },
      { id: 'links', label: 'Links' },
    ],
  },
  {
    to: '/design/components',
    label: 'Components',
    subsections: [
      { id: 'button', label: 'Button' },
      { id: 'eyebrow-flag', label: 'Eyebrow & flag' },
      { id: 'card', label: 'Card' },
      { id: 'page-masthead', label: 'Page masthead' },
      { id: 'section-header', label: 'Section header' },
      { id: 'big-search', label: 'Big search' },
      { id: 'officials-table', label: 'Officials table' },
      { id: 'propose', label: 'Propose a component' },
    ],
  },
  {
    to: '/design/patterns',
    label: 'Patterns',
    subsections: [
      { id: 'task-patterns', label: 'Help people to…' },
      { id: 'page-types', label: 'Page types' },
      { id: 'propose', label: 'Propose a pattern' },
    ],
  },
  {
    to: '/design/accessibility',
    label: 'Accessibility',
    subsections: [
      { id: 'system', label: 'What the system does' },
      { id: 'your-team', label: 'What your team must do' },
      { id: 'testing', label: 'How to test' },
    ],
  },
  {
    to: '/design/community',
    label: 'Community',
    subsections: [
      { id: 'criteria', label: 'Contribution criteria' },
      { id: 'propose', label: 'How to propose' },
      { id: 'channels', label: 'Where the work happens' },
      { id: 'reuse', label: 'Reuse it anywhere' },
    ],
  },
];
