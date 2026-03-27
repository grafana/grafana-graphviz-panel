import React from 'react';
import { render, screen } from '@testing-library/react';
import { EmptyStateContent } from './index';
import { InputMode } from '../../../types';

describe('EmptyStateContent', () => {
  describe('renders correct content for each input mode', () => {
    it.each([
      {
        mode: InputMode.CODE,
        expectedText: /add a node definition to the dot diagram source code/i,
        testType: 'text',
        description: 'CODE mode shows code instructions',
      },
      {
        mode: InputMode.BUILDER,
        expectedText: /add node/i,
        testType: 'button',
        onAddNode: jest.fn(),
        description: 'BUILDER mode shows Add Node button when callback provided',
      },
      {
        mode: InputMode.QUERY,
        expectedText: /no diagram definition found in the query results/i,
        testType: 'text',
        description: 'QUERY mode shows query instructions',
      },
      {
        mode: undefined as any,
        expectedText: /diagrams require at least one node/i,
        testType: 'text',
        description: 'undefined mode shows default content',
      },
      {
        mode: 'UNKNOWN' as InputMode,
        expectedText: /diagrams require at least one node/i,
        testType: 'text',
        description: 'unknown mode shows default content',
      },
    ])('$description', ({ mode, expectedText, testType, onAddNode }) => {
      render(<EmptyStateContent inputMode={mode} onAddNode={onAddNode} />);

      if (testType === 'button') {
        expect(screen.getByRole('button', { name: expectedText })).toBeInTheDocument();
      } else {
        expect(screen.getByText(expectedText)).toBeInTheDocument();
      }
    });
  });

  describe('BUILDER mode edge cases', () => {
    it('renders nothing when onAddNode callback is not provided', () => {
      const { container } = render(<EmptyStateContent inputMode={InputMode.BUILDER} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
