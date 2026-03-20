import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyDiagramDisplay } from './EmptyDiagramDisplay';
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

describe('EmptyDiagramDisplay', () => {
  const defaultProps = {
    dotDiagram: 'digraph G {}',
    layoutEngine: 'dot' as LayoutEngine,
    inputMode: InputMode.CODE,
    isEditMode: true,
  };

  it('should render empty state alert', () => {
    render(<EmptyDiagramDisplay {...defaultProps} />);
    expect(screen.getByText(/diagram is empty/i)).toBeInTheDocument();
  });

  it('should render empty state content in edit mode', () => {
    render(<EmptyDiagramDisplay {...defaultProps} inputMode={InputMode.CODE} />);
    expect(screen.getByText(/Add a node definition/i)).toBeInTheDocument();
  });

  it('should not render empty state content when not in edit mode', () => {
    render(<EmptyDiagramDisplay {...defaultProps} isEditMode={false} />);
    expect(screen.queryByText(/Add a node definition/i)).not.toBeInTheDocument();
  });

  it('should render AI assistant input when available', () => {
    render(<EmptyDiagramDisplay {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Create a simple diagram/)).toBeInTheDocument();
  });

  it('should handle prompt input change', () => {
    render(<EmptyDiagramDisplay {...defaultProps} />);
    const input = screen.getByPlaceholderText(/Create a simple diagram/);

    fireEvent.change(input, { target: { value: 'Create a network diagram' } });

    expect(input).toHaveValue('Create a network diagram');
  });

  it('should call assistant service on Ask button click', () => {
    const { GraphvizAssistantService } = require('../assistantService');
    render(<EmptyDiagramDisplay {...defaultProps} />);

    const input = screen.getByPlaceholderText(/Create a simple diagram/);
    fireEvent.change(input, { target: { value: 'Create diagram' } });

    const askButton = screen.getByRole('button');
    fireEvent.click(askButton);

    expect(GraphvizAssistantService.openWithContext).toHaveBeenCalledWith('Create diagram', {
      dotDiagram: 'digraph G {}',
      layoutEngine: 'dot',
      inputMode: 'code',
    });
  });

  it('should call assistant service on Enter key press', () => {
    const { GraphvizAssistantService } = require('../assistantService');
    GraphvizAssistantService.openWithContext.mockClear();

    render(<EmptyDiagramDisplay {...defaultProps} />);

    const input = screen.getByPlaceholderText(/Create a simple diagram/);
    fireEvent.change(input, { target: { value: 'Make a chart' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(GraphvizAssistantService.openWithContext).toHaveBeenCalledWith('Make a chart', expect.any(Object));
  });

  it('should clear prompt after asking', () => {
    render(<EmptyDiagramDisplay {...defaultProps} />);

    const input = screen.getByPlaceholderText(/Create a simple diagram/);
    fireEvent.change(input, { target: { value: 'Create diagram' } });

    const askButton = screen.getByRole('button');
    fireEvent.click(askButton);

    expect(input).toHaveValue('');
  });

  it('should not call assistant when prompt is empty', () => {
    const { GraphvizAssistantService } = require('../assistantService');
    GraphvizAssistantService.openWithContext.mockClear();

    render(<EmptyDiagramDisplay {...defaultProps} />);

    const askButton = screen.getByRole('button');
    fireEvent.click(askButton);

    expect(GraphvizAssistantService.openWithContext).not.toHaveBeenCalled();
  });

  it('should not call assistant when prompt is only whitespace', () => {
    const { GraphvizAssistantService } = require('../assistantService');
    GraphvizAssistantService.openWithContext.mockClear();

    render(<EmptyDiagramDisplay {...defaultProps} />);

    const input = screen.getByPlaceholderText(/Create a simple diagram/);
    fireEvent.change(input, { target: { value: '   ' } });

    const askButton = screen.getByRole('button');
    fireEvent.click(askButton);

    expect(GraphvizAssistantService.openWithContext).not.toHaveBeenCalled();
  });

  it('should call onAddNode when provided in builder mode', () => {
    const onAddNode = jest.fn();
    render(<EmptyDiagramDisplay {...defaultProps} inputMode={InputMode.BUILDER} onAddNode={onAddNode} />);

    const addButton = screen.getByText(/Add Node/i);
    fireEvent.click(addButton);

    expect(onAddNode).toHaveBeenCalled();
  });

  it('should handle different input modes', () => {
    const onAddNode = jest.fn();

    const { rerender } = render(<EmptyDiagramDisplay {...defaultProps} inputMode={InputMode.CODE} />);
    expect(screen.getByText(/Add a node definition/i)).toBeInTheDocument();

    rerender(<EmptyDiagramDisplay {...defaultProps} inputMode={InputMode.BUILDER} onAddNode={onAddNode} />);
    expect(screen.getByText(/Add Node/i)).toBeInTheDocument();

    rerender(<EmptyDiagramDisplay {...defaultProps} inputMode={InputMode.QUERY} />);
    expect(screen.getByText(/No diagram definition found/i)).toBeInTheDocument();
  });
});
