
import React, { useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { useLocation } from 'react-router-dom';

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

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600">
      <Navbar />
      <main className="container mx-auto px-6 pt-48 pb-24">
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

          <div className="mt-8 text-white/30 text-xs font-mono uppercase tracking-[0.3em]">
            If the embed doesn’t load, open: <a className="text-white/70 hover:text-white transition-colors" href={calendlyUrl} target="_blank" rel="noreferrer">calendly.com/dizitup/new-meeting</a>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Book;
