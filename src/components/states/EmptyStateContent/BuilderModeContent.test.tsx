import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuilderModeContent } from './BuilderModeContent';

describe('BuilderModeContent', () => {
  it('should render Add Node button', () => {
    const onAddNode = jest.fn();
    render(<BuilderModeContent onAddNode={onAddNode} />);

    expect(screen.getByRole('button', { name: /add node/i })).toBeInTheDocument();
  });

  it('should call onAddNode when button is clicked', () => {
    const onAddNode = jest.fn();
    render(<BuilderModeContent onAddNode={onAddNode} />);

    fireEvent.click(screen.getByRole('button', { name: /add node/i }));

    expect(onAddNode).toHaveBeenCalledTimes(1);
  });

  it('should render button with icon', () => {
    const onAddNode = jest.fn();
    render(<BuilderModeContent onAddNode={onAddNode} />);

    const button = screen.getByRole('button', { name: /add node/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onAddNode multiple times when clicked multiple times', () => {
    const onAddNode = jest.fn();
    render(<BuilderModeContent onAddNode={onAddNode} />);

    const button = screen.getByRole('button', { name: /add node/i });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onAddNode).toHaveBeenCalledTimes(3);
  });
});
