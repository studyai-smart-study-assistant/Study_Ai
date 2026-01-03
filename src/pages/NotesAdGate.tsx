import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeAd } from '@/components/ads';

interface GeneratedNote {
  id: string;
  title: string;
  subject: string;
  topic: string;
  noteType: string;
  content: string;
  keyPoints: string[];
  timestamp: string;
}

const NotesAdGate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const note = location.state?.note as GeneratedNote | undefined;

  const [seconds, setSeconds] = useState(5);

  const canContinue = seconds <= 0;

  const title = useMemo(() => {
    const base = note?.title ? `Notes: ${note.title}` : 'Notes';
    return `${base} | Study AI`;
  }, [note?.title]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    if (canContinue) return;
    const t = window.setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [canContinue]);

  if (!note) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Notes नहीं मिला</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              कृपया Notes दुबारा generate करें।
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Home जाएं
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Notes तैयार हैं
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Continue करने से पहले sponsor ad दिखेगा।
          </p>
        </header>

        <section className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">प्रायोजित</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NativeAd className="rounded-lg overflow-hidden" />

              <div className="pt-4 flex items-center justify-between gap-3">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  वापस
                </Button>
                <Button
                  onClick={() => navigate('/notes-view', { state: { note } })}
                  disabled={!canContinue}
                >
                  {canContinue ? 'Continue' : `Continue (${seconds}s)`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default NotesAdGate;
