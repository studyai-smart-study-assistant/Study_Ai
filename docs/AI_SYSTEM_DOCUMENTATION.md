# Study AI - AI System Architecture & Prompt Documentation

> **Last Updated**: 2026-02-04
> **Purpose**: Complete documentation of AI prompts, models, and features for future multi-model orchestration

---

## 1. AI Provider Configuration

### Primary Provider: Lovable AI Gateway
- **Endpoint**: `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Auth**: Bearer token via `LOVABLE_API_KEY` (auto-provided by Lovable Cloud)

### Secondary Provider: Gemini Direct (Legacy)
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- **Auth**: API key rotation via `GEMINI_API_KEYS` secret (comma-separated)
- **Status**: Used for specific interactive features

---

## 2. Supported Models

| Model ID | Use Case | Speed | Quality |
|----------|----------|-------|---------|
| `google/gemini-2.5-flash` | Default chat, notes, quiz | Fast | Good |
| `google/gemini-2.5-pro` | Complex reasoning | Medium | Excellent |
| `openai/gpt-5` | Premium features (future) | Medium | Excellent |
| `openai/gpt-5-mini` | Quick responses | Fast | Good |

---

## 3. Feature-to-AI Mapping

### 3.1 Main Chat (`src/hooks/chat/useEnhancedChat.ts`)
- **Model**: `google/gemini-2.5-flash`
- **Edge Function**: `supabase/functions/chat-completion/index.ts`
- **Prompt Location**: System prompt in edge function (lines 36-46)

**System Prompt (Hindi/English bilingual):**
```
आप एक सहायक AI शिक्षक हैं। आप हिंदी और अंग्रेजी दोनों में छात्रों की मदद करते हैं।
महत्वपूर्ण निर्देश:
1. केवल वर्तमान प्रश्न का उत्तर दें - पिछले प्रश्नों को दोहराएं नहीं
2. उत्तर सीधा और संक्षिप्त हो
3. 2 अंक का प्रश्न = 3-4 लाइन
4. पिछली बातचीत का संदर्भ रखें लेकिन repeat न करें
5. प्रत्येक प्रश्न का एक ही बार जवाब दें
```

---

### 3.2 Notes Generator (`src/components/study/EnhancedNotesGenerator.tsx`)
- **Model**: `google/gemini-2.5-flash`
- **Edge Function**: `chat-completion`
- **Prompt Generator**: `generateSmartPrompt()` (lines 67-112)

**Prompt Template:**
```
आप एक expert teacher हैं। {class} के लिए {subject} विषय के "{chapter}" chapter पर 
विस्तृत और high-quality study notes बनाएं।

Notes में ये sections शामिल करें:
📚 Chapter Overview
📝 Detailed Content (step-by-step, formulas, diagrams)
💡 Key Points (tricks, mnemonics, tips)
📊 Practice Questions (short, long, MCQs)
📖 Summary
```

---

### 3.3 Quiz Generator (`src/components/study/QuizGenerator.tsx`)
- **Model**: `google/gemini-2.5-flash`
- **Edge Function**: `chat-completion`
- **Prompt Location**: `handleGenerateQuiz()` (lines 117-181)

**English Prompt Template:**
```
Create an educational quiz with:
- TOPIC: "{topic}"
- SUBJECT: {subjectName}
- DIFFICULTY: {difficultyLevel}
- QUESTIONS: {numberOfQuestions}
- TYPE: {quizType}

