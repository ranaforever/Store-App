import React from "react";
import { Mic, MicOff, AlertCircle } from "lucide-react";

interface VoiceInputButtonProps {
  onResult: (text: string) => void;
  placeholderName?: string;
  className?: string;
}

export default function VoiceInputButton({
  onResult,
  placeholderName = "লিখা",
  className = "",
}: VoiceInputButtonProps) {
  const [isListening, setIsListening] = React.useState(false);
  const [unsupported, setUnsupported] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);
  const timeoutRef = React.useRef<any>(null);

  React.useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setUnsupported(true);
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (unsupported) {
      setErrorMessage(
        "আপনার ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়। দয়া করে গুগল ক্রোম (Google Chrome) ব্যবহার করুন।"
      );
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setErrorMessage(null);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      try {
        const recognition = new SpeechRecognition();
        recognition.lang = "bn-BD"; // Bengali language input
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          if (resultText) {
            onResult(resultText);
          }
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech Recognition Error:", event.error);
          setIsListening(false);
          
          let friendlyMsg = "ভয়েস ইনপুটে সমস্যা হয়েছে! অনুগ্রহ করে আবার চেষ্টা করুন।";
          if (event.error === "not-allowed") {
            friendlyMsg = "মাইক্রোফোন ব্যবহারের অনুমতি (Permission) নেই! অনুগ্রহ করে ব্রাউজার সেটিংসে অনুমতি দিন।";
          } else if (event.error === "no-speech") {
            friendlyMsg = "কোনো কথা বা আওয়াজ শোনা যায়নি! অনুগ্রহ করে আবার চেষ্টা করুন।";
          } else if (event.error === "network") {
            friendlyMsg = "নেটওয়ার্ক সমস্যা! আপনার ইন্টারনেট সংযোগ চেক করুন।";
          } else if (event.error === "audio-capture") {
            friendlyMsg = "মাইক্রোফোন খুঁজে পাওয়া যায়নি! কোনো সচল মাইক্রোফোন সংযুক্ত আছে কি না চেক করুন।";
          } else if (event.error === "aborted") {
            friendlyMsg = "ভয়েস রেকর্ড বন্ধ করা হয়েছে।";
          }
          
          setErrorMessage(friendlyMsg);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => setErrorMessage(null), 5000);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err) {
        console.error("Failed to start speech recognition", err);
        setIsListening(false);
      }
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={toggleListening}
        className={`p-1.5 rounded-lg border transition-all duration-300 flex items-center justify-center cursor-pointer shrink-0 ${
          isListening
            ? "bg-rose-500 text-white border-rose-500 animate-pulse scale-105"
            : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 border-slate-200"
        } ${className}`}
        title={isListening ? "ভয়েস রেকর্ড হচ্ছে... বন্ধ করতে ক্লিক করুন" : `${placeholderName} ভয়েস ইনপুট দিন (বাংলা)`}
      >
        {isListening ? (
          <span className="flex items-center gap-1 text-[10px] font-bold px-0.5">
            <MicOff className="w-3.5 h-3.5 animate-bounce" />
            <span className="hidden sm:inline">শুনছি...</span>
          </span>
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
      </button>

      {errorMessage && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 text-white p-3 rounded-xl text-[11px] font-medium shadow-xl z-50 flex items-start gap-1.5 border border-slate-700/60 transition-all duration-300 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-amber-400">ভয়েস ইনপুট সমস্যা</p>
            <p className="text-slate-200 mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
