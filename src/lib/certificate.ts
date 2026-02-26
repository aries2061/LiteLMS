import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";

interface CertificateData {
    certificateId: string;
    studentName: string;
    courseTitle: string;
    score: number;
    issuedAt: Date;
    verificationUrl: string;
}

/**
 * Generates a PDF certificate locally using pdf-lib.
 * Stamps a QR code for verification.
 * Returns the PDF as a Uint8Array.
 */
export async function generateCertificate(
    data: CertificateData
): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    const page = doc.addPage([842, 595]); // A4 Landscape
    const { width, height } = page.getSize();

    // Fonts
    const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);
    const bodyFont = await doc.embedFont(StandardFonts.Helvetica);

    // ─── Background ──────────────────────────────
    page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height,
        color: rgb(0.98, 0.98, 1),
    });

    // Border
    page.drawRectangle({
        x: 20,
        y: 20,
        width: width - 40,
        height: height - 40,
        borderColor: rgb(0.055, 0.647, 0.914), // #0ea5e9
        borderWidth: 3,
    });

    // Inner border
    page.drawRectangle({
        x: 30,
        y: 30,
        width: width - 60,
        height: height - 60,
        borderColor: rgb(0.055, 0.647, 0.914),
        borderWidth: 1,
    });

    // ─── Title ───────────────────────────────────
    const title = "CERTIFICATE OF COMPLETION";
    const titleWidth = titleFont.widthOfTextAtSize(title, 28);
    page.drawText(title, {
        x: (width - titleWidth) / 2,
        y: height - 100,
        size: 28,
        font: titleFont,
        color: rgb(0.055, 0.647, 0.914),
    });

    // ─── Subtitle ────────────────────────────────
    const subtitle = "This is to certify that";
    const subtitleWidth = bodyFont.widthOfTextAtSize(subtitle, 14);
    page.drawText(subtitle, {
        x: (width - subtitleWidth) / 2,
        y: height - 160,
        size: 14,
        font: bodyFont,
        color: rgb(0.4, 0.4, 0.4),
    });

    // ─── Student Name ────────────────────────────
    const nameWidth = titleFont.widthOfTextAtSize(data.studentName, 32);
    page.drawText(data.studentName, {
        x: (width - nameWidth) / 2,
        y: height - 210,
        size: 32,
        font: titleFont,
        color: rgb(0.1, 0.1, 0.1),
    });

    // Decorative line under name
    page.drawLine({
        start: { x: width / 2 - 150, y: height - 225 },
        end: { x: width / 2 + 150, y: height - 225 },
        color: rgb(0.055, 0.647, 0.914),
        thickness: 1,
    });

    // ─── Course Details ──────────────────────────
    const courseText = "has successfully completed the course";
    const courseTextWidth = bodyFont.widthOfTextAtSize(courseText, 14);
    page.drawText(courseText, {
        x: (width - courseTextWidth) / 2,
        y: height - 265,
        size: 14,
        font: bodyFont,
        color: rgb(0.4, 0.4, 0.4),
    });

    const courseTitleWidth = titleFont.widthOfTextAtSize(data.courseTitle, 22);
    page.drawText(data.courseTitle, {
        x: (width - courseTitleWidth) / 2,
        y: height - 300,
        size: 22,
        font: titleFont,
        color: rgb(0.1, 0.1, 0.1),
    });

    const scoreText = `with a score of ${data.score}%`;
    const scoreWidth = bodyFont.widthOfTextAtSize(scoreText, 14);
    page.drawText(scoreText, {
        x: (width - scoreWidth) / 2,
        y: height - 335,
        size: 14,
        font: bodyFont,
        color: rgb(0.4, 0.4, 0.4),
    });

    // ─── Date ────────────────────────────────────
    const dateStr = `Issued on ${data.issuedAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })}`;
    const dateWidth = bodyFont.widthOfTextAtSize(dateStr, 11);
    page.drawText(dateStr, {
        x: (width - dateWidth) / 2,
        y: height - 375,
        size: 11,
        font: bodyFont,
        color: rgb(0.5, 0.5, 0.5),
    });

    // ─── QR Code ─────────────────────────────────
    const qrDataUrl = await QRCode.toDataURL(data.verificationUrl, {
        width: 100,
        margin: 1,
        color: {
            dark: "#0ea5e9",
            light: "#00000000",
        },
    });

    // Convert data URL to bytes
    const qrBase64 = qrDataUrl.split(",")[1];
    const qrBytes = Uint8Array.from(atob(qrBase64), (c) => c.charCodeAt(0));
    const qrImage = await doc.embedPng(qrBytes);

    page.drawImage(qrImage, {
        x: width - 140,
        y: 40,
        width: 80,
        height: 80,
    });

    // QR label
    const qrLabel = "Scan to verify";
    const qrLabelWidth = bodyFont.widthOfTextAtSize(qrLabel, 8);
    page.drawText(qrLabel, {
        x: width - 140 + (80 - qrLabelWidth) / 2,
        y: 32,
        size: 8,
        font: bodyFont,
        color: rgb(0.5, 0.5, 0.5),
    });

    // ─── Certificate ID ──────────────────────────
    const idText = `Certificate ID: ${data.certificateId}`;
    page.drawText(idText, {
        x: 50,
        y: 50,
        size: 8,
        font: bodyFont,
        color: rgb(0.6, 0.6, 0.6),
    });

    // ─── Powered by ──────────────────────────────
    const footer = "Lite LMS — Offline Learning Management System";
    const footerWidth = bodyFont.widthOfTextAtSize(footer, 9);
    page.drawText(footer, {
        x: (width - footerWidth) / 2,
        y: 50,
        size: 9,
        font: bodyFont,
        color: rgb(0.6, 0.6, 0.6),
    });

    return doc.save();
}
