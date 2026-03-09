export const getRealtimeContext = () => {
  const now = new Date();
  
  // Format dates in IST explicitly
  const optionsEn: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  
  const optionsHi: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  };
  
  const istDateStr = now.toLocaleString('en-IN', optionsEn);
  const istDateHindiStr = now.toLocaleString('hi-IN', optionsHi);
  const shortDate = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short' });
  
  const contextPrompt = `[CRITICAL SYSTEM CONTEXT: The current real-time date and time is ${istDateStr} (IST). Today's date is ${shortDate} and day is ${istDateHindiStr}. ALWAYS use this exact date and time if the user asks "आज क्या तारीख है", "कितना बज रहा है", "what is today's date", "what is the time" or any similar questions. Do not say you don't know or don't have real-time access. Also use this date as the current anchor for any news or web searches.]`;
  
  return {
    contextPrompt,
    currentTimeStr: istDateStr
  };
};

export const isDateTimeQuery = (query: string): boolean => {
  const lowerQuery = query.toLowerCase();
  const timeKeywords = [
    'क्या तारीख', 'कौन सी तारीख', 'क्या दिन', 'आज क्या है', 'तारीख', 
    'date today', 'time right now', 'क्या समय', 'कितना बज', 'what time is it'
  ];
  
  return timeKeywords.some(keyword => lowerQuery.includes(keyword));
};

export const getDateTimeAnswer = (query: string): string => {
  const now = new Date();
  const timeOpts: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true };
  const dateOpts: Intl.DateTimeFormatOptions = { timeZone: 'Asia/Kolkata', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  
  const timeStr = now.toLocaleTimeString('hi-IN', timeOpts);
  const dateStr = now.toLocaleDateString('hi-IN', dateOpts);
  
  if (query.includes('समय') || query.includes('बज') || query.includes('time')) {
    return `अभी भारतीय समयानुसार (IST) **${timeStr}** हो रहे हैं। 🕒`;
  }
  
  if (query.includes('तारीख') || query.includes('दिन') || query.includes('date')) {
    return `आज **${dateStr}** है। 📅`;
  }
  
  return `आज **${dateStr}** है और अभी **${timeStr}** हो रहे हैं। 🕒📅`;
};
