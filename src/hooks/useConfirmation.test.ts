import { renderHook, act } from '@testing-library/react';
import { useConfirmation } from './useConfirmation';

describe('hooks/useConfirmation', () => {
  it('should initialize with closed state', () => {
    const onConfirm = jest.fn();
    const { result } = renderHook(() => useConfirmation(onConfirm));

    expect(result.current.isOpen).toBe(false);
    expect(result.current.itemToConfirm).toBeNull();
  });

  it('should open confirmation dialog with item', () => {
    const onConfirm = jest.fn();
    const { result } = renderHook(() => useConfirmation(onConfirm));
    const testItem = { id: 1, name: 'Test' };

    act(() => {
      result.current.request(testItem);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.itemToConfirm).toEqual(testItem);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should call onConfirm and close when confirmed', () => {
    const onConfirm = jest.fn();
    const { result } = renderHook(() => useConfirmation(onConfirm));
    const testItem = { id: 2, name: 'Item' };

    act(() => {
      result.current.request(testItem);
    });

    act(() => {
      result.current.confirm();
    });

    expect(onConfirm).toHaveBeenCalledWith(testItem);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.itemToConfirm).toBeNull();
  });

  it('should close without calling onConfirm when cancelled', () => {
    const onConfirm = jest.fn();
    const { result } = renderHook(() => useConfirmation(onConfirm));
    const testItem = { id: 3, name: 'Cancel Test' };

    act(() => {
      result.current.request(testItem);
    });

    act(() => {
      result.current.cancel();
    });

    expect(onConfirm).not.toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
    expect(result.current.itemToConfirm).toBeNull();
  });

  it('should handle confirm without item gracefully', () => {
    const onConfirm = jest.fn();
    const { result } = renderHook(() => useConfirmation(onConfirm));

    act(() => {
      result.current.confirm();
    });

    expect(onConfirm).not.toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
  });

  it('should handle multiple request cycles', () => {
    const onConfirm = jest.fn();
    const { result } = renderHook(() => useConfirmation(onConfirm));

    const item1 = { id: 4, name: 'First' };
    const item2 = { id: 5, name: 'Second' };

    act(() => {
      result.current.request(item1);
    });
    act(() => {
      result.current.confirm();
    });

    expect(onConfirm).toHaveBeenCalledWith(item1);
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.request(item2);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.itemToConfirm).toEqual(item2);

    act(() => {
      result.current.cancel();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });

  it('should handle string items', () => {
    const onConfirm = jest.fn();
    const { result } = renderHook(() => useConfirmation<string>(onConfirm));

    act(() => {
      result.current.request('delete-node-A');
    });

    act(() => {
      result.current.confirm();
    });

    expect(onConfirm).toHaveBeenCalledWith('delete-node-A');
  });

  it('should handle number items', () => {
    const onConfirm = jest.fn();
    const { result } = renderHook(() => useConfirmation<number>(onConfirm));

    act(() => {
      result.current.request(42);
    });

    act(() => {
      result.current.confirm();
    });

    expect(onConfirm).toHaveBeenCalledWith(42);
  });
});
