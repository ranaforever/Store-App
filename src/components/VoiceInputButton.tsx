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
  const recognitionRef = React.useRef<any>(null);

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
    };
  }, []);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (unsupported) {
      alert(
        "আপনার ব্রাউজারে ভয়েস ইনপুট (Speech Recognition) সমর্থিত নয়। দয়া করে গুগল ক্রোম (Google Chrome) ব্রাউজার ব্যবহার করুন।"
      );
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
          if (event.error === "not-allowed") {
            alert("ভয়েস ইনপুট ব্যবহারের জন্য মাইক্রোফোনের অনুমতি (Permission) প্রয়োজন!");
          }
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
  );
}
