import React, { useState } from 'react';
import { Bot, Send, Sparkles, User, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useDashboard } from '../hooks/useAirQuality';
import { useAppStore } from '../stores/appStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const PRESET_QUESTIONS = [
  'Is it safe to go for a run today?',
  'What does PM2.5 mean and why is it dangerous?',
  'What are the best precautions for my location today?',
  'Explain the difference between PM2.5 and PM10',
  'Should I wear a mask outdoors right now?',
];

function generateRuleBasedAnswer(question: string, context: {
  stationName?: string;
  aqi?: number | null;
  category?: string | null;
  dominant?: string | null;
  pm25?: number | null;
}): string {
  const q = question.toLowerCase();
  const station = context.stationName ?? 'your selected location';
  const aqi = context.aqi;
  const cat = context.category ?? 'Unknown';
  const pm25 = context.pm25;

  if (q.includes('run') || q.includes('jog') || q.includes('exercise')) {
    if (!aqi) {
      return `Based on currently available data for ${station}, we don't have a confirmed AQI. As a general rule, if the air looks or smells smoky, avoid strenuous outdoor cardio and exercise indoors instead.`;
    }
    if (aqi <= 50) {
      return `Air quality at ${station} is Good (AQI: ${aqi}). It's an excellent time for a run or outdoor exercise!`;
    }
    if (aqi <= 100) {
      return `Air quality at ${station} is Satisfactory (AQI: ${aqi}). Safe for running for most people. If you have asthma or sensitive airways, consider moderating your pace.`;
    }
    if (aqi <= 200) {
      return `Air quality at ${station} is Moderate (AQI: ${aqi}). Strenuous outdoor cardio is not recommended for sensitive groups (asthma, heart conditions). Healthy adults should prefer early morning hours when traffic emissions are lower, or exercise indoors.`;
    }
    return `Air quality at ${station} is ${cat} (AQI: ${aqi}). Outdoor running is NOT recommended. Strenuous outdoor exercise in this air forces large volumes of pollutants deep into your lung tissue. Please exercise indoors.`;
  }

  if (q.includes('pm2.5') || q.includes('pm25')) {
    return `PM2.5 refers to fine particulate matter with a diameter of 2.5 micrometres or smaller (about 30 times smaller than a human hair). Because of their tiny size, these particles bypass the body's natural airway filters, penetrating deep into the lungs and entering the bloodstream. Health effects include respiratory irritation, aggravated asthma, reduced lung function, and increased risk of cardiovascular disease. The current PM2.5 reading at ${station} is ${pm25 ? `${pm25.toFixed(1)} µg/m³` : 'not available'}.`;
  }

  if (q.includes('mask')) {
    if (!aqi || aqi > 200) {
      return `With air quality in the ${cat} range (AQI: ${aqi ?? 'unavailable'}) at ${station}, an N95 or N99 respirator mask is strongly recommended for any prolonged outdoor exposure. Cloth or surgical masks do NOT effectively filter PM2.5 particles.`;
    }
    if (aqi > 100) {
      return `Air quality is Moderate at ${station}. An N95 mask is advisable for sensitive groups (elderly, children, respiratory conditions) during commute hours or near high-traffic roads.`;
    }
    return `Air quality is ${cat} at ${station}. A mask is not necessary for air quality protection at this time.`;
  }

  if (q.includes('precaution') || q.includes('what should i do')) {
    return `Current conditions at ${station}: Category is ${cat} (AQI: ${aqi ?? 'N/A'}). Key precautions:\n1. Keep windows closed during peak traffic hours.\n2. Run a HEPA air purifier if available.\n3. Sensitive groups should stay indoors.\n4. Avoid strenuous outdoor activities.\n5. Stay hydrated — water helps mucous membranes clear particulate matter.`;
  }

  return `Based on data for ${station} (Category: ${cat}, AQI: ${aqi ?? 'N/A'}): The dominant pollutant is ${context.dominant?.toUpperCase() ?? 'PM2.5'}. Please refer to the Health dashboard for specific activity recommendations. This response is grounded in current monitoring data and standard CPCB public-health guidance.`;
}

export function AssistantPage() {
  const { selectedLocationId } = useAppStore();
  const { data: dashData } = useDashboard(selectedLocationId);

  const dashboard = dashData?.data;
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your BreatheBetter Air Quality Assistant. I'm grounded in real-time monitoring data from OpenAQ and CPCB guidelines. Ask me about outdoor activities, health precautions, or pollutant explanations for ${dashboard?.location?.name ?? 'your location'}.`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    const reply = generateRuleBasedAnswer(text, {
      stationName: dashboard?.location?.name,
      aqi: dashboard?.aqi?.value,
      category: dashboard?.aqi?.category,
      dominant: dashboard?.aqi?.dominantPollutant,
      pm25: dashboard?.pollutants?.['pm25']?.value,
    });

    const assistantMsg: Message = {
      role: 'assistant',
      content: reply,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="w-6 h-6 text-primary" />
          AI Air Quality Assistant
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Grounded in live monitoring data from {dashboard?.location?.name ?? 'selected station'}
        </p>
      </div>

      {/* Preset questions */}
      <div className="flex flex-wrap gap-2">
        {PRESET_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm space-y-1 ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-card border border-border rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-line">{m.content}</p>
              <div className="text-[10px] opacity-60 text-right">{m.timestamp}</div>
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about air quality or health precautions..."
          className="flex-1 h-11 px-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" size="md">
          <Send className="w-4 h-4" />
        </Button>
      </form>

      <p className="text-[11px] text-muted-foreground text-center">
        Responses are derived from real-time monitoring data and standard CPCB health guidelines. 
        Not a substitute for professional medical advice.
      </p>
    </div>
  );
}

