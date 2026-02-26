import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ──────────────────────────────────────────────
// POST /api/assessments/upload-csv
// Parses a CSV file of quiz questions and inserts
// them into the MySQL database via Prisma.
//
// Expected CSV columns:
//   type, text, optionA, optionB, optionC, optionD, answer
//
// Types: TRUE_FALSE, MULTIPLE_CHOICE, FILL_IN_BLANK
// ──────────────────────────────────────────────

interface ParsedQuestion {
    type: "TRUE_FALSE" | "MULTIPLE_CHOICE" | "FILL_IN_BLANK";
    text: string;
    options: string[] | null;
    answer: string;
    order: number;
}

function parseCSV(csvText: string): ParsedQuestion[] {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
        throw new Error("CSV must have a header row and at least one data row");
    }

    // Parse header
    const header = lines[0]
        .split(",")
        .map((h) => h.trim().toLowerCase().replace(/"/g, ""));
    const requiredHeaders = ["type", "text", "answer"];
    for (const h of requiredHeaders) {
        if (!header.includes(h)) {
            throw new Error(`Missing required CSV header: ${h}`);
        }
    }

    const questions: ParsedQuestion[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0) continue;

        const row: Record<string, string> = {};
        header.forEach((h, idx) => {
            row[h] = values[idx]?.trim().replace(/^"|"$/g, "") || "";
        });

        const type = row.type.toUpperCase() as ParsedQuestion["type"];
        if (!["TRUE_FALSE", "MULTIPLE_CHOICE", "FILL_IN_BLANK"].includes(type)) {
            throw new Error(
                `Invalid question type on row ${i + 1}: "${row.type}". Must be TRUE_FALSE, MULTIPLE_CHOICE, or FILL_IN_BLANK`
            );
        }

        let options: string[] | null = null;
        if (type === "MULTIPLE_CHOICE") {
            options = [
                row.optiona || row["option_a"] || "",
                row.optionb || row["option_b"] || "",
                row.optionc || row["option_c"] || "",
                row.optiond || row["option_d"] || "",
            ].filter(Boolean);

            if (options.length < 2) {
                throw new Error(
                    `Multiple choice question on row ${i + 1} needs at least 2 options`
                );
            }
        }

        questions.push({
            type,
            text: row.text,
            options,
            answer: row.answer,
            order: i,
        });
    }

    return questions;
}

/**
 * Simple CSV line parser that handles quoted fields with commas.
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current.trim());

    return result;
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const assessmentId = formData.get("assessmentId") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }
        if (!assessmentId) {
            return NextResponse.json(
                { error: "assessmentId is required" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!file.name.endsWith(".csv")) {
            return NextResponse.json(
                { error: "Only CSV files are accepted" },
                { status: 400 }
            );
        }

        const csvText = await file.text();
        const questions = parseCSV(csvText);

        if (questions.length === 0) {
            return NextResponse.json(
                { error: "No valid questions found in CSV" },
                { status: 400 }
            );
        }

        // Insert questions into database
        const created = await prisma.question.createMany({
            data: questions.map((q) => ({
                assessmentId,
                type: q.type,
                text: q.text,
                options: q.options ?? undefined,
                answer: q.answer,
                order: q.order,
            })),
        });

        return NextResponse.json({
            message: `Successfully imported ${created.count} questions`,
            count: created.count,
        });
    } catch (error) {
        console.error("[upload-csv] Error:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error ? error.message : "Failed to process CSV",
            },
            { status: 500 }
        );
    }
}
