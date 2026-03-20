import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NamedThresholdsEditor } from './NamedThresholdsEditor';
import { NamedThreshold } from '../types';

const mockOnChange = jest.fn();

const defaultProps = {
  value: [] as NamedThreshold[],
  onChange: mockOnChange,
  context: {} as any,
  item: {} as any,
};

describe('NamedThresholdsEditor', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Initial state', () => {
    it('should render add threshold button', () => {
      render(<NamedThresholdsEditor {...defaultProps} />);
      expect(screen.getByRole('button', { name: /add threshold set/i })).toBeInTheDocument();
    });

    it('should render empty when no thresholds provided', () => {
      render(<NamedThresholdsEditor {...defaultProps} />);
      expect(screen.queryByText(/threshold 1/i)).not.toBeInTheDocument();
    });

    it('should render existing thresholds', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [
            { value: 0, color: '#73BF69' },
            { value: 80, color: '#F2495C' },
          ],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);
      expect(screen.getByText('CPU Thresholds')).toBeInTheDocument();
    });
  });

  describe('Adding thresholds', () => {
    it('should add new threshold when add button clicked', () => {
      render(<NamedThresholdsEditor {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /add threshold set/i });
      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          id: expect.stringMatching(/^threshold-/),
          name: 'Threshold 1',
          steps: [
            { value: 0, color: '#73BF69' },
            { value: 80, color: '#F2495C' },
          ],
        }),
      ]);
    });

    it('should add multiple thresholds with incremented names', () => {
      const { rerender } = render(<NamedThresholdsEditor {...defaultProps} />);

      const addButton = screen.getByRole('button', { name: /add threshold set/i });
      fireEvent.click(addButton);

      const firstThreshold = mockOnChange.mock.calls[0][0];

      rerender(<NamedThresholdsEditor {...defaultProps} value={firstThreshold} />);

      fireEvent.click(addButton);

      expect(mockOnChange).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Threshold 1' }),
          expect.objectContaining({ name: 'Threshold 2' }),
        ])
      );
    });
  });

  describe('Removing thresholds', () => {
    it('should remove threshold when trash button clicked', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [{ value: 0, color: '#73BF69' }],
        },
        {
          id: 'threshold-2',
          name: 'Memory Thresholds',
          steps: [{ value: 0, color: '#73BF69' }],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      const trashButtons = screen.getAllByLabelText(/remove threshold set/i);
      fireEvent.click(trashButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'threshold-2', name: 'Memory Thresholds' }),
      ]);
    });
  });

  describe('Editing threshold names', () => {
    it('should allow editing threshold name by clicking on it', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [{ value: 0, color: '#73BF69' }],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      const nameElement = screen.getByText('CPU Thresholds');
      fireEvent.click(nameElement);

      const input = screen.getByPlaceholderText(/e.g., CPU Thresholds/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('CPU Thresholds');
    });

    it('should update threshold name on input change', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [{ value: 0, color: '#73BF69' }],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      const nameElement = screen.getByText('CPU Thresholds');
      fireEvent.click(nameElement);

      const input = screen.getByPlaceholderText(/e.g., CPU Thresholds/i);
      fireEvent.change(input, { target: { value: 'Memory Thresholds' } });

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'threshold-1',
          name: 'Memory Thresholds',
        }),
      ]);
    });

    it('should exit edit mode on blur', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [{ value: 0, color: '#73BF69' }],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      const nameElement = screen.getByText('CPU Thresholds');
      fireEvent.click(nameElement);

      const input = screen.getByPlaceholderText(/e.g., CPU Thresholds/i);
      fireEvent.blur(input);

      expect(screen.queryByPlaceholderText(/e.g., CPU Thresholds/i)).not.toBeInTheDocument();
    });

    it('should exit edit mode on Enter key', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [{ value: 0, color: '#73BF69' }],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      const nameElement = screen.getByText('CPU Thresholds');
      fireEvent.click(nameElement);

      const input = screen.getByPlaceholderText(/e.g., CPU Thresholds/i);
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(screen.queryByPlaceholderText(/e.g., CPU Thresholds/i)).not.toBeInTheDocument();
    });
  });

  describe('Managing threshold steps', () => {
    it('should add new step when add step button clicked', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [
            { value: 0, color: '#73BF69' },
            { value: 80, color: '#F2495C' },
          ],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      const addStepButton = screen.getByRole('button', { name: /add step/i });
      fireEvent.click(addStepButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'threshold-1',
          steps: [
            { value: 0, color: '#73BF69' },
            { value: 80, color: '#F2495C' },
            { value: 90, color: '#FADE2A' },
          ],
        }),
      ]);
    });

    it('should increment new step value from last step', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [{ value: 50, color: '#73BF69' }],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      const addStepButton = screen.getByRole('button', { name: /add step/i });
      fireEvent.click(addStepButton);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          steps: [
            { value: 50, color: '#73BF69' },
            { value: 60, color: '#FADE2A' },
          ],
        }),
      ]);
    });

    it('should remove step when trash button clicked', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [
            { value: 0, color: '#73BF69' },
            { value: 80, color: '#F2495C' },
          ],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      const removeButtons = screen.getAllByLabelText(/remove step/i);
      fireEvent.click(removeButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'threshold-1',
          steps: [{ value: 80, color: '#F2495C' }],
        }),
      ]);
    });

    it('should not show remove button when only one step exists', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [{ value: 0, color: '#73BF69' }],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      expect(screen.queryByLabelText(/remove step/i)).not.toBeInTheDocument();
    });

    it('should update step value when changed', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [
            { value: 0, color: '#73BF69' },
            { value: 80, color: '#F2495C' },
          ],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '10' } });

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          steps: [
            { value: 10, color: '#73BF69' },
            { value: 80, color: '#F2495C' },
          ],
        }),
      ]);
    });

    it('should handle invalid number input gracefully', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [{ value: 50, color: '#73BF69' }],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '' } });

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          steps: [{ value: 0, color: '#73BF69' }],
        }),
      ]);
    });
  });

  describe('Collapsible sections', () => {
    it('should expand section by default', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [{ value: 0, color: '#73BF69' }],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      expect(screen.getByRole('button', { name: /add step/i })).toBeVisible();
    });
  });

  describe('Multiple thresholds', () => {
    it('should manage multiple thresholds independently', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [{ value: 0, color: '#73BF69' }],
        },
        {
          id: 'threshold-2',
          name: 'Memory Thresholds',
          steps: [{ value: 0, color: '#FF0000' }],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      expect(screen.getByText('CPU Thresholds')).toBeInTheDocument();
      expect(screen.getByText('Memory Thresholds')).toBeInTheDocument();
    });

    it('should update specific threshold without affecting others', () => {
      const thresholds: NamedThreshold[] = [
        {
          id: 'threshold-1',
          name: 'CPU Thresholds',
          steps: [{ value: 0, color: '#73BF69' }],
        },
        {
          id: 'threshold-2',
          name: 'Memory Thresholds',
          steps: [{ value: 0, color: '#FF0000' }],
        },
      ];

      render(<NamedThresholdsEditor {...defaultProps} value={thresholds} />);

      const cpuThreshold = screen.getByText('CPU Thresholds');
      fireEvent.click(cpuThreshold);

      const input = screen.getByDisplayValue('CPU Thresholds');
      fireEvent.change(input, { target: { value: 'Updated CPU' } });

      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'threshold-1', name: 'Updated CPU' }),
        expect.objectContaining({ id: 'threshold-2', name: 'Memory Thresholds' }),
      ]);
    });
  });
});
