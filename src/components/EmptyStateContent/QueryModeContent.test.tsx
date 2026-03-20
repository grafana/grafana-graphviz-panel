import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryModeContent } from './QueryModeContent';

describe('QueryModeContent', () => {
  it('should render message about no diagram definition found', () => {
    render(<QueryModeContent />);
    expect(screen.getByText(/no diagram definition found in the query results/i)).toBeInTheDocument();
  });

  it('should instruct user to check query returns valid DOT syntax', () => {
    render(<QueryModeContent />);
    expect(screen.getByText(/check your query returns valid dot syntax/i)).toBeInTheDocument();
  });

  it('should render complete message in single element', () => {
    render(<QueryModeContent />);
    const message = screen.getByText(
      /no diagram definition found in the query results.*check your query returns valid dot syntax/i
    );
    expect(message).toBeInTheDocument();
  });
});
