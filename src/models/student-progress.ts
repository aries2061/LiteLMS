import mongoose, { Schema, type Document, type Model } from "mongoose";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface ICompletedSection {
    sectionId: string;
    completedAt: Date;
}

export interface ICompletedModule {
    moduleId: string;
    completedAt: Date;
}

export interface IStudentProgress extends Document {
    userId: string;
    courseId: string;
    completedSections: ICompletedSection[];
    completedModules: ICompletedModule[];
    lastAccessedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

// ──────────────────────────────────────────────
// Schema
// ──────────────────────────────────────────────

const CompletedSectionSchema = new Schema<ICompletedSection>(
    {
        sectionId: { type: String, required: true },
        completedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const CompletedModuleSchema = new Schema<ICompletedModule>(
    {
        moduleId: { type: String, required: true },
        completedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const StudentProgressSchema = new Schema<IStudentProgress>(
    {
        userId: { type: String, required: true, index: true },
        courseId: { type: String, required: true, index: true },
        completedSections: { type: [CompletedSectionSchema], default: [] },
        completedModules: { type: [CompletedModuleSchema], default: [] },
        lastAccessedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
        collection: "student_progress",
    }
);

// Compound index for fast lookups
StudentProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// ──────────────────────────────────────────────
// Model
// ──────────────────────────────────────────────

export const StudentProgress: Model<IStudentProgress> =
    mongoose.models.StudentProgress ||
    mongoose.model<IStudentProgress>("StudentProgress", StudentProgressSchema);
