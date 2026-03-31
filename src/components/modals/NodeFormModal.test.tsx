import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NodeFormModal } from './NodeFormModal';

describe('NodeFormModal', () => {
  const defaultProps = {
    isOpen: true,
    existingNodeIds: ['server1', 'server2'],
    onSubmit: jest.fn(),
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the modal', () => {
    render(<NodeFormModal {...defaultProps} />);

    expect(screen.getByRole('heading', { name: /Add Node/i })).toBeInTheDocument();
    expect(screen.getByTestId('node-form-id-input')).toBeInTheDocument();
    expect(screen.getByTestId('node-form-label-input')).toBeInTheDocument();
  });

  it('should show error when node ID is empty', () => {
    render(<NodeFormModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /add node/i }));

    expect(screen.getByText(/Node ID is required/i)).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should show error when node ID already exists', () => {
    render(<NodeFormModal {...defaultProps} />);

    const idInput = screen.getByTestId('node-form-id-input');
    fireEvent.change(idInput, { target: { value: 'server1' } });

    fireEvent.click(screen.getByRole('button', { name: /add node/i }));

    expect(screen.getByText(/Node ID already exists/i)).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should submit form with valid node ID', () => {
    render(<NodeFormModal {...defaultProps} />);

    const idInput = screen.getByTestId('node-form-id-input');
    fireEvent.change(idInput, { target: { value: 'server3' } });

    fireEvent.click(screen.getByRole('button', { name: /add node/i }));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('server3', undefined, undefined);
  });

  it('should submit form with node ID and label', () => {
    render(<NodeFormModal {...defaultProps} />);

    const idInput = screen.getByTestId('node-form-id-input');
    const labelInput = screen.getByTestId('node-form-label-input');

    fireEvent.change(idInput, { target: { value: 'server3' } });
    fireEvent.change(labelInput, { target: { value: 'Server 3' } });

    fireEvent.click(screen.getByRole('button', { name: /add node/i }));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith('server3', 'Server 3', undefined);
  });

  it('should call onDismiss when Cancel button is clicked', () => {
    render(<NodeFormModal {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(defaultProps.onDismiss).toHaveBeenCalled();
  });

  it('should reset form after successful submission', () => {
    render(<NodeFormModal {...defaultProps} />);

    const idInput = screen.getByTestId('node-form-id-input');
    fireEvent.change(idInput, { target: { value: 'server3' } });

    fireEvent.click(screen.getByRole('button', { name: /add node/i }));

    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it('should trim whitespace from node ID', () => {
    render(<NodeFormModal {...defaultProps} />);

    const idInput = screen.getByTestId('node-form-id-input');
    fireEvent.change(idInput, { target: { value: '   ' } });

    fireEvent.click(screen.getByRole('button', { name: /add node/i }));

    expect(screen.getByText(/Node ID is required/i)).toBeInTheDocument();
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });
});
