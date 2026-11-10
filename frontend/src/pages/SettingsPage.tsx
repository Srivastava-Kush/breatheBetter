import React, { useState } from 'react';
import { Settings, Bell, Trash2, Plus } from 'lucide-react';
import { useAlerts, useCreateAlert, useDeleteAlert, useLocations } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

export function SettingsPage() {
  const { data: alertsData, isLoading } = useAlerts();
  const createAlert = useCreateAlert();
  const deleteAlert = useDeleteAlert();
  const { data: locationsData } = useLocations({ limit: 50 });

  const [threshold, setThreshold] = useState('200');
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

  const alerts = alertsData?.data ?? [];
  const locations = locationsData?.data ?? [];

  const handleCreateAlert = () => {
    if (!selectedLocationId || !threshold) return;
    const loc = locations.find((l) => l.openaqId === selectedLocationId);
    if (!loc) return;

    createAlert.mutate({
      locationId: selectedLocationId,
      stationName: loc.name,
      aqiThreshold: parseInt(threshold, 10),
      condition: 'above',
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          Settings & Alerts
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure notifications, thresholds, and monitoring preferences
        </p>
      </div>

      {/* Smart AQI Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Smart AQI Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Receive in-app alerts when the AQI at a selected monitoring station crosses your threshold.
          </p>

          {/* Create alert form */}
          <div className="space-y-3 p-4 rounded-lg bg-muted/30">
            <div className="text-sm font-medium">Add New Alert</div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Station</label>
              <select
                value={selectedLocationId ?? ''}
                onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
              >
                <option value="">Select a monitoring station</option>
                {locations.map((loc) => (
                  <option key={loc.openaqId} value={loc.openaqId}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">
                  AQI Threshold (Alert when above)
                </label>
                <input
                  type="number"
                  min="50"
                  max="500"
                  step="10"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                />
              </div>
              <Button
                size="md"
                onClick={handleCreateAlert}
                disabled={!selectedLocationId || createAlert.isPending}
              >
                <Plus className="w-4 h-4" /> Add
              </Button>
            </div>
          </div>

          {/* Active alerts */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Active Alerts ({alerts.length})
            </div>
            {alerts.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No alerts configured yet.</p>
            )}
            {alerts.map((alert: { _id: string; stationName: string; aqiThreshold: number; condition: string }) => (
              <div
                key={alert._id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
              >
                <div>
                  <div className="text-sm font-medium">{alert.stationName}</div>
                  <div className="text-xs text-muted-foreground">
                    Alert when AQI is {alert.condition} {alert.aqiThreshold}
                  </div>
                </div>
                <button
                  onClick={() => deleteAlert.mutate(alert._id)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attribution & Legal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Providers & Attribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>
            <strong>OpenAQ:</strong> Air quality observations and sensor metadata provided by OpenAQ (openaq.org) under applicable open data licenses.
          </p>
          <p>
            <strong>Open-Meteo:</strong> Air quality forecast data provided by the Open-Meteo Air Quality API (open-meteo.com).
          </p>
          <p>
            <strong>CPCB Methodology:</strong> AQI is calculated by BreatheBetter using the Indian Central Pollution Control Board (CPCB) National Air Quality Index methodology. It is not an official CPCB-published index.
          </p>
          <p>
            <strong>OpenStreetMap:</strong> Map tiles © OpenStreetMap contributors under ODbL.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

