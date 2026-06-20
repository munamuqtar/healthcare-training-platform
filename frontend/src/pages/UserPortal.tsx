import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, Calendar, Award, Bell, Shield, Key, Mail, Phone, BookOpen, 
  MapPin, Clock, Download, AlertCircle, CheckCircle, ArrowLeft, LogOut
} from 'lucide-react';
import { api, logoutUser } from '../services/api';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import confetti from 'canvas-confetti';

interface Registration {
  _id: string;
  attendanceStatus: 'pending' | 'present' | 'absent';
  completionStatus: 'ongoing' | 'completed' | 'failed';
  registeredAt: string;
  trainingDetail: {
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    trainer: string;
    venue: string;
  };
}

interface Certificate {
  _id: string;
  certificateNumber: string;
  issuedDate: string;
  userDetail: {
    name: string;
    email: string;
  };
  trainingDetail: {
    title: string;
    startDate: string;
    endDate: string;
    trainer: string;
  };
}

export default function UserPortal() {
  const [activeTab, setActiveTab] = useState<'profile' | 'trainings' | 'certificates' | 'notifications'>('trainings');
  const [user, setUser] = useState<any>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Profile forms
  const { register: profileReg, handleSubmit: handleProfileSubmit, setValue } = useForm();
  const { register: passwordReg, handleSubmit: handlePasswordSubmit, reset: resetPasswordForm } = useForm();

  const fetchUserData = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsed = JSON.parse(userStr);
      setUser(parsed);
      setValue('name', parsed.name);
      setValue('email', parsed.email);
      setValue('phone', parsed.phone);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const response = await api.get('/registrations/my');
      setRegistrations(response.data);

      // Extract notifications based on course dates
      const newNotifications: any[] = [];
      response.data.forEach((reg: Registration) => {
        const start = new Date(reg.trainingDetail.startDate);
        const diffTime = start.getTime() - Date.now();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0 && diffDays <= 3) {
          newNotifications.push({
            id: reg._id,
            title: 'Upcoming Course Reminder',
            message: `Your registered training course "${reg.trainingDetail.title}" starts in ${diffDays} day(s) at ${reg.trainingDetail.venue}.`,
            date: reg.trainingDetail.startDate,
            type: 'reminder'
          });
        }
      });
      setNotifications(newNotifications);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    }
  };

  const fetchCertificates = async () => {
    try {
      const response = await api.get('/certificates');
      setCertificates(response.data);
    } catch (err) {
      console.error('Error fetching certificates:', err);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchRegistrations();
    fetchCertificates();
  }, [setValue]);

  // UPDATE PROFILE INFO
  const onUpdateProfile = async (data: any) => {
    setLoading(true);
    try {
      const response = await api.put('/auth/profile', {
        name: data.name,
        email: data.email,
        phone: data.phone
      });
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      toast.success('Profile details updated successfully.');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not update profile.');
    } finally {
      setLoading(false);
    }
  };

  // CHANGE PASSWORD
  const onChangePassword = async (data: any) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/profile', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Your password has been changed.');
      resetPasswordForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  // GENERATE PDF CERTIFICATE CLIENT SIDE (High Fidelity Canvas PDF)
  const downloadCertificatePDF = (cert: Certificate) => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [842, 595] // A4 Landscape size
      });

      // 1. Decorative Borders and Canvas setup
      doc.setFillColor(248, 250, 252); // Soft light slate bg
      doc.rect(0, 0, 842, 595, 'F');

      // Double lines outer border
      doc.setDrawColor(15, 118, 110); // Primary Deep Teal
      doc.setLineWidth(6);
      doc.rect(20, 20, 802, 555);

      doc.setDrawColor(16, 185, 129); // Secondary Emerald Green
      doc.setLineWidth(2);
      doc.rect(28, 28, 786, 539);

      // Corner geometric graphics (simulated watermark)
      doc.setFillColor(15, 118, 110, 0.05);
      doc.circle(28, 28, 60, 'F');
      doc.circle(814, 28, 60, 'F');
      doc.circle(28, 567, 60, 'F');
      doc.circle(814, 567, 60, 'F');

      // 2. Header
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139);
      doc.text('NATIONAL CLINICAL EDUCATION BOARD ACCREDITATION', 421, 80, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(15, 118, 110);
      doc.text('CERTIFICATE OF COMPLETION', 421, 120, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139);
      doc.text('This credential is proudly awarded to', 421, 170, { align: 'center' });

      // 3. Recipient Name
      doc.setFont('Times-BoldItalic', 'italic');
      doc.setFontSize(36);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text(cert.userDetail?.name || 'Practitioner Name', 421, 220, { align: 'center' });

      // Border line under name
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1);
      doc.line(221, 240, 621, 240);

      // 4. Training Description
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139);
      doc.text('for successfully attending and completing all continuing hours in the accredited course', 421, 275, { align: 'center' });

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129); // Secondary Emerald Green
      doc.text(cert.trainingDetail?.title || 'Advanced Clinical Training Program', 421, 315, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(100, 116, 139);
      doc.text(`Conducted by Chief Instructor ${cert.trainingDetail?.trainer || 'Specialist Officer'}`, 421, 345, { align: 'center' });
      doc.text(`Issued Date: ${new Date(cert.issuedDate).toLocaleDateString()}`, 421, 365, { align: 'center' });

      // 5. Signatures and Seals Section
      // Signature Left
      doc.setDrawColor(148, 163, 184);
      doc.line(100, 460, 260, 460);
      doc.setFontSize(10);
      doc.text('TRAINING DIRECTOR', 180, 475, { align: 'center' });
      doc.setFont('Times-Italic', 'italic');
      doc.setFontSize(14);
      doc.text('Dr. Sarah Jenkins', 180, 450, { align: 'center' });

      // Seal Middle
      doc.setDrawColor(15, 118, 110);
      doc.setLineWidth(2);
      doc.circle(421, 450, 28);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(6);
      doc.text('ACCREDITED', 421, 448, { align: 'center' });
      doc.text('BOARD', 421, 455, { align: 'center' });

      // Signature Right
      doc.setDrawColor(148, 163, 184);
      doc.line(582, 460, 742, 460);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('CarePulse Registrar', 662, 475, { align: 'center' });
      doc.setFont('Times-Italic', 'italic');
      doc.setFontSize(14);
      doc.text('Robert Downey', 662, 450, { align: 'center' });

      // 6. Verification metadata bottom
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Certificate Verification Code: ${cert.certificateNumber}`, 421, 525, { align: 'center' });
      doc.text('Verify credentials online at: verify.carepulse-org.org', 421, 538, { align: 'center' });

      // Confetti burst on successful download trigger
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Save PDF
      doc.save(`Certificate-${cert.certificateNumber}.pdf`);
      toast.success('Certificate download completed.');
    } catch (error) {
      console.error(error);
      toast.error('Could not generate PDF. Please try again.');
    }
  };

  const handleLogout = () => {
    logoutUser();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      
      {/* Portal Navbar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-teal-500" />
          <span className="font-bold text-lg">Practitioner Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold leading-none">{user?.name}</p>
            <p className="text-[10px] text-teal-650 dark:text-teal-400 capitalize font-medium mt-0.5">{user?.role} Account</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 transition-all"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Grid Portal */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Nav */}
        <aside className="space-y-2">
          {[
            { id: 'trainings', name: 'My Trainings', icon: BookOpen },
            { id: 'certificates', name: 'My Certificates', icon: Award },
            { id: 'notifications', name: 'Notifications', icon: Bell },
            { id: 'profile', name: 'Profile Settings', icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-slate-650 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
                {tab.id === 'notifications' && notifications.length > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold">
                    {notifications.length}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-8">
            <a
              href="/"
              className="flex items-center justify-center gap-1.5 w-full py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Public Site
            </a>
          </div>
        </aside>

        {/* Workspace Area */}
        <main className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200/65 dark:border-slate-800 rounded-3xl p-6 sm:p-8 min-h-[500px]">
          
          {/* TAB 1: MY REGISTERED COURSES */}
          {activeTab === 'trainings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">My Registered Programs</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage enrollment statuses and attendance confirmations.</p>
              </div>

              {registrations.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                  <p>You are not registered for any health trainings yet.</p>
                  <a href="/" className="inline-block mt-4 px-4 py-2 text-xs font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700">
                    Browse Courses
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {registrations.map((reg) => (
                    <div 
                      key={reg._id} 
                      className="p-5 rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-1 md:grid-cols-3 gap-4 items-center"
                    >
                      <div className="md:col-span-2 space-y-2">
                        <h4 className="font-bold text-base">{reg.trainingDetail?.title}</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-550 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 shrink-0" /> {reg.trainingDetail?.startDate}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" /> {reg.trainingDetail?.venue}</span>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                        {/* Enrollment Indicators */}
                        <div className="flex flex-col gap-1 items-end">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
                            reg.completionStatus === 'completed' 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                              : reg.completionStatus === 'ongoing'
                              ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/25'
                              : 'bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/25'
                          }`}>
                            Course: {reg.completionStatus}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            Attendance: <strong className="capitalize">{reg.attendanceStatus}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CERTIFICATES TAB */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">Earned Professional Credentials</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Download CNE/CPR clinical course certificate credentials.</p>
              </div>

              {certificates.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400">
                  <p>No certificates issued yet. Complete a registered course to unlock credentials.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certificates.map((cert) => (
                    <div 
                      key={cert._id} 
                      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col justify-between h-44 shadow-sm"
                    >
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-teal-650 dark:text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                          Verified Certificate
                        </span>
                        <h4 className="font-bold text-sm leading-snug line-clamp-2">{cert.trainingDetail?.title}</h4>
                        <p className="text-[10px] text-slate-400">Issued on: {new Date(cert.issuedDate).toLocaleDateString()}</p>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-850 flex justify-between items-center text-xs">
                        <span className="font-mono text-[10px] text-slate-450 truncate pr-2" title={cert.certificateNumber}>
                          {cert.certificateNumber}
                        </span>
                        <button
                          onClick={() => downloadCertificatePDF(cert)}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-1 shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS PANEL */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">Clinical Reminders & Notifications</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Updates regarding registered venues, scheduling, and health guidelines.</p>
              </div>

              {notifications.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-450">
                  <p>You have no new notifications.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 rounded-xl border border-teal-500/10 bg-teal-500/5 flex gap-3 text-slate-650 dark:text-slate-350"
                    >
                      <AlertCircle className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">{item.title}</h4>
                        <p className="text-xs leading-relaxed">{item.message}</p>
                        <span className="block text-[10px] text-slate-400 mt-1">Event Date: {item.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <div className="space-y-8">
              
              {/* Form 1: General Info */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold">Profile Information</h2>
                  <p className="text-xs text-slate-400">Update your practitioner phone coordinates and name details.</p>
                </div>
                
                <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4 max-w-lg text-slate-350">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          {...profileReg('name')}
                          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-850 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                        <input
                          type="text"
                          required
                          {...profileReg('phone')}
                          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-850 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Email Coordinates</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        {...profileReg('email')}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-850 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-sm font-bold text-white bg-teal-650 hover:bg-teal-700 rounded-xl transition-all shadow-md"
                  >
                    Save Changes
                  </button>
                </form>
              </div>

              {/* Form 2: Password Update */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div>
                  <h2 className="text-lg font-bold">Update Passcode Credentials</h2>
                  <p className="text-xs text-slate-400">Regularly rotate passwords to protect credentials.</p>
                </div>

                <form onSubmit={handlePasswordSubmit(onChangePassword)} className="space-y-4 max-w-lg text-slate-350">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Current Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        {...passwordReg('currentPassword')}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-850 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        {...passwordReg('newPassword')}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-850 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        {...passwordReg('confirmPassword')}
                        placeholder="••••••••"
                        className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-850 dark:text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 text-sm font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-xl transition-all"
                  >
                    Change Password
                  </button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
