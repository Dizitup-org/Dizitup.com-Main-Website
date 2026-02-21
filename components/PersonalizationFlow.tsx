
import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight, Sparkles, Search } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

// Generate or retrieve unique device ID
const getDeviceId = (): string => {
  const key = 'dizitup_device_id';
  let deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(key, deviceId);
  }
  return deviceId;
};

// ── Pricing regions (internal pricing buckets) ──
export type PricingRegion = 'India' | 'United States' | 'Europe' | 'Other';

// ── All selectable countries ──
export type Country =
  | 'India'
  // Dollar-priced countries
  | 'United States' | 'Canada' | 'Australia' | 'United Kingdom'
  | 'Singapore' | 'UAE' | 'Saudi Arabia' | 'New Zealand'
  | 'Japan' | 'South Korea' | 'Hong Kong' | 'Philippines'
  | 'Malaysia' | 'Indonesia' | 'South Africa' | 'Nigeria'
  | 'Brazil' | 'Mexico' | 'Thailand' | 'Vietnam'
  // Euro-priced countries
  | 'Germany' | 'France' | 'Netherlands' | 'Spain'
  | 'Italy' | 'Ireland' | 'Portugal' | 'Belgium'
  | 'Austria' | 'Finland' | 'Greece' | 'Switzerland'
  | 'Sweden' | 'Denmark' | 'Norway' | 'Poland'
  // Catch-all
  | 'Other';

// Map every country to its pricing region
const COUNTRY_PRICING_MAP: Record<Country, PricingRegion> = {
  'India': 'India',
  // Dollar-region
  'United States': 'United States',
  'Canada': 'United States',
  'Australia': 'United States',
  'United Kingdom': 'United States',
  'Singapore': 'United States',
  'UAE': 'United States',
  'Saudi Arabia': 'United States',
  'New Zealand': 'United States',
  'Japan': 'United States',
  'South Korea': 'United States',
  'Hong Kong': 'United States',
  'Philippines': 'United States',
  'Malaysia': 'United States',
  'Indonesia': 'United States',
  'South Africa': 'United States',
  'Nigeria': 'United States',
  'Brazil': 'United States',
  'Mexico': 'United States',
  'Thailand': 'United States',
  'Vietnam': 'United States',
  // Euro-region
  'Germany': 'Europe',
  'France': 'Europe',
  'Netherlands': 'Europe',
  'Spain': 'Europe',
  'Italy': 'Europe',
  'Ireland': 'Europe',
  'Portugal': 'Europe',
  'Belgium': 'Europe',
  'Austria': 'Europe',
  'Finland': 'Europe',
  'Greece': 'Europe',
  'Switzerland': 'Europe',
  'Sweden': 'Europe',
  'Denmark': 'Europe',
  'Norway': 'Europe',
  'Poland': 'Europe',
  // Fallback
  'Other': 'Other',
};

export function getPricingRegion(country: Country): PricingRegion {
  return COUNTRY_PRICING_MAP[country] ?? 'Other';
}

export type AgencySize = '1–5' | '5–15' | '15–30' | '30+';

export interface UserProfile {
  name: string;
  agencySize: AgencySize;
  country: Country;
}

interface Props {
  onComplete: (profile: UserProfile) => void;
}

// Country display list grouped by region (flag emoji + name)
interface CountryOption {
  name: Country;
  flag: string;
  group: string;
}

