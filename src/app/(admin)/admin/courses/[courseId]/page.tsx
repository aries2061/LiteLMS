export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourse } from "@/actions/admin";
import { CourseDetailClient } from "@/components/admin/course-detail-client";

export default async function CourseDetailPage({
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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link
                        href="/admin/courses"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        ← Back to Courses
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight mt-2">
                        {course.title}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {course.description}
                    </p>
                </div>
                <Link href={`/admin/courses/${courseId}/edit`}>
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-colors cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                        Edit Course
                    </span>
                </Link>
            </div>

            <CourseDetailClient course={course} />
        </div>
    );
}
