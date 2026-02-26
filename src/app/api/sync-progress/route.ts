import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/lib/mongodb";
import { StudentProgress } from "@/models/student-progress";

// ──────────────────────────────────────────────
// Types (matching the client-side ProgressEntry)
// ──────────────────────────────────────────────

interface ProgressEntry {
    sectionId: string;
    courseId: string;
    userId: string;
    completedAt: string;
}

interface SyncRequestBody {
    entries: ProgressEntry[];
}

// ──────────────────────────────────────────────
// POST /api/sync-progress
// Batch-writes section completions to MongoDB.
// Returns the list of successfully synced sectionIds.
// ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body: SyncRequestBody = await request.json();

        if (!body.entries || !Array.isArray(body.entries) || body.entries.length === 0) {
            return NextResponse.json(
                { error: "Invalid payload: entries array required" },
                { status: 400 }
            );
        }

        // Validate each entry
        for (const entry of body.entries) {
            if (!entry.sectionId || !entry.courseId || !entry.userId) {
                return NextResponse.json(
                    { error: "Each entry must have sectionId, courseId, and userId" },
                    { status: 400 }
                );
            }
        }

        await connectMongoDB();

        const syncedSectionIds: string[] = [];

        // Group entries by userId+courseId for batch upserts
        const grouped = new Map<string, ProgressEntry[]>();
        for (const entry of body.entries) {
            const key = `${entry.userId}:${entry.courseId}`;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(entry);
        }

        // Process each group
        for (const [, entries] of grouped) {
            const { userId, courseId } = entries[0];

            const completedSections = entries.map((e) => ({
                sectionId: e.sectionId,
                completedAt: new Date(e.completedAt),
            }));

            await StudentProgress.findOneAndUpdate(
                { userId, courseId },
                {
                    $addToSet: {
                        completedSections: { $each: completedSections },
                    },
                    $set: {
                        lastAccessedAt: new Date(),
                    },
                },
                { upsert: true, new: true }
            );

            syncedSectionIds.push(...entries.map((e) => e.sectionId));
        }

        return NextResponse.json({
            syncedSectionIds,
            syncedCount: syncedSectionIds.length,
        });
    } catch (error) {
        console.error("[sync-progress] Error:", error);
        return NextResponse.json(
            { error: "Internal server error during sync" },
            { status: 500 }
        );
    }
}