const COUNTRY_OPTIONS: CountryOption[] = [
  // Asia-Pacific
  { name: 'India', flag: '🇮🇳', group: 'Asia-Pacific' },
  { name: 'Singapore', flag: '🇸🇬', group: 'Asia-Pacific' },
  { name: 'Japan', flag: '🇯🇵', group: 'Asia-Pacific' },
  { name: 'South Korea', flag: '🇰🇷', group: 'Asia-Pacific' },
  { name: 'Hong Kong', flag: '🇭🇰', group: 'Asia-Pacific' },
  { name: 'Philippines', flag: '🇵🇭', group: 'Asia-Pacific' },
  { name: 'Malaysia', flag: '🇲🇾', group: 'Asia-Pacific' },
  { name: 'Indonesia', flag: '🇮🇩', group: 'Asia-Pacific' },
  { name: 'Thailand', flag: '🇹🇭', group: 'Asia-Pacific' },
  { name: 'Vietnam', flag: '🇻🇳', group: 'Asia-Pacific' },
  { name: 'Australia', flag: '🇦🇺', group: 'Asia-Pacific' },
  { name: 'New Zealand', flag: '🇳🇿', group: 'Asia-Pacific' },
  // Americas
  { name: 'United States', flag: '🇺🇸', group: 'Americas' },
  { name: 'Canada', flag: '🇨🇦', group: 'Americas' },
  { name: 'Brazil', flag: '🇧🇷', group: 'Americas' },
  { name: 'Mexico', flag: '🇲🇽', group: 'Americas' },
  // Europe
  { name: 'United Kingdom', flag: '🇬🇧', group: 'Europe' },
  { name: 'Germany', flag: '🇩🇪', group: 'Europe' },
  { name: 'France', flag: '🇫🇷', group: 'Europe' },
  { name: 'Netherlands', flag: '🇳🇱', group: 'Europe' },
  { name: 'Spain', flag: '🇪🇸', group: 'Europe' },
  { name: 'Italy', flag: '🇮🇹', group: 'Europe' },
  { name: 'Ireland', flag: '🇮🇪', group: 'Europe' },
  { name: 'Portugal', flag: '🇵🇹', group: 'Europe' },
  { name: 'Belgium', flag: '🇧🇪', group: 'Europe' },
  { name: 'Austria', flag: '🇦🇹', group: 'Europe' },
  { name: 'Switzerland', flag: '🇨🇭', group: 'Europe' },
  { name: 'Sweden', flag: '🇸🇪', group: 'Europe' },
  { name: 'Denmark', flag: '🇩🇰', group: 'Europe' },
  { name: 'Norway', flag: '🇳🇴', group: 'Europe' },
  { name: 'Finland', flag: '🇫🇮', group: 'Europe' },
  { name: 'Greece', flag: '🇬🇷', group: 'Europe' },
  { name: 'Poland', flag: '🇵🇱', group: 'Europe' },
  // Middle East & Africa
  { name: 'UAE', flag: '🇦🇪', group: 'Middle East & Africa' },
  { name: 'Saudi Arabia', flag: '🇸🇦', group: 'Middle East & Africa' },
  { name: 'South Africa', flag: '🇿🇦', group: 'Middle East & Africa' },
  { name: 'Nigeria', flag: '🇳🇬', group: 'Middle East & Africa' },
  // Other
  { name: 'Other', flag: '🌍', group: 'Other' },
];

const AGENCY_SIZES: AgencySize[] = ['1–5', '5–15', '15–30', '30+'];

