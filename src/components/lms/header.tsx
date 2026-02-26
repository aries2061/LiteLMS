"use client";

import { useOfflineSync } from "@/hooks/use-offline-sync";
import { Badge } from "@/components/ui/badge";

export function Header() {
    const { isOnline, isSyncing, queueLength } = useOfflineSync();

    return (
        <header className="sticky top-0 z-40 flex items-center justify-between h-14 px-6 border-b border-border bg-card/80 backdrop-blur-sm">
            {/* Breadcrumb area */}
            <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-foreground">Lite LMS</h2>
            </div>

            {/* Status indicators */}
            <div className="flex items-center gap-3">
                {/* Sync status */}
                {queueLength > 0 && (
                    <Badge variant="secondary" className="text-xs">
                        {isSyncing ? "Syncing..." : `${queueLength} pending`}
                    </Badge>
                )}

                {/* Network status */}
                <div className="flex items-center gap-1.5">
                    <div
                        className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"
                            }`}
                    />
                    <span className="text-xs text-muted-foreground">
                        {isOnline ? "Online" : "Offline"}
                    </span>
                </div>
            </div>
        </header>
    );
}
