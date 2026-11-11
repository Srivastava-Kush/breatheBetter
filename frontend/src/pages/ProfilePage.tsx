import React, { useState } from 'react';
import {
  User,
  Bell,
  Trash2,
  Plus,
  ShieldCheck,
  LogOut,
  Lock,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  MapPin,
  Clock,
  Radio,
} from 'lucide-react';
import { useAlerts, useCreateAlert, useDeleteAlert, useLocations } from '../hooks/useAirQuality';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { authApi } from '../api/endpoints';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export function ProfilePage() {
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const { selectedLocationId } = useAppStore();
  const { data: alertsData, isLoading: alertsLoading } = useAlerts();
  const createAlert = useCreateAlert();
  const deleteAlert = useDeleteAlert();
  const { data: locationsData } = useLocations({ limit: 100 });

  // Auth Form State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // New Alert Form State
  const [threshold, setThreshold] = useState('150');
  const [customStationId, setCustomStationId] = useState<number | null>(null);
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const alerts = alertsData?.data ?? [];
  const locations = locationsData?.data ?? [];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (authMode === 'register') {
        if (!name.trim()) {
          setAuthError('Please enter your full name');
          setAuthLoading(false);
          return;
        }
        const res = await authApi.register({ name: name.trim(), email: email.trim(), password });
        if (res.data) {
          setAuth(res.data.token, res.data.user);
        }
      } else {
        const res = await authApi.login({ email: email.trim(), password });
        if (res.data) {
          setAuth(res.data.token, res.data.user);
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateAlert = () => {
    const locId = customStationId || selectedLocationId;
    if (!locId || !threshold) return;

    const loc = locations.find((l) => l.openaqId === locId);
    const stationName = loc ? loc.name : `Station #${locId}`;

    createAlert.mutate({
      locationId: locId,
      stationName,
      aqiThreshold: parseInt(threshold, 10),
      condition,
    });
  };

  // If user is not logged in: display Login / Register Box
  if (!isAuthenticated || !user) {
    return (
      <div className="p-4 md:p-8 max-w-md mx-auto space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Account & Smart Alerts</h1>
          <p className="text-xs text-muted-foreground">
            Sign in to manage and configure your personal smart air quality threshold alerts
          </p>
        </div>

        <Card className="shadow-xl border-border/80">
          <CardHeader className="pb-3 border-b border-border/60">
            <div className="flex rounded-xl bg-muted p-1">
              <button
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'login'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  authMode === 'register'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Create Account
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="e.g. Kushagra Verma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9 text-sm"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-sm"
                    required
                    minLength={6}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">Minimum 6 characters</span>
              </div>

              <Button
                type="submit"
                disabled={authLoading}
                className="w-full text-xs font-bold py-2.5 mt-2 flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                <span>{authMode === 'login' ? 'Sign In' : 'Register Account'}</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Authenticated Profile Page (Only displays configured smart alerts)
  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* User Profile Card */}
      <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 text-white font-extrabold text-lg flex items-center justify-center shadow-sm shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-foreground leading-tight">{user.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                Verified
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{user.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer self-start sm:self-auto"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Smart Alerts Section */}
      <Card className="shadow-md border-border/80">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Configured Smart Alerts
          </CardTitle>
          <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {alerts.length} Active
          </span>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <p className="text-xs text-muted-foreground">
            Smart alerts monitor ground stations 24/7. When AQI crosses your chosen safety threshold, an instant notification banner is triggered on the dashboard.
          </p>

          {/* List of Configured Smart Alerts */}
          {alertsLoading ? (
            <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading smart alerts...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-6 rounded-xl border border-dashed border-border text-center space-y-2 bg-muted/20">
              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Bell className="w-4 h-4" />
              </div>
              <p className="text-sm font-semibold text-foreground">No Smart Alerts Configured Yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Set up an alert below to receive high-priority warnings whenever particulate levels exceed your limit.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {alerts.map((alert: any) => (
                <div
                  key={alert._id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors shadow-2xs gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground flex items-center gap-2 flex-wrap">
                        <span>{alert.stationName}</span>
                        <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                          {alert.condition === 'above' ? '▲ Exceeds' : '▼ Falls Below'} {alert.aqiThreshold} AQI
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Radio className="w-3 h-3 text-emerald-600" />
                          <span>Active Monitoring</span>
                        </span>
                        <span>•</span>
                        <span>Criteria: {alert.pollutant?.toUpperCase() || 'CPCB AQI'}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteAlert.mutate(alert._id)}
                    className="p-2 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer shrink-0"
                    title="Delete Smart Alert"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Form to setup a new Smart Alert */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3 pt-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Plus className="w-4 h-4 text-primary" />
              <span>Setup New Smart Alert</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Monitoring Ground Station
                </label>
                <select
                  value={customStationId || selectedLocationId || ''}
                  onChange={(e) => setCustomStationId(Number(e.target.value))}
                  className="w-full h-9 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                >
                  {locations.map((loc) => (
                    <option key={loc.openaqId} value={loc.openaqId}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                  Alert Trigger Threshold (CPCB AQI)
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                  >
                    <option value="50">AQI &gt; 50 (Satisfactory limit)</option>
                    <option value="100">AQI &gt; 100 (Moderate limit)</option>
                    <option value="150">AQI &gt; 150 (Sensitive limit)</option>
                    <option value="200">AQI &gt; 200 (Poor / Health advisory)</option>
                    <option value="300">AQI &gt; 300 (Very Poor emergency)</option>
                    <option value="400">AQI &gt; 400 (Severe lockdown)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                onClick={handleCreateAlert}
                disabled={createAlert.isPending}
                className="text-xs font-bold py-1.5 px-4 flex items-center gap-1.5 shadow-xs"
              >
                {createAlert.isPending ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Add Smart Alert</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

