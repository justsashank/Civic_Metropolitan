import { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  CircleDashed,
  Compass,
  FileText,
  Gauge,
  Home,
  LocateFixed,
  LogIn,
  Map,
  MapPinned,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const api = axios.create({ baseURL: API_URL });

const priorityColors = {
  Critical: '#ef4444',
  High: '#f59e0b',
  Medium: '#3b82f6',
  Low: '#10b981',
};

const categoryOptions = ['Roads', 'Streetlights', 'Sanitation', 'Water', 'Drainage', 'Traffic', 'Public Safety', 'Other'];

const defaultIssueForm = {
  title: 'Large pothole near college road',
  description: 'Deep pothole causing danger to two-wheelers.',
  category: 'Roads',
  location: 'College Road, Chennai',
  latitude: 13.0674,
  longitude: 80.2376,
  phone: '',
  email: '',
};

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('civicai-token') || '');
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('civicai-user');
    return raw ? JSON.parse(raw) : null;
  });
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem('civicai-token', token);
    } else {
      delete axios.defaults.headers.common.Authorization;
      localStorage.removeItem('civicai-token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('civicai-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('civicai-user');
    }
  }, [user]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleLogin = (authUser, authToken) => {
    setUser(authUser);
    setToken(authToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <SiteNav user={user} onLogout={handleLogout} />
        {toast && (
          <div className="fixed right-5 top-20 z-50 rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-lg">
            {toast}
          </div>
        )}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/report" element={<ReportIssuePage user={user} token={token} showToast={setToast} />} />
          <Route path="/track" element={<TrackIssuePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} user={user} />} />
          <Route path="/register" element={<RegisterPage onLogin={handleLogin} user={user} />} />
          <Route path="/dashboard" element={user ? <DashboardPage user={user} token={token} /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <UnauthorizedPage />} />
          <Route path="/admin/issues" element={user?.role === 'admin' ? <AdminIssuesPage token={token} /> : <UnauthorizedPage />} />
          <Route path="/admin/departments" element={user?.role === 'admin' ? <AdminDepartmentsPage token={token} /> : <UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <SiteFooter />
      </div>
    </BrowserRouter>
  );
}

function SiteNav({ user, onLogout }) {
  const navLinkClass = ({ isActive }) =>
    `site-nav-link ${isActive ? 'is-active' : ''}`;

  return (
    <header className="site-header sticky top-0 z-40">
      <div className="site-nav-inner mx-auto flex max-w-7xl items-center justify-between px-5">
        <Link to="/" className="site-brand flex items-center gap-3">
          <div className="site-brand-mark flex h-10 w-10 items-center justify-center">
            <Building2 className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold text-slate-900">CivicAI</div>
            <div className="site-brand-subtitle">Chennai civic services</div>
          </div>
        </Link>

        <nav className="site-nav flex items-center" aria-label="Main navigation">
          <NavLink to="/" end className={navLinkClass}>Overview</NavLink>
          <NavLink to="/report" className={navLinkClass}>Report an issue</NavLink>
          <NavLink to="/track" className={navLinkClass}>Track a report</NavLink>
          <NavLink to="/map" className={navLinkClass}>Issue map</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin" className={navLinkClass}>Administration</NavLink>}
          {user && <NavLink to="/dashboard" className={navLinkClass}>My account</NavLink>}
        </nav>

        <div className="site-nav-actions flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm font-medium text-slate-700 md:inline-block">
                {user.name}
              </span>
              <button onClick={onLogout} className="site-nav-login text-sm font-medium">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="site-nav-login hidden text-sm font-medium md:inline-flex">
                Login
              </Link>
              <Link to="/register" className="site-nav-cta inline-flex text-sm font-semibold">
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="site-footer-mark flex h-9 w-9 items-center justify-center"><Building2 className="h-4 w-4" /></div>
          <div>
            <div className="text-sm font-bold text-slate-900">CivicAI Chennai</div>
            <p className="mt-1 text-xs text-slate-500">A clearer way to reach city services.</p>
          </div>
        </div>
        <div className="site-footer-links flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link to="/report">Submit a report</Link>
          <Link to="/map">View issue map</Link>
          <Link to="/track">Track a report</Link>
        </div>
      </div>
    </footer>
  );
}

