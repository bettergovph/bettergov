/** A gap in a page list, rendered as an ellipsis. */
export const PAGE_GAP = 'gap' as const;

export type PageSlot = number | typeof PAGE_GAP;

/**
 * Page numbers to render in a pager: always the first and last page, a window
 * of `siblings` either side of the current page, and gaps for what's skipped.
 *
 * A single skipped page is rendered as that page rather than a gap — "1 2 3"
 * is both shorter and more useful than "1 … 3".
 */
export const paginationRange = (
  page: number,
  totalPages: number,
  siblings = 1
): PageSlot[] => {
  if (totalPages <= 1) return totalPages === 1 ? [1] : [];

  const pages = new Set<number>([1, totalPages]);
  for (let p = page - siblings; p <= page + siblings; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }

  const sorted = Array.from(pages).sort((a, b) => a - b);
  const slots: PageSlot[] = [];

  sorted.forEach((p, i) => {
    const previous = sorted[i - 1];
    if (i > 0 && p - previous > 1) {
      if (p - previous === 2) slots.push(previous + 1);
      else slots.push(PAGE_GAP);
    }
    slots.push(p);
  });

  return slots;
};
