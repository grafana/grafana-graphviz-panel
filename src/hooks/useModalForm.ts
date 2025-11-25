import { useState } from 'react';

export function useModalForm<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [error, setError] = useState('');

  const handleChange =
    <K extends keyof T>(field: K) =>
    (value: T[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setError('');
    };

  const setValue = <K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setValues(initialValues);
    setError('');
  };

  return { values, error, setError, handleChange, setValue, resetForm, setValues };
}
