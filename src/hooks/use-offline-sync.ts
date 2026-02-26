"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface ProgressEntry {
    sectionId: string;
    courseId: string;
    userId: string;
    completedAt: string; // ISO string for serialization
}

interface SyncState {
    isOnline: boolean;
    isSyncing: boolean;
    queueLength: number;
    lastSyncAt: string | null;
    error: string | null;
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────

const QUEUE_KEY = "lite-lms-sync-queue";
const LAST_SYNC_KEY = "lite-lms-last-sync";
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1s → 2s → 4s

// ──────────────────────────────────────────────
// Queue helpers (localStorage)
// ──────────────────────────────────────────────

function getQueue(): ProgressEntry[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(QUEUE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function setQueue(queue: ProgressEntry[]): void {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function addToQueue(entry: ProgressEntry): ProgressEntry[] {
    const queue = getQueue();
    // De-duplicate by sectionId
    const exists = queue.some((e) => e.sectionId === entry.sectionId);
    if (!exists) {
        queue.push(entry);
        setQueue(queue);
    }
    return queue;
}

function removeFromQueue(sectionIds: string[]): ProgressEntry[] {
    const queue = getQueue().filter((e) => !sectionIds.includes(e.sectionId));
    setQueue(queue);
    return queue;
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

/**
 * useOfflineSync — Manages an offline-first progress sync queue.
 *
 * 1. When a section is completed, push it to localStorage queue.
 * 2. When online, batch-POST to /api/sync-progress.
 * 3. Clear only successfully synced entries.
 * 4. Listen for 'online' event to auto-retry.
 * 5. Exponential backoff on failure (max 3 retries).
 */
export function useOfflineSync() {
    const [state, setState] = useState<SyncState>({
        isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
        isSyncing: false,
        queueLength: getQueue().length,
        lastSyncAt: null,
        error: null,
    });

    const retryCount = useRef(0);
    const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ─── Sync function ──────────────────────────
    const syncQueue = useCallback(async () => {
        const queue = getQueue();
        if (queue.length === 0 || !navigator.onLine) return;

        setState((prev) => ({ ...prev, isSyncing: true, error: null }));

        try {
            const response = await fetch("/api/sync-progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entries: queue }),
            });

            if (!response.ok) {
                throw new Error(`Sync failed: ${response.status}`);
            }

            const data = await response.json();
            const syncedIds: string[] = data.syncedSectionIds || [];

            // Clear only successfully synced items
            const remaining = removeFromQueue(syncedIds);
            const now = new Date().toISOString();
            localStorage.setItem(LAST_SYNC_KEY, now);

            retryCount.current = 0;
            setState((prev) => ({
                ...prev,
                isSyncing: false,
                queueLength: remaining.length,
                lastSyncAt: now,
                error: null,
            }));
        } catch (err) {
            retryCount.current += 1;

            if (retryCount.current < MAX_RETRIES) {
                const delay = BASE_DELAY_MS * Math.pow(2, retryCount.current - 1);
                retryTimeout.current = setTimeout(syncQueue, delay);
            }

            setState((prev) => ({
                ...prev,
                isSyncing: false,
                error:
                    err instanceof Error
                        ? err.message
                        : "Sync failed — will retry when connected",
            }));
        }
    }, []);

    // ─── Complete section (push + auto-sync) ────
    const completeSection = useCallback(
        (entry: Omit<ProgressEntry, "completedAt">) => {
            const fullEntry: ProgressEntry = {
                ...entry,
                completedAt: new Date().toISOString(),
            };

            const queue = addToQueue(fullEntry);
            setState((prev) => ({ ...prev, queueLength: queue.length }));

            // Attempt immediate sync if online
            if (navigator.onLine) {
                syncQueue();
            }
        },
        [syncQueue]
    );

    // ─── Network listeners ──────────────────────
    useEffect(() => {
        const handleOnline = () => {
            setState((prev) => ({ ...prev, isOnline: true }));
            retryCount.current = 0;
            syncQueue();
        };

        const handleOffline = () => {
            setState((prev) => ({ ...prev, isOnline: false }));
            if (retryTimeout.current) {
                clearTimeout(retryTimeout.current);
            }
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        // Initial sync attempt on mount
        const lastSync = localStorage.getItem(LAST_SYNC_KEY);
        setState((prev) => ({ ...prev, lastSyncAt: lastSync }));
        if (navigator.onLine && getQueue().length > 0) {
            syncQueue();
        }

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            if (retryTimeout.current) {
                clearTimeout(retryTimeout.current);
            }
        };
    }, [syncQueue]);

    return {
        ...state,
        completeSection,
        syncQueue,
        pendingEntries: getQueue(),
    };
}
