import { z } from 'zod';

export const ConstitutionStatusSchema = z.enum([
  'in-force',
  'superseded',
  'suspended',
  'interim',
  'never-implemented',
]);

// A single numbered section (or unnumbered paragraph) within an article/title.
export const ConstitutionSectionSchema = z.object({
  number: z.string().optional(), // e.g. "1", "12(a)" — omit for unnumbered text
  text: z.string(), // plain text, verbatim from the source. May contain "\n\n" for sub-paragraphs.
});

// A top-level division of the document (e.g. "ARTICLE III — BILL OF RIGHTS",
// or "TITLE IV — THE FILIPINOS..." for the 1899 charter).
export const ConstitutionArticleSchema = z.object({
  heading: z.string(), // e.g. "Article III", "Title IV"
  title: z.string().optional(), // e.g. "Bill of Rights"
  sections: z.array(ConstitutionSectionSchema),
});

// The full structured text of a constitution, transcribed verbatim from an
// official/public-domain source (see fullText.sourceUrl for provenance).
export const ConstitutionFullTextSchema = z.object({
  preamble: z.string().optional(),
  articles: z.array(ConstitutionArticleSchema),
  sourceUrl: z.string(), // exact page the text was transcribed from
  retrievedDate: z.string(), // e.g. "2026-06-19" — when it was last verified against the source
});

export const ConstitutionVersionSchema = z.object({
  slug: z.string(),
  name: z.string(),
  shortName: z.string(),
  year: z.number(),
  effectiveDate: z.string().optional(),
  endDate: z.string().optional(),
  status: ConstitutionStatusSchema,
  period: z.string(),
  summary: z.string(),
  formOfGovernment: z.string(),
  branchStructure: z.string(),
  rights: z.string(),
  keyChanges: z.array(z.string()),
  fullTextUrl: z.string().optional(),
  sourceUrl: z.string(),
  fullText: ConstitutionFullTextSchema.optional(), // present once transcribed; see CONTRIBUTING.md
});

export type ConstitutionVersion = z.infer<typeof ConstitutionVersionSchema>;
export type ConstitutionFullText = z.infer<typeof ConstitutionFullTextSchema>;
export type ConstitutionArticle = z.infer<typeof ConstitutionArticleSchema>;
export type ConstitutionSection = z.infer<typeof ConstitutionSectionSchema>;
