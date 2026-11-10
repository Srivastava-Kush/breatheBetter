import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Wind,
  Map,
  BarChart3,
  GitCompare,
  Heart,
  CloudSun,
  Bot,
  Settings,
  Menu,
  X,
  ShieldCheck,
  Navigation,
  Trophy,
  FileText,
} from 'lucide-react';
import { useState } from 'react';
import { LocationSearch } from '../components/LocationSearch';
import { locationsApi } from '../api/endpoints';
import { useAppStore } from '../stores/appStore';
import type { Location } from '../types';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: Wind, end: true },
  { to: '/map', label: 'Explore Map', icon: Map },
  { to: '/clean-air', label: 'Clean Air Finder', icon: ShieldCheck },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/report', label: 'Impact Report', icon: FileText },
  { to: '/compare', label: 'Compare', icon: GitCompare },
  { to: '/health', label: 'Health', icon: Heart },
  { to: '/forecast', label: 'Forecast & ML', icon: CloudSun },
  { to: '/assistant', label: 'AI Voice Assistant', icon: Bot },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Layout() {
  const location = useLocation();
  const isMapPage = location.pathname === '/map';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const { addRecentLocation, setSelectedLocation } = useAppStore();

  const handleLocationSelect = (loc: Location) => {
    addRecentLocation(loc);
  };

  const handleNearMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await locationsApi.nearby(pos.coords.latitude, pos.coords.longitude, 100);
          if (res.data && res.data.length > 0) {
            const nearest = res.data[0];
            setSelectedLocation(nearest.openaqId);
            addRecentLocation(nearest);
          }
        } catch (e) {
          console.error('Failed to locate nearby station:', e);
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
      }
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-r border-border flex-shrink-0">
        <div className="p-5 border-b border-border/80">
          <div className="flex items-center gap-3">
            <img
              src="/favicon-512.png"
              alt="BreatheBetter Logo"
              className="w-10 h-10 rounded-xl shadow-md object-cover transition-transform hover:scale-105"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-foreground tracking-tight text-base">BreatheBetter</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live System Active" />
              </div>
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <span>🇮🇳 India AQI Intelligence</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20 scale-[1.01]'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-0.5'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3.5 border-t border-border/70 text-[11px] text-muted-foreground flex items-center justify-between bg-muted/20">
          <span className="font-medium">CPCB Standard</span>
          <span className="font-mono text-[10px] bg-card border border-border px-2 py-0.5 rounded-md font-semibold text-primary">v2.4 Live</span>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-card border-r border-border flex flex-col">
            <div className="p-4 border-b border-border/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/favicon-512.png"
                  alt="BreatheBetter"
                  className="w-8 h-8 rounded-lg shadow-sm object-cover"
                />
                <div>
                  <span className="font-extrabold text-foreground text-sm">BreatheBetter</span>
                  <div className="text-[10px] text-muted-foreground">Air Intelligence</div>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with glassmorphism */}
        <header className="h-16 border-b border-border/80 bg-card/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 gap-4 flex-shrink-0 shadow-2xs">
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-muted text-foreground transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 max-w-lg flex items-center gap-2">
            {!isMapPage && <LocationSearch onSelect={handleLocationSelect} />}
            {!isMapPage && (
              <button
                onClick={handleNearMe}
                disabled={locating}
                title="Find Nearest Station using GPS"
                className="h-10 px-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all shadow-2xs hover:scale-102"
              >
                <Navigation className={`w-3.5 h-3.5 text-primary ${locating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Near Me</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>CPCB Ground Telemetry</span>
            </div>
            <span className="text-[11px] text-muted-foreground hidden md:block">
              OpenAQ · Open-Meteo
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

