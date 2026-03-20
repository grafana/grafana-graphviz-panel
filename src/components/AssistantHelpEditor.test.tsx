import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { of } from 'rxjs';
import { AssistantHelpEditor } from './AssistantHelpEditor';
import { GraphvizAssistantService } from '../assistantService';
import { LayoutEngine } from '../types';

jest.mock('@grafana/assistant', () => ({
  isAssistantAvailable: jest.fn(),
}));

jest.mock('../assistantService', () => ({
  GraphvizAssistantService: {
    openWithContext: jest.fn(),
  },
}));

jest.mock('./AskButton', () => ({
  AskButton: ({ onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="ask-button">
      Ask
    </button>
  ),
}));

describe('AssistantHelpEditor', () => {
  const mockProps = {
    value: '',
    onChange: jest.fn(),
    item: {} as any,
    context: {
      options: {
        dotDiagram: 'digraph G { A -> B; }',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
      },
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when assistant is unavailable', () => {
    beforeEach(() => {
      const { isAssistantAvailable } = require('@grafana/assistant');
      isAssistantAvailable.mockReturnValue(of(false));
    });

    it('should render documentation link', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('View documentation')).toBeInTheDocument();
      });
    });

    it('should show "Need help?" text', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Need help?')).toBeInTheDocument();
      });
    });

    it('should have correct documentation link href', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        const link = screen.getByText('View documentation').closest('a');
        expect(link).toHaveAttribute('href', 'https://github.com/grafana/grafana-graphviz-panel/blob/main/README.md');
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should not render AI input field', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText('Need help?')).toBeInTheDocument();
      });

      expect(screen.queryByPlaceholderText(/Diagram my data/i)).not.toBeInTheDocument();
    });
  });

  describe('when assistant is available', () => {
    beforeEach(() => {
      const { isAssistantAvailable } = require('@grafana/assistant');
      isAssistantAvailable.mockReturnValue(of(true));
    });

    it('should render AI input field', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Diagram my data/i)).toBeInTheDocument();
      });
    });

    it('should show AI assistant help text', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Ask the Grafana AI assistant for help/i)).toBeInTheDocument();
      });
    });

    it('should not show documentation link', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Diagram my data/i)).toBeInTheDocument();
      });

      expect(screen.queryByText('View documentation')).not.toBeInTheDocument();
    });

    it('should have Ask button disabled initially', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        const button = screen.getByTestId('ask-button');
        expect(button).toBeDisabled();
      });
    });

    it('should enable Ask button when prompt has content', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Diagram my data/i);
        fireEvent.change(input, { target: { value: 'Help me' } });
      });

      await waitFor(() => {
        const button = screen.getByTestId('ask-button');
        expect(button).not.toBeDisabled();
      });
    });

    it('should update prompt value when typing', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Diagram my data/i) as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'Test prompt' } });
        expect(input.value).toBe('Test prompt');
      });
    });

    it('should call GraphvizAssistantService on Ask button click', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Diagram my data/i);
        fireEvent.change(input, { target: { value: 'Help me create a diagram' } });
      });

      const button = screen.getByTestId('ask-button');
      fireEvent.click(button);

      expect(GraphvizAssistantService.openWithContext).toHaveBeenCalledWith('Help me create a diagram', {
        dotDiagram: 'digraph G { A -> B; }',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
      });
    });

    it('should call GraphvizAssistantService on Enter key press', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Diagram my data/i);
        fireEvent.change(input, { target: { value: 'Help me' } });
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      });

      expect(GraphvizAssistantService.openWithContext).toHaveBeenCalledWith('Help me', {
        dotDiagram: 'digraph G { A -> B; }',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
      });
    });

    it('should clear prompt after successful submission', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Diagram my data/i) as HTMLInputElement;
        fireEvent.change(input, { target: { value: 'Test prompt' } });
        expect(input.value).toBe('Test prompt');
      });

      const button = screen.getByTestId('ask-button');
      fireEvent.click(button);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Diagram my data/i) as HTMLInputElement;
        expect(input.value).toBe('');
      });
    });

    it('should not call service when prompt is empty', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        const button = screen.getByTestId('ask-button');
        fireEvent.click(button);
      });

      expect(GraphvizAssistantService.openWithContext).not.toHaveBeenCalled();
    });

    it('should not call service when prompt is only whitespace', async () => {
      render(<AssistantHelpEditor {...mockProps} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Diagram my data/i);
        fireEvent.change(input, { target: { value: '   ' } });
      });

      const button = screen.getByTestId('ask-button');
      fireEvent.click(button);

      expect(GraphvizAssistantService.openWithContext).not.toHaveBeenCalled();
    });

    it('should default to "code" inputMode when not provided', async () => {
      const propsWithoutInputMode = {
        ...mockProps,
        context: {
          options: {
            dotDiagram: 'digraph G {}',
            layoutEngine: LayoutEngine.HIERARCHICAL,
          },
        },
      };

      render(<AssistantHelpEditor {...propsWithoutInputMode} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Diagram my data/i);
        fireEvent.change(input, { target: { value: 'Help' } });
      });

      const button = screen.getByTestId('ask-button');
      fireEvent.click(button);

      expect(GraphvizAssistantService.openWithContext).toHaveBeenCalledWith('Help', {
        dotDiagram: 'digraph G {}',
        layoutEngine: LayoutEngine.HIERARCHICAL,
        inputMode: 'code',
      });
    });

    it('should not call service when options are undefined', async () => {
      const propsWithoutOptions = {
        ...mockProps,
        context: { options: undefined },
      };

      render(<AssistantHelpEditor {...propsWithoutOptions} />);

      await waitFor(() => {
        const input = screen.getByPlaceholderText(/Diagram my data/i);
        fireEvent.change(input, { target: { value: 'Help' } });
      });

      const button = screen.getByTestId('ask-button');
      fireEvent.click(button);

      expect(GraphvizAssistantService.openWithContext).not.toHaveBeenCalled();
    });
  });

  describe('useEffect cleanup', () => {
    it('should unsubscribe on unmount', async () => {
      const { isAssistantAvailable } = require('@grafana/assistant');
      const mockUnsubscribe = jest.fn();
      const mockSubscription = {
        unsubscribe: mockUnsubscribe,
      };
      isAssistantAvailable.mockReturnValue({
        subscribe: jest.fn(() => mockSubscription),
      });

      const { unmount } = render(<AssistantHelpEditor {...mockProps} />);

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
