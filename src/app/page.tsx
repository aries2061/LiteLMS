import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Lite LMS
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Lightweight, offline-capable Learning Management System
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <div className="flex gap-2">
            <Badge variant="secondary">PWA</Badge>
            <Badge variant="secondary">Offline-Ready</Badge>
            <Badge variant="secondary">Air-Gapped</Badge>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Running on local network • No internet required
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
