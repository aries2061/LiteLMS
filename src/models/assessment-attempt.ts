import mongoose, { Schema, type Document, type Model } from "mongoose";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface IAnswer {
    questionId: string;
    answer: string;
}

export interface IAssessmentAttempt extends Document {
    userId: string;
    assessmentId: string;
    courseId: string;
    answers: IAnswer[];
    score: number;
    passed: boolean;
    attemptedAt: Date;
}

// ──────────────────────────────────────────────
// Schema
// ──────────────────────────────────────────────

const AnswerSchema = new Schema<IAnswer>(
    {
        questionId: { type: String, required: true },
        answer: { type: String, required: true },
    },
    { _id: false }
);

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>(
    {
        userId: { type: String, required: true, index: true },
        assessmentId: { type: String, required: true, index: true },
        courseId: { type: String, required: true, index: true },
        answers: { type: [AnswerSchema], required: true },
        score: { type: Number, required: true },
        passed: { type: Boolean, required: true },
        attemptedAt: { type: Date, default: Date.now },
    },
    {
        collection: "assessment_attempts",
    }
);

// Index for finding user attempts on a specific assessment
AssessmentAttemptSchema.index({ userId: 1, assessmentId: 1 });

// ──────────────────────────────────────────────
// Model
// ──────────────────────────────────────────────

export const AssessmentAttempt: Model<IAssessmentAttempt> =
    mongoose.models.AssessmentAttempt ||
    mongoose.model<IAssessmentAttempt>(
        "AssessmentAttempt",
        AssessmentAttemptSchema
    );
