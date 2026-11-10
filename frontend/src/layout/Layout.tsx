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
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Wind className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-foreground">BreatheBetter</span>
              <div className="text-xs text-muted-foreground">Air Quality Intelligence</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-border text-[11px] text-muted-foreground/80 flex items-center justify-between">
          <span>India AQI Platform</span>
          <span className="font-mono text-[10px] bg-muted px-2 py-0.5 rounded">v1.2</span>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-72 bg-card border-r border-border flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Wind className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold">BreatheBetter</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
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
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 gap-4 flex-shrink-0">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 max-w-md flex items-center gap-2">
            {!isMapPage && <LocationSearch onSelect={handleLocationSelect} />}
            {!isMapPage && (
              <button
                onClick={handleNearMe}
                disabled={locating}
                title="Find Nearest Station using GPS"
                className="h-10 px-3 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Navigation className={`w-3.5 h-3.5 text-primary ${locating ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Near Me</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              Data: OpenAQ · Open-Meteo
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

