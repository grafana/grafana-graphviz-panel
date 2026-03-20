// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';
import React from 'react';

// Mock canvas measureText for Combobox component
HTMLCanvasElement.prototype.getContext = function (contextType) {
  if (contextType === '2d') {
    return {
      measureText: (text) => ({ width: text.length * 8 }),
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({ data: [] })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => []),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      fillText: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      translate: jest.fn(),
      scale: jest.fn(),
      rotate: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      transform: jest.fn(),
      rect: jest.fn(),
      clip: jest.fn(),
    };
  }
  return null;
};

// Mock CodeEditor to avoid monaco-editor dependency
jest.mock('@grafana/ui', () => {
  const actual = jest.requireActual('@grafana/ui');
  return {
    ...actual,
    CodeEditor: (props) =>
      React.createElement('textarea', {
        'data-testid': 'code-editor',
        value: props.value,
        onChange: (e) => props.onChange?.(e.target.value),
      }),
  };
});
