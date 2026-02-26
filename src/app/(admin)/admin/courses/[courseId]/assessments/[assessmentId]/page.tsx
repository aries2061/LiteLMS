export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getAssessment } from "@/actions/admin";
import { QuestionsClient } from "@/components/admin/questions-client";

export default async function AssessmentQuestionsPage({
    params,
}: {
    params: Promise<{ courseId: string; assessmentId: string }>;
}) {
    const { courseId, assessmentId } = await params;
    const assessment = await getAssessment(assessmentId);

    if (!assessment || !assessment.isActive) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href={`/admin/courses/${courseId}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back to Course
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-2">
                    {assessment.title}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {assessment.course.title} • {assessment.questions.length} question
                    {assessment.questions.length !== 1 ? "s" : ""}
                </p>
            </div>

            <QuestionsClient
                assessmentId={assessmentId}
                courseId={courseId}
                questions={assessment.questions.map((q) => ({
                    id: q.id,
                    type: q.type,
                    text: q.text,
                    options: q.options as string[] | null,
                    answer: q.answer,
                    order: q.order,
                }))}
            />
        </div>
    );
}
