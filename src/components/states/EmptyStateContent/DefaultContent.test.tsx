import React from 'react';
import { render, screen } from '@testing-library/react';
import { DefaultContent } from './DefaultContent';

describe('DefaultContent', () => {
  it('should render message about requiring at least one node', () => {
    render(<DefaultContent />);
    expect(screen.getByText(/diagrams require at least one node/i)).toBeInTheDocument();
  });

  it('should render instruction to update diagram in panel options', () => {
    render(<DefaultContent />);
    expect(screen.getByText(/update the diagram in panel options/i)).toBeInTheDocument();
  });

  it('should render complete message with all parts', () => {
    render(<DefaultContent />);
    expect(screen.getByText(/diagrams require at least one node/i)).toBeInTheDocument();
    expect(screen.getByText(/update the diagram in panel options/i)).toBeInTheDocument();
  });
});
