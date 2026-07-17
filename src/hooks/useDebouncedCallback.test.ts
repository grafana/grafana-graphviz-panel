import { renderHook, act } from '@testing-library/react';
import { useDebouncedCallback, USER_INPUT_DEBOUNCE_FAST_MS, USER_INPUT_DEBOUNCE_SLOW_MS } from './useDebouncedCallback';

describe('hooks/useDebouncedCallback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not call the callback immediately when invoked', () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, USER_INPUT_DEBOUNCE_FAST_MS));

    act(() => {
      result.current('red');
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it('should call the callback after the delay has elapsed', () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, USER_INPUT_DEBOUNCE_FAST_MS));

    act(() => {
      result.current('red');
    });

    act(() => {
      jest.advanceTimersByTime(USER_INPUT_DEBOUNCE_FAST_MS);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('red');
  });

  it('should not call the callback before the delay has elapsed', () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, USER_INPUT_DEBOUNCE_FAST_MS));

    act(() => {
      result.current('red');
    });

    act(() => {
      jest.advanceTimersByTime(USER_INPUT_DEBOUNCE_FAST_MS - 1);
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it('should debounce rapid calls and only invoke with the last argument', () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, USER_INPUT_DEBOUNCE_SLOW_MS));

    act(() => {
      result.current('rgb(255,');
      result.current('rgb(255, 0,');
      result.current('rgb(255, 0, 128)');
    });

    act(() => {
      jest.advanceTimersByTime(USER_INPUT_DEBOUNCE_SLOW_MS);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('rgb(255, 0, 128)');
  });

  it('should reset the timer on each call within the delay window', () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, USER_INPUT_DEBOUNCE_SLOW_MS));

    act(() => {
      result.current('first');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    act(() => {
      result.current('second');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(fn).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(USER_INPUT_DEBOUNCE_SLOW_MS - 300);
    });

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('second');
  });

  it('should not call the callback after unmount even if the delay elapses', () => {
    const fn = jest.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(fn, USER_INPUT_DEBOUNCE_FAST_MS));

    act(() => {
      result.current('red');
    });

    unmount();

    act(() => {
      jest.advanceTimersByTime(USER_INPUT_DEBOUNCE_FAST_MS);
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it('should allow multiple independent calls after each delay elapses', () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(fn, USER_INPUT_DEBOUNCE_FAST_MS));

    act(() => {
      result.current('first');
    });

    act(() => {
      jest.advanceTimersByTime(USER_INPUT_DEBOUNCE_FAST_MS);
    });

    act(() => {
      result.current('second');
    });

    act(() => {
      jest.advanceTimersByTime(USER_INPUT_DEBOUNCE_FAST_MS);
    });

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'first');
    expect(fn).toHaveBeenNthCalledWith(2, 'second');
  });
});
