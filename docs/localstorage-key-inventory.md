# LocalStorage / SessionStorage Key Inventory

Source scan command used:

```bash
rg -n "localStorage\\.|sessionStorage\\." src
```

## 1) Must keep (Auth / Session only)
These are required for Supabase auth session continuity and should **not** be wiped except by auth sign-out itself.

- `sb-*`
- `*supabase.auth*`

> Note: app logout logic should only clear auth/session keys, not business data keys.

## 2) Migrate to DB (Business data)
These key families should be treated as legacy client cache and moved to Supabase tables/functions.

- **Points / level / credits**
  - `${userId}_points`
  - `${userId}_level`
  - `${userId}_credits`
  - `${userId}_points_history`
  - Target: `user_points`, `points_transactions`, and points edge functions (`points-balance`, `points-add`, etc.)
- **Profile preferences**
  - `userCategory`
  - `educationLevel`
  - Target: `profiles.user_category`, `profiles.education_level`
- **Chat history**
  - `teacher_chats_${userId}` and other chat-like local history keys
  - Target: `conversations`, `chat_messages`
- **Bookmarks / saved items**
  - `saved_messages`, `${userId}_purchased_items`, `${userId}_unlocked_items` (feature-level bookmarks/unlocks)
  - Target: DB-backed metadata tables (e.g. `message_metadata`) / dedicated tables where needed

## 3) Optional local-cache only (Ephemeral UI toggles / transient UX)
These can remain local-only because they are device UX state, not canonical business data.

- `hasSeenPointsOnboarding`
- `notification_sound_enabled`
- theme/voice/UI preference caches (e.g. `voicePreferences`)
- `lesson_${sessionId}` in `sessionStorage`

## 4) Additional observed key families from scan

- Study-planner/task local caches (`study_plans_*`, `active_study_plan_*`, `*_study_tasks`, `*_tasks_accepted`, etc.)
- Streak and usage local caches (`*_streak`, `*_usage_data`, `*_last_login`, etc.)
- Third-party / service caches (`Youtube_cache`, `remote_config`, OneSignal IDs)

These are not all in immediate migration scope of this change, but are inventory-confirmed.
