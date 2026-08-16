import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Pagination from '../v2/ui/Pagination';
import { paginationRange } from '../../lib/pagination';

describe('paginationRange', () => {
  it('lists every page when they all fit', () => {
    expect(paginationRange(1, 4)).toEqual([1, 2, 3, 4]);
  });

  it('windows around the current page with gaps at both ends', () => {
    expect(paginationRange(50, 302)).toEqual([
      1,
      'gap',
      49,
      50,
      51,
      'gap',
      302,
    ]);
  });

  it('renders a lone skipped page instead of a gap', () => {
    // Page 3 sits between 1 and the 4..6 window, so show it rather than "…".
    expect(paginationRange(5, 302, 1)).toEqual([1, 'gap', 4, 5, 6, 'gap', 302]);
    expect(paginationRange(4, 302, 1)).toEqual([1, 2, 3, 4, 5, 'gap', 302]);
  });

  it('handles the edges', () => {
    expect(paginationRange(1, 302)).toEqual([1, 2, 'gap', 302]);
    expect(paginationRange(302, 302)).toEqual([1, 'gap', 301, 302]);
    expect(paginationRange(1, 1)).toEqual([1]);
    expect(paginationRange(1, 0)).toEqual([]);
  });
});

describe('<Pagination />', () => {
  const renderAt = (page: number, totalPages = 302) =>
    render(
      <MemoryRouter>
        <Pagination
          page={page}
          totalPages={totalPages}
          hrefFor={p => `/news?page=${p}`}
        />
      </MemoryRouter>
    );

  it('renders nothing for a single page', () => {
    const { container } = renderAt(1, 1);
    expect(container).toBeEmptyDOMElement();
  });

  it('marks the current page for assistive tech', () => {
    renderAt(5);
    expect(screen.getByLabelText('Page 5')).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByLabelText('Page 4')).not.toHaveAttribute('aria-current');
  });

  it('links to the neighbouring pages', () => {
    renderAt(5);
    expect(screen.getByLabelText('Previous page')).toHaveAttribute(
      'href',
      '/news?page=4'
    );
    expect(screen.getByLabelText('Next page')).toHaveAttribute(
      'href',
      '/news?page=6'
    );
  });

  it('offers no previous link on the first page, or next on the last', () => {
    const first = renderAt(1);
    expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    first.unmount();

    renderAt(302);
    expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
    expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
  });
});
