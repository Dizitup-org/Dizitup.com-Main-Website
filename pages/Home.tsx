import React, { useMemo, useState, useCallback, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Scrollytelling from '../components/Scrollytelling';
import HowItWorks from '../components/HowItWorks';
import Portfolio from '../components/Portfolio';
import DynamicPricing from '../components/DynamicPricing';
import CustomProjects from '../components/CustomProjects';
import BookingModal from '../components/BookingModal';
import type { Country } from '../components/PersonalizationFlow';
import Footer from '../components/Footer';
import WelcomeLoader from '../components/WelcomeLoader';
import CursorGlow from '../components/CursorGlow';
import TiltCard from '../components/TiltCard';
import AnimatedCounter from '../components/AnimatedCounter';
import AuthModal from '../components/AuthModal';
import ContactAdminModal from '../components/ContactAdminModal';
import ChatWidget from '../components/ChatWidget';
import DiziAIChat from '../components/DiziAIChat';
import DarkVeil from '../components/DarkVeil';
import { useBooking } from '../contexts/BookingContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Zap, Target } from 'lucide-react';

type HomePhase = 'loader' | 'site';



// Staggered word reveal component
const WordReveal = ({ text, className = '' }: { text: string; className?: string }) => {
  const words = text.split(' ');
  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.12, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

const Home: React.FC = () => {
  const { isOpen: bookingOpen, packageName: bookingPackage, openBooking, closeBooking, setCountry: setBookingCountry,
    authPromptOpen, closeAuthPrompt, onBookingLoginSuccess,
    contactAdminOpen, closeContactAdmin,
  } = useBooking();

  // Determine initial phase — skip personalize, go straight to site after loader
  const initialPhase = useMemo<HomePhase>(() => {
    const w = window as unknown as { __WELCOME_SHOWN?: boolean };
    if (!w.__WELCOME_SHOWN) return 'loader';
    return 'site';
  }, []);

  const [phase, setPhase] = useState<HomePhase>(initialPhase);

  const country: Country = 'Other';

  const handleLoaderComplete = useCallback(() => {
    (window as unknown as { __WELCOME_SHOWN?: boolean }).__WELCOME_SHOWN = true;
    setPhase('site');
  }, []);

  // Sync country to booking context on mount
  useEffect(() => {
    setBookingCountry(country);
  }, [setBookingCountry]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-transparent text-white selection:bg-red-600 selection:text-white overflow-x-hidden relative">
      
      {/* Fixed DarkVeil Background for the whole page */}
      <div className="fixed inset-0 z-[-1] bg-black pointer-events-none">
        <div className="absolute inset-0 mix-blend-lighten opacity-50">
          <div className="w-full h-full" style={{ filter: 'hue-rotate(330deg) saturate(1.5)' }}>
            <DarkVeil
              hueShift={227}
              noiseIntensity={0}
              scanlineIntensity={0}
              speed={0.5}
              scanlineFrequency={0}
              warpAmount={0}
            />
          </div>
        </div>
      </div>

      {/* Phase 1: Welcome Animation */}
      <AnimatePresence>
        {phase === 'loader' && (
          <WelcomeLoader onComplete={handleLoaderComplete} />
        )}
      </AnimatePresence>


      {/* Phase 3: Main Site */}
      {phase === 'site' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
          className="relative"
        >
          <div className="relative z-10 w-full h-full">
            {/* Cursor Glow — follows mouse across the whole page */}
            <CursorGlow />

            {/* Dizi AI — always visible, shows teaser when logged out */}
            <DiziAIChat />

            <Navbar />

          <main>
            <div id="hero">
              <Hero />
            </div>

            {/* Section Divider */}
            <div className="section-divider" />

            <Scrollytelling />

            {/* Section Divider */}
            <div className="section-divider" />

            {/* Strategic Pillars */}
            <section className="py-16 sm:py-28 lg:py-40 bg-transparent relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-red-600/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="container mx-auto px-4 sm:px-6 text-center relative z-10">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-12">
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/60">The Dizitup Operational Standard</span>
                </div>

                <h2 className="text-3xl sm:text-5xl md:text-8xl font-heading font-bold mb-8 sm:mb-12 tracking-tighter leading-tight">
                  <WordReveal text="ENGINEERED" /> <br />
                  <WordReveal text="GROWTH." className="text-white/20 italic font-light" />
                </h2>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto">
                  {[
                    { icon: BrainCircuit, title: "Intelligent Systems", desc: "Proprietary AI architectures built for decision-making and scale." },
                    { icon: Target, title: "Precision Focus", desc: "Removing boring manual work so you focus 100% on the vision." },
                    { icon: Zap, title: "Rapid Execution", desc: "Deployment speeds that traditional agencies simply cannot match." }
                  ].map((item, i) => (
                    <TiltCard key={i}>
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15 }}
                        className="p-6 sm:p-8 lg:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white/[0.02] border border-white/5 group hover:border-white/20 transition-all duration-500 h-full"
                      >
                        <item.icon className="w-10 h-10 text-red-600 mb-6 mx-auto group-hover:scale-110 transition-transform" />
                        <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                        <p className="text-sm text-white/40 font-light leading-relaxed">{item.desc}</p>
                      </motion.div>
                    </TiltCard>
                  ))}
                </div>
              </div>
            </section>

            {/* Section Divider */}
            <div className="section-divider" />

            <div id="engine">
              <HowItWorks />
            </div>

            {/* Section Divider */}
            <div className="section-divider" />

            {/* ═══ Animated Metrics Ribbon ═══ */}
            <section className="py-16 sm:py-24 bg-transparent relative overflow-hidden">
              <div className="container mx-auto px-4 sm:px-6 relative z-10">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
                  <AnimatedCounter end={50} suffix="+" label="Systems Deployed" />
                  <AnimatedCounter end={3} suffix="x" label="Average ROI" />
                  <AnimatedCounter end={24} suffix="/7" label="AI Uptime" />
                  <AnimatedCounter end={20} suffix="+" label="Hours Saved Weekly" />
                </div>
              </div>
            </section>

            {/* Section Divider */}
            <div className="section-divider" />

            <div id="capabilities">
              <DynamicPricing country={country} onBookCall={openBooking} />
              <CustomProjects country={country} onBookCall={openBooking} />
            </div>

            {/* ── ALL UNDER ONE ROOF — CTA conversion block ── */}
            <section className="bg-transparent relative overflow-hidden py-16 sm:py-24">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[700px] h-[300px] bg-white/[0.025] blur-[100px] rounded-full" />
              </div>
              <div className="container mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-10" />
                <p className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-[0.4em] text-white/25 mb-6">
                  The Dizitup Promise
                </p>
                <motion.h2
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="font-heading font-black text-white leading-[0.95] tracking-tight"
                  style={{ fontSize: 'clamp(2.8rem, 9vw, 7.5rem)' }}
                >
                  All Under{' '}
                  <span style={{
                    background: 'linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.5) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    One Roof.
                  </span>
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="mt-6 text-white/40 text-base sm:text-xl max-w-[520px] leading-relaxed"
                >
                  ERP. CRM. Mobile. Branding. AI.{' '}
                  <span className="text-white/70">Everything your business needs</span> — built, scaled, and grown in one place.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.38 }}
                  className="mt-10 flex flex-col sm:flex-row gap-4 items-center"
                >
                  <button
                    onClick={() => openBooking()}
                    className="px-8 sm:px-12 py-4 sm:py-5 bg-white text-black rounded-full font-black text-[11px] uppercase tracking-widest hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.12)] hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95"
                  >
                    Book a Free Strategy Call →
                  </button>
                  <button
                    onClick={() => { const el = document.getElementById('capabilities'); el?.scrollIntoView({ behavior: 'smooth' }); }}
                    className="px-8 py-4 sm:py-5 bg-white/5 border border-white/15 text-white/70 rounded-full font-bold text-[11px] uppercase tracking-widest hover:border-white/30 hover:text-white transition-all"
                  >
                    Explore Services
                  </button>
                </motion.div>
                <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mt-10" />
              </div>
            </section>

            {/* Section Divider */}
            <div className="section-divider" />

            <div id="works">
              <Portfolio />
            </div>

            {/* Section Divider */}
            <div className="section-divider" />

            {/* Final CTA */}
            <section className="py-16 sm:py-28 lg:py-40 container mx-auto px-4 sm:px-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative p-8 sm:p-16 lg:p-24 rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] bg-gradient-to-br from-red-600 to-red-900 overflow-hidden text-center group"
              >


                <div className="relative z-10">
                  <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-heading font-bold text-white mb-8 sm:mb-12 tracking-tighter leading-[0.9] sm:leading-[0.85]">
                    The Future Won't <br /> Wait for Your Brand.
                  </h2>
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <button
                      onClick={() => openBooking()}
                      className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-6 bg-black text-white rounded-full font-bold hover:bg-white hover:text-black transition-all duration-500 uppercase tracking-widest text-xs"
                    >
                      Book a Free AI Strategy Call
                    </button>
                    <button
                      onClick={() => {
                        const el = document.getElementById('pricing');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-6 bg-white/10 text-white rounded-full font-bold hover:bg-white hover:text-black transition-all duration-500 uppercase tracking-widest text-xs border border-white/20"
                    >
                      Get AI Blueprint
                    </button>
                  </div>
                </div>
              </motion.div>
            </section>
          </main>

          <Footer />

          {/* Booking Modal */}
          <BookingModal
            isOpen={bookingOpen}
            onClose={closeBooking}
            prefilledPackage={bookingPackage}
            country={country}
          />

          {/* Auth prompt (login gate before booking) */}
          <AuthModal
            open={authPromptOpen}
            onClose={closeAuthPrompt}
            onLoginSuccess={onBookingLoginSuccess}
          />

          {/* Onboarded client redirect to chat */}
          <ContactAdminModal
            open={contactAdminOpen}
            onClose={closeContactAdmin}
          />

          {/* Floating in-app chat widget (follow_up + onboarded users only) */}
          <ChatWidget />
          </div>

        </motion.div>
      )}
    </div>
  );
};

export default Home;
