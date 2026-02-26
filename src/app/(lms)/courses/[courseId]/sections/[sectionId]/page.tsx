"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOfflineSync } from "@/hooks/use-offline-sync";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface SectionData {
    id: string;
    title: string;
    contentType: "IMAGE" | "PDF" | "VIDEO";
    contentUrl: string;
    courseId: string;
    moduleTitle: string;
    nextSectionId: string | null;
    isCompleted: boolean;
}

// ──────────────────────────────────────────────
// Content Renderers
// ──────────────────────────────────────────────

function ImageViewer({ url, title }: { url: string; title: string }) {
    return (
        <div className="flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[400px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={url}
                alt={title}
                className="max-w-full max-h-[600px] object-contain rounded-lg"
            />
        </div>
    );
}

function VideoPlayer({ url, title }: { url: string; title: string }) {
    return (
        <div className="rounded-lg overflow-hidden bg-black">
            <video
                controls
                className="w-full max-h-[500px]"
                preload="metadata"
                aria-label={title}
            >
                <source src={url} />
                Your browser does not support the video tag.
            </video>
        </div>
    );
}

function PDFViewer({ url }: { url: string }) {
    // react-pdf would be configured here with local worker
    // For now, use a basic iframe/embed fallback
    return (
        <div className="rounded-lg overflow-hidden border border-border bg-white min-h-[600px]">
            <embed
                src={url}
                type="application/pdf"
                className="w-full h-[600px]"
            />
        </div>
    );
}

// ──────────────────────────────────────────────
// Section Viewer Page
// ──────────────────────────────────────────────

export default function SectionViewerPage({
    params: _params,
}: {
    params: Promise<{ courseId: string; sectionId: string }>;
}) {
    const { completeSection } = useOfflineSync();
    const [completed, setCompleted] = useState(false);

    // Placeholder — will fetch from MySQL
    // Cast to avoid TypeScript narrowing to `never` after null check
    const section = (null as unknown) as SectionData | null;

    if (!section) {
        return (
            <div className="space-y-6 max-w-4xl">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <p className="text-sm text-muted-foreground">
                            Section not found or hasn&apos;t been created yet.
                        </p>
                        <Link href="/courses">
                            <Button variant="outline" className="mt-4">
                                ← Back to Courses
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const handleCompleteSection = () => {
        completeSection({
            sectionId: section.id,
            courseId: section.courseId,
            userId: "current-user", // TODO: Get from auth context
        });
        setCompleted(true);
    };

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <Link
                    href={`/courses/${section.courseId}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back to Course
                </Link>
                <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                        {section.moduleTitle}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                        {section.contentType}
                    </Badge>
                </div>
                <h1 className="text-2xl font-bold tracking-tight mt-2">
                    {section.title}
                </h1>
            </div>

            {/* Content renderer */}
            <Card>
                <CardContent className="p-4">
                    {section.contentType === "IMAGE" && (
                        <ImageViewer url={section.contentUrl} title={section.title} />
                    )}
                    {section.contentType === "VIDEO" && (
                        <VideoPlayer url={section.contentUrl} title={section.title} />
                    )}
                    {section.contentType === "PDF" && (
                        <PDFViewer url={section.contentUrl} />
                    )}
                </CardContent>
            </Card>

            {/* Completion & Navigation */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            {completed || section.isCompleted ? (
                                <div className="flex items-center gap-2 text-green-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                                    <span className="text-sm font-medium">
                                        Section completed
                                    </span>
                                </div>
                            ) : (
                                <Button onClick={handleCompleteSection}>
                                    Mark as Complete
                                </Button>
                            )}
                        </div>

                        {section.nextSectionId && (
                            <Link href={`/courses/${section.courseId}/sections/${section.nextSectionId}`}>
                                <Button variant="outline">
                                    Next Section →
                                </Button>
                            </Link>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
