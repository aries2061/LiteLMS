import Link from "next/link";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// Types — will be replaced with Prisma types
interface Section {
    id: string;
    title: string;
    contentType: "IMAGE" | "PDF" | "VIDEO";
    order: number;
    isCompleted: boolean;
    isLocked: boolean;
}

interface Module {
    id: string;
    title: string;
    order: number;
    sections: Section[];
    isLocked: boolean;
}

interface CourseDetail {
    id: string;
    title: string;
    description: string;
    passingGrade: number;
    modules: Module[];
    assessmentUnlocked: boolean;
}

// Icons for content types
function ContentTypeIcon({ type }: { type: Section["contentType"] }) {
    switch (type) {
        case "IMAGE":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
            );
        case "PDF":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>
            );
        case "VIDEO":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg>
            );
    }
}

export default async function CourseDetailPage({
    params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const { courseId } = await params;

    // Placeholder — will fetch from MySQL + MongoDB for progress
    // Cast to avoid TypeScript narrowing to `never` after null check
    const course = (null as unknown) as CourseDetail | null;

    if (!course) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Course Not Found</h1>
                    <p className="text-sm text-muted-foreground">
                        Course ID: {courseId}
                    </p>
                </div>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <p className="text-sm text-muted-foreground">
                            This course doesn&apos;t exist or hasn&apos;t been created yet.
                        </p>
                        <Link href="/courses">
                            <Button variant="outline" className="mt-4">
                                ← Back to Courses
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const totalSections = course.modules.reduce(
        (sum, m) => sum + m.sections.length,
        0
    );
    const completedSections = course.modules.reduce(
        (sum, m) => sum + m.sections.filter((s) => s.isCompleted).length,
        0
    );
    const progress =
        totalSections > 0
            ? Math.round((completedSections / totalSections) * 100)
            : 0;

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Course header */}
            <div>
                <Link
                    href="/courses"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back to Courses
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-2">
                    {course.title}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {course.description}
                </p>
            </div>

            {/* Progress overview */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Progress</span>
                        <span className="text-sm text-muted-foreground">
                            {completedSections}/{totalSections} sections • {progress}%
                        </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </CardContent>
            </Card>

            {/* Modules accordion */}
            <Accordion type="multiple" className="space-y-2">
                {course.modules.map((module) => (
                    <AccordionItem
                        key={module.id}
                        value={module.id}
                        className="border rounded-lg px-4"
                    >
                        <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-3">
                                {module.isLocked ? (
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                    </div>
                                ) : (
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                        {module.order}
                                    </div>
                                )}
                                <div className="text-left">
                                    <p className="text-sm font-medium">{module.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {module.sections.length} sections
                                    </p>
                                </div>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-1 pb-2">
                                {module.sections.map((section) => (
                                    <div key={section.id}>
                                        {section.isLocked ? (
                                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground/60">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                                <span className="text-sm">{section.title}</span>
                                                <ContentTypeIcon type={section.contentType} />
                                            </div>
                                        ) : (
                                            <Link
                                                href={`/courses/${courseId}/sections/${section.id}`}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors"
                                            >
                                                {section.isCompleted ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                                                ) : (
                                                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                                                )}
                                                <span className="text-sm flex-1">{section.title}</span>
                                                <ContentTypeIcon type={section.contentType} />
                                            </Link>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>

            {/* Assessment section */}
            <Separator />
            <Card className={course.assessmentUnlocked ? "" : "opacity-60"}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Final Assessment</CardTitle>
                        <Badge variant={course.assessmentUnlocked ? "default" : "secondary"}>
                            {course.assessmentUnlocked ? "Unlocked" : "Locked"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                        {course.assessmentUnlocked
                            ? `Complete the assessment to earn your certificate. Passing grade: ${course.passingGrade}%`
                            : "Complete all modules to unlock the final assessment."}
                    </p>
                    {course.assessmentUnlocked && (
                        <Link href={`/courses/${courseId}/assessment`}>
                            <Button>Start Assessment</Button>
                        </Link>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
