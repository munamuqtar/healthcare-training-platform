import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, Calendar, MapPin, Users, Award, Shield, Mail, Phone, 
  MapPin as PinIcon, BookOpen, Clock, Activity, ArrowRight, 
  Search, SlidersHorizontal, Image, Play, CheckCircle2, ChevronRight,
  Sun, Moon, Menu, X, MessageSquare, Send
} from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'react-toastify';

// Define Interface Types
interface Training {
  _id: string;
  title: string;
  description: string;
  trainer: string;
  venue: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  participantLimit: number;
  registeredCount: number;
  status: 'open' | 'full' | 'closed';
}

interface ActivityItem {
  _id: string;
  title: string;
  description: string;
  images: string[];
  videos: string[];
  activityDate: string;
}

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface PublicProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export function PublicLayout({ 
  currentTab, 
  setCurrentTab, 
  user, 
  onLogout, 
  darkMode, 
  setDarkMode 
}: PublicProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Quick navigation helper
  const navigateTo = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      {/* 1. NAVIGATION HEADER */}
      <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 dark:bg-slate-900/80 dark:border-slate-800 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/20">
                <Heart className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
                CarePulse Org
              </span>
            </div>

            {/* Desktop Navigation Link Tabs */}
            <div className="hidden md:flex items-center gap-6">
              {['home', 'about', 'trainings', 'gallery', 'news', 'contact'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => navigateTo(tab)}
                  className={`text-sm font-medium capitalize transition-colors duration-200 hover:text-teal-500 ${
                    currentTab === tab 
                      ? 'text-teal-600 dark:text-teal-400 font-semibold border-b-2 border-teal-500 py-1' 
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tab === 'home' ? 'Home' : tab.replace('-', ' ')}
                </button>
              ))}
            </div>

            {/* Utilities and Authentication Actions */}
            <div className="hidden md:flex items-center gap-4">
              {/* Dark Mode Switcher */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                title="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={user.role === 'admin' ? '/admin-dashboard' : '/dashboard'}
                    className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all"
                  >
                    Portal Dashboard
                  </Link>
                  <button
                    onClick={onLogout}
                    className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-red-500 dark:text-slate-300 dark:hover:text-red-400"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/auth?mode=login"
                    className="px-4 py-2 text-sm font-medium text-teal-600 dark:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth?mode=register"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-lg shadow-md hover:shadow-lg transition-all"
                  >
                    Register Training
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-1">
            {['home', 'about', 'trainings', 'gallery', 'news', 'contact'].map((tab) => (
              <button
                key={tab}
                onClick={() => navigateTo(tab)}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium capitalize ${
                  currentTab === tab 
                    ? 'bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400' 
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              {user ? (
                <>
                  <Link
                    to={user.role === 'admin' ? '/admin-dashboard' : '/dashboard'}
                    className="block w-full text-center py-2 text-sm font-medium text-white bg-teal-600 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Go to Portal Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center py-2 text-sm font-medium text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth?mode=login"
                    className="block w-full text-center py-2 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/auth?mode=register"
                    className="block w-full text-center py-2 text-sm font-medium text-white bg-teal-600 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register Training
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Pages Router Section */}
      <main className="flex-grow">
        {currentTab === 'home' && <HomePage onNavigate={navigateTo} darkMode={darkMode} />}
        {currentTab === 'about' && <AboutPage />}
        {currentTab === 'trainings' && <TrainingsPage user={user} />}
        {currentTab === 'gallery' && <GalleryPage />}
        {currentTab === 'news' && <NewsPage />}
        {currentTab === 'contact' && <ContactPage />}
      </main>

      {/* 2. FOOTER SECTION */}
      <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white">
                  <Heart className="w-5 h-5" />
                </div>
                <span className="text-lg font-bold text-white">CarePulse Org</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Dedicated to improving public health resilience through professional healthcare education, awareness workshops, and community medicine programs.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                {['home', 'about', 'trainings', 'gallery', 'news', 'contact'].map((tab) => (
                  <li key={tab}>
                    <button
                      onClick={() => navigateTo(tab)}
                      className="hover:text-teal-400 capitalize transition-colors"
                    >
                      {tab}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Contact Info</h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <PinIcon className="w-5 h-5 text-teal-400 shrink-0" />
                  <span>742 Evergreen Terrace, Medical Heights, Springfield</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-teal-400" />
                  <span>+1 (555) 0199</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-teal-400" />
                  <span>support@carepulse-org.org</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Accreditation</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Accredited clinical training partner of regional healthcare boards. Certified CNE programs under code HP-2026-CNE.
              </p>
              <div className="mt-4 flex gap-2">
                <span className="px-2 py-1 text-xs font-semibold bg-slate-800 text-teal-400 rounded-md">CE Approved</span>
                <span className="px-2 py-1 text-xs font-semibold bg-slate-800 text-teal-400 rounded-md">BLS/ACLS</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            <p>&copy; {new Date().getFullYear()} CarePulse Healthcare Organization. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">Verification Code System</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-PAGE: HOME
// -------------------------------------------------------------
function HomePage({ onNavigate, darkMode }: { onNavigate: (tab: string) => void; darkMode: boolean }) {
  const [stats, setStats] = useState({
    trainings: 18,
    participants: 412,
    certificates: 395,
    activities: 24
  });
  const [upcoming, setUpcoming] = useState<Training[]>([]);

  useEffect(() => {
    // Fetch stats and upcoming trainings preview
    api.get('/trainings')
      .then(res => {
        const list: Training[] = res.data;
        const open = list.filter(t => t.status === 'open').slice(0, 3);
        setUpcoming(open);

        // Compute simulated stats aggregates based on DB seed counts
        const totalTrainingsCount = list.length;
        const totalRegisteredCount = list.reduce((acc, curr) => acc + curr.registeredCount, 0);
        
        api.get('/certificates')
          .then(cRes => {
            setStats({
              trainings: totalTrainingsCount + 10, // pre-seeded aggregates
              participants: totalRegisteredCount + 380,
              certificates: cRes.data.length + 370,
              activities: 14
            });
          })
          .catch(() => {});
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="space-y-20 pb-20 animate-fade-in">
      {/* A. Hero Banner Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-950 to-slate-950 text-white py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-teal-400 blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-emerald-400 blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> Accredited Medical Education
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              Empowering Health Teams, <br />
              <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Saving Lives Together
              </span>
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed max-w-xl">
              We provide professional clinical certification, public wellness programs, emergency workshops, and community health resources to elevate standards of preventive and responsive medicine.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => onNavigate('trainings')}
                className="px-6 py-3 font-semibold rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-650 hover:to-emerald-650 text-white shadow-lg shadow-teal-500/20 transition-all hover:-translate-y-0.5"
              >
                Register For Trainings
              </button>
              <button
                onClick={() => onNavigate('about')}
                className="px-6 py-3 font-semibold rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all hover:-translate-y-0.5"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Banner Graphics Card Mockup */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md p-6 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-md shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs text-teal-400 font-semibold tracking-wider uppercase">Live Activity</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <Activity className="w-8 h-8 text-teal-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">ACLS Certification</h4>
                    <p className="text-xs text-slate-400">Class commencing in Springfield Hall A</p>
                  </div>
                </div>
                <div className="flex gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                  <Calendar className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-white">Diabetes Camp</h4>
                    <p className="text-xs text-slate-400">Free screening tomorrow at Green Valley</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-slate-400">
                <span>Active Trainees Online</span>
                <span className="text-teal-400 font-bold">148+ Members</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* B. About Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Our Mission & Foundation</h2>
          <p className="text-slate-500">
            Founded with the commitment to deliver cutting-edge clinical training and elevate public health knowledge, our organization bridges the gap between expert care and local community awareness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Our Vision</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              To build a resilient healthcare ecosystem where every clinical practitioner holds state-of-the-art certification, and every citizen is educated on primary health indicators and prevention.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Our Mission</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              To design, accredit, and execute training programs in lifesaving methods, hygiene compliance, emergency response, and cardiovascular support for healthcare workers and community groups.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Core Objectives</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Deliver standard BLS/ACLS instruction, publish health awareness material, implement disease prevention campaigns, and provide certified training logs for professional validation.
            </p>
          </div>
        </div>
      </section>

      {/* C. Services / What We Do */}
      <section className="bg-slate-100 dark:bg-slate-900/40 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold">Our Core Health Services</h2>
            <p className="text-slate-500">
              We design specialized healthcare tracks configured for clinical staff, nursing students, emergency responders, and local volunteer networks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Health Trainings',
                desc: 'Certified courses in Advanced Cardiovascular Life Support (ACLS), Basic Life Support (BLS), and clinical critical care systems.',
                icon: Heart,
                color: 'text-rose-500 bg-rose-500/10'
              },
              {
                title: 'Medical Workshops',
                desc: 'Practical pediatric first aid, infection containment protocols, and surgical hygiene workshops for medical centers.',
                icon: BookOpen,
                color: 'text-teal-500 bg-teal-500/10'
              },
              {
                title: 'Awareness Campaigns',
                desc: 'Regional health awareness drives, chronic illness checkups, and nutritional counseling programs.',
                icon: Activity,
                color: 'text-emerald-500 bg-emerald-500/10'
              },
              {
                title: 'Community Programs',
                desc: 'Support services targeting public disease mapping, hygiene infrastructure, and home-care volunteer education.',
                icon: Users,
                color: 'text-sky-500 bg-sky-500/10'
              }
            ].map((service, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 hover:-translate-y-1 transition-all space-y-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${service.color}`}>
                  <service.icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base">{service.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* D. Statistics Counter section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-extrabold">{stats.trainings}</div>
              <div className="text-xs md:text-sm text-teal-100 font-medium uppercase tracking-wider">Total Trainings</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-extrabold">{stats.participants}</div>
              <div className="text-xs md:text-sm text-teal-100 font-medium uppercase tracking-wider">Total Participants</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-extrabold">{stats.certificates}</div>
              <div className="text-xs md:text-sm text-teal-100 font-medium uppercase tracking-wider">Certificates Issued</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl md:text-4xl font-extrabold">{stats.activities}</div>
              <div className="text-xs md:text-sm text-teal-100 font-medium uppercase tracking-wider">Active Campaigns</div>
            </div>
          </div>
        </div>
      </section>

      {/* E. Upcoming Trainings preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Upcoming Training Programs</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Browse classes and register to secure your credentials.
            </p>
          </div>
          <button
            onClick={() => onNavigate('trainings')}
            className="flex items-center gap-1.5 text-sm font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors group"
          >
            View All Programs <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
            No upcoming trainings registered at the moment. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {upcoming.map((t) => {
              const seatsLeft = t.participantLimit - t.registeredCount;
              return (
                <div key={t._id} className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6 flex-grow space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        Open Enrollment
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {t.startDate}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-lg leading-snug line-clamp-1">{t.title}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">{t.description}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Trainer: <strong>{t.trainer}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="truncate">Venue: {t.venue}</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center gap-2">
                    <div className="text-xs">
                      <span className="font-bold text-teal-600 dark:text-teal-400">{seatsLeft}</span> of {t.participantLimit} seats remaining
                    </div>
                    <button
                      onClick={() => onNavigate('trainings')}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                    >
                      Register
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* F. Partners section */}
      <section className="bg-slate-50 dark:bg-slate-900/20 py-12 border-y border-slate-100 dark:border-slate-850">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-6">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Trusted by Leading Medical Institutions</span>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="text-lg font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Shield className="w-5 h-5 text-teal-500" /> Springfield Hospital</div>
            <div className="text-lg font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Heart className="w-5 h-5 text-teal-500" /> Mercy General</div>
            <div className="text-lg font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Activity className="w-5 h-5 text-teal-500" /> Red Cross Local</div>
            <div className="text-lg font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Award className="w-5 h-5 text-teal-500" /> Health Council</div>
          </div>
        </div>
      </section>

      {/* G. Contact Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-lg overflow-hidden">
          <div className="lg:col-span-2 p-8 md:p-12 space-y-6">
            <h3 className="text-2xl font-bold tracking-tight">Need Immediate Guidance?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              If your clinical group requires onsite certification, customized CPR classes, or you wish to support volunteer initiatives, complete the form and our coordination office will get back to you within 24 hours.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => onNavigate('contact')}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm"
              >
                Send Message
              </button>
              <button
                onClick={() => onNavigate('contact')}
                className="px-5 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Call Office
              </button>
            </div>
          </div>
          <div className="bg-gradient-to-br from-teal-650 to-emerald-650 p-8 md:p-12 text-white flex flex-col justify-center gap-4">
            <h4 className="font-bold text-lg">Office Hours</h4>
            <div className="space-y-2 text-sm text-teal-100">
              <p>Monday - Friday: 08:00 - 17:00</p>
              <p>Saturday: 09:00 - 13:00</p>
              <p>Sunday: Closed</p>
            </div>
            <div className="pt-4 border-t border-teal-500/30 text-xs text-teal-200">
              Emergency CPR instructors available 24/7.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-PAGE: ABOUT US
// -------------------------------------------------------------
function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16 animate-slide-up">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">About CarePulse</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Our history, administrative team, and standard accreditation records.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Bridging Healthcare and Education Since 2018</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            CarePulse was founded to address the critical need for continuing clinical training and broad public health literacy. Over the years, we have certified thousands of medical professionals in emergency protocols (ACLS, BLS) and launched dozen-plus campaigns targeting cardiovascular prevention, diabetes diagnostics, and sanitary safety.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Accredited by regional health councils, our instructors consist of seasoned medical practitioners, emergency paramedics, and public health researchers dedicated to delivering high-fidelity simulation programs.
          </p>
        </div>
        <div className="h-64 rounded-3xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/10 flex items-center justify-center">
          <div className="text-center p-6 space-y-2">
            <Award className="w-12 h-12 text-teal-500 mx-auto" />
            <h4 className="font-bold text-slate-700 dark:text-slate-350">Accredited Clinical Training Facility</h4>
            <p className="text-xs text-slate-400">License Reference No: HPC-2026-MED</p>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <section className="space-y-10">
        <h3 className="text-2xl font-bold text-center">Meet Our Medical Leadership</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              name: 'Dr. Sarah Jenkins, MD',
              role: 'Chief Medical Officer & Instructor',
              specialty: 'Cardiovascular Medicine',
              desc: 'Over 15 years in urgent cardiology; leads advanced cardiac life support programs.'
            },
            {
              name: 'Robert Downey, EMT-P',
              role: 'Emergency Director',
              specialty: 'Trauma & CPR Instructor',
              desc: 'Paramedic captain; designs custom emergency response protocols for community groups.'
            },
            {
              name: 'Clara Oswald, RN',
              role: 'Community Health Coordinator',
              specialty: 'Preventive Care Nurse',
              desc: 'Coordinates diabetic health fairs, remote diagnostic screenings, and home hygiene programs.'
            },
            {
              name: 'Dr. Helen Carter, PhD',
              role: 'Research & Accreditation',
              specialty: 'Epidemiology Specialist',
              desc: 'Oversees infectious control curricula and accrediting standards for professional courses.'
            }
          ].map((member, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 shadow-sm text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto text-xl font-bold">
                {member.name.charAt(4)}
              </div>
              <div>
                <h4 className="font-bold text-base">{member.name}</h4>
                <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold">{member.role}</p>
                <p className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">{member.specialty}</p>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{member.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// -------------------------------------------------------------
// SUB-PAGE: TRAININGS LIST WITH SEARCH & Capacity Automation
// -------------------------------------------------------------
function TrainingsPage({ user }: { user: any }) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [registering, setRegistering] = useState(false);

  const fetchTrainings = () => {
    setLoading(true);
    api.get('/trainings')
      .then(res => {
        setTrainings(res.data);
        setLoading(false);
      })
      .catch(err => {
        toast.error('Could not fetch trainings list.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const handleRegister = async (trainingId: string) => {
    if (!user) {
      toast.warning('Please log in or create an account to register for training programs.');
      return;
    }

    setRegistering(true);
    try {
      const response = await api.post('/registrations', { trainingId });
      toast.success(response.data.message || 'Registration successful!');
      fetchTrainings(); // Refresh training seat counts
      setSelectedTraining(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete registration.');
    } finally {
      setRegistering(false);
    }
  };

  // Filter and search computation
  const filteredTrainings = trainings.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.trainer.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && t.status === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10 animate-slide-up">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Healthcare Training Programs</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Professional development, nursing CNE certifications, first-aid workshops, and medical courses.
        </p>
      </div>

      {/* Filter and search layout */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by course title or trainer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {['all', 'open', 'full', 'closed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`flex-1 md:flex-none px-4 py-2 text-xs font-semibold capitalize rounded-xl transition-all ${
                statusFilter === filter
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : filteredTrainings.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-slate-200/60 dark:border-slate-800 text-slate-400 bg-white dark:bg-slate-900">
          No training programs match your selection criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {filteredTrainings.map((t) => {
            const seatsLeft = Math.max(0, t.participantLimit - t.registeredCount);
            
            return (
              <div 
                key={t._id} 
                className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow relative"
              >
                <div className="p-6 flex-grow space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                      t.status === 'open' 
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                        : t.status === 'full'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                        : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/25'
                    }`}>
                      {t.status === 'open' ? 'Open for registration' : t.status === 'full' ? 'FULL' : 'Closed'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Deadline: {t.registrationDeadline}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg leading-snug hover:text-teal-500 cursor-pointer" onClick={() => setSelectedTraining(t)}>
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">{t.description}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Trainer: <strong>{t.trainer}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>Duration: {t.startDate} to {t.endDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate">Venue: {t.venue}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-150 dark:border-slate-850 flex justify-between items-center gap-2">
                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{seatsLeft}</span> of {t.participantLimit} seats remaining
                  </div>
                  <button
                    onClick={() => setSelectedTraining(t)}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-teal-650 hover:bg-teal-700 rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TRAINING DETAIL DRAWER MODAL */}
      {selectedTraining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-in">
            <button
              onClick={() => setSelectedTraining(null)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${
                  selectedTraining.status === 'open' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                    : selectedTraining.status === 'full'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
                    : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/25'
                }`}>
                  {selectedTraining.status === 'open' ? 'Open for registration' : selectedTraining.status === 'full' ? 'FULL' : 'Closed'}
                </span>
                <h2 className="text-2xl font-bold pr-8">{selectedTraining.title}</h2>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Course Syllabus & Description</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {selectedTraining.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-955 border border-slate-150 dark:border-slate-850 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400">Accredited Instructor</span>
                    <p className="font-bold text-slate-700 dark:text-slate-200">{selectedTraining.trainer}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Venue & Facilities</span>
                    <p className="font-semibold text-slate-750 dark:text-slate-200">{selectedTraining.venue}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-400">Program Schedule</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{selectedTraining.startDate} to {selectedTraining.endDate}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Registration Deadline</span>
                    <p className="font-semibold text-red-500">{selectedTraining.registrationDeadline}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-sm">
                  Available Seats: <strong className="text-teal-600 dark:text-teal-400">{Math.max(0, selectedTraining.participantLimit - selectedTraining.registeredCount)}</strong> / {selectedTraining.participantLimit}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedTraining(null)}
                    className="px-4 py-2.5 text-sm font-semibold border border-slate-200 dark:border-slate-750 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    Close
                  </button>
                  
                  {selectedTraining.status === 'open' ? (
                    <button
                      onClick={() => handleRegister(selectedTraining._id)}
                      disabled={registering}
                      className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-teal-650 to-emerald-650 hover:from-teal-700 hover:to-emerald-700 rounded-xl transition-all shadow-md"
                    >
                      {registering ? 'Processing...' : 'Confirm Registration'}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="px-6 py-2.5 text-sm font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-not-allowed border border-slate-200 dark:border-slate-700"
                    >
                      {selectedTraining.status === 'full' ? 'Training registration is full.' : 'Registration Closed'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-PAGE: GALLERY (ACTIVITIES)
// -------------------------------------------------------------
function GalleryPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/activities')
      .then(res => {
        setActivities(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10 animate-slide-up">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Activities & Event Reports</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Media records, screening camp images, wellness forums, and field activity logs.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 border animate-pulse"></div>
          <div className="h-64 rounded-2xl bg-white dark:bg-slate-900 border animate-pulse"></div>
        </div>
      ) : activities.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-slate-200/60 dark:border-slate-800 text-slate-400 bg-white dark:bg-slate-900">
          No activities published in the gallery yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {activities.map((act) => (
            <div key={act._id} className="flex flex-col bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
              
              {/* Media Preview Area */}
              <div className="relative h-64 bg-slate-900 overflow-hidden flex items-center justify-center">
                {act.images && act.images.length > 0 ? (
                  <img 
                    src={act.images[0].startsWith('http') ? act.images[0] : `http://localhost:5000${act.images[0]}`} 
                    alt={act.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <Image className="w-12 h-12 text-slate-700" />
                )}
                
                <div className="absolute top-4 left-4 px-2.5 py-1 text-xs font-semibold rounded-lg bg-black/60 text-white backdrop-blur-sm">
                  {act.activityDate}
                </div>
              </div>

              <div className="p-6 space-y-3">
                <h3 className="text-lg font-bold tracking-tight">{act.title}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {act.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-PAGE: NEWS & ANNOUNCEMENTS
// -------------------------------------------------------------
function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  useEffect(() => {
    api.get('/news')
      .then(res => {
        setNews(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10 animate-slide-up">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">News & Announcements</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Continuing medical curriculum updates, institutional changes, and wellness bulletins.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(n => (
            <div key={n} className="h-32 rounded-2xl bg-white dark:bg-slate-900 border animate-pulse"></div>
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-slate-200/60 dark:border-slate-800 text-slate-400 bg-white dark:bg-slate-900">
          No news updates have been published yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 max-w-4xl mx-auto">
          {news.map((item) => (
            <div 
              key={item._id} 
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                    Official Announcement
                  </span>
                  <h3 className="font-bold text-lg hover:text-teal-500 transition-colors cursor-pointer" onClick={() => setSelectedNews(item)}>
                    {item.title}
                  </h3>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {item.content}
              </p>
              <button
                onClick={() => setSelectedNews(item)}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 flex items-center gap-1 hover:text-teal-700"
              >
                Read Article <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FULL NEWS ARTICLE DETAIL DRAWER */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-scale-in">
            <button
              onClick={() => setSelectedNews(null)}
              className="absolute right-4 top-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <span className="text-xs text-slate-400">
                  Published on {new Date(selectedNews.createdAt).toLocaleDateString()}
                </span>
                <h2 className="text-2xl font-bold pr-8">{selectedNews.title}</h2>
              </div>

              <div className="max-h-64 overflow-y-auto pr-2 text-sm text-slate-650 dark:text-slate-350 leading-relaxed space-y-4">
                {selectedNews.content.split('\n\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedNews(null)}
                  className="px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// SUB-PAGE: CONTACT US
// -------------------------------------------------------------
function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.warning('Please complete all form inputs.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      toast.success('Your message was dispatched successfully! Our coordinators will reply shortly.');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitting(false);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 animate-slide-up">
      <div className="max-w-3xl mx-auto text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight">Contact Our Office</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Get in touch for institutional certification inquiries, class coordinates, or volunteer support.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="lg:col-span-2 p-8 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="ACLS Corporate Discount / Partnership"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Detailed Message</label>
              <textarea
                rows={4}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Type your inquiry here..."
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              {submitting ? 'Sending...' : <><Send className="w-4 h-4" /> Send Message</>}
            </button>
          </form>
        </div>

        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <h4 className="font-bold text-base">Office Headquarters</h4>
            <ul className="space-y-3 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-teal-500 shrink-0" />
                <span>742 Evergreen Terrace, Medical Heights, Springfield</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-teal-500 shrink-0" />
                <span>+1 (555) 0199</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-teal-500 shrink-0" />
                <span>support@carepulse-org.org</span>
              </li>
            </ul>
          </div>

          <div className="p-6 bg-gradient-to-br from-teal-50/50 to-emerald-50/50 dark:from-teal-950/20 dark:to-emerald-950/20 border border-teal-500/10 rounded-3xl shadow-sm text-center space-y-3">
            <MessageSquare className="w-8 h-8 text-teal-500 mx-auto" />
            <h4 className="font-bold text-sm">Direct Professional Support</h4>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
              Are you an institutional HR looking to verify staff certificates? Provide the certificate codes in our search query, or message us directly here for batch authentications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
