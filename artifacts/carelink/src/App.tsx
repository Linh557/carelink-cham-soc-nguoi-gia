import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity as ActivityIcon,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  CreditCard,
  Droplets,
  Eye,
  FileText,
  HeartPulse,
  Home,
  LifeBuoy,
  LocateFixed,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Mic,
  Navigation,
  PhoneCall,
  Pill,
  Plus,
  ReceiptText,
  RefreshCw,
  Route as RouteIcon,
  Send,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
  WandSparkles,
  X,
} from 'lucide-react';
import {
  getGetActivityQueryKey,
  getGetCareLogsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetExpensesQueryKey,
  getGetMedicationsQueryKey,
  getGetScheduleQueryKey,
  useCreateCareLog,
  useCreateExpense,
  useCreateSosAlert,
  useGenerateProfileDraft,
  useGetActivity,
  useGetCareLogs,
  useGetCaregivers,
  useGetDashboardSummary,
  useGetExpenses,
  useGetMedications,
  useGetSchedule,
  useUpdateCareLog,
  useUpdateMedicationStatus,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type ModalName = 'care-log' | 'expense' | 'sos' | null;

function Avatar({ initials, src, size = 'md' }: { initials?: string; src?: string; size?: 'sm' | 'md' | 'lg' }) {
  return <div className={`avatar ${size}`} data-testid={`avatar-${initials ?? 'user'}`}>{src ? <img src={src} alt="" /> : initials ?? 'CL'}</div>;
}

function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return <div className="list">{Array.from({ length: rows }, (_, i) => <div className="list-row" key={i}><div className="skeleton" style={{ width: 38, height: 38 }} /><div className="row-copy"><div className="skeleton" style={{ width: `${45 + i * 8}%`, height: 12 }} /><div className="skeleton" style={{ width: '32%', height: 9, marginTop: 8 }} /></div></div>)}</div>;
}

function ErrorBox({ message = 'We could not load this right now.' }: { message?: string }) {
  return <div className="error-state" data-testid="status-error"><span>{message}</span><button className="btn btn-danger btn-sm" onClick={() => window.location.reload()} data-testid="button-retry">Try again</button></div>;
}

function EmptyState({ icon: Icon = ClipboardList, title, text }: { icon?: typeof ClipboardList; title: string; text: string }) {
  return <div className="empty-state" data-testid="status-empty"><div className="empty-icon"><Icon size={20} /></div><strong>{title}</strong><p>{text}</p></div>;
}

