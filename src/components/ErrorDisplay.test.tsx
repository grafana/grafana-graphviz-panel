import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorDisplay } from './ErrorDisplay';
import { LayoutEngine, InputMode } from '../types';
import { of } from 'rxjs';

jest.mock('@grafana/assistant', () => ({
  isAssistantAvailable: jest.fn(() => of(true)),
}));

jest.mock('../assistantService', () => ({
  GraphvizAssistantService: {
    openWithContext: jest.fn(),
  },
}));

describe('ErrorDisplay', () => {
  const defaultProps = {
    errorMessage: 'Syntax error at line 5',
    dotDiagram: 'digraph G { A -> B; }',
    layoutEngine: 'dot' as LayoutEngine,
    inputMode: InputMode.CODE,
    isEditMode: true,
  };

  it('should render error message', () => {
    render(<ErrorDisplay {...defaultProps} />);
    expect(screen.getByText('Syntax error at line 5')).toBeInTheDocument();
  });

  it('should render error info when provided', () => {
    const props = {
      ...defaultProps,
      errorInfo: {
        lineNumber: 5,
        lineContent: 'A -> B',
      },
    };

    render(<ErrorDisplay {...props} />);
    expect(screen.getByText(/5: A -> B/)).toBeInTheDocument();
  });

  it('should not render error info when not provided', () => {
    render(<ErrorDisplay {...defaultProps} />);
    expect(screen.queryByText(/^\d+:/)).not.toBeInTheDocument();
  });

  it('should render AI assistant input in edit mode', () => {
    render(<ErrorDisplay {...defaultProps} />);
    expect(screen.getByPlaceholderText(/How do I fix this DOT syntax error/)).toBeInTheDocument();
  });

  it('should not render AI assistant when not in edit mode', () => {
    render(<ErrorDisplay {...defaultProps} isEditMode={false} />);
    expect(screen.queryByPlaceholderText(/How do I fix/)).not.toBeInTheDocument();
  });

  it('should handle prompt input change', () => {
    render(<ErrorDisplay {...defaultProps} />);
    const input = screen.getByPlaceholderText(/How do I fix/);

    fireEvent.change(input, { target: { value: 'Help me fix this' } });

    expect(input).toHaveValue('Help me fix this');
  });

  it('should call assistant service on Ask button click', () => {
    const { GraphvizAssistantService } = require('../assistantService');
    render(<ErrorDisplay {...defaultProps} />);

    const input = screen.getByPlaceholderText(/How do I fix/);
    fireEvent.change(input, { target: { value: 'Fix this error' } });

    const askButton = screen.getByRole('button');
    fireEvent.click(askButton);

    expect(GraphvizAssistantService.openWithContext).toHaveBeenCalledWith('Fix this error', {
      dotDiagram: 'digraph G { A -> B; }',
      layoutEngine: 'dot',
      inputMode: 'code',
      error: {
        message: 'Syntax error at line 5',
        lineNumber: undefined,
        lineContent: undefined,
      },
    });
  });

  it('should call assistant service on Enter key press', () => {
    const { GraphvizAssistantService } = require('../assistantService');
    GraphvizAssistantService.openWithContext.mockClear();

    render(<ErrorDisplay {...defaultProps} />);

    const input = screen.getByPlaceholderText(/How do I fix/);
    fireEvent.change(input, { target: { value: 'Fix this error' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(GraphvizAssistantService.openWithContext).toHaveBeenCalledWith('Fix this error', expect.any(Object));
  });

  it('should clear prompt after asking', () => {
    render(<ErrorDisplay {...defaultProps} />);

    const input = screen.getByPlaceholderText(/How do I fix/);
    fireEvent.change(input, { target: { value: 'Fix this error' } });

    const askButton = screen.getByRole('button');
    fireEvent.click(askButton);

    expect(input).toHaveValue('');
  });

  it('should not call assistant when prompt is empty', () => {
    const { GraphvizAssistantService } = require('../assistantService');
    GraphvizAssistantService.openWithContext.mockClear();

    render(<ErrorDisplay {...defaultProps} />);

    const askButton = screen.getByRole('button');
    fireEvent.click(askButton);

    expect(GraphvizAssistantService.openWithContext).not.toHaveBeenCalled();
  });

  it('should not call assistant when prompt is only whitespace', () => {
    const { GraphvizAssistantService } = require('../assistantService');
    GraphvizAssistantService.openWithContext.mockClear();

    render(<ErrorDisplay {...defaultProps} />);

    const input = screen.getByPlaceholderText(/How do I fix/);
    fireEvent.change(input, { target: { value: '   ' } });

    const askButton = screen.getByRole('button');
    fireEvent.click(askButton);

    expect(GraphvizAssistantService.openWithContext).not.toHaveBeenCalled();
  });

  it('should include error info in assistant context when provided', () => {
    const { GraphvizAssistantService } = require('../assistantService');
    GraphvizAssistantService.openWithContext.mockClear();

    const props = {
      ...defaultProps,
      errorInfo: {
        lineNumber: 10,
        lineContent: 'invalid syntax',
      },
    };

    render(<ErrorDisplay {...props} />);

    const input = screen.getByPlaceholderText(/How do I fix/);
    fireEvent.change(input, { target: { value: 'Help' } });

    const askButton = screen.getByRole('button');
    fireEvent.click(askButton);

    expect(GraphvizAssistantService.openWithContext).toHaveBeenCalledWith('Help', {
      dotDiagram: 'digraph G { A -> B; }',
      layoutEngine: 'dot',
      inputMode: 'code',
      error: {
        message: 'Syntax error at line 5',
        lineNumber: 10,
        lineContent: 'invalid syntax',
      },
    });
  });

  it('should not trigger assistant on non-Enter key press', () => {
    const { GraphvizAssistantService } = require('../assistantService');
    GraphvizAssistantService.openWithContext.mockClear();

    render(<ErrorDisplay {...defaultProps} />);

    const input = screen.getByPlaceholderText(/How do I fix/);
    fireEvent.change(input, { target: { value: 'Help' } });
    fireEvent.keyDown(input, { key: 'Tab' });

    expect(GraphvizAssistantService.openWithContext).not.toHaveBeenCalled();
  });
});
