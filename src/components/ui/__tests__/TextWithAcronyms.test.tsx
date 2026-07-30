import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TextWithAcronyms } from '../TextWithAcronyms';
import { TooltipProvider } from '../Tooltip';

describe('TextWithAcronyms', () => {
  it('renders regular text without modifications', () => {
    render(<TextWithAcronyms text='Just a normal sentence.' />);
    expect(screen.getByText('Just a normal sentence.')).toBeInTheDocument();
  });

  it('identifies and wraps acronyms with Tooltip triggers', () => {
    render(
      <TooltipProvider>
        <TextWithAcronyms text='The DOLE is responsible.' />
      </TooltipProvider>
    );
    expect(screen.getByText(/The/)).toBeInTheDocument();
    expect(screen.getByText(/is responsible/)).toBeInTheDocument();

    // The acronym itself should be rendered and wrapped.
    const trigger = screen.getByText('DOLE');
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveClass('border-dotted');
  });

  it('handles punctuation attached to acronyms', () => {
    render(
      <TooltipProvider>
        <TextWithAcronyms text='Contact DSWD, DOLE, or DPWH.' />
      </TooltipProvider>
    );
    expect(screen.getByText('DSWD')).toBeInTheDocument();
    expect(screen.getByText('DOLE')).toBeInTheDocument();
    expect(screen.getByText('DPWH')).toBeInTheDocument();
    expect(screen.getByText(/Contact/)).toBeInTheDocument();
  });

  it('is case-sensitive', () => {
    render(<TextWithAcronyms text='I gave out a dole out.' />);
    expect(screen.getByText('I gave out a dole out.')).toBeInTheDocument();
    expect(screen.queryByText('DOLE')).not.toBeInTheDocument();
  });
});