function HomePage() {
  const issueTypes = [
    { title: 'Roads', icon: Wrench, desc: 'Potholes, damaged roads, and lane hazards.' },
    { title: 'Streetlights', icon: Sparkles, desc: 'Missing illumination and electrical faults.' },
    { title: 'Sanitation', icon: CheckCircle2, desc: 'Waste overflow and public cleanliness concerns.' },
    { title: 'Water', icon: Gauge, desc: 'Water leaks, pipe breaks, and supply issues.' },
    { title: 'Drainage', icon: Compass, desc: 'Blocked drains and waterlogging hotspots.' },
    { title: 'Traffic', icon: MapPinned, desc: 'Traffic signals and unsafe intersections.' },
  ];

  const processSteps = [
    { number: '01', title: 'Tell us what needs attention', text: 'Share the issue, its location, and a photo if you have one.' },
    { number: '02', title: 'Your report is organized', text: 'A category and priority help direct the report to the relevant team.' },
    { number: '03', title: 'Follow its progress', text: 'Use your report reference to check updates from submission to resolution.' },
  ];

  return (
    <main className="home-page">
      <section className="home-hero">
        <div className="home-hero-inner mx-auto grid max-w-7xl items-center gap-12 px-5">
          <div className="home-intro">
            <div className="home-kicker"><span className="home-kicker-mark" /> GREATER CHENNAI · CIVIC SERVICES</div>
            <h1>Care for your city<br /><em>starts on your street.</em></h1>
            <p className="home-intro-copy">Report a local issue, share where it is, and follow the response. One place to connect everyday concerns with the teams who can address them.</p>
            <div className="home-actions">
              <Link to="/report" className="home-primary-action">Report a problem <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/track" className="home-secondary-action"><FileText className="h-4 w-4" /> Track a report</Link>
            </div>
            <div className="home-assurance"><ShieldCheck className="h-4 w-4" /> Reports are organized and routed to the relevant service team.</div>
          </div>

          <div className="city-panel">
            <div className="city-panel-heading">
              <div>
                <div className="section-eyebrow">YOUR NEIGHBOURHOOD</div>
                <h2>Chennai, Tamil Nadu</h2>
              </div>
              <Link to="/map" className="city-map-link" aria-label="Open the issue map"><Map className="h-4 w-4" /></Link>
            </div>
            <div className="city-map-wrap">
              <MapContainer center={[13.0674, 80.2376]} zoom={13} scrollWheelZoom={false} zoomControl={false} dragging={false} className="city-map">
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[13.0674, 80.2376]} icon={makeMarkerIcon('#bd5d3a')}>
                  <Popup>Chennai</Popup>
                </Marker>
              </MapContainer>
              <div className="map-caption"><MapPinned className="h-4 w-4" /> Central Chennai</div>
            </div>
            <div className="city-panel-bottom">
              <div><span className="city-panel-dot" /> A report starts with a place</div>
              <Link to="/map">Browse the issue map <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="process-section">
        <div className="mx-auto max-w-7xl px-5">
          <div className="section-heading">
            <div>
              <p className="section-eyebrow">A STRAIGHTFORWARD PROCESS</p>
              <h2>From street-level concern<br className="hidden sm:block" /> to a clear next step.</h2>
            </div>
            <p className="section-heading-note">Every report gets a reference number so you can return and check its progress.</p>
          </div>
          <div className="process-grid">
            {processSteps.map((item) => (
              <article key={item.number} className="process-step">
                <span className="process-number">{item.number}</span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="category-section">
        <div className="mx-auto max-w-7xl px-5">
          <div className="section-heading category-heading">
            <div>
              <p className="section-eyebrow">WHAT NEEDS ATTENTION?</p>
              <h2>Everyday issues, in one place.</h2>
            </div>
            <Link to="/report" className="text-link">Start a report <ArrowRight className="h-4 w-4" /></Link>
          </div>

          <div className="category-grid">
            {issueTypes.map(({ title, icon: Icon, desc }) => (
              <div key={title} className="category-item">
                <div className="category-icon">
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div><h3>{title}</h3><p>{desc}</p></div>
                <ArrowRight className="category-arrow h-4 w-4" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-section">
        <div className="closing-inner mx-auto max-w-7xl px-5">
          <div><p className="section-eyebrow">YOUR CITY. YOUR REPORT.</p><h2>Seen something that needs fixing?</h2></div>
          <Link to="/report" className="closing-action">Make a report <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}

function ReportIssuePage({ user, token, showToast }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(defaultIssueForm);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [triage, setTriage] = useState(null);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const detectLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported in this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        showToast('Location detected successfully.');
      },
      () => showToast('Location permission was denied. Please enter coordinates manually.'),
    );
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        location: {
          address: form.location,
          latitude: form.latitude,
          longitude: form.longitude,
        },
      };

      const response = await api.post('/issues/preview-triage', payload, token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      setTriage(response.data);
      showToast('AI triage complete.');
    } catch (error) {
      showToast(error.response?.data?.message || 'AI triage failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('description', form.description);
      payload.append('category', form.category);
      payload.append('location', JSON.stringify({
        address: form.location,
        latitude: form.latitude,
        longitude: form.longitude,
      }));
      payload.append('phone', form.phone);
      payload.append('email', form.email || user?.email || '');
      if (image) payload.append('image', image);

      const response = await api.post('/issues', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      showToast('Issue submitted successfully.');
      navigate('/track', { state: { issueId: response.data.issueId } });
    } catch (error) {
      showToast(error.response?.data?.message || 'Issue submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="civic-page report-page mx-auto max-w-6xl px-5 py-12">
      <div className="report-layout grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="report-form-panel rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="report-panel-heading mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="page-kicker text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Report an issue</p>
              <h1 className="page-title text-3xl font-black text-slate-900">Submit a civic request</h1>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="report-form space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Issue Title</label>
              <input value={form.title} onChange={(e) => updateField('title', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none ring-0 transition focus:border-indigo-300 focus:bg-white" required />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
              <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows="5" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" required />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                <select value={form.category} onChange={(e) => updateField('category', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white">
                  {categoryOptions.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Location</label>
                <input value={form.location} onChange={(e) => updateField('location', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" required />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Latitude</label>
                <input type="number" step="any" value={form.latitude} onChange={(e) => updateField('latitude', Number(e.target.value))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Longitude</label>
                <input type="number" step="any" value={form.longitude} onChange={(e) => updateField('longitude', Number(e.target.value))} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={detectLocation} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700 hover:bg-slate-100">
                <LocateFixed className="h-4 w-4" /> Detect my location
              </button>
              <button type="button" onClick={handleAnalyze} className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2.5 font-medium text-white hover:bg-slate-800" disabled={loading}>
                <Sparkles className="h-4 w-4" /> {loading ? 'Analyzing...' : 'Analyze with AI'}
              </button>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
                <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                <input type="email" value={form.email || user?.email || ''} onChange={(e) => updateField('email', e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Image</label>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg" onChange={(e) => setImage(e.target.files[0])} className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600" />
            </div>

            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500" disabled={loading}>
              <PlusCircle className="h-5 w-5" /> Submit issue
            </button>
          </form>
        </div>

        <div className="report-triage-panel rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-500/20 p-3 text-indigo-300">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">AI triage</p>
              <h2 className="text-2xl font-bold">Ready to route</h2>
            </div>
          </div>

          {triage ? (
            <div className="space-y-4 text-sm">
              <div className="triage-result-item rounded-2xl border border-slate-700 bg-slate-800 p-4">
                <div className="text-slate-400">Category</div>
                <div className="mt-2 text-lg font-bold text-white">{triage.category}</div>
              </div>
              <div className="triage-result-item rounded-2xl border border-slate-700 bg-slate-800 p-4">
                <div className="text-slate-400">Priority</div>
                <div className="mt-2 text-lg font-bold text-amber-400">{triage.priority}</div>
              </div>
              <div className="triage-result-item rounded-2xl border border-slate-700 bg-slate-800 p-4">
                <div className="text-slate-400">Department</div>
                <div className="mt-2 text-lg font-bold text-white">{triage.department}</div>
              </div>
              <div className="triage-result-item rounded-2xl border border-slate-700 bg-slate-800 p-4">
                <div className="text-slate-400">Confidence</div>
                <div className="mt-2 text-lg font-bold text-indigo-300">{Math.round((triage.confidence || 0) * 100)}%</div>
              </div>
              <div className="triage-result-item rounded-2xl border border-slate-700 bg-slate-800 p-4">
                <div className="text-slate-400">Summary</div>
                <div className="mt-2 leading-6 text-slate-100">{triage.summary}</div>
              </div>
            </div>
          ) : (
            <div className="triage-empty rounded-2xl border border-dashed border-slate-700 bg-slate-800/70 p-6 text-slate-300">
              Click “Analyze with AI” to get a category, priority, department, and confidence summary.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function TrackIssuePage() {
  const location = useLocation();
  const [issueId, setIssueId] = useState(location.state?.issueId || '');
  const [issue, setIssue] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchIssue = async (value) => {
    setLoading(true);
    try {
      const response = await api.get(`/issues/track/${value}`);
      setIssue(response.data.issue);
      setHistory(response.data.history || []);
    } catch (error) {
      setIssue(null);
      setHistory([]);
      alert(error.response?.data?.message || 'Issue not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.issueId) {
      fetchIssue(location.state.issueId);
    }
  }, [location.state]);

  const statusSequence = ['Reported', 'AI Triaged', 'Assigned', 'In Progress', 'Resolved'];
  const activeStatus = issue?.status || 'Reported';

  return (
    <main className="civic-page track-page mx-auto max-w-5xl px-5 py-12">
      <div className="track-shell rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="track-heading mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="page-kicker text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Report status</p>
            <h1 className="page-title mt-2 text-3xl font-black text-slate-900">Track a report</h1>
          </div>
          <div className="track-search flex w-full max-w-xl gap-3">
            <input value={issueId} onChange={(e) => setIssueId(e.target.value)} placeholder="Enter Issue ID" className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-indigo-300 focus:bg-white" />
            <button onClick={() => fetchIssue(issueId)} className="rounded-full bg-indigo-600 px-5 py-3 font-medium text-white hover:bg-indigo-500">Search</button>
          </div>
        </div>

        {loading && <div className="py-10 text-center text-slate-500">Loading issue…</div>}

        {issue && (
          <div className="mt-8 space-y-8">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="track-summary rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm text-slate-500">Issue</div>
                <div className="mt-2 text-2xl font-bold text-slate-900">{issue.title}</div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                  <span className="rounded-full bg-slate-200 px-3 py-1">{issue.category}</span>
                  <span className="rounded-full bg-slate-200 px-3 py-1">{issue.priority}</span>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-indigo-700">{issue.department}</span>
                </div>
              </div>

              <div className="track-summary rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-sm text-slate-500">Location</div>
                <div className="mt-2 text-lg font-bold text-slate-900">{issue.location?.address || 'Chennai'}</div>
                <div className="mt-4 text-sm text-slate-600">Category: {issue.category}</div>
                <div className="text-sm text-slate-600">Priority: {issue.priority}</div>
                <div className="text-sm text-slate-600">Department: {issue.department}</div>
              </div>
            </div>

            <div className="track-timeline-panel rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-5 text-lg font-bold text-slate-900">Progress</div>
              <div className="track-timeline">
                {statusSequence.map((status, index) => {
                  const isActive = statusSequence.indexOf(activeStatus) >= index;
                  return (
                    <div key={status} className={`track-step ${isActive ? 'is-complete' : ''}`}>
                      <div className="track-step-marker">
                        {isActive ? <CheckCircle2 className="h-4 w-4" /> : <CircleDashed className="h-4 w-4" />}
                      </div>
                      <div className="track-step-label">{status}</div>
                      {index < statusSequence.length - 1 && <span className="track-step-connector" aria-hidden="true" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="track-history rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="mb-4 text-lg font-bold text-slate-900">Status history</div>
              <div className="space-y-3">
                {history.map((entry) => (
                  <div key={entry._id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-slate-900">{entry.status}</span>
                      <span className="text-xs uppercase tracking-[0.18em] text-slate-500">{new Date(entry.timestamp).toLocaleDateString()}</span>
                    </div>
                    {entry.note && <div className="mt-1 text-sm text-slate-600">{entry.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function MapPage() {
  const [issues, setIssues] = useState([]);
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');
  const [department, setDepartment] = useState('All');

  useEffect(() => {
    const loadIssues = async () => {
      try {
        const response = await api.get('/issues/map');
        setIssues(response.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    loadIssues();
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (category !== 'All' && issue.category !== category) return false;
      if (priority !== 'All' && issue.priority !== priority) return false;
      if (status !== 'All' && issue.status !== status) return false;
      if (department !== 'All' && issue.department !== department) return false;
      return true;
    });
  }, [issues, category, priority, status, department]);

  return (
    <main className="civic-page map-page mx-auto max-w-7xl px-5 py-12">
      <div className="map-page-heading mb-6 flex items-center justify-between">
        <div>
          <p className="page-kicker text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Greater Chennai</p>
          <h1 className="page-title mt-2 text-3xl font-black text-slate-900">Issues across the city</h1>
          <p className="map-page-description">Explore reported concerns by location and service area.</p>
        </div>
      </div>

      <div className="map-filters mb-4 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-4">
        <select aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <option value="All">All categories</option>
          {categoryOptions.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select aria-label="Filter by priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <option value="All">All priorities</option>
          {Object.keys(priorityColors).map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <option value="All">All statuses</option>
          <option value="Reported">Reported</option>
          <option value="AI Triaged">AI Triaged</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select aria-label="Filter by department" value={department} onChange={(e) => setDepartment(e.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <option value="All">All departments</option>
          <option value="Roads & Highways">Roads & Highways</option>
          <option value="Electrical">Electrical</option>
          <option value="Sanitation">Sanitation</option>
          <option value="Water & Utilities">Water & Utilities</option>
          <option value="Traffic Management">Traffic Management</option>
          <option value="Public Works">Public Works</option>
        </select>
      </div>

      <div className="map-toolbar">
        <span>{filteredIssues.length} {filteredIssues.length === 1 ? 'report' : 'reports'} shown</span>
        <div className="map-legend" aria-label="Map priority legend">
          <span><i className="priority-dot priority-critical" /> Critical</span>
          <span><i className="priority-dot priority-high" /> High</span>
          <span><i className="priority-dot priority-medium" /> Medium</span>
          <span><i className="priority-dot priority-low" /> Low</span>
        </div>
      </div>

      <div className="issue-map-frame overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <MapContainer center={[13.0827, 80.2707]} zoom={11} scrollWheelZoom className="h-[560px] w-full">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filteredIssues.map((issue) => (
            <Marker key={issue._id} position={[issue.location?.latitude || 13.0827, issue.location?.longitude || 80.2707]} icon={makeMarkerIcon(priorityColors[issue.priority] || '#174c3c')}>
              <Popup>
                <div className="space-y-2">
                  <div className="font-bold text-slate-900">{issue.title}</div>
                  <div className="text-sm text-slate-600">Priority: {issue.priority}</div>
                  <div className="text-sm text-slate-600">Category: {issue.category}</div>
                  <div className="text-sm text-slate-600">Status: {issue.status}</div>
                  <div className="text-sm text-slate-600">Department: {issue.department}</div>
                  <div className="text-sm text-slate-600">Location: {issue.location?.address || 'Chennai'}</div>
                  <Link to="/track" state={{ issueId: issue.issueId }} className="mt-2 inline-block text-sm font-medium text-indigo-600">View issue</Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </main>
  );
}

function DashboardPage({ user, token }) {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const loadIssues = async () => {
      try {
        const response = await api.get('/issues/my', { headers: { Authorization: `Bearer ${token}` } });
        setIssues(response.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    if (user) loadIssues();
  }, [user, token]);

  const totals = {
    total: issues.length,
    pending: issues.filter((issue) => !['Resolved', 'Rejected'].includes(issue.status)).length,
    inProgress: issues.filter((issue) => issue.status === 'In Progress').length,
    resolved: issues.filter((issue) => issue.status === 'Resolved').length,
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Citizen dashboard</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">My reports</h1>
        </div>
      </div>

      <div className="mb-8 grid gap-5 md:grid-cols-4">
        {[
          { label: 'Total', value: totals.total },
          { label: 'Pending', value: totals.pending },
          { label: 'In Progress', value: totals.inProgress },
          { label: 'Resolved', value: totals.resolved },
        ].map((item) => (
          <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-sm text-slate-500">{item.label}</div>
            <div className="mt-3 text-3xl font-black text-slate-900">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 text-xl font-bold text-slate-900">Reports</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 pr-4 font-medium">Issue ID</th>
                <th className="pb-3 pr-4 font-medium">Title</th>
                <th className="pb-3 pr-4 font-medium">Category</th>
                <th className="pb-3 pr-4 font-medium">Priority</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue._id} className="border-b border-slate-100">
                  <td className="py-3 pr-4 font-medium text-indigo-600"><Link to="/track" state={{ issueId: issue.issueId }}>{issue.issueId}</Link></td>
                  <td className="py-3 pr-4">{issue.title}</td>
                  <td className="py-3 pr-4">{issue.category}</td>
                  <td className="py-3 pr-4"><span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ backgroundColor: `${priorityColors[issue.priority] || '#4f46e5'}22`, color: priorityColors[issue.priority] || '#4f46e5' }}>{issue.priority}</span></td>
                  <td className="py-3 pr-4">{issue.status}</td>
                  <td className="py-3 pr-4">{new Date(issue.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState({ totalIssues: 0, pending: 0, resolved: 0, critical: 0 });
  const [queue, setQueue] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [statsRes, queueRes, deptRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/priority-queue'),
          api.get('/dashboard/departments'),
        ]);
        setStats(statsRes.data);
        setQueue(queueRes.data || []);
        setDepartmentData(deptRes.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    loadDashboard();
  }, []);

  const chartData = departmentData.map((item) => ({
    name: item.name,
    active: item.activeIssues || 0,
    resolved: item.resolvedIssues || 0,
    workload: Math.round(item.workload || 0),
  }));

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Admin dashboard</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Municipal operations overview</h1>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/issues" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">Issue queue</Link>
          <Link to="/admin/departments" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Departments</Link>
        </div>
      </div>

      <div className="mb-8 grid gap-5 md:grid-cols-4">
        <StatCard label="Total Issues" value={stats.totalIssues} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Resolved" value={stats.resolved} />
        <StatCard label="Critical" value={stats.critical} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900">AI priority queue</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Issue</th>
                  <th className="pb-3 pr-4 font-medium">Category</th>
                  <th className="pb-3 pr-4 font-medium">Priority</th>
                  <th className="pb-3 pr-4 font-medium">AI Confidence</th>
                  <th className="pb-3 pr-4 font-medium">Department</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((issue) => (
                  <tr key={issue._id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-900">{issue.title}</td>
                    <td className="py-3 pr-4">{issue.category}</td>
                    <td className="py-3 pr-4"><span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ backgroundColor: `${priorityColors[issue.priority] || '#4f46e5'}22`, color: priorityColors[issue.priority] || '#4f46e5' }}>{issue.priority}</span></td>
                    <td className="py-3 pr-4">{issue.aiConfidence ? `${Math.round(issue.aiConfidence * 100)}%` : '—'}</td>
                    <td className="py-3 pr-4">{issue.department}</td>
                    <td className="py-3 pr-4">{issue.status}</td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-2">
                        <Link to="/track" state={{ issueId: issue.issueId }} className="text-indigo-600">View</Link>
                        <span className="text-slate-400">|</span>
                        <Link to="/admin/issues" className="text-indigo-600">Assign</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-slate-900">Department workload</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="active" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </main>
  );
}

function AdminIssuesPage({ token }) {
  const [issues, setIssues] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [priority, setPriority] = useState('All');
  const [status, setStatus] = useState('All');
  const [department, setDepartment] = useState('All');

  const fetchIssues = async () => {
    try {
      const response = await api.get('/issues', { headers: { Authorization: `Bearer ${token}` } });
      setIssues(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [token]);

  const filtered = issues.filter((issue) => {
    const term = search.toLowerCase();
    const matchesSearch = !term || issue.title.toLowerCase().includes(term) || issue.issueId.toLowerCase().includes(term);
    const matchesCategory = category === 'All' || issue.category === category;
    const matchesPriority = priority === 'All' || issue.priority === priority;
    const matchesStatus = status === 'All' || issue.status === status;
    const matchesDepartment = department === 'All' || issue.department === department;
    return matchesSearch && matchesCategory && matchesPriority && matchesStatus && matchesDepartment;
  });

  const updateIssueField = async (issueId, updates) => {
    try {
      await api.put(`/issues/${issueId}`, updates, { headers: { Authorization: `Bearer ${token}` } });
      fetchIssues();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Admin issue management</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Issue queue</h1>
        </div>
      </div>

      <div className="mb-6 grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search issue" className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <option value="All">All categories</option>
          {categoryOptions.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <option value="All">All priorities</option>
          {Object.keys(priorityColors).map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <option value="All">All statuses</option>
          <option value="Reported">Reported</option>
          <option value="AI Triaged">AI Triaged</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select value={department} onChange={(e) => setDepartment(e.target.value)} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <option value="All">All departments</option>
          <option value="Roads & Highways">Roads & Highways</option>
          <option value="Electrical">Electrical</option>
          <option value="Sanitation">Sanitation</option>
          <option value="Water & Utilities">Water & Utilities</option>
          <option value="Traffic Management">Traffic Management</option>
          <option value="Public Works">Public Works</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="px-4 py-3 font-medium">Issue ID</th>
                <th className="px-4 py-3 font-medium">Issue</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Reported</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((issue) => (
                <tr key={issue._id} className="border-b border-slate-100">
                  <td className="px-4 py-3 font-medium text-indigo-600">{issue.issueId}</td>
                  <td className="px-4 py-3">{issue.title}</td>
                  <td className="px-4 py-3">{issue.category}</td>
                  <td className="px-4 py-3"><span className="rounded-full px-2 py-1 text-xs font-semibold" style={{ backgroundColor: `${priorityColors[issue.priority] || '#4f46e5'}22`, color: priorityColors[issue.priority] || '#4f46e5' }}>{issue.priority}</span></td>
                  <td className="px-4 py-3">{issue.department}</td>
                  <td className="px-4 py-3">{issue.location?.address || 'Chennai'}</td>
                  <td className="px-4 py-3">{issue.status}</td>
                  <td className="px-4 py-3">{new Date(issue.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button onClick={() => updateIssueField(issue._id, { department: 'Roads & Highways' })} className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">Assign</button>
                      <button onClick={() => updateIssueField(issue._id, { status: 'In Progress' })} className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">Progress</button>
                      <button onClick={() => updateIssueField(issue._id, { status: 'Resolved' })} className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Resolve</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function AdminDepartmentsPage({ token }) {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const response = await api.get('/dashboard/departments', { headers: { Authorization: `Bearer ${token}` } });
        setDepartments(response.data || []);
      } catch (error) {
        console.error(error);
      }
    };
    loadDepartments();
  }, [token]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Departments</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Department workload</h1>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Active Issues</th>
              <th className="px-4 py-3 font-medium">Resolved</th>
              <th className="px-4 py-3 font-medium">Workload</th>
              <th className="px-4 py-3 font-medium">Contact</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept._id || dept.name} className="border-b border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{dept.name}</td>
                <td className="px-4 py-3">{dept.activeIssues || 0}</td>
                <td className="px-4 py-3">{dept.resolvedIssues || 0}</td>
                <td className="px-4 py-3">{Math.round(dept.workload || 0)}%</td>
                <td className="px-4 py-3">{dept.contactEmail || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function LoginPage({ user, onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@civicai.demo');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      onLogin(response.data.user, response.data.token);
      navigate(response.data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600"><LogIn className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Welcome back</p>
            <h1 className="text-3xl font-black text-slate-900">Login</h1>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          </div>
          <button type="submit" className="w-full rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <div className="mt-4 text-sm text-slate-600">
          Demo admin: admin@civicai.demo / Admin@123
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Demo citizen: citizen@civicai.demo / Citizen@123
        </div>
      </div>
    </main>
  );
}

function RegisterPage({ onLogin, user }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/register', { ...form, role: 'citizen' });
      onLogin(response.data.user, response.data.token);
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Create account</p>
            <h1 className="text-3xl font-black text-slate-900">Register</h1>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3" required />
          </div>
          <button type="submit" className="w-full rounded-2xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-500" disabled={loading}>{loading ? 'Creating account...' : 'Create account'}</button>
        </form>
      </div>
    </main>
  );
}

function UnauthorizedPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <div className="rounded-3xl border border-red-200 bg-red-50 p-10 shadow-sm">
        <h1 className="text-3xl font-black text-red-700">Unauthorized</h1>
        <p className="mt-4 text-slate-600">You need admin permissions to view this page.</p>
        <Link to="/login" className="mt-6 inline-flex rounded-full bg-red-600 px-5 py-3 font-medium text-white">Go to login</Link>
      </div>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-20 text-center">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-3xl font-black text-slate-900">Page not found</h1>
        <p className="mt-4 text-slate-600">The page you requested does not exist.</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-indigo-600 px-5 py-3 font-medium text-white">Return home</Link>
      </div>
    </main>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function makeMarkerIcon(color) {
  return new L.DivIcon({
    className: '',
    html: `<span style="background:${color}; width:20px; height:20px; display:block; border-radius:50%; border:2px solid rgba(255,255,255,0.8); box-shadow:0 3px 12px rgba(15,23,42,0.18);"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

export default App;
