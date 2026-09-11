import { useCallback, useEffect, useRef, useState } from 'react';



// Keep speech optional so unsupported builds can load without the native module.
const Speech = (() => {
  try { return require('expo-speech') as typeof import('expo-speech'); } catch { return null; }
})();

type SpeakOptions = {
  rate?: number;
  pitch?: number;
};




const scoreVoice = (voice: import('expo-speech').Voice) => {
  const language = voice.language?.toLowerCase() ?? '';
  if (!language.startsWith('en')) return -1;

  const name = `${voice.name ?? ''} ${voice.identifier ?? ''}`.toLowerCase();
  let score = 20;

  if (language === 'en-gb' || language.startsWith('en-gb-')) score += 90;
  if (language === 'en-ie' || language === 'en-au' || language === 'en-nz') score += 28;
  if (language === 'en-us') score += 4;
  if (language.startsWith('en-')) score += 8;
  if (voice.quality === Speech?.VoiceQuality?.Enhanced) score += 22;
  if (/british|united kingdom|\buk\b|serena|daniel|martha|susan/.test(name)) score += 18;
  if (/natural|neural|premium|enhanced|siri|samantha|karen|moira/.test(name)) score += 12;
  if (/compact|novelty|whisper|bells|boing|cellos|organ|trinoids|zarvox/.test(name)) score -= 16;

  return score;
};






export function useEnglishSpeech() {
  const [preferredVoice, setPreferredVoice] = useState<string | undefined>(undefined);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const preferredVoiceRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    Speech?.getAvailableVoicesAsync()
      .then((voices) => {
        if (!mounted) return;

        const bestVoice = voices
          .map((voice) => ({ voice, score: scoreVoice(voice) }))
          .filter(({ score }) => score >= 0)
          .sort((a, b) => b.score - a.score)[0]?.voice;

        preferredVoiceRef.current = bestVoice?.identifier;
        setPreferredVoice(bestVoice?.identifier);
      })
      .catch(() => {
        if (mounted) setPreferredVoice(undefined);
      });

    return () => {
      mounted = false;
      Speech?.stop();
    };
  }, []);

  const stop = useCallback(() => {
    Speech?.stop();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback((text?: string | null, options?: SpeakOptions) => {
    const trimmed = text?.trim();
    if (!trimmed) return;

    Speech?.stop();
    setIsSpeaking(true);
    Speech?.speak(trimmed, {
      language: 'en-GB',
      voice: preferredVoiceRef.current,
      rate: options?.rate ?? 0.82,
      pitch: options?.pitch ?? 1.02,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, []);

  return { speak, stop, isSpeaking, preferredVoice, isAvailable: !!Speech };
}
