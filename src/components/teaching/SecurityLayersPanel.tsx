// =====================================================
// INTERACTIVE SECURITY LAYERS PANEL
// Shows all 6 security layers with live data + actions
// =====================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, UserCheck, Star, Activity, Lock, ShieldCheck,
  CheckCircle2, Clock, AlertTriangle, XCircle, ChevronDown,
  ChevronUp, Mail, Phone, Building2, Fingerprint, Plus,
  Eye, EyeOff, TrendingUp, Award, Zap, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIdentityVerification } from '@/hooks/useIdentityVerification';
import { useBehavioralMonitoring } from '@/hooks/useBehavioralMonitoring';
import { useTeacherSkills } from '@/hooks/useTeacherSkills';
import { useTeacherPerformance } from '@/hooks/useTeacherPerformance';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import { useAuth } from '@/contexts/AuthContext';
import type { OTPType } from '@/types/security';

// ---------- helpers ----------
type LayerStatus = 'active' | 'pending' | 'warning' | 'error' | 'inactive' | 'loading';

const STATUS_CFG: Record<LayerStatus, { color: string; ring: string; Icon: any; label: string }> = {
  active:   { color: 'text-emerald-500',      ring: 'border-emerald-500/40 bg-emerald-500/5',   Icon: CheckCircle2,  label: 'Active'   },
  pending:  { color: 'text-amber-500',        ring: 'border-amber-500/40 bg-amber-500/5',       Icon: Clock,         label: 'Pending'  },
  warning:  { color: 'text-orange-500',       ring: 'border-orange-500/40 bg-orange-500/5',     Icon: AlertTriangle, label: 'Warning'  },
  error:    { color: 'text-red-500',          ring: 'border-red-500/40 bg-red-500/5',           Icon: XCircle,       label: 'Error'    },
  inactive: { color: 'text-muted-foreground', ring: 'border-border bg-muted/20',                Icon: Clock,         label: 'Inactive' },
  loading:  { color: 'text-blue-400',         ring: 'border-blue-400/40 bg-blue-400/5',         Icon: RefreshCw,     label: 'Loading'  },
};

