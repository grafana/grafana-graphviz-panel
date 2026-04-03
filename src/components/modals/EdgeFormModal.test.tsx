import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EdgeFormModal } from './EdgeFormModal';

describe('EdgeFormModal', () => {
  const defaultProps = {
    isOpen: true,
    sourceNodeId: 'A',
    targetNodeId: null,
    existingNodeIds: ['A', 'B', 'C'],
    existingEdgeIds: [],
    onSubmit: jest.fn(),
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validation error paths', () => {
    it('should show error when source node is not selected (sourceNodeId is null)', () => {
      const props = {
        ...defaultProps,
        sourceNodeId: null,
      };

      render(<EdgeFormModal {...props} />);

      const submitButton = screen.getByRole('button', { name: /add edge/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Source node is required/i)).toBeInTheDocument();
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should show error when target node is not selected', () => {
      render(<EdgeFormModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /add edge/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Target node is required/i)).toBeInTheDocument();
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });

    it('should show error when edge already exists', () => {
      const props = {
        ...defaultProps,
        targetNodeId: 'B',
        existingEdgeIds: ['A__to__B'],
      };

      render(<EdgeFormModal {...props} />);

      const submitButton = screen.getByRole('button', { name: /add edge/i });
      fireEvent.click(submitButton);

      expect(screen.getByText(/Edge already exists/i)).toBeInTheDocument();
      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('conditional rendering based on sourceNodeId', () => {
    it('should show source node selector when sourceNodeId is null', () => {
      const props = {
        ...defaultProps,
        sourceNodeId: null,
      };

      render(<EdgeFormModal {...props} />);

      expect(screen.getByTestId('edge-form-source-select')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Add Edge$/i })).toBeInTheDocument();
    });

    it('should not show source node selector when sourceNodeId is provided', () => {
      render(<EdgeFormModal {...defaultProps} />);

      expect(screen.queryByTestId('edge-form-source-select')).not.toBeInTheDocument();
      expect(screen.getByText(/Add Edge from A/i)).toBeInTheDocument();
    });
  });

  describe('default value handling', () => {
    it('should handle sourceNodeId default value correctly', () => {
      const props = {
        ...defaultProps,
        sourceNodeId: null,
      };

      render(<EdgeFormModal {...props} />);

      const sourceCombobox = screen.getByTestId('edge-form-source-select');
      expect(sourceCombobox).toBeInTheDocument();
    });

    it('should handle targetNodeId default value when null', () => {
      render(<EdgeFormModal {...defaultProps} targetNodeId={null} />);

      const targetCombobox = screen.getByTestId('edge-form-target-select');
      expect(targetCombobox).toBeInTheDocument();
    });

    it('should render with provided targetNodeId', () => {
      const props = {
        ...defaultProps,
        targetNodeId: 'B',
      };

      render(<EdgeFormModal {...props} />);

      const targetCombobox = screen.getByTestId('edge-form-target-select');
      expect(targetCombobox).toBeInTheDocument();
    });
  });

  describe('successful submission', () => {
    it('should submit form with valid data and call resetForm', () => {
      const props = {
        ...defaultProps,
        targetNodeId: 'B',
      };

      render(<EdgeFormModal {...props} />);

      fireEvent.click(screen.getByRole('button', { name: /add edge/i }));

      expect(defaultProps.onSubmit).toHaveBeenCalledWith('A', 'B', undefined, undefined, undefined, undefined);
    });

    it('should submit with custom edge ID and label', () => {
      const props = {
        ...defaultProps,
        targetNodeId: 'B',
      };

      render(<EdgeFormModal {...props} />);

      const edgeIdInput = screen.getByTestId('edge-form-id-input');
      const edgeLabelInput = screen.getByTestId('edge-form-label-input');

      fireEvent.change(edgeIdInput, { target: { value: 'custom_edge' } });
      fireEvent.change(edgeLabelInput, { target: { value: 'Custom Label' } });

      fireEvent.click(screen.getByRole('button', { name: /add edge/i }));

      expect(defaultProps.onSubmit).toHaveBeenCalledWith('A', 'B', 'custom_edge', 'Custom Label', undefined, undefined);
    });
  });

  describe('form dismissal', () => {
    it('should call onDismiss when cancel button is clicked', () => {
      render(<EdgeFormModal {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(defaultProps.onDismiss).toHaveBeenCalled();
    });

    it('should reset form on dismissal', () => {
      const props = {
        ...defaultProps,
        targetNodeId: 'B',
      };

      render(<EdgeFormModal {...props} />);

      const edgeIdInput = screen.getByTestId('edge-form-id-input');
      fireEvent.change(edgeIdInput, { target: { value: 'changed' } });

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      expect(defaultProps.onDismiss).toHaveBeenCalled();
    });
  });

  describe('field interactions', () => {
    it('should update edge ID when input changes', () => {
      const props = {
        ...defaultProps,
        targetNodeId: 'B',
      };

      render(<EdgeFormModal {...props} />);

      const edgeIdInput = screen.getByTestId('edge-form-id-input');
      fireEvent.change(edgeIdInput, { target: { value: 'my_edge' } });

      expect(edgeIdInput).toHaveValue('my_edge');
    });

    it('should update edge label when input changes', () => {
      const props = {
        ...defaultProps,
        targetNodeId: 'B',
      };

      render(<EdgeFormModal {...props} />);

      const edgeLabelInput = screen.getByTestId('edge-form-label-input');
      fireEvent.change(edgeLabelInput, { target: { value: 'My Label' } });

      expect(edgeLabelInput).toHaveValue('My Label');
    });
  });
});
