
import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../utils/supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

const CALENDLY_URL = 'https://calendly.com/dizitup/new-meeting';

const ensureCalendlyAsset = (tagName: 'script' | 'link', srcOrHref: string) => {
  const attribute = tagName === 'script' ? 'src' : 'href';
  const existing = document.querySelector(`${tagName}[${attribute}="${srcOrHref}"]`);
  if (existing) return;

  const element = document.createElement(tagName);
  element.setAttribute(attribute, srcOrHref);
  if (tagName === 'script') {
    (element as HTMLScriptElement).async = true;
  } else {
    (element as HTMLLinkElement).rel = 'stylesheet';
  }
  document.head.appendChild(element);
};

const Book: React.FC = () => {
  useEffect(() => {
    ensureCalendlyAsset('link', 'https://assets.calendly.com/assets/external/widget.css');
    ensureCalendlyAsset('script', 'https://assets.calendly.com/assets/external/widget.js');
  }, []);

  const { search } = useLocation();
  const selectedService = useMemo(() => {
    const params = new URLSearchParams(search || '');
    return params.get('service') || '';
  }, [search]);

  const calendlyUrl = useMemo(() => {
    if (!selectedService) return CALENDLY_URL;
    return `${CALENDLY_URL}?utm_medium=service-card&utm_content=${encodeURIComponent(selectedService)}`;
  }, [selectedService]);

  const { user } = useAuth();
  const [hasActiveBooking, setHasActiveBooking] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return setHasActiveBooking(false);
      const { data } = await supabase
        .from('bookings')
        .select('id,status')
        .eq('user_id', user.id)
        .in('status', ['pending', 'accepted'])
        .limit(1);
      setHasActiveBooking(Boolean(data && data.length > 0));
    };
    load();
  }, [user]);

  const recordBooking = async () => {
    if (!user) {
      toast.error('Please login to create a booking');
      return;
    }
    if (hasActiveBooking) {
      toast('You already have an active booking', { icon: 'ℹ️' });
      return;
    }
    const payload = {
      user_id: user.id,
      service: selectedService || 'general',
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('bookings')
      .upsert(payload, { onConflict: 'user_id' });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Booking recorded. We will review soon.');
    setHasActiveBooking(true);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600">
      <Navbar />
      <main className="container mx-auto px-6 pt-48 pb-24">
        <Toaster position="top-right" />
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col gap-6 mb-10">
            <span className="text-red-600 font-mono text-[10px] uppercase tracking-[0.5em]">Booking</span>
            <h1 className="text-5xl md:text-7xl font-heading font-bold tracking-tighter leading-[0.9]">
              Book a Free AI Strategy Call
            </h1>
            <p className="text-white/40 text-lg md:text-xl font-light max-w-3xl leading-snug">
              Pick a time that works. We’ll align on your goals, identify the highest‑leverage AI opportunities, and outline a clear execution path.
            </p>
          </div>

          {selectedService && (
            <div className="mb-6 text-white/40 text-sm">
              You’re booking about: <span className="text-white font-medium">{selectedService.replace(/-/g, ' ')}</span>
            </div>
          )}

          <div
            aria-label="Calendly booking"
            className="rounded-[2.5rem] bg-white/[0.02] border border-white/10 overflow-hidden"
          >
            <div
              className="calendly-inline-widget"
              data-url={calendlyUrl}
              style={{ minWidth: '320px', height: '820px' }}
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-white/60 text-sm">
              {user ? (
                hasActiveBooking ? 'You have an active booking. Await status update.' : 'No active booking yet.'
              ) : (
                'Login required to record booking.'
              )}
            </div>
            <button
              onClick={recordBooking}
              disabled={!user || hasActiveBooking}
              className="premium-btn font-bold disabled:opacity-60"
            >
              Record Booking
            </button>
          </div>

          <div className="mt-8 text-white/30 text-xs font-mono uppercase tracking-[0.3em]">
            If the embed doesn’t load, open: <a className="text-white/70 hover:text-white transition-colors" href={calendlyUrl} target="_blank" rel="noreferrer">calendly.com/dizitup/new-meeting</a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Book;
