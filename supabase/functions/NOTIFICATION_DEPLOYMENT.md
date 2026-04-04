# Notification Edge Functions Deployment

Agar dashboard me function दिखाई नहीं दे रहा, इसका मतलब function अभी deploy नहीं हुआ है.

## Deploy commands

```bash
supabase functions deploy notification
supabase functions deploy send-push-notification
supabase functions deploy onesignal-identity-sync
supabase functions deploy analyze-study-pattern
supabase functions deploy deep-thinking
supabase functions deploy chat-completion
```

## Set secrets (server-side only)

```bash
supabase secrets set ONESIGNAL_APP_ID="<app-id>"
supabase secrets set ONESIGNAL_REST_API_KEY="<rest-api-key>"
```

## Quick health check

```bash
supabase functions invoke notification --body '{"action":"ping"}'
```

Expected response: `{"success":true,"action":"ping","message":"notification function is live"}`
