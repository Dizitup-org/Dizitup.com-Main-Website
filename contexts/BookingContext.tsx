
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Country } from '../components/PersonalizationFlow';

interface BookingContextValue {
  isOpen: boolean;
  packageName: string;
  country: Country;
  openBooking: (packageName?: string) => void;
  closeBooking: () => void;
  setCountry: (c: Country) => void;
}

const BookingContext = createContext<BookingContextValue>({
  isOpen: false,
  packageName: '',
  country: 'Other',
  openBooking: () => {},
  closeBooking: () => {},
  setCountry: () => {},
});

export const useBooking = () => useContext(BookingContext);

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [packageName, setPackageName] = useState('');
  const [country, setCountry] = useState<Country>('Other');

  const openBooking = useCallback((pkg?: string) => {
    setPackageName(pkg ?? '');
    setIsOpen(true);
  }, []);

  const closeBooking = useCallback(() => setIsOpen(false), []);

  return (
    <BookingContext.Provider value={{ isOpen, packageName, country, openBooking, closeBooking, setCountry }}>
      {children}
    </BookingContext.Provider>
  );
};
