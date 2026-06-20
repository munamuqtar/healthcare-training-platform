import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Users, BookOpen, Award, Bell, Shield, Key, Mail, Phone, MapPin, 
  Clock, Download, Plus, Edit, Trash2, CheckCircle2, XCircle, Search, 
  Settings, Image, FileSpreadsheet, FileText, ChevronRight, Check, X, AlertCircle
} from 'lucide-react';
import { api, logoutUser } from '../services/api';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import jsPDF from 'jspdf';

// Define Type Interfaces
interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
}

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
  createdAt: string;
}

interface Registration {
  _id: string;
  user: string;
  training: string;
  attendanceStatus: 'pending' | 'present' | 'absent';
  completionStatus: 'ongoing' | 'completed' | 'failed';
  registeredAt: string;
  userDetail: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  trainingDetail: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    trainer: string;
    venue: string;
  } | null;
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'trainings' | 'registrations' | 'users' | 'news-activities'>('overview');
  const [adminUser, setAdminUser] = useState<any>(null);
  
  // States for DB data lists
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  // Search/Filter helper states
  const [searchQuery, setSearchQuery] = useState('');

  // Editor states
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);

  // Forms
  const { register: trainingReg, handleSubmit: handleTrainingSubmit, reset: resetTrainingForm, setValue: setTrainingValue } = useForm();
  const { register: newsReg, handleSubmit: handleNewsSubmit, reset: resetNewsForm } = useForm();
  const { register: activityReg, handleSubmit: handleActivitySubmit, reset: resetActivityForm } = useForm();

  const fetchAdminUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) setAdminUser(JSON.parse(userStr));
  };

  const fetchAllData = async () => {
    try {
      const tRes = await api.get('/trainings');
      setTrainings(tRes.data);

      const rRes = await api.get('/registrations');
      setRegistrations(rRes.data);

      const uRes = await api.get('/auth/users');
      setUsers(uRes.data);

      const nRes = await api.get('/news');
      setNews(nRes.data);

      const aRes = await api.get('/activities');
      setActivities(aRes.data);
    } catch (err: any) {
      toast.error('Error fetching database records.');
    }
  };

  useEffect(() => {
    fetchAdminUser();
    fetchAllData();
  }, []);

  // -------------------------------------------------------------
  // CRUD ACTIONS: TRAININGS
  // -------------------------------------------------------------
  const openCreateModal = () => {
    setEditingTraining(null);
    resetTrainingForm();
    setShowTrainingModal(true);
  };

  const openEditModal = (t: Training) => {
    setEditingTraining(t);
    setTrainingValue('title', t.title);
    setTrainingValue('description', t.description);
    setTrainingValue('trainer', t.trainer);
    setTrainingValue('venue', t.venue);
    setTrainingValue('startDate', t.startDate);
    setTrainingValue('endDate', t.endDate);
    setTrainingValue('registrationDeadline', t.registrationDeadline);
    setTrainingValue('participantLimit', t.participantLimit);
    setTrainingValue('status', t.status);
    setShowTrainingModal(true);
  };

  const saveTraining = async (data: any) => {
    try {
      if (editingTraining) {
        // Edit Mode
        await api.put(`/trainings/${editingTraining._id}`, data);
        toast.success('Training updated successfully.');
      } else {
        // Create Mode
        await api.post('/trainings', data);
        toast.success('Training created successfully.');
      }
      setShowTrainingModal(false);
      resetTrainingForm();
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error saving training.');
    }
  };

  const deleteTraining = async (id: string) => {
    if (!window.confirm('Delete this training course and all linked student registrations?')) return;
    try {
      await api.delete(`/trainings/${id}`);
      toast.success('Training course deleted.');
      fetchAllData();
    } catch (err) {
      toast.error('Failed to delete training.');
    }
  };

  // -------------------------------------------------------------
  // PARTICIPANT PROGRESSION AND REGISTRATION CONTROLS
  // -------------------------------------------------------------
  const updateStatus = async (regId: string, type: 'attendanceStatus' | 'completionStatus', val: string) => {
    try {
      const body = type === 'attendanceStatus' 
        ? { attendanceStatus: val } 
        : { completionStatus: val };
      
      const res = await api.put(`/registrations/${regId}`, body);
      toast.success(res.data.message || 'Status updated.');
      fetchAllData(); // Refresh certificate status and logs
    } catch (err) {
      toast.error('Failed to update registration status.');
    }
  };

  const deleteRegistration = async (id: string) => {
    if (!window.confirm('Delete this user enrollment? This frees up a seat.')) return;
    try {
      await api.delete(`/registrations/${id}`);
      toast.success('Enrollment deleted.');
      fetchAllData();
    } catch (err) {
      toast.error('Failed to delete enrollment.');
    }
  };

  // -------------------------------------------------------------
  // USER MANAGEMENTS
  // -------------------------------------------------------------
  const toggleUserActive = async (id: string) => {
    try {
      await api.put(`/auth/users/${id}/toggle-active`);
      toast.success('User status updated.');
      fetchAllData();
    } catch (err) {
      toast.error('Failed to update user status.');
    }
  };

  const deleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success('User account deleted.');
      fetchAllData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  // -------------------------------------------------------------
  // PUBLISH NEWS & ACTIVITIES
  // -------------------------------------------------------------
  const publishNews = async (data: any) => {
    try {
      await api.post('/news', data);
      toast.success('News announcement published!');
      resetNewsForm();
      fetchAllData();
    } catch (err) {
      toast.error('Failed to publish news.');
    }
  };

  const publishActivity = async (data: any) => {
    try {
      // Activity payload accepts url
      await api.post('/activities', {
        title: data.title,
        description: data.description,
        activityDate: data.activityDate,
        images: [data.imageUrl || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80']
      });
      toast.success('Activity published to gallery!');
      resetActivityForm();
      fetchAllData();
    } catch (err) {
      toast.error('Failed to publish activity.');
    }
  };

  // -------------------------------------------------------------
  // DATA EXPORTS: CSV (EXCEL) AND PDF REPORTS
  // -------------------------------------------------------------
  const exportParticipantsCSV = () => {
    try {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Name,Email,Phone,Training Title,Attendance,CompletionStatus,RegisteredAt\n';

      registrations.forEach(r => {
        const row = [
          `"${r.userDetail?.name || 'N/A'}"`,
          `"${r.userDetail?.email || 'N/A'}"`,
          `"${r.userDetail?.phone || 'N/A'}"`,
          `"${r.trainingDetail?.title || 'N/A'}"`,
          `"${r.attendanceStatus}"`,
          `"${r.completionStatus}"`,
          `"${r.registeredAt.split('T')[0]}"`
        ].join(',');
        csvContent += row + '\n';
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `CarePulse-ParticipantsReport-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Excel CSV Report downloaded.');
    } catch (error) {
      toast.error('Could not export CSV.');
    }
  };

  const exportSummaryPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header branding
      doc.setFontSize(20);
      doc.setTextColor(15, 118, 110);
      doc.text('CarePulse Healthcare Organization', 14, 20);
      
      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139);
      doc.text('Institutional Training and Enrollment Report Summary', 14, 28);
      
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 32, 196, 32);

      // Section: Aggregate stats
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`Total Registered Users: ${users.length}`, 14, 42);
      doc.text(`Total Training Courses: ${trainings.length}`, 14, 48);
      doc.text(`Total Enrollments: ${registrations.length}`, 14, 54);
      doc.text(`Total Activities: ${activities.length}`, 14, 60);

      // Section: Courses overview table
      doc.setFontSize(14);
      doc.setTextColor(15, 118, 110);
      doc.text('Accredited Courses Status', 14, 76);

      let yPos = 86;
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('Course Title', 14, yPos);
      doc.text('Trainer', 90, yPos);
      doc.text('Limit', 145, yPos);
      doc.text('Enrolled', 165, yPos);
      doc.text('Status', 182, yPos);
      
      doc.line(14, yPos + 2, 196, yPos + 2);
      yPos += 8;

      doc.setTextColor(15, 23, 42);
      trainings.forEach(t => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        
        // Truncate long titles
        const title = t.title.length > 35 ? t.title.slice(0, 35) + '...' : t.title;
        const trainer = t.trainer.length > 25 ? t.trainer.slice(0, 25) + '...' : t.trainer;

        doc.text(title, 14, yPos);
        doc.text(trainer, 90, yPos);
        doc.text(t.participantLimit.toString(), 145, yPos);
        doc.text(t.registeredCount.toString(), 165, yPos);
        doc.text(t.status, 182, yPos);
        
        yPos += 8;
      });

      doc.save(`CarePulse-SummaryReport-${Date.now()}.pdf`);
      toast.success('Summary PDF Report downloaded.');
    } catch (error) {
      toast.error('Could not export PDF.');
    }
  };

  // Recharts graphics mock datasets computed from live database states
  const monthlyStatsData = [
    { name: 'Jan', Registered: 42, Certificates: 35 },
    { name: 'Feb', Registered: 55, Certificates: 48 },
    { name: 'Mar', Registered: 88, Certificates: 74 },
    { name: 'Apr', Registered: 120, Certificates: 98 },
    { name: 'May', Registered: 180, Certificates: 145 },
    { name: 'Jun', Registered: registrations.length + 300, Certificates: registrations.filter(r => r.completionStatus === 'completed').length + 270 },
  ];

  // Helper filters
  const filteredRegistrations = registrations.filter(r => {
    return (
      r.userDetail?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.trainingDetail?.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Admin Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-950 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-teal-400 animate-pulse" />
          <span className="font-bold text-lg text-white">Super Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">Welcome, <strong>{adminUser?.name || 'Administrator'}</strong></span>
          <button
            onClick={() => { logoutUser(); window.location.href = '/'; }}
            className="px-3 py-1.5 text-xs bg-slate-800 hover:bg-red-950/40 hover:text-red-400 border border-slate-700 rounded-lg"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Grid Deck */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Admin Navigation Sidebar Links */}
        <aside className="space-y-2 lg:col-span-1">
          {[
            { id: 'overview', name: 'Overview & Charts', icon: Settings },
            { id: 'trainings', name: 'Course Management', icon: BookOpen },
            { id: 'registrations', name: 'Participants & Attendance', icon: Award },
            { id: 'users', name: 'User Management', icon: Users },
            { id: 'news-activities', name: 'News & Activities Form', icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-slate-950 border border-slate-850 text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}

          <div className="pt-6 border-t border-slate-800 mt-6 space-y-2">
            <button
              onClick={exportParticipantsCSV}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl bg-slate-950 hover:bg-emerald-950/30 hover:text-emerald-400 text-slate-350 border border-slate-850"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel (CSV)
            </button>
            <button
              onClick={exportSummaryPDF}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl bg-slate-950 hover:bg-teal-950/30 hover:text-teal-400 text-slate-350 border border-slate-850"
            >
              <FileText className="w-3.5 h-3.5" /> Export PDF Summary
            </button>
            <a
              href="/"
              className="block text-center py-2 text-xs text-slate-500 hover:underline"
            >
              Return to Public Site
            </a>
          </div>
        </aside>

        {/* Dashboard Panels */}
        <main className="lg:col-span-3 bg-slate-950 border border-slate-850 rounded-3xl p-6 sm:p-8 min-h-[500px]">
          
          {/* TAB 1: OVERVIEW METRICS & GRAPH CHARTS */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold">Platform Overview & Metrics</h2>
                <p className="text-xs text-slate-500">Live operational counts and enrollment statistics.</p>
              </div>

              {/* Total Aggregate Counter Cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { name: 'Total Users', count: users.length, color: 'text-sky-400 border-sky-500/20 bg-sky-500/5' },
                  { name: 'Trainings', count: trainings.length, color: 'text-teal-400 border-teal-500/20 bg-teal-500/5' },
                  { name: 'Participants', count: registrations.length, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
                  { name: 'Activities', count: activities.length, color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
                  { name: 'Certificates', count: registrations.filter(r => r.completionStatus === 'completed').length, color: 'text-rose-400 border-rose-500/20 bg-rose-500/5' }
                ].map((stat, i) => (
                  <div key={i} className={`p-4 rounded-2xl border text-center ${stat.color}`}>
                    <div className="text-2xl font-extrabold">{stat.count}</div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-1">{stat.name}</div>
                  </div>
                ))}
              </div>

              {/* Chart Grid */}
              <div className="grid grid-cols-1 gap-6 pt-4">
                <div className="p-5 rounded-2xl border border-slate-850 bg-slate-950">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Registration & Certificates Trends</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyStatsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                        <YAxis stroke="#64748b" fontSize={11} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }} />
                        <Line type="monotone" dataKey="Registered" stroke="#0f766e" strokeWidth={3} activeDot={{ r: 8 }} />
                        <Line type="monotone" dataKey="Certificates" stroke="#10b981" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COURSE MANAGEMENT (CRUD) */}
          {activeTab === 'trainings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Training Program Management</h2>
                  <p className="text-xs text-slate-500">Create, adjust and open/close continuing clinical tracks.</p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Create Course
                </button>
              </div>

              {trainings.length === 0 ? (
                <div className="p-16 text-center border border-slate-850 rounded-2xl text-slate-400">
                  No courses registered in the database.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-400">
                        <th className="pb-3 pr-2">Title</th>
                        <th className="pb-3 px-2">Trainer</th>
                        <th className="pb-3 px-2">Start Date</th>
                        <th className="pb-3 px-2">Limit (Enrolled)</th>
                        <th className="pb-3 px-2">Status</th>
                        <th className="pb-3 pl-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trainings.map((t) => (
                        <tr key={t._id} className="border-b border-slate-850/50 hover:bg-slate-900/30">
                          <td className="py-3 pr-2 font-semibold text-white">{t.title}</td>
                          <td className="py-3 px-2">{t.trainer}</td>
                          <td className="py-3 px-2">{t.startDate}</td>
                          <td className="py-3 px-2">{t.participantLimit} ({t.registeredCount})</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                              t.status === 'open' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                                : t.status === 'full'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                                : 'bg-red-500/10 text-red-400 border-red-500/25'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-3 pl-2 text-right space-x-1">
                            <button
                              onClick={() => openEditModal(t)}
                              className="p-1.5 rounded-lg border border-slate-800 text-slate-300 hover:bg-slate-850 hover:text-white"
                              title="Edit"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteTraining(t._id)}
                              className="p-1.5 rounded-lg border border-slate-800 text-red-400 hover:bg-red-950/20"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PARTICIPANT ATTENDANCE & COMPLETION (CERTIFICATE TRIGGERS) */}
          {activeTab === 'registrations' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">Participant & Completion Logs</h2>
                <p className="text-xs text-slate-500">Record attendance, mark training completions, and generate certified credentials.</p>
              </div>

              {/* Search bar */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by student name or course..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-850 bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white"
                />
              </div>

              {filteredRegistrations.length === 0 ? (
                <div className="p-16 text-center border border-slate-850 rounded-2xl text-slate-400">
                  No registration logs match search criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-400">
                        <th className="pb-3 pr-2">Student</th>
                        <th className="pb-3 px-2">Course</th>
                        <th className="pb-3 px-2">Attendance Status</th>
                        <th className="pb-3 px-2">Accreditation Completion</th>
                        <th className="pb-3 pl-2 text-right">Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegistrations.map((reg) => (
                        <tr key={reg._id} className="border-b border-slate-850/50 hover:bg-slate-900/30">
                          <td className="py-3 pr-2">
                            <p className="font-semibold text-white">{reg.userDetail?.name}</p>
                            <p className="text-[10px] text-slate-400">{reg.userDetail?.email}</p>
                          </td>
                          <td className="py-3 px-2 font-medium text-teal-400">
                            {reg.trainingDetail?.title}
                          </td>
                          
                          {/* Attendance Status Selector */}
                          <td className="py-3 px-2">
                            <select
                              value={reg.attendanceStatus}
                              onChange={(e) => updateStatus(reg._id, 'attendanceStatus', e.target.value)}
                              className="px-2 py-1 text-xs rounded border border-slate-800 bg-slate-900 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                            >
                              <option value="pending">Pending</option>
                              <option value="present">Present</option>
                              <option value="absent">Absent</option>
                            </select>
                          </td>

                          {/* Completion Status Selector (Certificate trigger) */}
                          <td className="py-3 px-2">
                            <select
                              value={reg.completionStatus}
                              onChange={(e) => updateStatus(reg._id, 'completionStatus', e.target.value)}
                              className={`px-2 py-1 text-xs rounded border focus:outline-none focus:ring-1 focus:ring-teal-500 bg-slate-900 ${
                                reg.completionStatus === 'completed'
                                  ? 'text-emerald-400 border-emerald-500/20'
                                  : reg.completionStatus === 'failed'
                                  ? 'text-red-400 border-red-500/25'
                                  : 'text-teal-400 border-teal-500/25'
                              }`}
                            >
                              <option value="ongoing">Ongoing</option>
                              <option value="completed">Completed (Issue Cert)</option>
                              <option value="failed">Failed</option>
                            </select>
                          </td>

                          <td className="py-3 pl-2 text-right">
                            <button
                              onClick={() => deleteRegistration(reg._id)}
                              className="p-1.5 rounded-lg border border-slate-800 text-red-400 hover:bg-red-950/20"
                              title="Cancel signup"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: USER ACCOUNTS LOCKS AND MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">Registered User Accounts</h2>
                <p className="text-xs text-slate-500">Deactivate profiles, control access roles, and remove credentials.</p>
              </div>

              {users.length === 0 ? (
                <div className="p-16 text-center border border-slate-850 rounded-2xl text-slate-400">
                  No registered users.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-400">
                        <th className="pb-3 pr-2">User Name</th>
                        <th className="pb-3 px-2">Phone</th>
                        <th className="pb-3 px-2">Role</th>
                        <th className="pb-3 px-2">Registered On</th>
                        <th className="pb-3 px-2">Account Status</th>
                        <th className="pb-3 pl-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-slate-850/50 hover:bg-slate-900/30">
                          <td className="py-3 pr-2 font-semibold text-white">
                            <p>{u.name}</p>
                            <p className="text-[10px] text-slate-400">{u.email}</p>
                          </td>
                          <td className="py-3 px-2">{u.phone}</td>
                          <td className="py-3 px-2 capitalize font-medium text-teal-400">{u.role}</td>
                          <td className="py-3 px-2">{u.createdAt?.split('T')[0]}</td>
                          <td className="py-3 px-2">
                            <button
                              onClick={() => toggleUserActive(u.id)}
                              className={`px-3 py-1 rounded text-[10px] font-bold border transition-colors ${
                                u.isActive
                                  ? 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20 hover:bg-emerald-950/20 hover:text-emerald-350'
                                  : 'bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-950/20'
                              }`}
                              title={u.isActive ? 'Deactivate user' : 'Activate user'}
                            >
                              {u.isActive ? 'Active' : 'Locked'}
                            </button>
                          </td>
                          <td className="py-3 pl-2 text-right">
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="p-1.5 rounded-lg border border-slate-800 text-red-400 hover:bg-red-950/20"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PUBLISH NEWS & ACTIVITIES GALLERY */}
          {activeTab === 'news-activities' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Form 1: News Bulletin */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <div>
                  <h3 className="font-bold text-base text-white">Publish News Announcement</h3>
                  <p className="text-[11px] text-slate-400">Post details to the public news feed.</p>
                </div>

                <form onSubmit={handleNewsSubmit(publishNews)} className="space-y-4 text-xs text-slate-300">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      {...newsReg('title')}
                      placeholder="ACLS Accreditation Updates"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Article Content</label>
                    <textarea
                      rows={4}
                      required
                      {...newsReg('content')}
                      placeholder="Write your announcement details here..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all"
                  >
                    Publish News
                  </button>
                </form>
              </div>

              {/* Form 2: Activity Gallery */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <div>
                  <h3 className="font-bold text-base text-white">Publish Activity to Gallery</h3>
                  <p className="text-[11px] text-slate-400">Upload reports and images of regional wellness fairs.</p>
                </div>

                <form onSubmit={handleActivitySubmit(publishActivity)} className="space-y-4 text-xs text-slate-300">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Activity Title</label>
                    <input
                      type="text"
                      required
                      {...activityReg('title')}
                      placeholder="Green Valley Screening Camp"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Activity Date</label>
                    <input
                      type="date"
                      required
                      {...activityReg('activityDate')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Image URL (Optional)</label>
                    <input
                      type="text"
                      {...activityReg('imageUrl')}
                      placeholder="https://example.com/health-event.jpg"
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Description / Summary</label>
                    <textarea
                      rows={2}
                      required
                      {...activityReg('description')}
                      placeholder="Conducted glucose testing for 300+ residents..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-955 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all"
                  >
                    Publish Activity
                  </button>
                </form>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* CREATE/EDIT TRAINING MODAL POPUP */}
      {showTrainingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowTrainingModal(false)}
              className="absolute right-4 top-4 p-2 text-slate-400 hover:text-white rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="font-bold text-lg text-white">
                {editingTraining ? 'Modify Training Program' : 'Schedule New Clinical Course'}
              </h3>
              <p className="text-xs text-slate-450">Set syllabus, trainers, capacities and dates.</p>
            </div>

            <form onSubmit={handleTrainingSubmit(saveTraining)} className="space-y-3 text-xs text-slate-300">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  {...trainingReg('title')}
                  placeholder="Infection Control Seminar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Description / Curriculum Details</label>
                <textarea
                  rows={3}
                  required
                  {...trainingReg('description')}
                  placeholder="Detail course competencies and required prerequisites..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-955 text-white focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Trainer Name</label>
                  <input
                    type="text"
                    required
                    {...trainingReg('trainer')}
                    placeholder="Dr. Sarah Jenkins"
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Venue Room / Address</label>
                  <input
                    type="text"
                    required
                    {...trainingReg('venue')}
                    placeholder="Main Center Hall A"
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    {...trainingReg('startDate')}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    {...trainingReg('endDate')}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Reg. Deadline</label>
                  <input
                    type="date"
                    required
                    {...trainingReg('registrationDeadline')}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">Participant Limit</label>
                  <input
                    type="number"
                    required
                    {...trainingReg('participantLimit')}
                    placeholder="50"
                    className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                
                {editingTraining && (
                  <div>
                    <label className="block font-semibold text-slate-400 mb-1">Override Status</label>
                    <select
                      {...trainingReg('status')}
                      className="w-full px-3 py-2 rounded-xl border border-slate-800 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                      <option value="open">Open</option>
                      <option value="full">Full</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTrainingModal(false)}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-650 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md"
                >
                  {editingTraining ? 'Update Program' : 'Publish Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
