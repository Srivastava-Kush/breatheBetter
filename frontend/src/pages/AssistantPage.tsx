import React, { useState, useEffect, useRef } from 'react';
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
  'Is it safe to go for a run today?',
  'What does PM2.5 mean and why is it dangerous?',
  'What are the best precautions for my location today?',
  'Explain the difference between PM2.5 and PM10',
  'Should I wear a mask outdoors right now?',
];

function generateRuleBasedAnswer(
  question: string,
  context: {
    stationName?: string;
    aqi?: number | null;
    category?: string | null;
    dominant?: string | null;
    pm25?: number | null;
  }
): string {
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
    return `PM2.5 refers to fine particulate matter with a diameter of 2.5 micrometres or smaller (about 30 times smaller than a human hair). Because of their tiny size, these particles bypass the body's natural airway filters, penetrating deep into the lungs and entering the bloodstream. Health effects include respiratory irritation, aggravated asthma, reduced lung function, and increased risk of cardiovascular disease. The current PM2.5 reading at ${station} is ${
      pm25 ? `${pm25.toFixed(1)} µg/m³` : 'not available'
    }.`;
  }

  if (q.includes('mask')) {
    if (!aqi || aqi > 200) {
      return `With air quality in the ${cat} range (AQI: ${
        aqi ?? 'unavailable'
      }) at ${station}, an N95 or N99 respirator mask is strongly recommended for any prolonged outdoor exposure. Cloth or surgical masks do NOT effectively filter PM2.5 particles.`;
    }
    if (aqi > 100) {
      return `Air quality is Moderate at ${station}. An N95 mask is advisable for sensitive groups (elderly, children, respiratory conditions) during commute hours or near high-traffic roads.`;
    }
    return `Air quality is ${cat} at ${station}. A mask is not necessary for air quality protection at this time.`;
  }

  if (q.includes('precaution') || q.includes('what should i do')) {
    return `Current conditions at ${station}: Category is ${cat} (AQI: ${
      aqi ?? 'N/A'
    }). Key precautions:\n1. Keep windows closed during peak traffic hours.\n2. Run a HEPA air purifier if available.\n3. Sensitive groups should stay indoors.\n4. Avoid strenuous outdoor activities.\n5. Stay hydrated — water helps mucous membranes clear particulate matter.`;
  }

  return `Based on live data for ${station} (Category: ${cat}, AQI: ${
    aqi ?? 'N/A'
  }): The dominant pollutant is ${
    context.dominant?.toUpperCase() ?? 'PM2.5'
  }. Please refer to the Health dashboard for specific activity recommendations. This response is grounded in current monitoring data and standard CPCB public-health guidance.`;
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
    const utterance = new SpeechSynthesisUtterance(text);
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

    const answer = generateRuleBasedAnswer(text, {
      stationName: dashboard?.location?.name,
      aqi: dashboard?.aqi?.value,
      category: dashboard?.aqi?.category,
      dominant: dashboard?.aqi?.dominantPollutant,
      pm25: (dashboard?.pollutants as any)?.pm25?.value,
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
                  : 'bg-card border border-border rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-line leading-relaxed">{m.content}</p>

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
