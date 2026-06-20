import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Heart, Mail, Lock, Phone, User, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';
import { api } from '../services/api';
import { toast } from 'react-toastify';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify'>(initialMode);
  
  const [loading, setLoading] = useState(false);
  const [tempEmail, setTempEmail] = useState('');
  const [tempUserId, setTempUserId] = useState('');

  useEffect(() => {
    const queryMode = searchParams.get('mode');
    if (queryMode === 'register') setMode('register');
    else if (queryMode === 'login') setMode('login');
  }, [searchParams]);

  // React Hook Form setups
  const { register: loginReg, handleSubmit: handleLoginSubmit, reset: resetLogin } = useForm();
  const { register: signupReg, handleSubmit: handleSignupSubmit, watch, reset: resetSignup } = useForm();
  const { register: forgotReg, handleSubmit: handleForgotSubmit } = useForm();
  const { register: verifyReg, handleSubmit: handleVerifySubmit } = useForm();

  const watchPassword = watch('password');

  // LOGIN HANDLER
  const onLogin = async (data: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: data.email,
        password: data.password
      });

      const { accessToken, refreshToken, user } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success(`Welcome back, ${user.name}!`);
      
      // Dispatch authentication change state
      window.dispatchEvent(new Event('auth-change'));
      
      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // SIGNUP HANDLER
  const onSignup = async (data: any) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.confirmPassword
      });

      const { accessToken, refreshToken, user } = response.data;
      
      // Capture details for simulated verification screen
      setTempEmail(data.email);
      setTempUserId(user.id);
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success('Registration successful! Verification code sent to email.');
      setMode('verify');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // FORGOT PASSWORD HANDLER
  const onForgot = (data: any) => {
    setLoading(true);
    // Simulate sending forgot email OTP
    setTimeout(() => {
      setTempEmail(data.email);
      toast.success(`A password reset verification code has been sent to ${data.email}`);
      setMode('verify');
      setLoading(false);
    }, 1000);
  };

  // VERIFICATION CODE HANDLER
  const onVerifyCode = (data: any) => {
    if (data.code !== '123456') {
      toast.error('Invalid verification code. Use demo code "123456".');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      toast.success('Account successfully verified!');
      window.dispatchEvent(new Event('auth-change'));
      
      // Check current user role to redirect
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (user && user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full bg-teal-500/10 blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl"></div>

      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-950/80 border border-slate-800 shadow-2xl backdrop-blur-md space-y-6">
        
        {/* Brand Logotype */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center justify-center gap-1.5 mb-2 group">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-white">
              <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-lg font-bold text-white">CarePulse Org</span>
          </Link>
          <h2 className="text-xl font-bold tracking-tight text-white capitalize">
            {mode === 'login' && 'Sign in to account'}
            {mode === 'register' && 'Create practitioner account'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'verify' && 'Verify credentials'}
          </h2>
          <p className="text-xs text-slate-400">
            {mode === 'login' && 'Enter your authorization credentials below.'}
            {mode === 'register' && 'Sign up to register and track continuing CNE courses.'}
            {mode === 'forgot' && 'We will verify code OTP to reset your passcode.'}
            {mode === 'verify' && `Verification code sent. Use demo code "123456".`}
          </p>
        </div>

        {/* 1. LOGIN CARD VIEW */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4 text-slate-300">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-450 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  {...loginReg('email')}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-450">Password</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-teal-400 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  {...loginReg('password')}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl transition-all shadow-lg shadow-teal-500/10"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* 2. REGISTRATION CARD VIEW */}
        {mode === 'register' && (
          <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-4 text-slate-350">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  {...signupReg('name')}
                  placeholder="Dr. John Doe"
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 focus:outline-none text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  {...signupReg('email')}
                  placeholder="drjohn@example.com"
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 focus:outline-none text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  {...signupReg('phone')}
                  placeholder="+1 (555) 0122"
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 focus:outline-none text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Password</label>
                <input
                  type="password"
                  required
                  {...signupReg('password')}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 focus:outline-none text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Confirm</label>
                <input
                  type="password"
                  required
                  {...signupReg('confirmPassword')}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 focus:outline-none text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl transition-all"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {/* 3. FORGOT PASSWORD VIEW */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotSubmit(onForgot)} className="space-y-4 text-slate-300">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-450 mb-1">Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  {...forgotReg('email')}
                  placeholder="doctor@example.com"
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-800 bg-slate-900 focus:outline-none text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-all"
            >
              {loading ? 'Dispatched request...' : 'Send Verification Code'}
            </button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          </form>
        )}

        {/* 4. VERIFICATION / OTP SCREEN VIEW */}
        {mode === 'verify' && (
          <form onSubmit={handleVerifySubmit(onVerifyCode)} className="space-y-4 text-slate-350">
            <div className="flex justify-center mb-2">
              <ShieldCheck className="w-12 h-12 text-teal-400" />
            </div>
            <div>
              <label className="block text-center text-xs font-semibold text-slate-400 mb-2">
                Enter 6-Digit OTP Verification Code
              </label>
              <div className="relative max-w-xs mx-auto">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  {...verifyReg('code')}
                  placeholder="123456"
                  className="w-full pl-9 pr-4 py-2 text-sm text-center font-bold tracking-widest rounded-xl border border-slate-850 bg-slate-900 focus:outline-none text-white focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all"
            >
              {loading ? 'Verifying...' : 'Verify & Continue'}
            </button>

            <div className="text-center text-[10px] text-slate-500 space-y-1">
              <p>For review testing, use default demo code: <strong className="text-teal-400 font-bold">123456</strong></p>
              <button 
                type="button"
                onClick={() => toast.info('Verification code re-sent. Check "123456".')}
                className="text-teal-500 hover:underline"
              >
                Resend Code
              </button>
            </div>
          </form>
        )}

        {/* Authentication Card Bottom Switcher */}
        {mode !== 'verify' && (
          <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-405">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button onClick={() => setMode('register')} className="text-teal-400 hover:underline font-semibold">
                  Create Account
                </button>
              </p>
            ) : (
              <p>
                Already have a practitioner account?{' '}
                <button onClick={() => setMode('login')} className="text-teal-400 hover:underline font-semibold">
                  Sign In
                </button>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