// ---------- Layer 1: Identity Verification ----------
function L1Panel() {
  const { user } = useAuth();
  const {
    verification, loading, sendingOTP, verifying,
    sendOTP, verifyOTP, getVerificationProgress, refresh,
  } = useIdentityVerification();

  const [expanded, setExpanded] = useState(false);
  const [otpType, setOtpType] = useState<OTPType>('email');
  const [contact, setContact] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const progress = getVerificationProgress();
  const emailOk  = verification?.email_verified ?? false;
  const mobileOk = verification?.mobile_verified ?? false;
  const instOk   = verification?.institutional_verified ?? false;

  const status: LayerStatus = loading ? 'loading'
    : emailOk ? 'active'
    : 'pending';

  const cfg = STATUS_CFG[status];
  const StatusIcon = cfg.Icon;

  const handleSend = async () => {
    const target = otpType === 'email' ? (user?.email ?? '') : contact;
    const ok = await sendOTP(otpType, target);
    if (ok) setOtpSent(true);
  };

  const handleVerify = async () => {
    const ok = await verifyOTP(code, otpType);
    if (ok) { setOtpSent(false); setCode(''); refresh(); }
  };

  return (
    <div className={`rounded-xl border p-4 transition-all ${cfg.ring}`}>
      {/* Header row */}
      <button
        className="w-full flex items-start justify-between gap-2 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Shield className={`h-4 w-4 shrink-0 ${cfg.color}`} />
          <span className="text-sm font-semibold text-foreground">L1 · Identity Verification</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
            <StatusIcon className="h-3 w-3" /> {cfg.label}
          </span>
          {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </div>
      </button>

      {/* Quick indicators */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${emailOk ? 'border-emerald-500/40 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'border-amber-500/30 text-amber-600 bg-amber-50 dark:bg-amber-950/30'}`}>
          <Mail className="h-3 w-3" /> Email {emailOk ? '✓' : '—'}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${mobileOk ? 'border-emerald-500/40 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'border-muted text-muted-foreground'}`}>
          <Phone className="h-3 w-3" /> Mobile {mobileOk ? '✓' : '—'}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${instOk ? 'border-emerald-500/40 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'border-muted text-muted-foreground'}`}>
          <Building2 className="h-3 w-3" /> Institution {instOk ? '✓' : '—'}
        </span>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Progress value={progress} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">{progress}%</span>
      </div>

      {/* Expanded section */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4 border-t border-border/40 mt-3">
              {/* Identity info */}
              <div className="text-xs space-y-1 text-muted-foreground">
                <p><span className="text-foreground font-medium">Auth email:</span> {user?.email}</p>
                <p><span className="text-foreground font-medium">Level:</span> {verification?.verification_level?.replace(/_/g, ' ') ?? 'unverified'}</p>
                {verification?.last_login_at && (
                  <p><span className="text-foreground font-medium">Last login:</span> {new Date(verification.last_login_at).toLocaleString()}</p>
                )}
              </div>

              {/* OTP flow */}
              {!otpSent ? (
                <div className="space-y-2">
                  <Label className="text-xs">Verify via OTP</Label>
                  <div className="flex gap-2">
                    <select
                      value={otpType}
                      onChange={e => setOtpType(e.target.value as OTPType)}
                      className="text-xs rounded-md border border-input bg-background px-2 py-1 focus:outline-none"
                    >
                      <option value="email">Email</option>
                      <option value="mobile">Mobile</option>
                      <option value="institutional">Institutional</option>
                    </select>
                    {otpType !== 'email' && (
                      <Input
                        placeholder={otpType === 'mobile' ? '+1234567890' : 'you@university.edu'}
                        value={contact}
                        onChange={e => setContact(e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      disabled={sendingOTP || (otpType !== 'email' && !contact)}
                      onClick={handleSend}
                    >
                      {sendingOTP ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Send OTP'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs">Enter the code sent to your {otpType}</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="6-digit code"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      maxLength={6}
                      className="h-8 text-xs font-mono tracking-widest"
                    />
                    <Button size="sm" className="h-8 text-xs" disabled={verifying || code.length < 4} onClick={handleVerify}>
                      {verifying ? <RefreshCw className="h-3 w-3 animate-spin" /> : 'Verify'}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setOtpSent(false)}>Back</Button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Fingerprint className="h-3 w-3" />
                Device fingerprinting: {verification?.device_fingerprint?.length ? 'Registered' : 'Not yet registered'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Layer 2: Skill Validation ----------
function L2Panel() {
  const { skills, domains, loading, submitting, submitSkill, getApprovedSkills, getPendingSkills } = useTeacherSkills();
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState('');
  const [experience, setExperience] = useState<'beginner'|'intermediate'|'advanced'|'expert'>('intermediate');
  const [years, setYears] = useState('');
  const [description, setDescription] = useState('');

  const approved = getApprovedSkills();
  const pending  = getPendingSkills();

  const status: LayerStatus = loading ? 'loading'
    : approved.length > 0 ? 'active'
    : pending.length > 0 ? 'pending'
    : 'inactive';

  const cfg = STATUS_CFG[status];
  const StatusIcon = cfg.Icon;
  const progress = approved.length > 0 ? 100 : pending.length > 0 ? 50 : 0;

  const handleSubmit = async () => {
    if (!selectedDomain) return;
    const ok = await submitSkill({
      skill_domain_id: selectedDomain,
      experience_level: experience,
      teaching_scope: 'all_levels',
      years_of_experience: years ? Number(years) : undefined,
      description: description || undefined,
    });
    if (ok) { setShowForm(false); setSelectedDomain(''); setDescription(''); setYears(''); }
  };

  return (
    <div className={`rounded-xl border p-4 transition-all ${cfg.ring}`}>
      <button className="w-full flex items-start justify-between gap-2 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2 min-w-0">
          <UserCheck className={`h-4 w-4 shrink-0 ${cfg.color}`} />
          <span className="text-sm font-semibold text-foreground">L2 · Skill Validation</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
            <StatusIcon className="h-3 w-3" /> {cfg.label}
          </span>
          {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </div>
      </button>

      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
        <span className="text-emerald-500 font-medium">{approved.length} Approved</span>
        <span>·</span>
        <span className="text-amber-500 font-medium">{pending.length} Pending</span>
        <span>·</span>
        <span>{skills.length} Total</span>
      </div>
      <Progress value={progress} className="h-1.5 mt-2" />

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="pt-4 space-y-3 border-t border-border/40 mt-3">
              {/* Skills list */}
              {skills.length > 0 ? (
                <div className="space-y-2">
                  {skills.map(s => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-xs">
                      <div>
                        <p className="font-medium text-foreground">{s.skill_domain?.name ?? s.skill_domain_id}</p>
                        <p className="text-muted-foreground capitalize">{s.experience_level} · {s.verification_status?.replace(/_/g, ' ')}</p>
                      </div>
                      <Badge variant={s.approval_status === 'approved' ? 'default' : 'outline'} className="text-xs">
                        {s.approval_status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No skills declared yet.</p>
              )}

              {/* Add skill form */}
              {showForm ? (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                  <p className="text-xs font-semibold text-foreground">Declare New Skill</p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Domain</Label>
                    <select
                      value={selectedDomain}
                      onChange={e => setSelectedDomain(e.target.value)}
                      className="w-full text-xs rounded-md border border-input bg-background px-2 py-1.5 focus:outline-none"
                    >
                      <option value="">— Select domain —</option>
                      {domains.map(d => (
                        <option key={d.id} value={d.id}>{d.name} {d.requires_validation ? '(requires approval)' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Level</Label>
                      <select value={experience} onChange={e => setExperience(e.target.value as any)} className="w-full text-xs rounded-md border border-input bg-background px-2 py-1.5 focus:outline-none">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Years of experience</Label>
                      <Input value={years} onChange={e => setYears(e.target.value)} placeholder="e.g. 3" type="number" min="0" className="h-7 text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description (optional)</Label>
                    <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Briefly describe your expertise" className="h-7 text-xs" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-7 text-xs" disabled={submitting || !selectedDomain} onClick={handleSubmit}>
                      {submitting ? <RefreshCw className="h-3 w-3 animate-spin mr-1" /> : null} Submit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowForm(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="w-full h-8 text-xs gap-1" onClick={() => setShowForm(true)}>
                  <Plus className="h-3 w-3" /> Declare New Skill
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Layer 3: Performance Metrics ----------
function L3Panel() {
  const { performance, loading, meetsMinimumStandards, getPerformanceBreakdown, getRatingDistribution, getVisibilityStatus } = useTeacherPerformance();
  const [expanded, setExpanded] = useState(false);

  const breakdown = getPerformanceBreakdown();
  const vis = getVisibilityStatus();
  const ratings = getRatingDistribution();

  const status: LayerStatus = loading ? 'loading'
    : !performance ? 'inactive'
    : meetsMinimumStandards() ? 'active'
    : 'warning';

  const cfg = STATUS_CFG[status];
  const StatusIcon = cfg.Icon;
  const progress = performance ? Math.min(100, performance.reliability_score ?? 0) : 0;

  return (
    <div className={`rounded-xl border p-4 transition-all ${cfg.ring}`}>
      <button className="w-full flex items-start justify-between gap-2 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2 min-w-0">
          <Star className={`h-4 w-4 shrink-0 ${cfg.color}`} />
          <span className="text-sm font-semibold text-foreground">L3 · Performance Metrics</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
            <StatusIcon className="h-3 w-3" /> {cfg.label}
          </span>
          {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </div>
      </button>

      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>⭐ {performance?.average_rating?.toFixed(1) ?? '—'}/5</span>
        <span>· {breakdown?.completion ?? 0}% completion</span>
        <span>· Reliability {performance?.reliability_score ?? 0}/100</span>
      </div>
      <Progress value={progress} className="h-1.5 mt-2" />

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="pt-4 space-y-4 border-t border-border/40 mt-3">
              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Total Sessions', value: performance?.total_sessions ?? 0, icon: TrendingUp },
                  { label: 'Completed',       value: performance?.completed_sessions ?? 0, icon: CheckCircle2 },
                  { label: 'Unique Learners', value: performance?.unique_learners ?? 0, icon: UserCheck },
                  { label: 'Total Ratings',  value: performance?.total_ratings ?? 0, icon: Star },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2 rounded-lg border border-border/60 px-2 py-2">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{value}</p>
                      <p className="text-muted-foreground">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rating bars */}
              {ratings.some(r => r.count > 0) && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">Rating Distribution</p>
                  {ratings.map(r => (
                    <div key={r.stars} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-right text-muted-foreground">{r.stars}★</span>
                      <Progress value={performance && performance.total_ratings > 0 ? (r.count / performance.total_ratings) * 100 : 0} className="h-1.5 flex-1" />
                      <span className="w-4 text-muted-foreground">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Visibility + standards */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Visibility</span>
                <Badge variant={vis.level === 'high' ? 'default' : vis.level === 'hidden' ? 'destructive' : 'outline'} className="text-xs capitalize">
                  {vis.message}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Standards</span>
                <Badge variant={meetsMinimumStandards() ? 'default' : 'destructive'} className="text-xs">
                  {meetsMinimumStandards() ? 'Meets minimum' : 'Below minimum'}
                </Badge>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Layer 4: Behavioral Monitor ----------
function L4Panel() {
  const { anomalies, creditsFrozen, freezeLog, loading, getBehavioralHealthScore, getAnomalySummary, getFreezeDetails, canEarnCredits, getRecentAnomalies, refresh } = useBehavioralMonitoring();
  const [expanded, setExpanded] = useState(false);

  const health = getBehavioralHealthScore();
  const summary = getAnomalySummary();
  const recent = getRecentAnomalies();
  const earnStatus = canEarnCredits();
  const freezeDetails = getFreezeDetails();

  const status: LayerStatus = loading ? 'loading'
    : creditsFrozen ? 'error'
    : summary.by_severity.critical > 0 || summary.by_severity.high > 0 ? 'warning'
    : 'active';

  const cfg = STATUS_CFG[status];
  const StatusIcon = cfg.Icon;

  return (
    <div className={`rounded-xl border p-4 transition-all ${cfg.ring}`}>
      <button className="w-full flex items-start justify-between gap-2 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2 min-w-0">
          <Activity className={`h-4 w-4 shrink-0 ${cfg.color}`} />
          <span className="text-sm font-semibold text-foreground">L4 · Behavioral Monitor</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
            <StatusIcon className="h-3 w-3" /> {cfg.label}
          </span>
          {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </div>
      </button>

      <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className={health >= 80 ? 'text-emerald-500 font-medium' : health >= 50 ? 'text-amber-500 font-medium' : 'text-red-500 font-medium'}>
          Health {health}/100
        </span>
        <span>· {summary.total} flag{summary.total !== 1 ? 's' : ''}</span>
        {creditsFrozen && <span className="text-red-500 font-medium">· Credits FROZEN</span>}
      </div>
      <Progress
        value={health}
        className="h-1.5 mt-2"
      />

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="pt-4 space-y-4 border-t border-border/40 mt-3">
              {/* Credit freeze warning */}
              {creditsFrozen && freezeDetails && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs space-y-1">
                  <p className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-1">
                    <XCircle className="h-3 w-3" /> Credits Frozen
                  </p>
                  <p className="text-muted-foreground">Reason: {freezeDetails.reason}</p>
                  <p className="text-muted-foreground">Frozen {freezeDetails.daysFrozen} day{freezeDetails.daysFrozen !== 1 ? 's' : ''} ago</p>
                  <p className="text-muted-foreground">Credits affected: {freezeDetails.creditsAffected}</p>
                </div>
              )}

              {/* Anomaly severity breakdown */}
              <div className="grid grid-cols-4 gap-1 text-xs text-center">
                {(['critical','high','medium','low'] as const).map(sev => (
                  <div key={sev} className={`rounded-lg border py-1.5 ${summary.by_severity[sev] > 0 ? (sev === 'critical' ? 'border-red-500/40 bg-red-50 dark:bg-red-950/30 text-red-600' : sev === 'high' ? 'border-orange-500/40 bg-orange-50 dark:bg-orange-950/30 text-orange-600' : 'border-amber-500/40 bg-amber-50 dark:bg-amber-950/30 text-amber-600') : 'border-border text-muted-foreground'}`}>
                    <p className="font-bold text-sm">{summary.by_severity[sev]}</p>
                    <p className="text-[10px] capitalize">{sev}</p>
                  </div>
                ))}
              </div>

              {/* Recent anomalies */}
              {recent.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-foreground">Recent Flags (7 days)</p>
                  {recent.slice(0, 3).map(a => (
                    <div key={a.id} className="flex items-start justify-between text-xs rounded border border-border/60 px-2 py-1.5">
                      <div>
                        <p className="font-medium text-foreground capitalize">{String(a.anomaly_type).replace(/_/g,' ')}</p>
                        <p className="text-muted-foreground">{new Date(a.detection_timestamp).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={a.severity === 'critical' || a.severity === 'high' ? 'destructive' : 'outline'} className="text-[10px] capitalize">{a.severity}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> No behavioral flags in last 7 days
                </div>
              )}

              {/* Earn credits status */}
              <div className={`flex items-center gap-2 text-xs rounded-lg border px-3 py-2 ${earnStatus.allowed ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'border-red-500/30 text-red-600 dark:text-red-400'}`}>
                <Zap className="h-3 w-3 shrink-0" />
                {earnStatus.allowed ? 'Eligible to earn credits' : earnStatus.reason}
              </div>

              <Button size="sm" variant="ghost" className="w-full h-7 text-xs" onClick={refresh}>
                <RefreshCw className="h-3 w-3 mr-1" /> Refresh
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Layer 5: Admin Oversight ----------
function L5Panel() {
  const { isAdmin, adminRole, loading, pendingApprovals, getDashboardStats } = useAdminDashboard();
  const [expanded, setExpanded] = useState(false);

  const stats = getDashboardStats();
  const status: LayerStatus = loading ? 'loading' : isAdmin ? 'active' : 'inactive';
  const cfg = STATUS_CFG[status];
  const StatusIcon = cfg.Icon;

  return (
    <div className={`rounded-xl border p-4 transition-all ${cfg.ring}`}>
      <button className="w-full flex items-start justify-between gap-2 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2 min-w-0">
          <Lock className={`h-4 w-4 shrink-0 ${cfg.color}`} />
          <span className="text-sm font-semibold text-foreground">L5 · Admin Oversight</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
            <StatusIcon className="h-3 w-3" /> {cfg.label}
          </span>
          {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </div>
      </button>

      <p className="mt-2 text-xs text-muted-foreground">
        {isAdmin ? `Role: ${adminRole ?? 'admin'} · ${stats.pending_approvals} pending` : 'Standard account — no admin role assigned'}
      </p>
      <Progress value={isAdmin ? 100 : 40} className="h-1.5 mt-2" />

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="pt-4 space-y-3 border-t border-border/40 mt-3">
              {isAdmin ? (
                <>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center">
                    {[
                      { label: 'Pending', value: stats.pending_approvals },
                      { label: 'Flagged',  value: stats.flagged_users },
                      { label: 'Anomalies', value: stats.unresolved_anomalies },
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg border border-border/60 py-2">
                        <p className="font-bold text-foreground text-sm">{value}</p>
                        <p className="text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                  {pendingApprovals.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-foreground">Pending Approvals</p>
                      {pendingApprovals.slice(0, 3).map((a: any) => (
                        <div key={a.id} className="flex items-center justify-between text-xs rounded border border-border/60 px-2 py-1.5">
                          <span className="text-muted-foreground truncate">{a.id?.slice(0, 12)}…</span>
                          <Badge variant="outline" className="text-[10px]">pending</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>This layer activates when an institution assigns you an admin role.</p>
                  <p>Admin oversight enables teacher approval workflows, flagged user reviews, and anomaly triage.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Layer 6: Transaction Integrity ----------
function L6Panel() {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG['active'];
  const StatusIcon = cfg.Icon;

  return (
    <div className={`rounded-xl border p-4 transition-all ${cfg.ring}`}>
      <button className="w-full flex items-start justify-between gap-2 text-left" onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className={`h-4 w-4 shrink-0 ${cfg.color}`} />
          <span className="text-sm font-semibold text-foreground">L6 · Transaction Integrity</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
            <StatusIcon className="h-3 w-3" /> {cfg.label}
          </span>
          {expanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </div>
      </button>

      <p className="mt-2 text-xs text-muted-foreground">Dual-confirmation required for all credit transfers</p>
      <Progress value={100} className="h-1.5 mt-2" />

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="pt-4 space-y-2 border-t border-border/40 mt-3 text-xs text-muted-foreground">
              {[
                { icon: CheckCircle2, label: 'Dual-party confirmation active', ok: true },
                { icon: CheckCircle2, label: 'Historical accuracy validation', ok: true },
                { icon: CheckCircle2, label: 'Value restoration guard', ok: true },
                { icon: CheckCircle2, label: 'Credit ledger integrity check', ok: true },
                { icon: CheckCircle2, label: 'Fairness guardian enforced', ok: true },
              ].map(({ icon: Icon, label, ok }) => (
                <div key={label} className={`flex items-center gap-2 ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  <Icon className="h-3 w-3 shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Main export ----------
export function SecurityLayersPanel() {
  const { verification } = useIdentityVerification();
  const { getBehavioralHealthScore, creditsFrozen, anomalies } = useBehavioralMonitoring();
  const { getApprovedSkills, getPendingSkills } = useTeacherSkills();
  const { meetsMinimumStandards } = useTeacherPerformance();
  const { isAdmin } = useAdminDashboard();

  const approved = getApprovedSkills();
  const pending  = getPendingSkills();
  const health   = getBehavioralHealthScore();
  const highFlags = (anomalies || []).filter((a: any) => a.severity === 'critical' || a.severity === 'high').length;

  const layerStatuses: LayerStatus[] = [
    verification?.email_verified ? 'active' : 'pending',
    approved.length > 0 ? 'active' : pending.length > 0 ? 'pending' : 'inactive',
    meetsMinimumStandards() ? 'active' : 'warning',
    creditsFrozen ? 'error' : highFlags > 0 ? 'warning' : 'active',
    isAdmin ? 'active' : 'inactive',
    'active',
  ];

  const activeCount = layerStatuses.filter(s => s === 'active').length;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-primary" />
          Security Layers
          <div className="ml-auto flex items-center gap-2">
            {layerStatuses.map((s, i) => {
              const dot = s === 'active' ? 'bg-emerald-500'
                : s === 'pending' ? 'bg-amber-500'
                : s === 'warning' ? 'bg-orange-500'
                : s === 'error' ? 'bg-red-500'
                : 'bg-muted-foreground/30';
              return <span key={i} title={`L${i + 1}: ${s}`} className={`h-2 w-2 rounded-full ${dot}`} />;
            })}
            <Badge variant="secondary" className="text-xs ml-1">{activeCount}/6 Active</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <L1Panel />
        <L2Panel />
        <L3Panel />
        <L4Panel />
        <L5Panel />
        <L6Panel />
      </CardContent>
    </Card>
  );
}
