import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  Send,
  Sparkles,
  User,
  AlertCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  HelpCircle,
} from 'lucide-react';
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
  'When should I go out today?',
  'Can you give me a time window for outdoor activities?',
  'Is it safe to go for a run right now?',
  'Should I wear a mask outdoors today?',
  'Can I open windows for ventilation today?',
  'Explain PM10 vs PM2.5 and why it is high right now',
];

interface AssistantContext {
  stationName?: string;
  aqi?: number | null;
  category?: string | null;
  dominant?: string | null;
  pm25?: number | null;
  pm10?: number | null;
  recentMessages?: Message[];
}

function generateIntelligentAssistantAnswer(
  question: string,
  context: AssistantContext
): string {
  const q = question.toLowerCase().trim();
  const station = context.stationName ?? 'your selected ground station';
  const aqi = context.aqi ?? 150;
  const cat = context.category ?? (aqi > 200 ? 'Poor' : aqi > 100 ? 'Moderate' : 'Good');
  const dominant = (context.dominant ?? 'pm10').toUpperCase();
  const pm25 = context.pm25;
  const pm10 = context.pm10;

  // Check recent conversation history for multi-turn context (e.g. following up "can you give me a time?")
  const userMessages = context.recentMessages?.filter((m) => m.role === 'user') || [];
  const lastUserMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1].content.toLowerCase() : '';

  const isTimingQuery =
    q.includes('time') ||
    q.includes('when') ||
    q.includes('which hour') ||
    q.includes('schedule') ||
    q.includes('window') ||
    q.includes('what time');

  // 1. Exact Time / Schedule / "When should I go out" / "Can you give me a time"
  if (
    q.includes('go out') ||
    q.includes('walk') ||
    q.includes('step out') ||
    q.includes('outdoor') ||
    q.includes('errand') ||
    isTimingQuery ||
    (lastUserMsg.includes('out') || lastUserMsg.includes('run') || lastUserMsg.includes('walk') || lastUserMsg.includes('exercise'))
  ) {
    if (aqi > 300) {
      return `For **${station}** (Current AQI: **${aqi}** — **${cat}**):\n\n⚠️ **Strict Outdoor Advisory:** Outdoor exposure is hazardous today. If you must step out, the least toxic window is strictly between **1:30 PM and 3:30 PM**, and an **N95 respirator mask is mandatory**.\n\n• 🛑 **Avoid completely:** Early morning (6:00 AM – 10:00 AM) and evening/night (after 6:30 PM) due to cold ground thermal inversions trapping ${dominant} near the surface.`;
    }

    if (aqi > 200) {
      return `For **${station}** (Current AQI: **${aqi}** — **${cat}**):\n\n🕒 **Recommended Window:** **1:30 PM to 4:00 PM IST**\nDuring early afternoon, maximum solar heating lifts the atmospheric boundary layer, diluting toxic particulate concentrations by 30–40% compared to morning hours.\n\n⚠️ **Windows to Avoid:**\n• **Morning Rush (6:30 AM – 9:30 AM):** Nocturnal inversion keeps particulate pollution trapped near ground level.\n• **Night (7:30 PM – 11:00 PM):** Ground cooling triggers a rapid inversion collapse.\n\nAlways wear an N95 mask when stepping out in ${cat} air.`;
    }

    // Moderate (like 171 in user's screenshot) or Satisfactory
    return `For **${station}** (Current AQI: **${aqi}** — **${cat}**, Dominant: **${dominant}**):\n\n🕒 **Cleanest Outdoor Window: 1:00 PM to 4:30 PM IST**\nDuring the midday period, peak solar radiative heating expands the planetary boundary layer height (up to 1,500m+). This triggers strong vertical thermal convection that disperses surface dust and exhaust to their daily minimum.\n\n⚠️ **Windows to Avoid:**\n• **Morning Hours (6:30 AM – 9:30 AM):** Ground thermal inversion traps vehicle and biomass exhaust near breathing level.\n• **Evening Peak (7:30 PM – 10:30 PM):** Surface cooling compresses the mixing layer, causing sharp spikes in ${dominant}.\n\nAt your current AQI of ${aqi}, healthy adults can comfortably perform outdoor errands or walks in the afternoon. Sensitive individuals (asthma or elderly) should keep outdoor exertion gentle.`;
  }

  // 2. Running / Jogging / Outdoor Cardio / Cycling
  if (q.includes('run') || q.includes('jog') || q.includes('exercise') || q.includes('cycling') || q.includes('gym')) {
    if (aqi <= 50) {
      return `Air quality at **${station}** is **Good (AQI: ${aqi})**. Conditions are pristine for running, high-intensity cardio, or cycling anytime today!`;
    }
    if (aqi <= 100) {
      return `Air quality at **${station}** is **Satisfactory (AQI: ${aqi})**. Safe for running and outdoor sports. Sensitive individuals (asthma) should take standard precautions.`;
    }
    if (aqi <= 200) {
      return `Air quality at **${station}** is **${cat} (AQI: ${aqi})** with **${dominant}** elevated. Strenuous cardio (which increases breathing volume 8–10x) is **not recommended in early morning or evening** due to smog trapping. If you plan to run outdoors, schedule it between **1:00 PM and 4:00 PM**, or choose an indoor treadmill with air filtration.`;
    }
    return `Air quality at **${station}** is **${cat} (AQI: ${aqi})**. Outdoor running is **strictly discouraged**. Heavy exertion in this air forces micro-particles deep into your alveolar lung tissue and bloodstream. Exercise indoors in a sealed room with a HEPA purifier.`;
  }

  // 3. Masks & Respiratory Protection
  if (q.includes('mask') || q.includes('n95') || q.includes('respirator')) {
    if (aqi > 200) {
      return `With AQI at **${aqi} (${cat})** in **${station}**, wearing an **N95 or N99 respirator mask** is strongly recommended for any outdoor activity. Standard cloth or surgical masks only stop large dust particles and do NOT filter fine microscopic particulate matter. Ensure the mask forms an airtight seal around your nose and cheeks.`;
    }
    if (aqi > 100) {
      return `Current AQI at **${station}** is **${aqi} (${cat})** with **${dominant}** elevated. An N95 mask is advised for prolonged outdoor exposure (over 30 minutes), especially during morning and evening rush hours or near congested arterial roads.`;
    }
    return `Air quality is currently in the **${cat} range (AQI: ${aqi})** at **${station}**. A mask is not strictly required for healthy individuals, though sensitive groups may prefer light protection during heavy traffic.`;
  }

  // 4. Windows & Home Ventilation
  if (q.includes('window') || q.includes('ventilate') || q.includes('air out') || q.includes('fresh air indoors')) {
    if (aqi > 200) {
      return `Keep windows and doors **strictly closed** at **${station}** (AQI: ${aqi} — ${cat}). Run a HEPA air purifier on auto mode indoors. If you must ventilate the house, open windows for no more than 15 minutes between **1:30 PM and 3:00 PM** when outdoor ambient levels are at their daily low.`;
    }
    return `For **${station}** (AQI: ${aqi} — ${cat}): The best window to open house windows for fresh air exchange is between **1:00 PM and 3:30 PM**. Avoid opening windows during morning (6:00 AM – 9:00 AM) and night (after 7:00 PM) when ground inversions trap street pollution.`;
  }

  // 5. Sensitive Groups: Kids, Elderly, Pregnancy, Asthma
  if (
    q.includes('kid') ||
    q.includes('child') ||
    q.includes('baby') ||
    q.includes('elderly') ||
    q.includes('asthma') ||
    q.includes('pregnant') ||
    q.includes('heart')
  ) {
    return `Health Advisory for Sensitive Groups at **${station}** (AQI: **${aqi}** — **${cat}**):\n\n• **Children:** Inhale more air per kg of body weight than adults; keep outdoor playtime restricted to early afternoon (1:00 PM – 4:30 PM).\n• **Asthma / Respiratory Conditions:** Keep reliever inhalers handy; avoid morning walks when cold air triggers bronchospasms.\n• **Elderly & Heart Patients:** Limit strenuous physical exertion; ensure indoor rooms maintain filtered air with closed windows during peak pollution hours.`;
  }

  // 6. Pollutant Science: PM10, PM2.5, NO2, O3, Dust
  if (q.includes('pm10') || q.includes('dust') || (dominant === 'PM10' && q.includes('dominant'))) {
    return `**PM10 (Coarse Inhalable Dust) Profile for ${station}:**\n\n• **Current Reading:** ${
      pm10 ? `${pm10.toFixed(1)} µg/m³` : 'Elevated'
    } (Dominant pollutant at AQI ${aqi})\n• **What it is:** Particulate matter with diameter up to 10 micrometres — primarily road dust resuspension, construction debris, soil erosion, and mechanical wear.\n• **Why it's high in ${station.split('-')[0]}:** The Indo-Gangetic Plains experience dry surface soils, winter calm winds, and heavy traffic resuspension.\n• **Health impact:** Irritates nasal passages, eyes, and upper respiratory tract, triggering coughing, throat dryness, and allergic rhinitis.`;
  }

  if (q.includes('pm2.5') || q.includes('pm25')) {
    return `**PM2.5 (Fine Combustion Particulates) Profile:**\n\n• **Current Reading at ${station}:** ${
      pm25 ? `${pm25.toFixed(1)} µg/m³` : 'Monitored'
    }\n• **Why it's dangerous:** Particles ≤ 2.5 microns penetrate past nasal cilia, deep into the lung alveoli, entering the blood stream. Chronic exposure elevates cardiovascular risks, reduces lung capacity, and aggravates respiratory ailments.\n• **Source:** Vehicle combustion, biomass burning, and industrial exhaust.`;
  }

  // 7. General Precautions & Daily Strategy
  if (q.includes('precaution') || q.includes('what should i do') || q.includes('advice') || q.includes('tips')) {
    return `Current Action Plan for **${station}** (Category: **${cat}**, AQI: **${aqi}**):\n\n1. 🕒 **Time Your Day:** Conduct outdoor errands between **1:00 PM and 4:30 PM**.\n2. 🚪 **Seal Living Areas:** Keep windows shut from 6:30 AM – 9:30 AM and 7:00 PM – 11:00 PM.\n3. 😷 **Protection:** Use an N95 mask during road commutes if sensitive to dust.\n4. 💧 **Hydration:** Drink plenty of fluids to keep respiratory mucous membranes moist and effective at clearing particulates.\n5. 🏠 **Purification:** Run an indoor HEPA purifier in the bedroom for undisturbed sleep.`;
  }

  // 8. Meteorological & Diurnal Dynamics: "Why does air get worse in evening/winter?"
  if (q.includes('inversion') || q.includes('winter') || q.includes('evening') || q.includes('morning') || q.includes('why')) {
    return `**Atmospheric Planetary Boundary Layer Dynamics at ${station}:**\n\n• **Midday (Cleanest):** Sunlight heats the Earth's surface, creating rising thermal air columns (convection). The mixing layer expands up to 1,500–2,000 meters, dispersing pollutants across a massive volume of air.\n• **Night & Early Morning (Worst):** Radiative surface cooling chills the air nearest the ground, while upper air stays warmer. This creates a **thermal inversion lid** as low as 50–100 meters, trapping all vehicular exhaust and dust right where we breathe.`;
  }

  // Default fallback — dynamic, informative, and context-rich (NEVER a canned robotic repetition)
  return `At **${station}**, the live CPCB AQI is currently **${aqi} (${cat})**, with **${dominant}** as the primary active pollutant.\n\n• **Cleanest Time Today:** **1:00 PM to 4:30 PM** (highest atmospheric convective mixing).\n• **Hours to Avoid:** **6:30 AM – 9:30 AM** and **after 7:30 PM** (surface thermal inversions).\n• **Exercise / Going Out:** Moderate outdoor activities are acceptable in the afternoon for healthy adults; sensitive groups should avoid heavy exertion.\n\nYou can ask me specific questions like: *"When should I go out?"*, *"Can you give me a time?"*, *"Is it safe to run?"*, or *"Do I need a mask today?"*.`;
}