const PersonalizationFlow: React.FC<Props> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'form' | 'loading' | 'welcome'>('form');
  const [name, setName] = useState('');
  const [agencySize, setAgencySize] = useState<AgencySize | ''>('');
  const [country, setCountry] = useState<Country | ''>('');
  const [sizeOpen, setSizeOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Check for existing visitor profile on mount
  useEffect(() => {
    let isCancelled = false;

    const checkExistingProfile = async () => {
      try {
        const deviceId = getDeviceId();

        const fetchPromise = supabase
          .from('visitor_profiles')
          .select('*')
          .eq('device_id', deviceId)
          .limit(1)
          .single();

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile check timeout')), 2500)
        );

        const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (isCancelled) return;

        if (data && !error) {
          // Found existing profile - auto-complete the flow
          const profile: UserProfile = {
            name: data.name,
            agencySize: data.agency_size as AgencySize,
            country: data.country as Country,
          };
          setExistingProfile(profile);
          setName(data.name);
          setAgencySize(data.agency_size as AgencySize);
          setCountry(data.country as Country);
          // Auto-complete immediately for returning visitors
          onComplete(profile);
        } else if (error) {
          console.log('No existing profile found. Showing form.', error.message);
        }
      } catch (err: any) {
        if (isCancelled) return;
        if (err.name === 'AbortError') {
          console.warn('Profile check aborted');
        } else {
          // No existing profile found, show form
          console.error('Failed to check existing profile:', err);
        }
      } finally {
        if (!isCancelled) {
          setCheckingProfile(false);
        }
      }
    };
    checkExistingProfile();

    return () => {
      isCancelled = true;
    };
  }, [onComplete]);

  // Save profile to Supabase
  const saveVisitorProfile = async (profile: UserProfile) => {
    try {
      const deviceId = getDeviceId();
      await supabase
        .from('visitor_profiles')
        .upsert({
          device_id: deviceId,
          name: profile.name,
          agency_size: profile.agencySize,
          country: profile.country,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'device_id' });
      console.log('✅ Visitor profile saved to Supabase');
    } catch (err) {
      console.error('Failed to save visitor profile:', err);
    }
  };

  const handleSubmit = useCallback(() => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!agencySize) { setError('Please select your agency size.'); return; }
    if (!country) { setError('Please select your country.'); return; }
    setError('');
    setPhase('loading');

    // Save profile to Supabase
    const profile: UserProfile = { name: name.trim(), agencySize: agencySize as AgencySize, country: country as Country };
    saveVisitorProfile(profile);

    // Animated progress bar over ~2.5s
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 18 + 4;
      if (p >= 100) {
        p = 100;
        clearInterval(interval);
        setTimeout(() => setPhase('welcome'), 400);
      }
      setProgress(Math.min(p, 100));
    }, 120);
  }, [name, agencySize, country]);

  const handleContinue = useCallback(() => {
    onComplete({ name: name.trim(), agencySize: agencySize as AgencySize, country: country as Country });
  }, [name, agencySize, country, onComplete]);

  // Don't render anything while checking for existing profile (prevents flash)
  if (checkingProfile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#050505]"
      >
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </motion.div>
    );
  }

  // If existing profile was found and auto-completed, render an empty motion component
  // so AnimatePresence can still animate it out cleanly instead of getting stuck.
  if (existingProfile) {
    return (
      <motion.div
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9998] pointer-events-none"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center overflow-y-auto overscroll-contain fullscreen-overlay"
    >
      {/* Blurred dark bg */}
      <div className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl backdrop-blur-heavy" />

      <div className="relative z-10 w-full max-w-lg px-4 sm:px-6 py-6 sm:py-0">
        <AnimatePresence mode="wait">
          {/* ─── FORM PHASE ─── */}
          {phase === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.6 }}
              className="p-6 sm:p-10 md:p-14 rounded-[1.5rem] sm:rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-2xl shadow-2xl"
            >
              <div className="text-center mb-10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: 60 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  className="h-px bg-red-600 mx-auto mb-6"
                />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold tracking-tight text-white leading-snug">
                  Before we design your <br />
                  <span className="text-red-500">AI growth system…</span>
                </h2>
              </div>

              {/* Name */}
              <div className="mb-5">
                <label className="block text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 mb-2">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-red-600 focus:shadow-[0_0_12px_rgba(255,43,43,0.3)] transition-all text-sm"
                />
              </div>

              {/* Agency Size Dropdown */}
              <div className="mb-5 relative">
                <label className="block text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 mb-2">Agency Size (Clients)</label>
                <button
                  type="button"
                  onClick={() => { setSizeOpen(!sizeOpen); setCountryOpen(false); }}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/[0.05] border border-white/10 text-left text-sm flex items-center justify-between focus:outline-none focus:border-red-600 focus:shadow-[0_0_12px_rgba(255,43,43,0.3)] transition-all"
                >
                  <span className={agencySize ? 'text-white' : 'text-white/20'}>{agencySize || 'Select size'}</span>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${sizeOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {sizeOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute z-30 mt-2 w-full rounded-2xl bg-[#111]/95 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl"
                    >
                      {AGENCY_SIZES.map(s => (
                        <button
                          key={s}
                          onClick={() => { setAgencySize(s); setSizeOpen(false); }}
                          className="w-full px-5 py-3 text-left text-sm hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                        >
                          {s} clients
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Country Dropdown */}
              <div className="mb-8 relative">
                <label className="block text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 mb-2">Country</label>
                <button
                  type="button"
                  onClick={() => { setCountryOpen(!countryOpen); setSizeOpen(false); setCountrySearch(''); }}
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/[0.05] border border-white/10 text-left text-sm flex items-center justify-between focus:outline-none focus:border-red-600 focus:shadow-[0_0_12px_rgba(255,43,43,0.3)] transition-all"
                >
                  <span className={country ? 'text-white flex items-center gap-2' : 'text-white/20'}>
                    {country ? (
                      <>{COUNTRY_OPTIONS.find(c => c.name === country)?.flag} {country}</>
                    ) : 'Select country'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${countryOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {countryOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute z-30 mt-2 w-full rounded-2xl bg-[#111]/95 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl"
                    >
                      {/* Search */}
                      <div className="px-3 py-2 border-b border-white/5">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/5">
                          <Search className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                          <input
                            type="text"
                            value={countrySearch}
                            onChange={e => setCountrySearch(e.target.value)}
                            placeholder="Search country..."
                            className="bg-transparent text-sm text-white placeholder-white/20 focus:outline-none w-full"
                            autoFocus
                          />
                        </div>
                      </div>
                      {/* Scrollable list */}
                      <div className="max-h-[200px] sm:max-h-[260px] overflow-y-auto modal-scroll">
                        {(() => {
                          const filtered = COUNTRY_OPTIONS.filter(c =>
                            c.name.toLowerCase().includes(countrySearch.toLowerCase())
                          );
                          let lastGroup = '';
                          return filtered.length === 0 ? (
                            <p className="px-5 py-4 text-xs text-white/30 text-center">No countries found</p>
                          ) : (
                            filtered.map(c => {
                              const showGroupHeader = c.group !== lastGroup;
                              lastGroup = c.group;
                              return (
                                <React.Fragment key={c.name}>
                                  {showGroupHeader && (
                                    <div className="px-4 pt-3 pb-1">
                                      <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/20">{c.group}</span>
                                    </div>
                                  )}
                                  <button
                                    onClick={() => { setCountry(c.name); setCountryOpen(false); setCountrySearch(''); }}
                                    className={`w-full px-5 py-2.5 text-left text-sm hover:bg-white/10 transition-colors flex items-center gap-2.5 ${country === c.name ? 'bg-red-600/10 text-red-400' : 'text-white/70 hover:text-white'
                                      }`}
                                  >
                                    <span className="text-base leading-none">{c.flag}</span>
                                    <span>{c.name}</span>
                                  </button>
                                </React.Fragment>
                              );
                            })
                          );
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs mb-4 text-center">
                  {error}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className="w-full py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)]"
              >
                Get My AI Blueprint
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}

          {/* ─── LOADING PHASE ─── */}
          {phase === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(12px)' }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <Sparkles className="w-8 h-8 text-red-500 mx-auto mb-6 animate-pulse" />
              <p className="text-lg md:text-xl font-heading font-semibold text-white/80 mb-8 tracking-tight">
                Designing your AI growth blueprint...
              </p>
              <div className="w-64 h-1 mx-auto rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] font-mono text-white/20 mt-4 uppercase tracking-[0.3em]">
                {progress < 40 ? 'Analyzing market...' : progress < 70 ? 'Calibrating strategy...' : 'Finalizing blueprint...'}
              </p>
            </motion.div>
          )}

          {/* ─── WELCOME PHASE ─── */}
          {phase === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-xl mx-auto"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 80 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="h-px bg-red-600 mx-auto mb-8"
              />

              <h2 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold tracking-tighter text-white mb-4 sm:mb-6">
                Welcome, <span className="text-red-500">{name.trim()}</span>.
              </h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-base sm:text-lg md:text-xl font-light text-white/50 leading-relaxed mb-4 italic"
              >
                "At Dizitup, AI stops being a tool and starts becoming your <span className="text-white/80 font-normal">unfair business advantage</span>."
              </motion.p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
                className="text-xs sm:text-sm text-white/30 font-mono uppercase tracking-[0.2em] mb-8 sm:mb-12"
              >
                Here's how we can scale your agency intelligently.
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleContinue}
                className="px-12 py-5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(220,38,38,0.25)] flex items-center gap-3 mx-auto"
              >
                Explore Your Blueprint
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default PersonalizationFlow;
