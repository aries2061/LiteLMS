"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for PWA offline support.
 * Rendered in the root layout — only runs on the client.
 */
export function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((registration) => {
                    console.log("[SW] Registered:", registration.scope);
                })
                .catch((error) => {
                    console.error("[SW] Registration failed:", error);
                });
        }
    }, []);

    return null;
}
