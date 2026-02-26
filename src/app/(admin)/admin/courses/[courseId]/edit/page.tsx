export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/actions/admin";
import { CourseForm } from "@/components/admin/course-form";

export default async function EditCoursePage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = await params;
    const course = await getCourse(courseId);

    if (!course || !course.isActive) {
        notFound();
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <Link
                    href={`/admin/courses/${courseId}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back to Course
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-2">Edit Course</h1>
            </div>
            <CourseForm
                course={{
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    passingGrade: course.passingGrade,
                    isPublished: course.isPublished,
                }}
            />
        </div>
    );
}
