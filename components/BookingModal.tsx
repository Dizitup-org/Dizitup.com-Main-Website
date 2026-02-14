
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Send, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Country } from './PersonalizationFlow';
import { supabase } from '../utils/supabaseClient';

interface BookingData {
  name: string;
  email: string;
  agency: string;
  package: string;
  country: Country;
  date: string;
  time: string;
  notes: string;
  created_at: Date;
}

// Insert booking into Supabase bookings table
async function submitBooking(data: BookingData): Promise<{ success: boolean; error?: string }> {
  try {
    const notesWithContext = [
      data.agency ? `Agency: ${data.agency}` : '',
      data.country ? `Country: ${data.country}` : '',
      data.notes || '',
    ].filter(Boolean).join(' | ');

    const { error } = await supabase.from('bookings').insert({
      name: data.name,
      email: data.email,
      project_type: data.package || null,
      notes: notesWithContext || null,
      meeting_date: data.date || null,
      meeting_time: data.time || null,
      status: 'pending',
    });

    if (error) throw error;
    console.log('✅ Booking saved to Supabase:', data);
    return { success: true };
  } catch (err: any) {
    console.error('❌ Booking insert failed:', err);
    return { success: false, error: err.message || 'Failed to submit booking' };
  }
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  prefilledPackage?: string;
  country: Country;
}

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const BookingModal: React.FC<Props> = ({ isOpen, onClose, prefilledPackage = '', country }) => {
  const [step, setStep] = useState<'details' | 'datetime' | 'confirm' | 'success'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [agency, setAgency] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(prefilledPackage);
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Calendar state
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());

  // Reset when prefill changes
  React.useEffect(() => {
    if (prefilledPackage) setSelectedPackage(prefilledPackage);
  }, [prefilledPackage]);

  // Reset on open & lock body scroll
  React.useEffect(() => {
    if (isOpen) {
      setStep('details');
      setError('');
      setSubmitting(false);
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  // Calendar generation
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calMonth, calYear]);

  const isDateDisabled = (day: number) => {
    const d = new Date(calYear, calMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d < todayStart || d.getDay() === 0; // disable past & sundays
  };

  const formatDate = (day: number) => `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const handleDetailsNext = () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Valid email is required.'); return; }
    setError('');
    setStep('datetime');
  };

  const handleDateTimeNext = () => {
    if (!selectedDate) { setError('Please select a date.'); return; }
    if (!selectedTime) { setError('Please select a time.'); return; }
    setError('');
    setStep('confirm');
  };

  const handleSubmit = useCallback(async () => {
    setSubmitting(true);
    setError('');
    const data: BookingData = {
      name: name.trim(),
      email: email.trim(),
      agency: agency.trim(),
      package: selectedPackage,
      country,
      date: selectedDate,
      time: selectedTime,
      notes: notes.trim(),
      created_at: new Date(),
    };
    const result = await submitBooking(data);
    setSubmitting(false);
    if (result.success) {
      setStep('success');
    } else {
      setError(result.error || 'Something went wrong. Please try again.');
    }
  }, [name, email, agency, selectedPackage, country, selectedDate, selectedTime, notes]);

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  const inputClass = "w-full px-4 py-3.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-red-600 focus:shadow-[0_0_12px_rgba(255,43,43,0.25)] transition-all";
  const labelClass = "block text-[10px] font-mono uppercase tracking-[0.25em] text-white/40 mb-1.5";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4"
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md backdrop-blur-heavy"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto modal-scroll rounded-[1.5rem] sm:rounded-[2rem] bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl safe-bottom"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>

            {/* Header */}
            <div className="p-5 sm:p-8 pb-0">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-red-500" />
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">Dizitup Strategy Call</span>
              </div>
              <h3 className="text-2xl font-heading font-bold text-white tracking-tight">Book Your Session</h3>
            </div>

            <div className="p-5 sm:p-8 pt-4 sm:pt-6">
              <AnimatePresence mode="wait">
                {/* ──── STEP 1: DETAILS ──── */}
                {step === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className={labelClass}>Name *</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Email *</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@agency.com" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Agency Name</label>
                      <input type="text" value={agency} onChange={e => setAgency(e.target.value)} placeholder="Your agency (optional)" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Selected Package</label>
                      <input type="text" value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)} placeholder="e.g. AI Growth Intelligence Stack" className={inputClass} />
                    </div>
                    <div>
                      <label className={labelClass}>Notes</label>
                      <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Anything you'd like us to know..." rows={3} className={inputClass + ' resize-none'} />
                    </div>

                    {error && <p className="text-red-500 text-xs">{error}</p>}

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDetailsNext}
                      className="w-full py-4 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase tracking-widest transition-all mt-2"
                    >
                      Choose Date & Time
                    </motion.button>
                  </motion.div>
                )}

                {/* ──── STEP 2: DATE & TIME ──── */}
                {step === 'datetime' && (
                  <motion.div
                    key="datetime"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    {/* Calendar */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <ChevronLeft className="w-4 h-4 text-white/40" />
                        </button>
                        <span className="text-sm font-medium text-white/70">{MONTHS[calMonth]} {calYear}</span>
                        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <ChevronRight className="w-4 h-4 text-white/40" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS.map(d => (
                          <div key={d} className="text-[10px] font-mono text-white/30 text-center py-1">{d}</div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => {
                          if (day === null) return <div key={`e-${i}`} />;
                          const dateStr = formatDate(day);
                          const disabled = isDateDisabled(day);
                          const selected = selectedDate === dateStr;
                          return (
                            <button
                              key={dateStr}
                              disabled={disabled}
                              onClick={() => setSelectedDate(dateStr)}
                              className={`py-2 rounded-lg text-sm transition-all ${
                                disabled
                                  ? 'text-white/10 cursor-not-allowed'
                                  : selected
                                  ? 'bg-red-600 text-white font-bold shadow-[0_0_15px_rgba(220,38,38,0.4)]'
                                  : 'text-white/60 hover:bg-white/10'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div className="mb-6">
                      <p className={labelClass + ' mb-3'}>Select Time</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2">
                        {TIME_SLOTS.map(t => (
                          <button
                            key={t}
                            onClick={() => setSelectedTime(t)}
                            className={`py-1.5 sm:py-2 px-1 rounded-lg text-[11px] sm:text-xs transition-all ${
                              selectedTime === t
                                ? 'bg-red-600 text-white font-bold shadow-[0_0_12px_rgba(220,38,38,0.3)]'
                                : 'bg-white/[0.04] text-white/50 hover:bg-white/10 border border-white/5'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

                    <div className="flex gap-3">
                      <button onClick={() => { setStep('details'); setError(''); }} className="px-6 py-3.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-all">
                        Back
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleDateTimeNext}
                        className="flex-1 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase tracking-widest transition-all"
                      >
                        Review & Confirm
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ──── STEP 3: CONFIRM ──── */}
                {step === 'confirm' && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
                      {[
                        ['Name', name],
                        ['Email', email],
                        ['Agency', agency || '—'],
                        ['Package', selectedPackage || '—'],
                        ['Date', selectedDate],
                        ['Time', selectedTime],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between items-center">
                          <span className="text-xs text-white/30 uppercase tracking-wider">{label}</span>
                          <span className="text-sm text-white/80 font-medium">{value}</span>
                        </div>
                      ))}
                      {notes && (
                        <div className="pt-3 border-t border-white/5">
                          <span className="text-xs text-white/30 uppercase tracking-wider">Notes</span>
                          <p className="text-sm text-white/60 mt-1">{notes}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setStep('datetime')} className="px-6 py-3.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm hover:bg-white/10 transition-all">
                        Back
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={submitting}
                        onClick={handleSubmit}
                        className="flex-1 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Confirm Booking
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {/* ──── STEP 4: SUCCESS ──── */}
                {step === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 sm:py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 15 }}
                    >
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                    </motion.div>
                    <h3 className="text-2xl font-heading font-bold text-white mb-3">You're Booked!</h3>
                    <p className="text-sm text-white/40 mb-8 leading-relaxed">
                      We'll send a confirmation to <span className="text-white/70">{email}</span>.<br />
                      Our team will reach out shortly.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-10 py-3.5 rounded-full bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-all"
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;
