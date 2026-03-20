import React from 'react';
import { render, screen } from '@testing-library/react';
import { CodeModeContent } from './CodeModeContent';

describe('CodeModeContent', () => {
  it('should render instruction to add node definition', () => {
    render(<CodeModeContent />);
    expect(screen.getByText(/add a node definition to the dot diagram source code/i)).toBeInTheDocument();
  });

  it('should render code example with proper syntax', () => {
    render(<CodeModeContent />);
    const codeElement = screen.getByText(/digraph G/);
    expect(codeElement).toBeInTheDocument();
    expect(codeElement.tagName).toBe('CODE');
  });

  it('should display MyNode example in code', () => {
    render(<CodeModeContent />);
    expect(screen.getByText(/MyNode/)).toBeInTheDocument();
  });

  it('should show code with HTML entities properly rendered', () => {
    const { container } = render(<CodeModeContent />);
    const code = container.querySelector('code');
    expect(code?.textContent).toContain('{');
    expect(code?.textContent).toContain('}');
    expect(code?.textContent).toContain('"');
  });
});
