# Repository Quality Audit (2026-04-04)

## Commands run
- `npm run lint`
- `npx eslint . --ext ts,tsx --report-unused-disable-directives -f json > /tmp/eslint-report.json`
- `npx tsc --noEmit`
- `npm run build`

## High-level findings
- ESLint reports **841 errors** and **81 warnings** across **287 files**.
- TypeScript compilation (`tsc --noEmit`) passes.
- Production build (`vite build`) passes.

## Critical errors
- Hook misuse (`react-hooks/rules-of-hooks`):
  - `src/components/study/SmartHomeworkAssistant.tsx:157`
- Parser/syntax failures (`fatal` / parsing error):
  - `src/data/main_system_prompt.ts:39`
  - `supabase/functions/chat-completion/index.ts:246`
- Constant-condition logic issues (`no-constant-condition`):
  - `src/lib/gemini.ts:89`
  - `src/lib/streamingChat.ts:100`

## Most frequent ESLint error types
1. `@typescript-eslint/no-explicit-any`: 411
2. `@typescript-eslint/no-unused-vars`: 386
3. `no-empty`: 24
4. `prefer-const`: 9
5. `no-useless-escape`: 3

## Top files by ESLint error count
1. `src/components/study/QuizGenerator.tsx` — 41 errors
2. `src/lib/enhanced-gemini.ts` — 22 errors
3. `src/components/study/teacher/TeacherModeTabs.tsx` — 19 errors
4. `src/components/campus-talk/CampusTalkGroupSettings.tsx` — 16 errors (1 warning)
5. `src/components/student/StudentLearningProgress.tsx` — 15 errors (1 warning)
6. `src/services/apiKeyRotationService.ts` — 14 errors
7. `src/components/campus-talk/CampusTalkGroupConversation.tsx` — 13 errors
8. `src/components/campus-talk/CampusTalkGroupList.tsx` — 12 errors (2 warnings)
9. `src/components/study/DetailedTaskTracker.tsx` — 12 errors (1 warning)
10. `src/components/study/examplanner/EnhancedAnalytics.tsx` — 12 errors (1 warning)

## Files with syntax issues
- `src/data/main_system_prompt.ts`
- `supabase/functions/chat-completion/index.ts`
