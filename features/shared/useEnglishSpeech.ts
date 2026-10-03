import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { toast } from 'sonner-native';



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






// Once per app session is enough to explain it; the student may not be able to fix it.
let hasShownMissingVoiceTip = false;

const showMissingVoiceTipOnce = () => {
  if (hasShownMissingVoiceTip) return;
  hasShownMissingVoiceTip = true;
  // English as the title, French as the toast's lighter description line.
  toast(
    "No English voice on this phone, so words may be read with a French accent. Add one in your phone's text-to-speech settings.",
    {
      description: 'Pas de voix anglaise sur ce téléphone : les mots risquent d’être lus avec un accent français. Ajoute-en une dans les réglages de synthèse vocale du téléphone.',
      duration: 10000,
    }
  );
};

export function useEnglishSpeech() {
  const [preferredVoice, setPreferredVoice] = useState<string | undefined>(undefined);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const preferredVoiceRef = useRef<string | undefined>(undefined);
  const hasNoEnglishVoiceRef = useRef(false);

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
        // Only when the phone lists voices and none is English. An empty list can just
        // mean Android's speech engine hasn't started yet, and browsers load voices late.
        hasNoEnglishVoiceRef.current = Platform.OS !== 'web' && voices.length > 0 && !bestVoice;
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

    if (hasNoEnglishVoiceRef.current) showMissingVoiceTipOnce();

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
