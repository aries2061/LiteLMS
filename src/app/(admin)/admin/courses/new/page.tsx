import Link from "next/link";
import { CourseForm } from "@/components/admin/course-form";

export default function NewCoursePage() {
    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <Link
                    href="/admin/courses"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back to Courses
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-2">
                    Create New Course
                </h1>
            </div>
            <CourseForm />
        </div>
    );
}
