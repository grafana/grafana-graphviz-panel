import { useState } from 'react';

export function useConfirmation<T>(onConfirm: (item: T) => void) {
  const [isOpen, setIsOpen] = useState(false);
  const [itemToConfirm, setItemToConfirm] = useState<T | null>(null);

  const request = (item: T) => {
    setItemToConfirm(item);
    setIsOpen(true);
  };

  const confirm = () => {
    if (itemToConfirm) {
      onConfirm(itemToConfirm);
    }
    setIsOpen(false);
    setItemToConfirm(null);
  };

  const cancel = () => {
    setIsOpen(false);
    setItemToConfirm(null);
  };

  return { isOpen, itemToConfirm, request, confirm, cancel };
}
