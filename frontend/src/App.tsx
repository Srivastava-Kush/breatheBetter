import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './layout/Layout';
import { OverviewPage } from './pages/OverviewPage';
import { MapPage } from './pages/MapPage';
import { CleanAirPage } from './pages/CleanAirPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ComparePage } from './pages/ComparePage';
import { HealthPage } from './pages/HealthPage';
import { ForecastPage } from './pages/ForecastPage';
import { AssistantPage } from './pages/AssistantPage';
import { SettingsPage } from './pages/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<OverviewPage />} />
            <Route path="map" element={<MapPage />} />
            <Route path="clean-air" element={<CleanAirPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="health" element={<HealthPage />} />
            <Route path="forecast" element={<ForecastPage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}
