import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, AlertCircle, MessageSquare, Mic, MicOff, Volume2, Volume1, Play, Layers, X } from "lucide-react";
import { ChatMessage, UserSession } from "../types";

// Siri/Alexa style active voice filters & state handlers
const hasPhraseWithWordBoundaries = (text: string, phrase: string): boolean => {
  if (!text) return false;
  const escaped = phrase.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  // Match phrase when it's isolated by spaces, punctuation, or string boundaries.
  const regex = new RegExp(`(?:^|\\s|[.,🚩!?|()_\\-"'\\s])` + escaped + `(?:$|\\s|[.,🚩!?|()_\\-"'\\s])`, 'i');
  return regex.test(text);
};

const isInterruptionPhrase = (lowerStr: string, speakingText?: string): boolean => {
  const normalized = lowerStr.trim();
  if (!normalized) return false;

  const cleanSpeaking = (speakingText || "").toLowerCase().trim();

  // Expanded natural Hindi / Hinglish and English interruption keywords
  const stopPhrases = [
    "ruk jao", "rukjao", "stop", "chup", "shant", "shanth", "rukiye",
    "रुक जाओ", "रुकजाओ", "रुको", "रूको", "रुकिए", "चुप", "शांत",
    "bas karo", "बस करो", "रहने दो", "rahne do", "rehne do", "roko", "रोको",
    "चुप हो जाओ", "silent", "mute", "chup karo", "चुप करो", "stop talking", "shutup",
    "चुप रहो", "chup raho", "ruk", "bas", "रुक", "शांत", "चुप", "रुको", "रूको", "रोको", "बस"
  ];

  for (const phrase of stopPhrases) {
    if (hasPhraseWithWordBoundaries(normalized, phrase)) {
      // Check if it is a self-echo of what the AI is currently stating (with boundary check)
      if (!cleanSpeaking || !hasPhraseWithWordBoundaries(cleanSpeaking, phrase)) {
        return true;
      }
    }
  }

  return false;
};

const hasWakeWordPhrase = (lowerStr: string): boolean => {
  return (
    lowerStr.includes("hello sakhi") ||
    lowerStr.includes("hey sakhi") ||
    lowerStr.includes("hello saki") ||
    lowerStr.includes("hey saki") ||
    lowerStr.includes("सखी") ||
    lowerStr.includes("sakhi") ||
    lowerStr.includes("sakh") ||
    lowerStr.includes("saki") ||
    lowerStr.includes("alexa") ||
    lowerStr.includes("siri")
  );
};

const isSendTriggerPhrase = (lowerStr: string): boolean => {
  return (
    lowerStr.includes("kaam shuru karo") ||
    lowerStr.includes("kaam shuru") ||
    lowerStr.includes("shuru karo") ||
    lowerStr.includes("काम शुरू करो") ||
    lowerStr.includes("काम शुरू") ||
    lowerStr.includes("शुरू करो") ||
    lowerStr.includes("send") ||
    lowerStr.includes("bhejo") ||
    lowerStr.includes("भेजो") ||
    lowerStr.includes("सेंड")
  );
};

const cleanSpeechTextOnly = (rawText: string): string => {
  let clean = rawText;
  
  // Clean wake words (case-insensitive)
  const wakeWordsRegex = /\b(hello sakhi|hey sakhi|hello saki|hey saki|हैलो सखी|हेलो सखी|सखी सुनो|ओए सखी|सुनो सखी|sakhi listen|siri|alexa|sakhi|सखी)\b/gi;
  clean = clean.replace(wakeWordsRegex, "");

  // Clean send triggers (case-insensitive)
  const sendTriggersRegex = /\b(kaam shuru karo|kaam shuru|shuru karo|काम शुरू करो|काम शुरू|शुरू करो|send|bhejo|भेजो|सेंड)\b/gi;
  clean = clean.replace(sendTriggersRegex, "");

  return clean.replace(/\s+/g, " ").trim();
};

const playWakeChime = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
    osc2.frequency.setValueAtTime(783.99, ctx.currentTime); // G5 

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.log("Audio bypass:", e);
  }
};


