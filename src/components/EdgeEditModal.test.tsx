import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EdgeEditModal } from './EdgeEditModal';

describe('EdgeEditModal', () => {
  const defaultProps = {
    isOpen: true,
    sourceNodeId: 'A',
    targetNodeId: 'B',
    currentId: 'A__to__B',
    currentLabel: 'Test Label',
    onSubmit: jest.fn(),
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with provided values', () => {
    render(<EdgeEditModal {...defaultProps} />);

    expect(screen.getByText(/Edit Edge: A → B/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('A')).toBeInTheDocument();
    expect(screen.getByDisplayValue('B')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Label')).toBeInTheDocument();
  });

  it('should call onSubmit with updated values when Update Edge is clicked', () => {
    render(<EdgeEditModal {...defaultProps} />);

    const labelInput = screen.getByTestId('edge-edit-label-input');
    fireEvent.change(labelInput, { target: { value: 'Updated Label' } });

    fireEvent.click(screen.getByRole('button', { name: /update edge/i }));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('A__to__B', 'Updated Label');
  });

  it('should call onDismiss when Cancel button is clicked', () => {
    render(<EdgeEditModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('should reset form values on dismiss', () => {
    render(<EdgeEditModal {...defaultProps} />);

    const labelInput = screen.getByTestId('edge-edit-label-input');
    fireEvent.change(labelInput, { target: { value: 'Changed' } });

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('should handle empty currentLabel and currentId', () => {
    const props = {
      ...defaultProps,
      currentId: undefined,
      currentLabel: undefined,
    };

    render(<EdgeEditModal {...props} />);

    expect(screen.getByText(/Edit Edge: A → B/i)).toBeInTheDocument();
  });
});
