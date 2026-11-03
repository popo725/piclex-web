export function stopSpeaking() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }
export function speak(english: string, example?: string) {
  if (!('speechSynthesis' in window)) throw new Error('此浏览器不支持发音，请尝试 Safari、Chrome 或 Edge。');
  stopSpeaking();
  const voice = speechSynthesis.getVoices().find(v => v.lang === 'en-US');
  for (const text of example?.trim() ? [example, english] : [english]) {
    const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'en-US'; utterance.rate = .85;
    if (voice) utterance.voice = voice;
    speechSynthesis.speak(utterance);
  }
}
