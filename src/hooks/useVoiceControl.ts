import { useState, useCallback, useRef, useEffect } from 'react';

interface VoiceControlActions {
  onPlay?: () => void;
  onPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSearch?: (query: string) => void;
}

export function useVoiceControl(actions: VoiceControlActions) {
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      setLastCommand(transcript);
      processCommand(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [isSupported]);

  const processCommand = useCallback((command: string) => {
    if (command.includes('play') && !command.includes('playlist')) {
      actions.onPlay?.();
    } else if (command.includes('pause') || command.includes('stop')) {
      actions.onPause?.();
    } else if (command.includes('next') || command.includes('skip')) {
      actions.onNext?.();
    } else if (command.includes('previous') || command.includes('back')) {
      actions.onPrevious?.();
    } else if (command.startsWith('search') || command.startsWith('find')) {
      const query = command.replace(/^(search|find)\s*(for)?\s*/i, '');
      if (query) actions.onSearch?.(query);
    }
  }, [actions]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setLastCommand(null);
    } catch {}
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.abort();
    setIsListening(false);
  }, []);

  return { isListening, isSupported, lastCommand, startListening, stopListening };
}
