import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// This will be replaced with real data from Prisma
// For now we define the type and show a placeholder
interface CourseCard {
    id: string;
    title: string;
    description: string;
    moduleCount: number;
    progress: number; // 0–100
    isPublished: boolean;
}

// Placeholder data — will be fetched from MySQL in production
const placeholderCourses: CourseCard[] = [];

export default function CoursesPage() {
    const courses = placeholderCourses;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
                <p className="text-sm text-muted-foreground">
                    Browse and continue your enrolled courses
                </p>
            </div>

            {courses.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-muted-foreground"
                            >
                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium">No courses available</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Courses will appear here once an admin creates them
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course) => (
                        <Link key={course.id} href={`/courses/${course.id}`}>
                            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant={course.isPublished ? "default" : "secondary"}
                                            className="text-xs"
                                        >
                                            {course.isPublished ? "Published" : "Draft"}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {course.moduleCount} modules
                                        </span>
                                    </div>
                                    <CardTitle className="text-lg mt-2">{course.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                        {course.description}
                                    </p>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-muted-foreground">Progress</span>
                                            <span className="font-medium">{course.progress}%</span>
                                        </div>
                                        <Progress value={course.progress} className="h-1.5" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
