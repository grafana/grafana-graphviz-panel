import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmptyStateAlert } from './EmptyStateAlert';

describe('EmptyStateAlert', () => {
  it('should render alert with title', () => {
    render(<EmptyStateAlert />);
    expect(screen.getByText('This diagram is empty!')).toBeInTheDocument();
  });

  it('should render children content', () => {
    render(
      <EmptyStateAlert>
        <div>Test content</div>
      </EmptyStateAlert>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should have info severity', () => {
    const { container } = render(<EmptyStateAlert />);
    const alert = container.querySelector('[data-testid="data-testid Alert info"]');
    expect(alert).toBeInTheDocument();
  });

  it('should render multiple children', () => {
    render(
      <EmptyStateAlert>
        <div>First child</div>
        <div>Second child</div>
      </EmptyStateAlert>
    );
    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
  });
});
