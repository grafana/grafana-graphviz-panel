import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NodeEditModal } from './NodeEditModal';

jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  Combobox: ({
    onChange,
    value,
    'data-testid': testId,
  }: {
    onChange: (option: { value: string } | null) => void;
    value: string | null;
    'data-testid': string;
  }) => (
    <input
      data-testid={testId}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? { value: e.target.value } : null)}
    />
  ),
}));

describe('NodeEditModal', () => {
  const defaultProps = {
    isOpen: true,
    nodeId: 'server1',
    currentLabel: 'Server 1',
    currentShape: 'box',
    onSubmit: jest.fn(),
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with provided values', () => {
    render(<NodeEditModal {...defaultProps} />);

    expect(screen.getByText(/Edit Node/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('server1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Server 1')).toBeInTheDocument();
  });

  it('should call onSubmit with updated values when Update Node is clicked', () => {
    render(<NodeEditModal {...defaultProps} />);

    const labelInput = screen.getByTestId('node-edit-label-input');
    fireEvent.change(labelInput, { target: { value: 'Updated Server' } });

    fireEvent.click(screen.getByRole('button', { name: /update node/i }));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('Updated Server', 'box');
    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('should call onDismiss when Cancel button is clicked', () => {
    render(<NodeEditModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('should reset form values on dismiss', () => {
    render(<NodeEditModal {...defaultProps} />);

    const labelInput = screen.getByTestId('node-edit-label-input');
    fireEvent.change(labelInput, { target: { value: 'Changed' } });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('should handle empty currentLabel and currentShape', () => {
    const props = {
      ...defaultProps,
      currentLabel: undefined,
      currentShape: undefined,
    };

    render(<NodeEditModal {...props} />);

    expect(screen.getByText(/Edit Node/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('server1')).toBeInTheDocument();
  });

  it('should update label field when user types', () => {
    render(<NodeEditModal {...defaultProps} />);

    const labelInput = screen.getByTestId('node-edit-label-input');
    fireEvent.change(labelInput, { target: { value: 'New Label' } });

    expect(labelInput).toHaveValue('New Label');
  });

  it('should call onSubmit with empty string when label is cleared', () => {
    render(<NodeEditModal {...defaultProps} />);

    const labelInput = screen.getByTestId('node-edit-label-input');
    fireEvent.change(labelInput, { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: /update node/i }));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('', 'box');
    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('should submit with updated shape', () => {
    render(<NodeEditModal {...defaultProps} />);

    const shapeInput = screen.getByTestId('node-edit-shape-select');
    fireEvent.change(shapeInput, { target: { value: 'circle' } });

    fireEvent.click(screen.getByRole('button', { name: /update node/i }));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('Server 1', 'circle');
  });
});
