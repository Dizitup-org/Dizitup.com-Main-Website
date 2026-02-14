
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBooking } from '../contexts/BookingContext';

/**
 * Legacy /book route — now redirects to home and opens the custom booking modal.
 */
const Book: React.FC = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { openBooking } = useBooking();

  useEffect(() => {
    const params = new URLSearchParams(search || '');
    const service = params.get('service') || '';
    const pkg = service ? service.replace(/-/g, ' ') : '';
    openBooking(pkg);
    navigate('/', { replace: true });
  }, [search, openBooking, navigate]);

  return null;
};

export default Book;