interface SakhiChatProps {
  onSuggestMapping?: (localName: string, suggestedMaster: string) => void;
  activeTab: string;
  userSession: UserSession | null;
  clientsCount: number;
  teamCount: number;
  mappingsCount: number;
  masterItemsCount: number;
  billsCount: number;
  onExecuteSakhiAction: (action: any) => { success: boolean; message: string };
  onClose?: () => void;
}

export default function SakhiChat({
  onSuggestMapping,
  activeTab,
  userSession,
  clientsCount,
  teamCount,
  mappingsCount,
  masterItemsCount,
  billsCount,
  onExecuteSakhiAction,
  onClose
}: SakhiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "sakhi",
      text: "Radhe Radhe Ajay, aapka swagat hai! 🙏🚩",
      timestamp: new Date(),
    }
  ]);

  // Dynamically update welcome message with the logged-in user's name
  useEffect(() => {
    const displayName = userSession?.name || "Ajay";
    setMessages(prev => prev.map(m => {
      if (m.id === "welcome") {
        return {
          ...m,
          text: `Radhe Radhe ${displayName}, aapka swagat hai! 🙏🚩`
        };
      }
      return m;
    }));
  }, [userSession]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [lastActionLog, setLastActionLog] = useState<string | null>(null);
  const [sakhiLang, setSakhiLang] = useState<"hi-IN" | "en-IN" | "sd-IN">("hi-IN");

  // Restart speech recognition automatically if target listening language shifts
  useEffect(() => {
    if (isHandsFree && recognitionActiveRef.current) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          console.log("Abort speech recognizer to apply language change", e);
        }
      }
      const timer = setTimeout(() => {
        if (isHandsFreeRef.current) {
          startVoiceInputRecognition();
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [sakhiLang]);

  // Hands-free & Interruption References
  const [isHandsFree, setIsHandsFree] = useState(false);
  const isHandsFreeRef = useRef(false);
  const speakingIdRef = useRef<string | null>(null);
  const speakingTextRef = useRef<string>("");
  const isFetchingRef = useRef(false);
  const recognitionActiveRef = useRef(false);
  
  // Track timestamps of TTS and ignore feedback loops
  const lastSpeechFinishedTimeRef = useRef<number>(0);
  const lastSpeechStartedTimeRef = useRef<number>(0);

  // Track speech recognition transcript indices to block past user queries from causing false-positives
  const resultsLengthRef = useRef<number>(0);
  const ttsStartResultsIndexRef = useRef<number>(0);

  // Siri / Alexa state variables
  const [isAwake, setIsAwake] = useState(false);
  const isAwakeRef = useRef(false);
  const [voiceBuffer, setVoiceBuffer] = useState("");
  const voiceBufferRef = useRef("");
  const lastVoiceTimeRef = useRef<number>(0);
  const [interimSpeech, setInterimSpeech] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const resetSiriMode = () => {
    setIsAwake(false);
    isAwakeRef.current = false;
    setVoiceBuffer("");
    voiceBufferRef.current = "";
    setInterimSpeech("");
  };

  // Synchronize state changes to refs to avoid closure lag
  useEffect(() => {
    isHandsFreeRef.current = isHandsFree;
    if (isHandsFree) {
      startVoiceInputRecognition();
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      resetSiriMode();
    }
  }, [isHandsFree]);

  useEffect(() => {
    speakingIdRef.current = speakingId;
  }, [speakingId]);

  useEffect(() => {
    isAwakeRef.current = isAwake;
  }, [isAwake]);

  useEffect(() => {
    voiceBufferRef.current = voiceBuffer;
  }, [voiceBuffer]);

  // Siri/Alexa mode silence submission after 1.8 seconds of absolute silence
  useEffect(() => {
    if (!isHandsFree) return;

    const interval = setInterval(() => {
      if (isAwakeRef.current && voiceBufferRef.current.trim() && !isFetchingRef.current) {
        const timeSinceLastVoice = Date.now() - lastVoiceTimeRef.current;
        if (timeSinceLastVoice >= 1800) {
          const rawCommand = voiceBufferRef.current.trim();
          const cleanedText = cleanSpeechTextOnly(rawCommand);
          if (cleanedText.length > 0) {
            handleSend(cleanedText);
          }
          resetSiriMode();
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isHandsFree, messages]);

  // Start continuous passive voice recognition on mount only if manually enabled
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const triggerTTS = (id: string, text: string) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not natively supported in this browser version.");
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      speakingIdRef.current = null;
      speakingTextRef.current = "";
      return;
    }

    window.speechSynthesis.cancel();
    // Strip emojis and action blocks
    const cleanMsg = text
      .replace(/\[ACTION:.*?\]/g, "")
      .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, "")
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanMsg);
    utterance.rate = 1.05; // Slightly faster to sound natural and human
    utterance.pitch = 1.15; // sweet sisterly/collegial partner pitch

    // Load voices
    const voices = window.speechSynthesis.getVoices();
    // Seek specialized Hindi voice
    const hindiVoice = voices.find(v => v.lang.startsWith("hi") || v.lang === "hi-IN");
    if (hindiVoice) {
      utterance.voice = hindiVoice;
      utterance.lang = "hi-IN";
    } else {
      utterance.lang = "en-IN"; // fallback to Indian voice
    }

    let safetyTimer: any = null;

    const cleanupTTSComplete = () => {
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      if (speakingIdRef.current !== id) {
        // Already cleared, interrupted, or speaking another text
        return;
      }
      setSpeakingId(null);
      speakingIdRef.current = null;
      speakingTextRef.current = "";
      lastSpeechFinishedTimeRef.current = Date.now();
      
      // Resume passive loop once talking finishes. This safely lets the onend handler of rec handle restarts.
      if (isHandsFreeRef.current) {
        if (recognitionRef.current && recognitionActiveRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {
            console.log("Safe abort on TTS end:", e);
          }
        } else if (!recognitionActiveRef.current) {
          startVoiceInputRecognition();
        }
      }
    };

    // Temporarily pause speech recognition while speaking to prevent echo loop,
    // but keep receiving results so user can say "ruk jao"
    utterance.onstart = () => {
      setSpeakingId(id);
      speakingIdRef.current = id;
      speakingTextRef.current = cleanMsg.toLowerCase();
      lastSpeechStartedTimeRef.current = Date.now();
    };

    utterance.onend = () => {
      cleanupTTSComplete();
    };

    utterance.onerror = (e) => {
      console.warn("TTS Utterance complete / alert:", e);
      cleanupTTSComplete();
    };

    setSpeakingId(id);
    speakingIdRef.current = id;
    speakingTextRef.current = cleanMsg.toLowerCase();

    // Mark current active SpeechRecognition resultados length so that while speaking,
    // we only process incoming words (like "ruk jao") starting from this index threshold
    ttsStartResultsIndexRef.current = resultsLengthRef.current;

    // Safety fallback timer to prevent getting stuck if browser fails to trigger onend/onerror
    const wordCount = cleanMsg.split(/\s+/).filter(Boolean).length || 1;
    const safetyTimeoutMs = (wordCount * 550) + 5000; // 550ms per word + 5s buffer

    safetyTimer = setTimeout(() => {
      if (speakingIdRef.current === id) {
        console.warn("Safety trigger: TTS onend failed to fire within estimated time. Forcing listening loop restart.");
        cleanupTTSComplete();
      }
    }, safetyTimeoutMs);

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Do NOT abort recognition here. This keeps the microphone active
    // dynamically without flashing or blinking. The event handler will
    // ignore user speech inputs while isFetchingRef.current is true.

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);
    isFetchingRef.current = true;
    setSpeechError(null);
    setLastActionLog(null);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-10),
          activeTab,
          sakhiLang,
          systemContext: {
            current_user: userSession,
            clients_count: clientsCount,
            team_count: teamCount,
            mappings_count: mappingsCount,
            master_items_count: masterItemsCount,
            bills_count: billsCount
          }
        }),
      });

      if (!response.ok) {
        throw new Error("Connection state lost. Server unavailable.");
      }

      const data = await response.json();
      let responseText = data.text || "Radhe Radhe Ajay! Please note that I couldn't get a proper reply.";
      
      // Parse ACTION command blocks
      const actionRegex = /\[ACTION:\s*(\{.*?\})\s*\]/;
      const match = responseText.match(actionRegex);
      let actionResultMessage = "";

      if (match && match[1]) {
        try {
          const actionPayload = JSON.parse(match[1]);
          const result = onExecuteSakhiAction(actionPayload);
          if (result.success) {
            actionResultMessage = `\n\n[✓ AI Sakhi Action: ${result.message}]`;
            setLastActionLog(result.message);
          } else {
            actionResultMessage = `\n\n[⚠ AI Sakhi Action Rejected: ${result.message}]`;
            setLastActionLog("Rejected: " + result.message);
          }
        } catch (e: any) {
          console.error("Failed to execute parsed Sakhi action", e);
          actionResultMessage = `\n\n[⚠ Action Error: There was an issue executing the action]`;
        }
      }

      // Append action log directly to message for high visibility
      const finalMsgText = responseText + actionResultMessage;

      const sakhiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "sakhi",
        text: finalMsgText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, sakhiMsg]);

      // Handle Auto synthesized voice play block (Speech to Voice)
      if (autoSpeak) {
        // synthesize without the action string
        const speakTextOnly = responseText.replace(actionRegex, "").trim();
        setTimeout(() => triggerTTS(sakhiMsg.id, speakTextOnly), 100);
      }

    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "sakhi",
          text: "Radhe Radhe Ajay! 😟 Connection failed. Please check if your GEMINI_API_KEY environment variable is configured correctly under Settings > Secrets.",
          timestamp: new Date(),
        }
      ]);
      // resume listening on failure
      if (isHandsFreeRef.current) {
        startVoiceInputRecognition();
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      // If voice response is off, resume passive listening immediately
      if (!autoSpeak && isHandsFreeRef.current) {
        startVoiceInputRecognition();
      }
    }
  };

  const startVoiceInputRecognition = () => {
    resultsLengthRef.current = 0;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

    if (recognitionActiveRef.current) {
      return;
    }

    // Set active early to avoid race conditions and double initialization
    recognitionActiveRef.current = true;

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = sakhiLang; // support selected language (hi-IN, en-IN, or sd-IN) natively

      rec.onstart = () => {
        setIsListening(true);
        recognitionActiveRef.current = true;
        setSpeechError(null);
        resultsLengthRef.current = 0;
      };

      rec.onerror = (e: any) => {
        console.warn("Speech Recognition info or alert:", e.error || e);
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setIsHandsFree(false);
          isHandsFreeRef.current = false;
          setSpeechError("Mic permission blocked. Please open in a new tab or grant access in browser bar.");
        } else if (e.error !== "no-speech" && e.error !== "aborted") {
          setSpeechError(`Speech status (${e.error || "unavailable"})`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        recognitionActiveRef.current = false;
        
        // Continuous hands-free passive restart if ended by browser timeout or idle state
        // Re-instantiate a fresh SpeechRecognition session instead of starting an aborted instance
        if (isHandsFreeRef.current) {
          setTimeout(() => {
            if (isHandsFreeRef.current && !recognitionActiveRef.current) {
              try {
                startVoiceInputRecognition();
              } catch (err) {
                console.log("Safe restart ignored:", err);
              }
            }
          }, 350);
        }
      };

      rec.onresult = (event: any) => {
        if (isFetchingRef.current) {
          return; // Ignore general inputs while processing a server query
        }

        // Keep the results length up-to-date
        resultsLengthRef.current = event.results.length;

        // Determine starting index to scan for interruption
        const isCurrentlySpeaking = speakingIdRef.current !== null || (window.speechSynthesis && window.speechSynthesis.speaking);
        const startIndex = isCurrentlySpeaking ? ttsStartResultsIndexRef.current : 0;

        // 1. Scan available result segments (respecting the speaking start threshold) to capture voice interruption perfectly
        let fullTranscriptSegment = "";
        for (let i = startIndex; i < event.results.length; ++i) {
          if (event.results[i]) {
            fullTranscriptSegment += event.results[i][0].transcript + " ";
          }
        }

        const lowerStr = fullTranscriptSegment.toLowerCase().trim();
        if (lowerStr.length < 1) return;

        // Expanded natural Hindi / Hinglish and English interruption keywords
        const isInterruptionCommand = isInterruptionPhrase(lowerStr, speakingTextRef.current);

        // 1. DYNAMIC NO-CLICK VOICE INTERRUPTION DURING ACTIVE SPEECH (Interim or Final)
        const timeSinceFinished = Date.now() - lastSpeechFinishedTimeRef.current;
        const wasRecentlySpeaking = timeSinceFinished < 800; // 0.8 seconds protective window for speech synthesis trailing echoes

        if (isCurrentlySpeaking || wasRecentlySpeaking) {
          if (isInterruptionCommand) {
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
            }
            setSpeakingId(null);
            speakingIdRef.current = null;
            speakingTextRef.current = "";
            lastSpeechFinishedTimeRef.current = Date.now();
            resetSiriMode();

            // Immediately append local acknowledgement
            const interruptAlertMsg: ChatMessage = {
              id: `int-${Date.now()}`,
              sender: "sakhi",
              text: "Radhe Radhe Ajay! (Speech Paused) 🚩 Got it, I have stopped speaking immediately. What can I do for you?",
              timestamp: new Date()
            };
            setMessages((prev) => [...prev, interruptAlertMsg]);
            setInputText("");

            // Abort and restart recognition for fresh listening state with clean audio buffer
            if (recognitionRef.current) {
              try {
                recognitionRef.current.abort();
              } catch (e) {
                console.log("Safe ignore abort:", e);
              }
            }
          }
          return; // Strictly ignore any voice capture during active speech or its trailing echoing period
        }

        // 2. PROCESS ALIVE STATE AND BUFFER TRANSCRIPTS (Siri / Alexa Mode)
        let newFinalizedText = "";
        let currentInterim = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            newFinalizedText += res[0].transcript + " ";
          } else {
            currentInterim = res[0].transcript;
          }
        }

        // Live visual typing feedback
        if (currentInterim.trim()) {
          setInterimSpeech(currentInterim.trim());
          if (isAwakeRef.current) {
            setInputText(currentInterim.trim());
          }
        }

        if (!newFinalizedText.trim()) {
          return;
        }

        const rawFinalCommand = newFinalizedText.trim();
        const lowerFinalCommand = rawFinalCommand.toLowerCase();

        // Idle-time manual stop check
        if (isInterruptionPhrase(lowerFinalCommand, speakingTextRef.current)) {
          setMessages((prev) => [...prev, {
            id: `ack-${Date.now()}`,
            sender: "sakhi",
            text: "Yes Ajay! I am in sleeping mode now, whenever you need me just say 'Hello Sakhi'!",
            timestamp: new Date()
          }]);
          resetSiriMode();
          setInputText("");
          return;
        }

        if (isAwakeRef.current) {
          // Speak activity detected while awake - register voice activity timestamp
          lastVoiceTimeRef.current = Date.now();

          if (isSendTriggerPhrase(lowerFinalCommand)) {
            // Compile accumulated buffer alongside new text chunk, strip triggers, and submit
            const combinedRaw = (voiceBufferRef.current + " " + rawFinalCommand).trim();
            const cleanFinalText = cleanSpeechTextOnly(combinedRaw);
            
            if (cleanFinalText.length > 0) {
              handleSend(cleanFinalText);
            }
            resetSiriMode();
          } else {
            // Still compiling commands
            const updatedBuffer = (voiceBufferRef.current + " " + rawFinalCommand).trim();
            setVoiceBuffer(updatedBuffer);
            voiceBufferRef.current = updatedBuffer;
            setInputText(updatedBuffer);
          }
        } else {
          // Asleep! Test if wake word is spoken
          if (hasWakeWordPhrase(lowerFinalCommand)) {
            playWakeChime();
            setIsAwake(true);
            isAwakeRef.current = true;
            lastVoiceTimeRef.current = Date.now();

            const parsedQuery = cleanSpeechTextOnly(rawFinalCommand);
            setVoiceBuffer(parsedQuery);
            voiceBufferRef.current = parsedQuery;
            setInputText(parsedQuery);
          } else {
            // Ignores standard office voices entirely
            console.log("Siri Mode: Ambient talk parsed & ignored properly:", rawFinalCommand);
          }
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      console.error(err);
      setIsListening(false);
      recognitionActiveRef.current = false;
    }
  };

  const handleMicToggle = () => {
    // If she is currently speaking, click MUST immediately cancel her voice synthesis
    const isCurrentlySpeaking = speakingId !== null || (window.speechSynthesis && window.speechSynthesis.speaking);
    if (isCurrentlySpeaking) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setSpeakingId(null);
      speakingIdRef.current = null;
      lastSpeechFinishedTimeRef.current = Date.now();
      
      // If mic is active, restart it cleanly for the next phrase
      if (isHandsFree) {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (e) {}
        }
        setTimeout(() => {
          if (isHandsFreeRef.current) {
            startVoiceInputRecognition();
          }
        }, 150);
      }
      return;
    }

    if (isHandsFree) {
      isHandsFreeRef.current = false;
      setIsHandsFree(false);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setIsListening(false);
      recognitionActiveRef.current = false;
    } else {
      isHandsFreeRef.current = true;
      setIsHandsFree(true);
      startVoiceInputRecognition();
    }
  };

  // Preset prompts for demonstration inside sandboxed iframe where mic can be blocked
  const demoVoicePresets = [
    { title: "Switch to Scanner", text: "Sakhi, switch to the Invoice Scanner tab and help me verify the bills" },
    { title: "Register Buyer Client", text: "Sakhi, with admin privilege please add a new Buyer client named 'Sharma Trading' with mobile '9870001234'" },
    { title: "Switch to Crawler", text: "Sakhi, take me to the Crawler Bot section so I can see the navigation map" },
    { title: "Create Item Mapping", text: "Sakhi, map the raw item 'A4 Bundles' to the master product 'A4 Copy Paper Bundle'" }
  ];

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 rounded-2xl overflow-hidden border border-slate-200 shadow-xl font-sans">
      {/* Header - Light daylight dual gradient */}
      <div className="p-4 bg-gradient-to-r from-teal-50/80 via-indigo-50/50 to-amber-50/80 border-b border-indigo-100/60 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-start bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl shadow-xs shrink-0 font-bold text-xs text-amber-850">
            <span>Radhe Radhe Ajay</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 id="sakhi-assistant-title" className="font-bold text-slate-900 text-xs sm:text-sm tracking-wide">
                Sakhi AI Consultant
              </h3>
              <span className="text-[9px] bg-red-100 text-red-700 border border-red-200 font-extrabold px-1 py-0.2 rounded uppercase">
                Voice Enabled
              </span>
            </div>
            <p className="text-[10px] text-teal-700 font-bold font-sans">Senior Tax & Bookkeeping AI Partner • Active advisor</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Hands-Free Passive Listener Toggle */}
          <button
            type="button"
            onClick={() => {
              const nextVal = !isHandsFree;
              setIsHandsFree(nextVal);
              isHandsFreeRef.current = nextVal;
              if (nextVal) {
                startVoiceInputRecognition();
              } else {
                if (recognitionRef.current) {
                  recognitionRef.current.abort();
                }
              }
            }}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
              isHandsFree 
                ? "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-inner" 
                : "bg-slate-50 text-slate-400 border-slate-200"
            }`}
            title="Always-Listening Hands-Free Mode (Gemini Live Style)"
          >
            <span className={`relative flex h-1.5 w-1.5 mr-0.5`}>
              {isHandsFree && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isHandsFree ? "bg-emerald-600" : "bg-slate-400"}`}></span>
            </span>
            <span className="hidden sm:inline">{isHandsFree ? "Live Loop: ON" : "Live Loop: OFF"}</span>
            <span className="sm:hidden">{isHandsFree ? "Live" : "Manual"}</span>
          </button>

          {/* TTS Toggle option */}
          <button
            type="button"
            onClick={() => {
              setAutoSpeak(!autoSpeak);
              if (autoSpeak && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                setSpeakingId(null);
              }
            }}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
              autoSpeak 
                ? "bg-amber-100 text-amber-800 border-amber-300 shadow-inner" 
                : "bg-slate-50 text-slate-400 border-slate-200"
            }`}
            title="Toggle Automatic Speech-to-Voice Output"
          >
            {autoSpeak ? <Volume2 className="h-3.5 w-3.5" /> : <Volume1 className="h-3.5 w-3.5 text-slate-350" />}
            <span className="hidden sm:inline">Voice Response</span>
          </button>

          {/* Close / Hide Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:text-red-655 hover:border-red-300 transition-all cursor-pointer text-slate-400 flex items-center justify-center"
              title="Hide AI Assistant (Sakhi)"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[280px] max-h-[380px] bg-slate-50/50 border-b border-slate-100 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-start gap-2.5`}
          >
            {msg.sender === "sakhi" && (
              <div className="h-7 w-7 rounded-full bg-indigo-600 border border-indigo-700 text-white flex items-center justify-center text-xs shrink-0 font-bold shadow-xs">
                🚩
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs relative ${
                msg.sender === "user"
                  ? "bg-amber-500 text-slate-900 rounded-tr-none font-medium"
                  : "bg-white text-slate-800 border border-slate-200 rounded-tl-none pr-5 font-sans"
              }`}
            >
              {/* Parse paragraph breaks & print lines cleanly */}
              {msg.text.split("\n").map((para, i) => (
                <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                  {para}
                </p>
              ))}
              
              <div className="flex items-center justify-end mt-2 pt-1 border-t border-slate-100/40">
                <div
                  className={`text-[8px] ${
                    msg.sender === "user" ? "text-amber-950 font-bold" : "text-slate-400 font-mono"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-indigo-600 border border-indigo-700 text-amber-500 flex items-center justify-center text-xs animate-bounce font-bold">
              🚩
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-slate-500 flex items-center gap-2 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="font-semibold text-[11px] text-slate-600">Sakhi is verifying records...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {speechError && (
        <div className="mx-3 mt-2 bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-start gap-2.5 text-[11px] text-rose-700 font-medium">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-rose-950">Microphone Permission Blocked:</p>
            <p className="leading-relaxed">Your browser or iframe has blocked microphone access. To resolve this, grant mic access by clicking the Lock 🔒 icon in the browser address bar, or utilize the <span className="font-bold">Mic Shortcuts</span> buttons below to query!</p>
          </div>
        </div>
      )}

      {/* Glowing wave container or other info indicators */}

      {/* Siri/Alexa-style glowing ambient wave state indicator */}
      {isHandsFree && (
        <div className="mx-3 mb-2 p-2.5 rounded-xl border flex items-center justify-between shadow-xs transition-all duration-300 bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
          <div className="flex items-center gap-2">
            {isAwake ? (
              <div className="relative flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </div>
            ) : (
              <div className="h-3 w-3 rounded-full bg-slate-350" />
            )}
            
            <div className="flex flex-col">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                {isAwake ? "🎙️ SAKHI ACTIVE" : "💤 SLEEPING"}
              </span>
              <span className="text-[9px] text-slate-400 font-medium">
                {isAwake 
                  ? "Listening... Say 'Execute Task' or stay silent for 8 seconds when finished speaking!"
                  : "Say 'Hello Sakhi' to activate; other phrases will be ignored."
                }
              </span>
            </div>
          </div>

          {/* Animated visual wave lines when awake to feel like Siri/Alexa */}
          {isAwake && (
            <div className="flex items-end gap-0.5 h-4 px-1">
              <div className="w-0.5 bg-cyan-500 rounded-full animate-bounce h-2" style={{ animationDelay: "0.1s" }} />
              <div className="w-0.5 bg-indigo-500 rounded-full animate-bounce h-3.5" style={{ animationDelay: "0.3s" }} />
              <div className="w-0.5 bg-pink-500 rounded-full animate-bounce h-1.5" style={{ animationDelay: "0.2s" }} />
              <div className="w-0.5 bg-cyan-500 rounded-full animate-bounce h-3" style={{ animationDelay: "0.4s" }} />
            </div>
          )}
        </div>
      )}

      {/* Voice Buffer Draft Banner - showing accumulated words */}
      {isHandsFree && isAwake && voiceBuffer && (
        <div className="mx-3 mb-2 p-2 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs flex flex-col gap-1 shadow-2xs">
          <div className="flex justify-between items-center text-[9px] font-bold text-indigo-700">
            <span>📝 ACCUMULATING COMMAND:</span>
            <span className="font-mono text-[8px] uppercase bg-indigo-200/50 px-1.5 py-0.2 rounded text-indigo-800">
              Draft Buffer
            </span>
          </div>
          <p className="text-slate-800 italic font-semibold leading-relaxed">"{voiceBuffer}"</p>
        </div>
      )}

      {/* Dynamic Language Selection Bar */}
      <div className="mx-3 mb-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between shadow-2xs gap-2 flex-wrap">
        <span className="text-[9px] font-extrabold text-slate-400 font-mono tracking-wider">
          🌐 LANGUAGE MODE:
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSakhiLang("hi-IN")}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
              sakhiLang === "hi-IN"
                ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-3xs"
                : "bg-white text-slate-505 text-slate-500 border-slate-200 hover:bg-slate-100"
            }`}
          >
            🇮🇳 Hindi/Hinglish
          </button>
          <button
            type="button"
            onClick={() => setSakhiLang("en-IN")}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
              sakhiLang === "en-IN"
                ? "bg-indigo-100 text-indigo-905 text-indigo-900 border-indigo-300 font-extrabold shadow-3xs"
                : "bg-white text-slate-505 text-slate-500 border-slate-200 hover:bg-slate-100"
            }`}
          >
            🇬🇧 English
          </button>
          <button
            type="button"
            onClick={() => setSakhiLang("sd-IN")}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all border cursor-pointer ${
              sakhiLang === "sd-IN"
                ? "bg-emerald-100 text-emerald-950 border-emerald-300 font-extrabold shadow-3xs"
                : "bg-white text-slate-505 text-slate-500 border-slate-200 hover:bg-slate-100"
            }`}
          >
            🚩 Sindhi
          </button>
        </div>
      </div>

      {/* Input Form with Real speech detection button */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputText);
        }}
        className="p-3 bg-slate-50 flex gap-2"
      >
        <button
          type="button"
          id="sakhi-speech-input-trigger"
          onClick={handleMicToggle}
          className={`p-2.5 rounded-xl border transition-all shrink-0 cursor-pointer flex items-center justify-center relative shadow-xs ${
            (speakingId !== null || (window.speechSynthesis && window.speechSynthesis.speaking))
              ? "bg-amber-600 text-white border-amber-700 shadow-sm animate-pulse hover:bg-amber-700"
              : isHandsFree 
                ? "bg-red-650 text-white border-red-755 shadow-sm shadow-red-200/60 animate-pulse" 
                : "bg-white text-indigo-650 hover:bg-slate-100 hover:text-indigo-900 border-slate-200"
          }`}
          title={(speakingId !== null || (window.speechSynthesis && window.speechSynthesis.speaking)) ? "Click to stop speaking voice stream" : "Click once to toggle continuous hands-free voice input"}
        >
          {(speakingId !== null || (window.speechSynthesis && window.speechSynthesis.speaking)) ? (
            <>
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600"></span>
              </span>
              <MicOff className="h-4 w-4 text-white" />
            </>
          ) : isHandsFree ? (
            <>
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-650"></span>
              </span>
              <Mic className="h-4 w-4 text-white" />
            </>
          ) : (
            <Mic className="h-4 w-4 text-slate-500" />
          )}
        </button>
 
        <input
          id="sakhi-chat-text-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            isHandsFree 
              ? (isAwake 
                  ? "Sakhi is listening... Say 'Execute Task' when finished, or stay silent!" 
                  : "Sakhi is in sleep mode: Say 'Hello Sakhi' to start (e.g. 'Show GSTR-2B reconciliation')")
              : "Talk to Sakhi (e.g., GSTR-2B reconciliation or change screen)..."
          }
          className="flex-1 bg-white border border-slate-205 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1.5 focus:ring-amber-500 placeholder-slate-400 font-sans shadow-xs font-semibold"
        />
        <button
          id="sakhi-send-chat-btn"
          type="submit"
          disabled={!inputText.trim() || loading}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-900 p-2.5 rounded-xl transition-all flex items-center justify-center shrink-0 shadow-xs font-bold cursor-pointer border border-amber-400"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
