import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ──────────────────────────────────────────────
// GET /api/certificates/verify/[id]
// Verifies a certificate by its ID.
// Returns validity status and metadata.
// ──────────────────────────────────────────────

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const certificate = await prisma.certificate.findUnique({
            where: { id },
        });

        if (!certificate) {
            return NextResponse.json(
                {
                    valid: false,
                    error: "Certificate not found",
                },
                { status: 404 }
            );
        }

        // Fetch user and course info
        const user = await prisma.user.findUnique({
            where: { id: certificate.userId },
            select: { name: true, email: true },
        });

        return NextResponse.json({
            valid: true,
            certificate: {
                id: certificate.id,
                issuedAt: certificate.issuedAt,
                studentName: user?.name || "Unknown",
                courseId: certificate.courseId,
            },
        });
    } catch (error) {
        console.error("[verify-certificate] Error:", error);
        return NextResponse.json(
            { valid: false, error: "Verification failed" },
            { status: 500 }
        );
    }
}