FORMATTING:
1. Number each question (1., 2., 3.)
2. Use options A, B, C, D
3. Mark correct answer clearly
4. Provide explanation after each answer
```

**Hindi Prompt Template:**
```
निम्नलिखित विशिष्टताओं के साथ शैक्षणिक प्रश्नोत्तरी बनाएं...
```

---

### 3.4 Homework Helper (`src/components/study/HomeworkAssistant.tsx`)
- **Model**: `google/gemini-2.5-flash`
- **Edge Function**: `chat-completion`
- **Prompt Location**: `handleGetHelp()` (lines 82-124)

**Assist Modes:**
1. **stepByStep**: Full solution with steps
2. **hint**: Starting point only
3. **check**: Verify user's solution

**English Prompt:**
```
I need help with this {subject} problem: "{problem}". 
Please explain the solution step by step, showing all work.
```

**Hindi Prompt:**
```
मुझे इस {hindiSubject} की समस्या में मदद चाहिए: "{problem}". 
कृपया समाधान को चरण-दर-चरण समझाएं।
```

---

### 3.5 Study Planner (`src/lib/gemini.ts` + `src/lib/ai-teacher-prompt-generator.ts`)
- **Model**: `google/gemini-2.5-flash`
- **Edge Function**: `chat-completion`
- **Prompt Generator**: `generateComprehensiveAITeacherPrompt()`

**Key Features:**
- Full syllabus integration
- Learning style adaptation (Visual/Auditory/Kinesthetic/Reading)
- Progress-based adaptation
- JSON-structured output

**Prompt Includes:**
- Exam details (name, date, subjects)
- Personal preferences (weak areas, strong areas, difficulty level)
- Daily study hours and time slots
- Official syllabus data

---

### 3.6 Interactive Teacher (`supabase/functions/gemini-chat/index.ts`)
- **Model**: `gemini-2.0-flash` (Direct Gemini API)
- **API Key Pool**: Rotating keys via `GEMINI_API_KEYS`
- **Features**: API key rotation, rate limit handling, retry logic

**Key Types:**
- `default`: General teaching
- `interactive-teacher`: Live tutoring sessions
- `interactive-quiz`: Real-time quiz

---

## 4. Edge Functions Summary

| Function | Purpose | Model | Auth Required |
|----------|---------|-------|---------------|
| `chat-completion` | Main AI chat | Lovable AI | No |
| `gemini-chat` | Interactive features | Gemini Direct | No |
| `generate-image` | Image generation | TBD | Yes |

---

## 5. Guest vs Logged-in User Flow

### Guest Users
- Full access to all AI features
- Usage tracked locally (`guestUsageTracker.ts`)
- Non-blocking signup prompt after 5 uses
- 24-hour cooldown on prompts

### Logged-in Users
- Credit-based system
- Activity tracking (points, streaks)
- Data sync across devices
- Premium features (future)

---

## 6. Future Multi-Model Orchestration

### Recommended Architecture
```
┌─────────────────────────────────────────────┐
│           AI Router (Future)                │
├─────────────────────────────────────────────┤
│ Request → Classify Intent → Select Model    │
│                                             │
│ Simple Q&A → gemini-flash (fast, cheap)     │
│ Complex → gemini-pro or gpt-5               │
│ Code → specialized model                    │
│ Math → reasoning model                      │
└─────────────────────────────────────────────┘
```

### Model Selection Criteria
1. **Speed**: Use flash models for real-time chat
2. **Quality**: Use pro/premium for notes, study plans
3. **Cost**: Route simple queries to cheaper models
4. **Fallback**: Auto-switch on rate limits

---

## 7. Prompt Optimization Guidelines

### Do's
- Keep system prompts concise (<500 tokens)
- Use language detection for bilingual support
- Limit history to last 6 messages
- Sanitize image URLs from prompts

### Don'ts
- Don't repeat entire conversation in prompts
- Don't include base64 images in text
- Don't exceed 8000 token responses
- Don't use premium models for simple queries

---

## 8. Files Reference

| File | Purpose |
|------|---------|
| `src/lib/gemini.ts` | Main AI response generator |
| `src/lib/ai-teacher-prompt-generator.ts` | Study plan prompts |
| `supabase/functions/chat-completion/index.ts` | Lovable AI edge function |
| `supabase/functions/gemini-chat/index.ts` | Direct Gemini edge function |
| `src/components/study/EnhancedNotesGenerator.tsx` | Notes prompts |
| `src/components/study/QuizGenerator.tsx` | Quiz prompts |
| `src/components/study/HomeworkAssistant.tsx` | Homework prompts |

---

## 9. Security Considerations

1. **API Keys**: Never exposed to frontend
2. **Rate Limiting**: Handled at edge function level
3. **Content Filtering**: Gemini safety settings enabled
4. **User Data**: Not included in AI prompts

---

*This document should be updated when adding new AI features or changing models.*
