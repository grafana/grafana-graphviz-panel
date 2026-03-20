import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AskButton } from './AskButton';

describe('AskButton', () => {
  it('should render button', () => {
    const onClick = jest.fn();
    render(<AskButton onClick={onClick} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = jest.fn();
    render(<AskButton onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be enabled by default', () => {
    const onClick = jest.fn();
    render(<AskButton onClick={onClick} />);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
  });

  it('should be disabled when disabled prop is true', () => {
    const onClick = jest.fn();
    render(<AskButton onClick={onClick} disabled={true} />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled and clicked', () => {
    const onClick = jest.fn();
    render(<AskButton onClick={onClick} disabled={true} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('should render SVG with Ask text', () => {
    const onClick = jest.fn();
    const { container } = render(<AskButton onClick={onClick} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should be type button', () => {
    const onClick = jest.fn();
    render(<AskButton onClick={onClick} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');
  });
});