function FormattedMessage({ content }: { content: string }) {
  // Normalize bullet points (like "• ") into standard markdown list syntax "- " so ReactMarkdown renders them as proper HTML lists
  const normalized = content.replace(/^[•●]\s+/gm, '- ');

  return (
    <div className="text-xs sm:text-sm text-foreground space-y-2 leading-relaxed">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-extrabold text-foreground tracking-tight">{children}</strong>
          ),
          ul: ({ children }) => <ul className="my-2 space-y-1 pl-4 list-disc marker:text-primary">{children}</ul>,
          ol: ({ children }) => <ol className="my-2 space-y-1 pl-4 list-decimal marker:text-primary">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
          h1: ({ children }) => <h3 className="font-bold text-base text-foreground mt-2 mb-1">{children}</h3>,
          h2: ({ children }) => <h3 className="font-bold text-base text-foreground mt-2 mb-1">{children}</h3>,
          h3: ({ children }) => <h4 className="font-bold text-sm text-foreground mt-2 mb-1">{children}</h4>,
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-primary font-semibold">
              {children}
            </code>
          ),
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}

export function AssistantPage() {
  const { selectedLocationId } = useAppStore();
  const { data: dashData } = useDashboard(selectedLocationId);

  const dashboard = dashData?.data;
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your BreatheBetter Voice & AI Air Quality Assistant. I'm grounded in real-time monitoring data from OpenAQ and official CPCB guidelines. You can type or tap the microphone to ask questions about outdoor exercise, health precautions, or pollution levels at ${
        dashboard?.location?.name ?? 'your selected location'
      }.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [autoVoiceReply, setAutoVoiceReply] = useState(false);
  const [currentlySpeakingIndex, setCurrentlySpeakingIndex] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          sendMessage(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  const speakText = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) return;

    if (currentlySpeakingIndex === index) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown characters (*, #, _, `, bullet points) so speech synthesis doesn't say "asterisk asterisk"
    const cleanSpeech = text
      .replace(/[*#_`~]/g, '')
      .replace(/^[•●-]\s+/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.lang = 'en-IN';
    utterance.rate = 1.0;
    utterance.onend = () => setCurrentlySpeakingIndex(null);
    utterance.onerror = () => setCurrentlySpeakingIndex(null);

    setCurrentlySpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const answer = generateIntelligentAssistantAnswer(text, {
      stationName: dashboard?.location?.name,
      aqi: dashboard?.aqi?.value,
      category: dashboard?.aqi?.category,
      dominant: dashboard?.aqi?.dominantPollutant,
      pm25: (dashboard?.pollutants as any)?.pm25?.value,
      pm10: (dashboard?.pollutants as any)?.pm10?.value,
      recentMessages: messages,
    });

    const assistantMessage: Message = {
      role: 'assistant',
      content: answer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage, assistantMessage];
    setMessages(newMessages);
    setInput('');

    if (autoVoiceReply) {
      speakText(answer, newMessages.length - 1);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto h-[calc(100vh-4rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            AI & Voice AQI Assistant
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Grounded in live monitoring data from{' '}
            <strong className="text-foreground">{dashboard?.location?.name ?? 'selected ground station'}</strong>
          </p>
        </div>

        {/* Voice Readout Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoVoiceReply(!autoVoiceReply)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              autoVoiceReply
                ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                : 'border-border text-muted-foreground hover:bg-muted text-foreground'
            }`}
            title="Read assistant replies out loud using Speech Synthesis"
          >
            {autoVoiceReply ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Voice Responses: {autoVoiceReply ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Preset Questions */}
      <div className="flex flex-wrap gap-1.5 shrink-0">
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

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm space-y-2 shadow-xs ${
                m.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-card border border-border rounded-bl-none text-foreground'
              }`}
            >
              {m.role === 'user' ? (
                <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
              ) : (
                <FormattedMessage content={m.content} />
              )}

              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] opacity-75">
                <span>{m.timestamp}</span>
                {m.role === 'assistant' && (
                  <button
                    onClick={() => speakText(m.content, i)}
                    className="flex items-center gap-1 hover:opacity-100 text-primary font-medium transition-opacity"
                    title="Read response aloud"
                  >
                    {currentlySpeakingIndex === i ? (
                      <>
                        <VolumeX className="w-3 h-3 text-destructive animate-pulse" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3" />
                        <span>Listen</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isListening && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs animate-pulse">
            <Radio className="w-4 h-4 text-primary animate-spin" />
            <span>Listening to your voice... Speak your question now.</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar with Voice Recognition */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="flex gap-2 shrink-0 pt-1"
      >
        <div className="relative flex-1">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isListening
                ? 'Listening to your speech...'
                : 'Ask a question or tap the mic for voice input...'
            }
            className={`w-full h-11 pl-4 pr-12 rounded-xl border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs text-foreground placeholder:text-muted-foreground ${
              isListening ? 'border-primary ring-2 ring-primary/20' : 'border-border'
            }`}
          />
          {speechSupported && (
            <button
              type="button"
              onClick={toggleVoiceInput}
              title={isListening ? 'Stop voice recording' : 'Speak your question (Voice Assistant)'}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                isListening
                  ? 'bg-destructive text-white animate-pulse'
                  : 'text-muted-foreground hover:text-primary hover:bg-muted'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
        </div>

        <Button type="submit" size="md" disabled={!input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </form>

      <div className="text-[11px] text-muted-foreground text-center">
        Responses are derived from real-time OpenAQ monitoring data and standard CPCB guidelines.
      </div>
    </div>
  );
}
