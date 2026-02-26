"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ──────────────────────────────────────────────
// Course Actions
// ──────────────────────────────────────────────

export async function getCourses() {
    return prisma.course.findMany({
        where: { isActive: true },
        include: {
            _count: { select: { modules: true, enrollments: true, assessments: true } },
        },
        orderBy: { createdAt: "desc" },
    });
}

export async function getCourse(id: string) {
    return prisma.course.findUnique({
        where: { id },
        include: {
            modules: {
                where: { isActive: true },
                orderBy: { order: "asc" },
                include: {
                    sections: {
                        where: { isActive: true },
                        orderBy: { order: "asc" },
                    },
                },
            },
            assessments: {
                where: { isActive: true },
                include: {
                    _count: { select: { questions: true } },
                },
            },
            _count: { select: { enrollments: true } },
        },
    });
}

export async function createCourse(data: {
    title: string;
    description: string;
    passingGrade: number;
    isPublished: boolean;
}) {
    const course = await prisma.course.create({ data });
    revalidatePath("/admin/courses");
    return course;
}

export async function updateCourse(
    id: string,
    data: {
        title?: string;
        description?: string;
        passingGrade?: number;
        isPublished?: boolean;
    }
) {
    const course = await prisma.course.update({ where: { id }, data });
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${id}`);
    return course;
}

export async function deleteCourse(id: string) {
    await prisma.course.update({
        where: { id },
        data: { isActive: false },
    });
    revalidatePath("/admin/courses");
}

// ──────────────────────────────────────────────
// Module Actions
// ──────────────────────────────────────────────

export async function createModule(data: {
    title: string;
    order: number;
    courseId: string;
}) {
    const mod = await prisma.module.create({ data });
    revalidatePath(`/admin/courses/${data.courseId}`);
    return mod;
}

export async function updateModule(
    id: string,
    data: { title?: string; order?: number },
    courseId: string
) {
    const mod = await prisma.module.update({ where: { id }, data });
    revalidatePath(`/admin/courses/${courseId}`);
    return mod;
}

export async function deleteModule(id: string, courseId: string) {
    await prisma.module.update({
        where: { id },
        data: { isActive: false },
    });
    revalidatePath(`/admin/courses/${courseId}`);
}

// ──────────────────────────────────────────────
// Section Actions
// ──────────────────────────────────────────────

export async function createSection(data: {
    title: string;
    contentType: "IMAGE" | "PDF" | "VIDEO";
    contentUrl: string;
    order: number;
    moduleId: string;
}) {
    const section = await prisma.section.create({ data });
    revalidatePath("/admin/courses");
    return section;
}

export async function updateSection(
    id: string,
    data: {
        title?: string;
        contentType?: "IMAGE" | "PDF" | "VIDEO";
        contentUrl?: string;
        order?: number;
    }
) {
    const section = await prisma.section.update({ where: { id }, data });
    revalidatePath("/admin/courses");
    return section;
}

export async function deleteSection(id: string) {
    await prisma.section.update({
        where: { id },
        data: { isActive: false },
    });
    revalidatePath("/admin/courses");
}

// ──────────────────────────────────────────────
// Assessment Actions
// ──────────────────────────────────────────────

export async function getAssessment(id: string) {
    return prisma.assessment.findUnique({
        where: { id },
        include: {
            questions: {
                where: { isActive: true },
                orderBy: { order: "asc" },
            },
            course: { select: { title: true } },
        },
    });
}

export async function createAssessment(data: {
    title: string;
    courseId: string;
}) {
    const assessment = await prisma.assessment.create({ data });
    revalidatePath(`/admin/courses/${data.courseId}`);
    return assessment;
}

export async function updateAssessment(
    id: string,
    data: { title?: string },
    courseId: string
) {
    const assessment = await prisma.assessment.update({ where: { id }, data });
    revalidatePath(`/admin/courses/${courseId}`);
    return assessment;
}

export async function deleteAssessment(id: string, courseId: string) {
    await prisma.assessment.update({
        where: { id },
        data: { isActive: false },
    });
    revalidatePath(`/admin/courses/${courseId}`);
}

// ──────────────────────────────────────────────
// Question Actions
// ──────────────────────────────────────────────

export async function createQuestion(data: {
    type: "TRUE_FALSE" | "MULTIPLE_CHOICE" | "FILL_IN_BLANK";
    text: string;
    options?: string[];
    answer: string;
    order: number;
    assessmentId: string;
}) {
    const { options, ...rest } = data;
    const question = await prisma.question.create({
        data: {
            ...rest,
            options: options ?? undefined,
        },
    });
    revalidatePath("/admin/courses");
    return question;
}

export async function deleteQuestion(id: string) {
    await prisma.question.update({
        where: { id },
        data: { isActive: false },
    });
    revalidatePath("/admin/courses");
}
