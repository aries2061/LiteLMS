"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { ModuleDialog } from "@/components/admin/module-dialog";
import { SectionDialog } from "@/components/admin/section-dialog";
import { AssessmentDialog } from "@/components/admin/assessment-dialog";

// Types inferred from getCourse
interface SectionData {
    id: string;
    title: string;
    contentType: "IMAGE" | "PDF" | "VIDEO";
    contentUrl: string;
    order: number;
}

interface ModuleData {
    id: string;
    title: string;
    order: number;
    sections: SectionData[];
}

interface AssessmentData {
    id: string;
    title: string;
    _count: { questions: number };
}

interface CourseData {
    id: string;
    title: string;
    description: string;
    passingGrade: number;
    isPublished: boolean;
    modules: ModuleData[];
    assessments: AssessmentData[];
    _count: { enrollments: number };
}

// Content type icons
function ContentTypeIcon({ type }: { type: string }) {
    switch (type) {
        case "IMAGE":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
            );
        case "PDF":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>
            );
        case "VIDEO":
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><polygon points="6 3 20 12 6 21 6 3" /></svg>
            );
        default:
            return null;
    }
}

export function CourseDetailClient({ course }: { course: CourseData }) {
    // Module dialog state
    const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
    const [editingModule, setEditingModule] = useState<ModuleData | undefined>();

    // Section dialog state
    const [sectionDialogOpen, setSectionDialogOpen] = useState(false);
    const [sectionModuleId, setSectionModuleId] = useState("");
    const [sectionNextOrder, setSectionNextOrder] = useState(1);
    const [editingSection, setEditingSection] = useState<SectionData | undefined>();

    // Assessment dialog state
    const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
    const [editingAssessment, setEditingAssessment] = useState<
        AssessmentData | undefined
    >();

    const totalSections = course.modules.reduce(
        (sum, m) => sum + m.sections.length,
        0
    );
    const maxModuleOrder =
        course.modules.length > 0
            ? Math.max(...course.modules.map((m) => m.order))
            : 0;

    return (
        <>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <p className="text-xs text-muted-foreground">Modules</p>
                        <p className="text-xl font-bold">{course.modules.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <p className="text-xs text-muted-foreground">Sections</p>
                        <p className="text-xl font-bold">{totalSections}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <p className="text-xs text-muted-foreground">Enrolled</p>
                        <p className="text-xl font-bold">{course._count.enrollments}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-4">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge
                            variant={course.isPublished ? "default" : "secondary"}
                            className="mt-1"
                        >
                            {course.isPublished ? "Published" : "Draft"}
                        </Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Modules */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Modules & Sections</CardTitle>
                    <Button
                        size="sm"
                        onClick={() => {
                            setEditingModule(undefined);
                            setModuleDialogOpen(true);
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        Add Module
                    </Button>
                </CardHeader>
                <CardContent>
                    {course.modules.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <p className="text-sm">No modules yet</p>
                            <p className="text-xs mt-1">
                                Add modules to organize course content
                            </p>
                        </div>
                    ) : (
                        <Accordion type="multiple" className="space-y-2">
                            {course.modules.map((mod) => (
                                <AccordionItem
                                    key={mod.id}
                                    value={mod.id}
                                    className="border rounded-lg px-4"
                                >
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                                {mod.order}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-medium">{mod.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {mod.sections.length} section
                                                    {mod.sections.length !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-1 pb-2">
                                            {mod.sections.map((section) => (
                                                <div
                                                    key={section.id}
                                                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-muted-foreground w-5">
                                                            {section.order}.
                                                        </span>
                                                        <ContentTypeIcon type={section.contentType} />
                                                        <span className="text-sm">{section.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Badge
                                                            variant="secondary"
                                                            className="text-[10px] px-1.5"
                                                        >
                                                            {section.contentType}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 w-7 p-0"
                                                            onClick={() => {
                                                                setEditingSection(section);
                                                                setSectionModuleId(mod.id);
                                                                setSectionNextOrder(section.order);
                                                                setSectionDialogOpen(true);
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add section & Edit module buttons */}
                                            <div className="flex items-center gap-2 pt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-xs"
                                                    onClick={() => {
                                                        setEditingSection(undefined);
                                                        setSectionModuleId(mod.id);
                                                        setSectionNextOrder(
                                                            mod.sections.length > 0
                                                                ? Math.max(...mod.sections.map((s) => s.order)) + 1
                                                                : 1
                                                        );
                                                        setSectionDialogOpen(true);
                                                    }}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                                    Add Section
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-xs text-muted-foreground"
                                                    onClick={() => {
                                                        setEditingModule(mod);
                                                        setModuleDialogOpen(true);
                                                    }}
                                                >
                                                    Edit Module
                                                </Button>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>

            {/* Assessments */}
            <Separator />
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">Assessments</CardTitle>
                    <Button
                        size="sm"
                        onClick={() => {
                            setEditingAssessment(undefined);
                            setAssessmentDialogOpen(true);
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        New Assessment
                    </Button>
                </CardHeader>
                <CardContent>
                    {course.assessments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <p className="text-sm">No assessments yet</p>
                            <p className="text-xs mt-1">
                                Create an assessment with quiz questions
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {course.assessments.map((assessment) => (
                                <div
                                    key={assessment.id}
                                    className="flex items-center justify-between px-4 py-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-medium">{assessment.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {assessment._count.questions} question
                                            {assessment._count.questions !== 1 ? "s" : ""}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/admin/courses/${course.id}/assessments/${assessment.id}`}
                                        >
                                            <Button variant="outline" size="sm" className="text-xs">
                                                Manage Questions
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0"
                                            onClick={() => {
                                                setEditingAssessment(assessment);
                                                setAssessmentDialogOpen(true);
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <ModuleDialog
                courseId={course.id}
                nextOrder={maxModuleOrder + 1}
                existingModule={editingModule}
                open={moduleDialogOpen}
                onOpenChange={setModuleDialogOpen}
            />
            <SectionDialog
                moduleId={sectionModuleId}
                nextOrder={sectionNextOrder}
                existingSection={editingSection}
                open={sectionDialogOpen}
                onOpenChange={setSectionDialogOpen}
            />
            <AssessmentDialog
                courseId={course.id}
                existingAssessment={editingAssessment}
                open={assessmentDialogOpen}
                onOpenChange={setAssessmentDialogOpen}
            />
        </>
    );
}