function StatusPill({ status }: { status?: string }) {
  const value = (status ?? 'pending').toLowerCase();
  const tone = value.includes('taken') || value.includes('verified') || value.includes('complete') || value.includes('active') || value.includes('paid') || value === 'done' ? 'success' : value.includes('miss') || value.includes('alert') || value.includes('low') ? 'alert' : value.includes('pending') || value.includes('upcoming') ? 'pending' : 'neutral';
  return <span className={`status-pill ${tone}`} data-testid={`status-${value}`}>{tone === 'success' ? <Check size={11} /> : tone === 'alert' ? <CircleAlert size={11} /> : <Clock3 size={11} />}{status ?? 'Pending'}</span>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [modal, setModal] = useState<ModalName>(null);
  const [toast, setToast] = useState('');
  const sos = useCreateSosAlert();
  const nav = [
    { href: '/', label: 'Overview', icon: Home },
    { href: '/care-log', label: 'Care log', icon: ClipboardList },
    { href: '/medications', label: 'Medications', icon: Pill },
    { href: '/journey', label: 'Day journey', icon: RouteIcon },
    { href: '/expenses', label: 'Expenses', icon: ReceiptText },
    { href: '/caregivers', label: 'Caregivers', icon: Users },
  ];
  const title = nav.find((item) => item.href === location)?.label ?? (location === '/profile-ai' ? 'Profile studio' : location === '/settings' ? 'Settings' : 'CareLink');
  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3000); };
  const triggerSos = () => {
    sos.mutate({ data: { source: 'family-dashboard', note: 'Family member requested a wellbeing check.' } }, {
      onSuccess: () => { setModal(null); showToast('Care team alerted. We will keep you posted.'); },
      onError: () => showToast('The alert could not be sent. Please try again.'),
    });
  };
  return <div className="carelink-app"><div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><HeartPulse size={20} strokeWidth={2.5} /></div><span className="brand-name">CareLink</span></div>
      <div className="nav-label">Family space</div>
      <nav className="nav-list" aria-label="Primary navigation">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-item ${location === href ? 'active' : ''}`} data-testid={`link-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={17} /><span>{label}</span>{href === '/' && <span style={{ marginLeft: 'auto', color: '#b7dbe1' }}><ChevronRight size={14} /></span>}</Link>)}</nav>
      <div style={{ marginTop: 24 }} className="nav-label">Your account</div>
      <nav className="nav-list"><Link href="/profile-ai" className={`nav-item ${location === '/profile-ai' ? 'active' : ''}`} data-testid="link-profile-studio"><Sparkles size={17} /><span>Profile studio</span></Link><Link href="/settings" className={`nav-item ${location === '/settings' ? 'active' : ''}`} data-testid="link-settings"><Settings2 size={17} /><span>Settings</span></Link></nav>
      <div className="sidebar-bottom">
        <div className="help-card"><LifeBuoy size={17} /><p>Need a hand with something today?</p><button onClick={() => showToast('Support is available weekdays, 8am–8pm.')} data-testid="button-contact-support">Contact support <ArrowUpRight size={12} /></button></div>
        <div className="profile-chip" style={{ padding: '0 12px' }}><Avatar initials="MC" size="sm" /><span>Margaret Chen</span><ChevronRight size={14} style={{ marginLeft: 'auto', color: '#aac4ca' }} /></div>
      </div>
    </aside>
    <main className="main-shell">
      <header className="topbar"><div><p className="topbar-kicker">Tuesday, October 8, 2024</p><h2 className="topbar-title">{title}</h2></div><div className="topbar-actions"><button className="icon-button" onClick={() => showToast('You are all caught up.')} aria-label="Notifications" data-testid="button-notifications"><Bell size={17} /></button><button className="btn btn-danger btn-sm" onClick={() => setModal('sos')} data-testid="button-sos"><CircleAlert size={14} /> SOS check</button><div className="profile-chip"><Avatar initials="MC" size="sm" /><span>Margaret</span></div></div></header>
      {children}
    </main>
    <nav className="mobile-nav" aria-label="Mobile navigation">{nav.slice(0, 4).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={location === href ? 'active' : ''} data-testid={`mobile-link-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon /><span>{label === 'Overview' ? 'Home' : label.split(' ')[0]}</span></Link>)}</nav>
  </div>{toast && <div className="toast" role="status" data-testid="status-toast">{toast}</div>}{modal === 'sos' && <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="sos-title"><button className="icon-button" style={{ float: 'right' }} onClick={() => setModal(null)} aria-label="Close" data-testid="button-close-sos"><X size={16} /></button><div className="health-icon"><CircleAlert size={20} /></div><h2 id="sos-title" style={{ marginTop: 16 }}>Request a wellbeing check?</h2><p>This sends an urgent note to the active care team for Eleanor. Use this if you are worried and need someone nearby to check in.</p><div className="modal-actions"><button className="btn btn-ghost" onClick={() => setModal(null)} data-testid="button-cancel-sos">Not now</button><button className="btn btn-danger" onClick={triggerSos} disabled={sos.isPending} data-testid="button-confirm-sos">{sos.isPending ? 'Sending…' : 'Alert care team'}</button></div></div></div>}</div>;
}

function Dashboard() {
  const qc = useQueryClient();
  const summary = useGetDashboardSummary();
  const activity = useGetActivity();
  const schedule = useGetSchedule();
  const medications = useGetMedications();
  const [toast, setToast] = useState('');
  const refresh = () => { [getGetDashboardSummaryQueryKey(), getGetActivityQueryKey(), getGetScheduleQueryKey(), getGetMedicationsQueryKey()].forEach((queryKey) => qc.invalidateQueries({ queryKey })); setToast('Overview refreshed'); window.setTimeout(() => setToast(''), 2200); };
  if (summary.isLoading) return <div className="page"><PageSkeleton rows={6} /></div>;
  if (summary.isError || !summary.data) return <div className="page"><ErrorBox message="Your family overview is taking a moment to load." /></div>;
  const data = summary.data;
  const activities = activity.data ?? [];
  const upcoming = schedule.data ?? [];
  const meds = medications.data ?? [];
  const carePercent = data.todayTotal ? Math.round((data.todayProgress / data.todayTotal) * 100) : 0;
  const medPercent = data.medicationTotal ? Math.round((data.medicationProgress / data.medicationTotal) * 100) : 0;
  return <div className="page">
    <div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-dot" />Good morning, Margaret</p><h1>A clear view of Eleanor’s day.</h1><p>Small updates, gathered in one calm place.</p></div><button className="btn btn-ghost" onClick={refresh} data-testid="button-refresh-overview"><RefreshCw size={14} /> Refresh view</button></div>
    <div className="dashboard-hero"><section className="card welcome-card" data-testid="card-welcome"><div className="welcome-meta"><Avatar initials={(data.elder.name ?? 'E').split(' ').map((part) => part[0]).join('')} src={data.elder.avatarUrl} size="sm" /><span>{data.elder.name} · {data.elder.relationship}</span></div><h1>Care that travels<br />with you.</h1><p>Everything looks steady in {data.elder.location}. Here is what happened while you were away.</p></section><section className="card health-card" data-testid="card-health-status"><div className="health-top"><div><span className="metric-label">Wellbeing today</span><h3>{data.elder.healthStatus}</h3><p>Last updated just now</p></div><div className="health-icon"><HeartPulse size={19} /></div></div><div><div className="progress-row"><span>Daily care completed</span><strong>{carePercent}%</strong></div><div className="progress-line"><span style={{ width: `${carePercent}%` }} /></div></div></section></div>
    <div className="metric-grid"><div className="card metric-card"><span className="metric-label">Care progress</span><div className="metric-value">{data.todayProgress}<span style={{ color: '#a0b6bb', fontSize: 16 }}>/{data.todayTotal}</span></div><div className="metric-note">visits and check-ins</div><ActivityIcon className="metric-icon" size={19} /></div><div className="card metric-card"><span className="metric-label">Medications</span><div className="metric-value">{data.medicationProgress}<span style={{ color: '#a0b6bb', fontSize: 16 }}>/{data.medicationTotal}</span></div><div className="metric-note">{medPercent}% taken today</div><Pill className="metric-icon" size={19} /></div><div className="card metric-card"><span className="metric-label">Team trust</span><div className="metric-value">{data.trustScore}<span style={{ color: '#a0b6bb', fontSize: 15 }}>/100</span></div><div className="metric-note">across active caregivers</div><ShieldCheck className="metric-icon" size={19} /></div><div className="card metric-card"><span className="metric-label">This month</span><div className="metric-value">${data.monthlySpend.toLocaleString()}</div><div className="metric-note">{data.activeAlerts ? `${data.activeAlerts} active alert` : 'No active alerts'}</div><CircleDollarSign className="metric-icon" size={19} /></div></div>
    <div className="dashboard-columns"><section className="card card-pad"><div className="card-title"><h2>Recent activity</h2><Link href="/care-log" className="btn btn-soft btn-sm" data-testid="link-view-all-activity">View care log <ArrowUpRight size={13} /></Link></div>{activity.isLoading ? <PageSkeleton rows={4} /> : activity.isError ? <ErrorBox /> : activities.length ? <div className="list">{activities.slice(0, 5).map((item) => <div className="list-row" key={item.id} data-testid={`activity-row-${item.id}`}><Avatar initials={item.initials} size="sm" /><div className="row-copy"><div className="row-title">{item.title}</div><div className="row-detail">{item.detail}</div></div><div style={{ textAlign: 'right' }}><StatusPill status={item.status} /><div className="row-detail">{item.time}</div></div></div>)}</div> : <EmptyState icon={ActivityIcon} title="A quiet day so far" text="New care updates will appear here." />}</section><section className="card card-pad"><div className="card-title"><h2>Next check-in</h2><Link href="/journey" className="btn btn-ghost btn-sm" data-testid="link-open-journey">Open journey</Link></div><div style={{ display: 'flex', alignItems: 'center', gap: 11, paddingBottom: 17, borderBottom: '1px solid #edf4f5' }}><div className="health-icon"><PhoneCall size={18} /></div><div className="row-copy"><div className="row-title">{data.nextCheckIn}</div><div className="row-detail">{data.nextCheckInTime}</div></div><StatusPill status="upcoming" /></div><div style={{ marginTop: 17 }}><div className="progress-row"><span>Medication rhythm</span><strong>{medPercent}%</strong></div><div className="progress-line"><span style={{ width: `${medPercent}%` }} /></div></div></section></div>
    <section className="card card-pad" style={{ marginTop: 15 }}><div className="card-title"><h2>Today’s rhythm</h2><span>{upcoming.length} moments planned</span></div>{upcoming.length ? <div className="timeline">{upcoming.slice(0, 4).map((item) => <div className="timeline-item" key={item.id} data-testid={`schedule-row-${item.id}`}><div className="timeline-time">{item.time}</div><div className="timeline-track"><div className={`timeline-dot ${item.status === 'complete' || item.status === 'done' ? 'done' : ''}`} /></div><div className="timeline-copy"><strong>{item.title}</strong><span>{item.detail}</span></div></div>)}</div> : <EmptyState icon={CalendarDays} title="No schedule added" text="Your care team can add today's moments when they are ready." />}</section>
    {toast && <div className="toast" data-testid="status-refresh-toast">{toast}</div>}
  </div>;
}

function CareLogPage() {
  const qc = useQueryClient();
  const logs = useGetCareLogs();
  const create = useCreateCareLog();
  const update = useUpdateCareLog();
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ title: '', detail: '', category: 'wellbeing', time: 'Now' });
  const list = (logs.data ?? []).filter((item) => filter === 'all' || item.status.toLowerCase() === filter);
  const flash = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2800); };
  const addLog = () => { if (!form.title.trim() || !form.detail.trim()) return; create.mutate({ data: form }, { onSuccess: () => { setModal(false); setForm({ title: '', detail: '', category: 'wellbeing', time: 'Now' }); qc.invalidateQueries({ queryKey: getGetCareLogsQueryKey() }); flash('Care update added'); } }); };
  const verify = (id: number) => update.mutate({ id, data: { status: 'verified', verifiedBy: 'Margaret Chen' } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetCareLogsQueryKey() }); flash('Log verified for the care team'); } });
  return <div className="page"><div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-dot" />Care record</p><h1>Review the moments that matter.</h1><p>Verify updates from the people looking after Eleanor today.</p></div><button className="btn btn-primary" onClick={() => setModal(true)} data-testid="button-add-care-log"><Plus size={15} /> Add care update</button></div><div className="toolbar"><div className="filter-tabs" role="tablist">{['all', 'pending', 'verified'].map((value) => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)} role="tab" data-testid={`filter-care-log-${value}`}>{value === 'all' ? 'All updates' : value === 'pending' ? 'Needs review' : 'Verified'}</button>)}</div><span style={{ color: '#8ca0a5', fontSize: 12 }}>{list.length} updates</span></div>{logs.isLoading ? <div className="card card-pad"><PageSkeleton rows={5} /></div> : logs.isError ? <ErrorBox message="Care updates could not be loaded." /> : list.length ? <div className="log-grid">{list.map((log) => <article className="card log-card" key={log.id} data-testid={`care-log-card-${log.id}`}><div className="log-main"><div className="category-icon">{log.category.toLowerCase().includes('meal') ? <Droplets size={17} /> : log.category.toLowerCase().includes('med') ? <Pill size={17} /> : <Stethoscope size={17} />}</div><div style={{ minWidth: 0 }}><h3>{log.title}</h3><p>{log.detail}</p><div className="log-meta"><span>{log.time}</span><span>·</span><span>by {log.caregiver}</span>{log.verifiedBy && <><span>·</span><span>verified by {log.verifiedBy}</span></>}</div></div></div><div className="log-action"><StatusPill status={log.status} />{log.status.toLowerCase() !== 'verified' && <button className="btn btn-soft btn-sm" onClick={() => verify(log.id)} disabled={update.isPending} data-testid={`button-verify-log-${log.id}`}><Check size={13} /> Verify</button>}{log.photoUrl && <button className="icon-button" aria-label="View care photo" data-testid={`button-view-photo-${log.id}`}><Eye size={15} /></button>}</div></article>)}</div> : <div className="card"><EmptyState title="No care updates here" text="Try another filter or add the first update for today." /> </div>}{toast && <div className="toast" data-testid="status-care-log-toast">{toast}</div>}{modal && <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true"><button className="icon-button" style={{ float: 'right' }} onClick={() => setModal(false)} aria-label="Close" data-testid="button-close-care-log"><X size={16} /></button><h2>Add a care update</h2><p>Keep the family record simple, factual, and kind.</p><div className="form-stack"><div className="field"><label htmlFor="log-title">What happened?</label><input id="log-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="A short title" data-testid="input-care-log-title" /></div><div className="field"><label htmlFor="log-detail">A little more detail</label><textarea id="log-detail" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="What would be reassuring to know?" data-testid="input-care-log-detail" /></div><div className="field"><label htmlFor="log-category">Category</label><select id="log-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="select-care-log-category"><option value="wellbeing">Wellbeing</option><option value="meal">Meal</option><option value="medication">Medication</option><option value="visit">Visit</option></select></div></div><div className="modal-actions"><button className="btn btn-ghost" onClick={() => setModal(false)} data-testid="button-cancel-care-log">Cancel</button><button className="btn btn-primary" onClick={addLog} disabled={create.isPending || !form.title || !form.detail} data-testid="button-save-care-log">{create.isPending ? 'Saving…' : 'Save update'}</button></div></div></div>}</div>;
}

function MedicationsPage() {
  const qc = useQueryClient();
  const medications = useGetMedications();
  const update = useUpdateMedicationStatus();
  const [toast, setToast] = useState('');
  const meds = medications.data ?? [];
  const mark = (id: number, status: string) => update.mutate({ id, data: { status } }, { onSuccess: () => { qc.invalidateQueries({ queryKey: getGetMedicationsQueryKey() }); setToast(status === 'taken' ? 'Marked as taken' : 'Medication status updated'); window.setTimeout(() => setToast(''), 2500); } });
  return <div className="page"><div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-dot" />Medication rhythm</p><h1>Gentle reminders, clear answers.</h1><p>See what is due, what is done, and what needs a second look.</p></div><div className="status-pill success"><Check size={11} /> {meds.filter((med) => med.status.toLowerCase() === 'taken').length} taken today</div></div>{medications.isLoading ? <div className="medication-grid"><div className="card med-card"><PageSkeleton rows={2} /></div><div className="card med-card"><PageSkeleton rows={2} /></div></div> : medications.isError ? <ErrorBox message="Medication reminders could not be loaded." /> : meds.length ? <div className="medication-grid">{meds.map((med) => <article className="card med-card" key={med.id} data-testid={`medication-card-${med.id}`}><div className="med-card-top"><div><span className="med-time">{med.time}</span><h3>{med.name}</h3><p>{med.dosage} · {med.instruction}</p></div><StatusPill status={med.status} /></div><div className="med-footer"><span className="stock">{med.stockLabel || `${med.stock} doses left`}</span>{med.status.toLowerCase() !== 'taken' ? <div style={{ display: 'flex', gap: 6 }}><button className="btn btn-ghost btn-sm" onClick={() => mark(med.id, 'missed')} disabled={update.isPending} data-testid={`button-missed-medication-${med.id}`}>Missed</button><button className="btn btn-primary btn-sm" onClick={() => mark(med.id, 'taken')} disabled={update.isPending} data-testid={`button-taken-medication-${med.id}`}><Check size={13} /> Taken</button></div> : <span style={{ color: '#16806f', fontSize: 11, fontWeight: 800 }}>Recorded <Check size={12} /></span>}</div></article>)}</div> : <div className="card"><EmptyState icon={Pill} title="No medications scheduled" text="Medication reminders will appear here when the care plan is ready." /></div>}{toast && <div className="toast" data-testid="status-medication-toast">{toast}</div>}</div>;
}

function JourneyPage() {
  const schedule = useGetSchedule();
  const items = schedule.data ?? [];
  return <div className="page"><div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-dot" />Premium day journey</p><h1>See the care route unfold.</h1><p>A shared view of Eleanor’s stops, check-ins, and little moments outside.</p></div><button className="btn btn-primary" onClick={() => window.alert('Live journey sharing is ready for your care team.')} data-testid="button-share-journey"><Send size={14} /> Share journey</button></div><div className="journey-layout"><section className="card route-card"><div className="route-map" data-testid="map-route"><div className="route-line" /><div className="map-pin one"><MapPin size={14} /></div><div className="map-pin two"><MapPin size={14} /></div><div className="map-pin three"><MapPin size={14} /></div><span className="route-label a">Eleanor’s home</span><span className="route-label b">Riverside café</span><span className="route-label c">Maple clinic</span></div><div className="route-summary"><div style={{ display: 'flex', justifyContent: 'space-between', gap: 15, alignItems: 'flex-start' }}><div><h2>Tuesday route</h2><p>2 of 3 checkpoints complete · updated 11:42 AM</p></div><div className="health-icon"><LocateFixed size={18} /></div></div><div className="progress-line" style={{ marginTop: 18 }}><span style={{ width: '67%' }} /></div></div></section><section className="card schedule-card"><div className="card-title"><h2>Live checkpoints</h2><span>{items.length} today</span></div>{schedule.isLoading ? <PageSkeleton rows={4} /> : schedule.isError ? <ErrorBox /> : items.length ? <div className="timeline">{items.map((item) => <div className="timeline-item" key={item.id} data-testid={`journey-checkpoint-${item.id}`}><div className="timeline-time">{item.time}</div><div className="timeline-track"><div className={`timeline-dot ${item.status === 'complete' || item.status === 'done' ? 'done' : ''}`} /></div><div className="timeline-copy"><strong>{item.title}</strong><span>{item.detail}</span><div style={{ marginTop: 7 }}><StatusPill status={item.status} /></div></div></div>)}</div> : <EmptyState icon={Navigation} title="No route checkpoints yet" text="Today’s journey will appear here when it starts." />}</section></div><section className="metric-grid" style={{ marginTop: 15 }}><div className="card metric-card"><span className="metric-label">Distance covered</span><div className="metric-value">3.8<span style={{ color: '#9eb4b9', fontSize: 14 }}> mi</span></div><div className="metric-note">of 5.1 mi planned</div><Navigation className="metric-icon" size={18} /></div><div className="card metric-card"><span className="metric-label">Time outside</span><div className="metric-value">1h 42</div><div className="metric-note">a lovely morning</div><Clock3 className="metric-icon" size={18} /></div><div className="card metric-card"><span className="metric-label">Next arrival</span><div className="metric-value">12:30</div><div className="metric-note">back home</div><MapPin className="metric-icon" size={18} /></div><div className="card metric-card"><span className="metric-label">Route status</span><div className="metric-value" style={{ fontSize: 21 }}>On track</div><div className="metric-note">no action needed</div><ShieldCheck className="metric-icon" size={18} /></div></section></div>;
}

function ExpensesPage() {
  const qc = useQueryClient();
  const expenses = useGetExpenses();
  const create = useCreateExpense();
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ merchant: '', detail: '', amount: '', date: '2024-10-08' });
  const list = expenses.data ?? [];
  const total = list.reduce((sum, item) => sum + item.amount, 0);
  const addExpense = () => { if (!form.merchant || !form.detail || !form.amount) return; create.mutate({ data: { merchant: form.merchant, detail: form.detail, amount: Number(form.amount), date: form.date } }, { onSuccess: () => { setModal(false); setForm({ merchant: '', detail: '', amount: '', date: '2024-10-08' }); qc.invalidateQueries({ queryKey: getGetExpensesQueryKey() }); setToast('Expense saved'); window.setTimeout(() => setToast(''), 2500); } }); };
  return <div className="page"><div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-dot" />Care spending</p><h1>Every receipt, easy to place.</h1><p>Stay close to the practical details without making them feel heavy.</p></div><button className="btn btn-primary" onClick={() => setModal(true)} data-testid="button-add-expense"><Plus size={15} /> Add receipt</button></div><div className="expense-layout"><section><div className="card expense-total" data-testid="card-monthly-spend"><small>October care spending</small><strong>${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong><span>{list.length ? `${list.length} receipts recorded this month` : 'No receipts recorded yet'}</span></div><div className="card expense-list" style={{ marginTop: 15 }}><div className="card-title"><h2>Recent receipts</h2><button className="btn btn-ghost btn-sm" onClick={() => setToast('Receipt export is being prepared.')} data-testid="button-export-expenses"><FileText size={13} /> Export</button></div>{expenses.isLoading ? <PageSkeleton rows={5} /> : expenses.isError ? <ErrorBox /> : list.length ? list.map((item) => <div className="expense-row" key={item.id} data-testid={`expense-row-${item.id}`}><div className="merchant-icon">{item.merchant.toLowerCase().includes('pharm') ? <Pill size={16} /> : item.merchant.toLowerCase().includes('market') ? <ShoppingBagIcon /> : <CreditCard size={16} />}</div><div><strong>{item.merchant}</strong><span>{item.detail} · {item.date}</span></div><div style={{ textAlign: 'right' }}><div className="expense-amount">${item.amount.toFixed(2)}</div><StatusPill status={item.status} /></div></div>) : <EmptyState icon={ReceiptText} title="Your receipt drawer is empty" text="Add a receipt when a care expense comes through." />}</div></section><section className="card card-pad"><div className="card-title"><h2>Spending notes</h2><SlidersHorizontal size={16} color="#8db1b8" /></div><div className="list"><div className="list-row"><div className="category-icon"><CircleDollarSign size={17} /></div><div className="row-copy"><div className="row-title">Monthly care plan</div><div className="row-detail">Your usual monthly range is $1,200–$1,600.</div></div></div><div className="list-row"><div className="category-icon"><ShieldCheck size={17} /></div><div className="row-copy"><div className="row-title">Receipts stay private</div><div className="row-detail">Only your family circle can view care spending.</div></div></div><div className="list-row"><div className="category-icon"><MessageCircle size={17} /></div><div className="row-copy"><div className="row-title">Ask the care team</div><div className="row-detail">Questions about a charge? Start a conversation.</div></div></div></div><button className="btn btn-soft" style={{ width: '100%', marginTop: 18 }} onClick={() => setToast('Message composer opened for the care team.')} data-testid="button-message-expenses"><MessageCircle size={14} /> Message care team</button></section></div>{toast && <div className="toast" data-testid="status-expense-toast">{toast}</div>}{modal && <div className="modal-backdrop"><div className="modal" role="dialog" aria-modal="true"><button className="icon-button" style={{ float: 'right' }} onClick={() => setModal(false)} aria-label="Close" data-testid="button-close-expense"><X size={16} /></button><h2>Add a receipt</h2><p>Record the basics now; you can attach the original later.</p><div className="form-stack"><div className="field"><label htmlFor="expense-merchant">Merchant</label><input id="expense-merchant" value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} placeholder="e.g. Maple Pharmacy" data-testid="input-expense-merchant" /></div><div className="field"><label htmlFor="expense-detail">What was it for?</label><input id="expense-detail" value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} placeholder="e.g. Prescription refill" data-testid="input-expense-detail" /></div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}><div className="field"><label htmlFor="expense-amount">Amount</label><input id="expense-amount" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" data-testid="input-expense-amount" /></div><div className="field"><label htmlFor="expense-date">Date</label><input id="expense-date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} data-testid="input-expense-date" /></div></div></div><div className="modal-actions"><button className="btn btn-ghost" onClick={() => setModal(false)} data-testid="button-cancel-expense">Cancel</button><button className="btn btn-primary" onClick={addExpense} disabled={create.isPending || !form.merchant || !form.detail || !form.amount} data-testid="button-save-expense">{create.isPending ? 'Saving…' : 'Save receipt'}</button></div></div></div>}</div>;
}

function ShoppingBagIcon() { return <ReceiptText size={16} />; }

function CaregiversPage() {
  const caregivers = useGetCaregivers();
  const list = caregivers.data ?? [];
  return <div className="page"><div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-dot" />Trusted circle</p><h1>The people beside your family.</h1><p>Know who is on the ground, how they are doing, and when they are nearby.</p></div><button className="btn btn-primary" onClick={() => window.alert('Caregiver invitations are available from your family administrator.')} data-testid="button-invite-caregiver"><Plus size={15} /> Invite caregiver</button></div>{caregivers.isLoading ? <div className="caregiver-grid"><div className="card caregiver-card"><PageSkeleton rows={2} /></div><div className="card caregiver-card"><PageSkeleton rows={2} /></div></div> : caregivers.isError ? <ErrorBox message="The caregiver circle could not be loaded." /> : list.length ? <><div className="caregiver-grid">{list.map((person) => <article className="card caregiver-card" key={person.id} data-testid={`caregiver-card-${person.id}`}><div className="caregiver-head"><div className="caregiver-id"><Avatar initials={person.initials} size="md" /><div><h3>{person.name}</h3><p>{person.role}</p></div></div><div className="trust-score">{person.trustScore}<small>trust score</small></div></div><div className="caregiver-details"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: person.status.toLowerCase() === 'active' ? '#39b98a' : '#eab640' }} />{person.status}</span><span><MapPin size={12} style={{ verticalAlign: 'middle' }} /> {person.distance}</span></div><button className="btn btn-soft btn-sm" style={{ width: '100%', marginTop: 15 }} onClick={() => window.alert(`A secure message to ${person.name} is ready.`)} data-testid={`button-message-caregiver-${person.id}`}><MessageCircle size={13} /> Message {person.name.split(' ')[0]}</button></article>)}</div><div className="card card-pad" style={{ marginTop: 15, display: 'flex', alignItems: 'center', gap: 14 }}><div className="health-icon"><ShieldCheck size={20} /></div><div className="row-copy"><div className="row-title">Your circle is looking steady</div><div className="row-detail">Trust scores reflect verified visits, family feedback, and time on the care team.</div></div><Link className="btn btn-ghost btn-sm" href="/profile-ai" data-testid="link-review-caregiver-profile">Review profiles <ChevronRight size={13} /></Link></div></> : <div className="card"><EmptyState icon={Users} title="Your trusted circle is taking shape" text="Caregivers will appear here once they are connected to Eleanor’s care plan." /></div>}</div>;
}

function ProfileAiPage() {
  const generate = useGenerateProfileDraft();
  const [transcript, setTranscript] = useState('');
  const [draft, setDraft] = useState<{ summary: string; experience: string; skills: string[]; availability: string; location: string } | null>(null);
  const [toast, setToast] = useState('');
  const createDraft = () => { if (!transcript.trim()) return; generate.mutate({ data: { transcript } }, { onSuccess: (result) => { setDraft(result); setToast('Profile draft ready to review'); window.setTimeout(() => setToast(''), 2800); } }); };
  return <div className="page"><div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-dot" />Profile studio</p><h1>Turn a conversation into a profile.</h1><p>Describe the caregiver in your own words. We will shape a thoughtful first draft.</p></div><div className="status-pill neutral"><WandSparkles size={11} /> AI-assisted, always editable</div></div><div className="profile-ai-layout"><section className="card card-pad"><div className="card-title"><h2>Your notes</h2><Mic size={16} color="#8db1b8" /></div><div className="field"><label htmlFor="profile-transcript">Tell us about this caregiver</label><textarea id="profile-transcript" style={{ minHeight: 250 }} value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="“Sofia has been caring for older adults for eight years. She is patient, speaks Spanish, and is available weekday mornings…”" data-testid="textarea-profile-transcript" /></div><button className="btn btn-primary" style={{ width: '100%', marginTop: 15 }} onClick={createDraft} disabled={generate.isPending || !transcript.trim()} data-testid="button-generate-profile"><Sparkles size={14} /> {generate.isPending ? 'Listening closely…' : 'Draft profile'}</button><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#94a7ab', fontSize: 10, lineHeight: 1.5, marginTop: 16 }}><LockKeyhole size={13} style={{ flex: '0 0 auto', marginTop: 1 }} />Your notes are used only to prepare this draft. Review every detail before sharing.</div></section><section className="card draft-card">{draft ? <><div className="card-title"><h2>Profile draft</h2><span className="status-pill success"><Check size={11} /> Ready to review</span></div><div className="draft-section"><label>Summary</label><p>{draft.summary}</p></div><div className="draft-section"><label>Experience</label><p>{draft.experience}</p></div><div className="draft-section"><label>Skills</label><div className="skill-list">{draft.skills.map((skill) => <span className="skill" key={skill}>{skill}</span>)}</div></div><div className="draft-section"><label>Availability</label><p>{draft.availability}</p></div><div className="draft-section"><label>Location</label><p><MapPin size={13} style={{ verticalAlign: 'middle' }} /> {draft.location}</p></div><div className="modal-actions"><button className="btn btn-ghost" onClick={() => setDraft(null)} data-testid="button-restart-profile">Start over</button><button className="btn btn-primary" onClick={() => setToast('Draft saved to your caregiver circle')} data-testid="button-save-profile"><Check size={14} /> Save profile</button></div></> : <div className="empty-state" style={{ paddingTop: 75, paddingBottom: 75 }}><div className="empty-icon"><WandSparkles size={20} /></div><strong>Your draft will appear here</strong><p>Give us a little context and we will organize it into a warm, useful profile.</p></div>}</section></div>{toast && <div className="toast" data-testid="status-profile-toast">{toast}</div>}</div>;
}

function SettingsPage() {
  const [tab, setTab] = useState('Family'); const [toggles, setToggles] = useState({ updates: true, reminders: true, weekly: false, location: true }); const [toast, setToast] = useState('');
  const toggle = (key: keyof typeof toggles) => setToggles({ ...toggles, [key]: !toggles[key] });
  const save = () => { setToast('Settings saved'); window.setTimeout(() => setToast(''), 2400); };
  return <div className="page"><div className="page-heading"><div><p className="eyebrow"><span className="eyebrow-dot" />Your preferences</p><h1>Make CareLink feel like yours.</h1><p>Quiet when you need quiet, close when your family needs you.</p></div><button className="btn btn-primary" onClick={save} data-testid="button-save-settings"><Check size={14} /> Save changes</button></div><div className="settings-layout"><nav className="settings-nav" aria-label="Settings sections">{['Family', 'Notifications', 'Privacy'].map((item) => <button key={item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)} data-testid={`settings-tab-${item.toLowerCase()}`}>{item}</button>)}</nav><section className="card settings-panel">{tab === 'Family' && <><div className="card-title"><h2>Family details</h2><UserRound size={16} color="#8db1b8" /></div><div className="setting-row"><div><strong>Family circle</strong><span>Margaret Chen, David Chen, and 2 caregivers</span></div><button className="btn btn-ghost btn-sm" onClick={() => setToast('Family circle editor opened')} data-testid="button-edit-family">Edit</button></div><div className="setting-row"><div><strong>Eleanor’s home</strong><span>Oakland, California · Pacific time</span></div><button className="btn btn-ghost btn-sm" onClick={() => setToast('Location editor opened')} data-testid="button-edit-location">Edit</button></div><div className="setting-row"><div><strong>Care plan</strong><span>Standard family plan · Renews November 8</span></div><button className="btn btn-soft btn-sm" onClick={() => setToast('Plan details opened')} data-testid="button-view-plan">View plan</button></div></>}{tab === 'Notifications' && <><div className="card-title"><h2>Notification rhythm</h2><Bell size={16} color="#8db1b8" /></div>{[['updates', 'Care updates', 'A note when a caregiver logs a completed moment.'], ['reminders', 'Medication reminders', 'A gentle reminder when a medication window is approaching.'], ['weekly', 'Weekly family digest', 'A Sunday summary of care, spending, and the week ahead.'], ['location', 'Journey checkpoints', 'When Eleanor arrives at an important stop.']].map(([key, title, text]) => <div className="setting-row" key={key}><div><strong>{title}</strong><span>{text}</span></div><button className={`switch ${toggles[key as keyof typeof toggles] ? 'on' : ''}`} onClick={() => toggle(key as keyof typeof toggles)} aria-label={`Toggle ${title}`} data-testid={`switch-${key}`}><span /></button></div>)}</>}{tab === 'Privacy' && <><div className="card-title"><h2>Privacy and access</h2><LockKeyhole size={16} color="#8db1b8" /></div><div className="setting-row"><div><strong>Family-only records</strong><span>Care logs and expenses are visible to your approved family circle.</span></div><span className="status-pill success">On</span></div><div className="setting-row"><div><strong>Location sharing</strong><span>Journey sharing stops automatically at the end of each day.</span></div><button className={`switch ${toggles.location ? 'on' : ''}`} onClick={() => toggle('location')} aria-label="Toggle location sharing" data-testid="switch-location-privacy"><span /></button></div><div className="setting-row"><div><strong>Download your data</strong><span>Request a private copy of your family records.</span></div><button className="btn btn-ghost btn-sm" onClick={() => setToast('Your data request has been noted')} data-testid="button-request-data">Request</button></div></>}</section></div>{toast && <div className="toast" data-testid="status-settings-toast">{toast}</div>}</div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Shell><Switch><Route path="/" component={Dashboard} /><Route path="/care-log" component={CareLogPage} /><Route path="/medications" component={MedicationsPage} /><Route path="/journey" component={JourneyPage} /><Route path="/expenses" component={ExpensesPage} /><Route path="/caregivers" component={CaregiversPage} /><Route path="/profile-ai" component={ProfileAiPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch></Shell></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;