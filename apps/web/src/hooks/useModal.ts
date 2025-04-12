import { useState, useCallback } from 'react';

export const useModal = (initialIsOpen = false) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [data, setData] = useState<any>(null);

  const openModal = useCallback((modalData: any = null) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    // Clear data after a short delay to prevent UI flicker
    setTimeout(() => {
      setData(null);
    }, 300);
  }, []);

  const toggleModal = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    data,
    openModal,
    closeModal,
    toggleModal,
  };
};
