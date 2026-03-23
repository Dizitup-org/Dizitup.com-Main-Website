
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ScrollStory from '../components/ScrollStory';
import HowItWorks from '../components/HowItWorks';
import Portfolio from '../components/Portfolio';
import DynamicPricing from '../components/DynamicPricing';
import CustomProjects from '../components/CustomProjects';
import BookingModal from '../components/BookingModal';
import PersonalizationFlow from '../components/PersonalizationFlow';
import type { UserProfile, Country } from '../components/PersonalizationFlow';
import Footer from '../components/Footer';
import WelcomeLoader from '../components/WelcomeLoader';
import CursorGlow from '../components/CursorGlow';
import TiltCard from '../components/TiltCard';
import AnimatedCounter from '../components/AnimatedCounter';
import AuthModal from '../components/AuthModal';
import ContactAdminModal from '../components/ContactAdminModal';
import ChatWidget from '../components/ChatWidget';
import DiziAIChat from '../components/DiziAIChat';
import { useBooking } from '../contexts/BookingContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BrainCircuit, Zap, Target } from 'lucide-react';

type HomePhase = 'loader' | 'personalize' | 'site';

// Trust logos for marquee
const TRUST_LOGOS = ['NEXUS', 'STELLAR', 'AURA', 'VELOCITY', 'QUANTUM', 'APEX', 'CIPHER', 'PRISM'];

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
  const navigate = useNavigate();
  const { isOpen: bookingOpen, packageName: bookingPackage, openBooking, closeBooking, setCountry: setBookingCountry,
    authPromptOpen, closeAuthPrompt, onBookingLoginSuccess,
    contactAdminOpen, closeContactAdmin,
  } = useBooking();

  // Determine initial phase
  const initialPhase = useMemo<HomePhase>(() => {
    const w = window as unknown as { __WELCOME_SHOWN?: boolean; __USER_PROFILE?: UserProfile };
    if (!w.__WELCOME_SHOWN) return 'loader';
    if (!w.__USER_PROFILE) return 'personalize';
    return 'site';
  }, []);

  const [phase, setPhase] = useState<HomePhase>(initialPhase);

  // User profile state
  const cachedProfile = useMemo(() => {
    return (window as unknown as { __USER_PROFILE?: UserProfile }).__USER_PROFILE;
  }, []);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(cachedProfile ?? null);

  const handleLoaderComplete = useCallback(() => {
    (window as unknown as { __WELCOME_SHOWN?: boolean }).__WELCOME_SHOWN = true;
    setPhase('personalize');
  }, []);

  const handlePersonalizationComplete = useCallback((profile: UserProfile) => {
    (window as unknown as { __USER_PROFILE?: UserProfile }).__USER_PROFILE = profile;
    setUserProfile(profile);
    setBookingCountry(profile.country);
    setPhase('site');
  }, [setBookingCountry]);

  const country: Country = userProfile?.country ?? 'Other';

  // Sync country to booking context on mount (if returning user)
  useEffect(() => {
    if (userProfile) setBookingCountry(userProfile.country);
  }, [userProfile, setBookingCountry]);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#050505] text-white selection:bg-red-600 selection:text-white overflow-x-hidden">
      {/* Phase 1: Welcome Animation */}
      <AnimatePresence>
        {phase === 'loader' && (
          <WelcomeLoader onComplete={handleLoaderComplete} />
        )}
      </AnimatePresence>

      {/* Phase 2: Personalization Flow */}
      <AnimatePresence>
        {phase === 'personalize' && (
          <PersonalizationFlow onComplete={handlePersonalizationComplete} />
        )}
      </AnimatePresence>

      {/* Phase 3: Main Site */}
      {phase === 'site' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* Cursor Glow — follows mouse across the whole page */}
          <CursorGlow />

          <Navbar />

          <main>
            <div id="hero">
              <Hero />
            </div>

            {/* Section Divider */}
            <div className="section-divider" />

            <ScrollStory />

            {/* Section Divider */}
            <div className="section-divider" />

            {/* Strategic Pillars */}
            <section className="py-16 sm:py-28 lg:py-40 bg-black relative overflow-hidden">
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
            <section className="py-16 sm:py-24 bg-black relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/[0.02] via-transparent to-red-600/[0.02] pointer-events-none" />
              <div className="container mx-auto px-4 sm:px-6">
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

            {/* Section Divider */}
            <div className="section-divider" />

            <div id="works">
              <Portfolio />
            </div>

            {/* Section Divider */}
            <div className="section-divider" />

            {/* ═══ Infinite Marquee Trust Logos ═══ */}
            <section className="py-16 sm:py-28 lg:py-40 border-y border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-black via-white/[0.01] to-black pointer-events-none" />
              <div className="container mx-auto px-4 sm:px-6 overflow-hidden">
                <div className="marquee-track">
                  {/* Duplicate the logos for seamless infinite scroll */}
                  {[...TRUST_LOGOS, ...TRUST_LOGOS].map((logo, i) => (
                    <span
                      key={i}
                      className="text-xl sm:text-3xl font-heading font-black tracking-tighter italic text-white/10 hover:text-white/30 transition-colors duration-500 mx-8 sm:mx-16 whitespace-nowrap select-none"
                    >
                      {logo}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Final CTA */}
            <section className="py-16 sm:py-28 lg:py-40 container mx-auto px-4 sm:px-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative p-8 sm:p-16 md:p-32 rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] bg-gradient-to-br from-red-600 to-red-900 overflow-hidden text-center group"
              >
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>

                <div className="relative z-10">
                  <h2 className="text-3xl sm:text-5xl md:text-8xl font-heading font-bold text-white mb-8 sm:mb-12 tracking-tighter leading-[0.9]">
                    The Future Won't <br /> Wait for Your Brand.
                  </h2>
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <button
                      onClick={() => navigate('/login')}
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

          {/* Dizi AI Chat Widget - Coming Soon */}
          <DiziAIChat />
        </motion.div>
      )}
    </div>
  );
};

export default Home;
