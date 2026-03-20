import { renderHook, act } from '@testing-library/react';
import { useModalForm } from './useModalForm';

describe('hooks/useModalForm', () => {
  interface TestFormData {
    name: string;
    age: number;
    email: string;
  }

  const initialValues: TestFormData = {
    name: '',
    age: 0,
    email: '',
  };

  it('should initialize with provided values', () => {
    const { result } = renderHook(() => useModalForm(initialValues));

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.error).toBe('');
  });

  it('should update field value using handleChange', () => {
    const { result } = renderHook(() => useModalForm(initialValues));

    act(() => {
      result.current.handleChange('name')('John Doe');
    });

    expect(result.current.values.name).toBe('John Doe');
    expect(result.current.values.age).toBe(0);
    expect(result.current.values.email).toBe('');
  });

  it('should clear error when field changes', () => {
    const { result } = renderHook(() => useModalForm(initialValues));

    act(() => {
      result.current.setError('Validation failed');
    });

    expect(result.current.error).toBe('Validation failed');

    act(() => {
      result.current.handleChange('name')('John');
    });

    expect(result.current.error).toBe('');
  });

  it('should update field value using setValue', () => {
    const { result } = renderHook(() => useModalForm(initialValues));

    act(() => {
      result.current.setValue('age', 25);
    });

    expect(result.current.values.age).toBe(25);
  });

  it('should set multiple values using setValues', () => {
    const { result } = renderHook(() => useModalForm(initialValues));

    const newValues = {
      name: 'Jane',
      age: 30,
      email: 'jane@example.com',
    };

    act(() => {
      result.current.setValues(newValues);
    });

    expect(result.current.values).toEqual(newValues);
  });

  it('should reset form to initial values', () => {
    const { result } = renderHook(() => useModalForm(initialValues));

    act(() => {
      result.current.handleChange('name')('John');
      result.current.handleChange('age')(30);
      result.current.setError('Some error');
    });

    expect(result.current.values.name).toBe('John');
    expect(result.current.values.age).toBe(30);
    expect(result.current.error).toBe('Some error');

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.error).toBe('');
  });

  it('should handle multiple field updates independently', () => {
    const { result } = renderHook(() => useModalForm(initialValues));

    act(() => {
      result.current.handleChange('name')('Alice');
      result.current.handleChange('email')('alice@example.com');
      result.current.setValue('age', 28);
    });

    expect(result.current.values).toEqual({
      name: 'Alice',
      age: 28,
      email: 'alice@example.com',
    });
  });

  it('should maintain other field values when updating one field', () => {
    const initialData = {
      name: 'Bob',
      age: 35,
      email: 'bob@example.com',
    };

    const { result } = renderHook(() => useModalForm(initialData));

    act(() => {
      result.current.handleChange('name')('Robert');
    });

    expect(result.current.values).toEqual({
      name: 'Robert',
      age: 35,
      email: 'bob@example.com',
    });
  });
});
