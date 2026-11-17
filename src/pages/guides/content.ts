const articles = import.meta.glob<string>(
  ['../../data/guides/*.md', '!../../data/guides/README.md'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  }
);

export function getGuideContent(id: string) {
  return articles[`../../data/guides/${id}.md`];
}

export function splitGuideContent(markdown: string) {
  const headings = [...markdown.matchAll(/^## (.+)$/gm)];
  const usedIds = new Set<string>();
  return {
    intro: markdown.slice(0, headings[0]?.index ?? markdown.length).trim(),
    sections: headings.map((heading, index) => {
      const title = heading[1].trim();
      const baseId = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const id = usedIds.has(baseId) ? `${baseId}-${index + 1}` : baseId;
      usedIds.add(id);
      return {
        id,
        title,
        body: markdown
          .slice(
            heading.index! + heading[0].length,
            headings[index + 1]?.index ?? markdown.length
          )
          .trim(),
      };
    }),
  };
}
