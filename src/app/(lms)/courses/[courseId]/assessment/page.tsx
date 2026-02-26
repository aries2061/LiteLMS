"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface Question {
    id: string;
    type: "TRUE_FALSE" | "MULTIPLE_CHOICE" | "FILL_IN_BLANK";
    text: string;
    options: string[] | null;
}

interface AssessmentData {
    id: string;
    title: string;
    courseId: string;
    courseTitle: string;
    passingGrade: number;
    questions: Question[];
}

interface AssessmentResult {
    score: number;
    passed: boolean;
    total: number;
    correct: number;
}

// ──────────────────────────────────────────────
// Question Components
// ──────────────────────────────────────────────

function TrueFalseQuestion({
    question,
    answer,
    onAnswer,
}: {
    question: Question;
    answer: string;
    onAnswer: (val: string) => void;
}) {
    return (
        <div className="space-y-3">
            <p className="text-sm font-medium">{question.text}</p>
            <div className="flex gap-3">
                {["True", "False"].map((opt) => (
                    <Button
                        key={opt}
                        variant={answer === opt ? "default" : "outline"}
                        size="sm"
                        onClick={() => onAnswer(opt)}
                    >
                        {opt}
                    </Button>
                ))}
            </div>
        </div>
    );
}

function MultipleChoiceQuestion({
    question,
    answer,
    onAnswer,
}: {
    question: Question;
    answer: string;
    onAnswer: (val: string) => void;
}) {
    return (
        <div className="space-y-3">
            <p className="text-sm font-medium">{question.text}</p>
            <div className="space-y-2">
                {question.options?.map((opt, idx) => (
                    <button
                        key={idx}
                        onClick={() => onAnswer(opt)}
                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${answer === opt
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 hover:bg-accent"
                            }`}
                    >
                        <span className="font-medium mr-2">
                            {String.fromCharCode(65 + idx)}.
                        </span>
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );
}

function FillInBlankQuestion({
    question,
    answer,
    onAnswer,
}: {
    question: Question;
    answer: string;
    onAnswer: (val: string) => void;
}) {
    return (
        <div className="space-y-3">
            <p className="text-sm font-medium">{question.text}</p>
            <input
                type="text"
                value={answer}
                onChange={(e) => onAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
        </div>
    );
}

// ──────────────────────────────────────────────
// Assessment Page
// ──────────────────────────────────────────────

export default function AssessmentPage({
    params: _params,
}: {
    params: Promise<{ courseId: string }>;
}) {
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [result, setResult] = useState<AssessmentResult | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);

    // Placeholder — will fetch from MySQL
    // Using a function so TypeScript doesn't narrow to `never` after null check
    const assessment = (null as unknown) as AssessmentData | null;

    if (!assessment) {
        return (
            <div className="space-y-6 max-w-3xl">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <p className="text-sm text-muted-foreground">
                            No assessment available for this course yet.
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

    const question = assessment.questions[currentQuestion];
    const totalQuestions = assessment.questions.length;
    const answeredCount = Object.keys(answers).length;
    const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

    const handleAnswer = (questionId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        // Score — TODO: verify answers against server
        // For now, placeholder scoring
        const score = 0;
        const passed = score >= assessment.passingGrade;

        setResult({
            score,
            passed,
            total: totalQuestions,
            correct: 0,
        });

        // TODO: Write attempt to MongoDB
        // TODO: If passed, trigger certificate generation
    };

    if (result) {
        return (
            <div className="space-y-6 max-w-3xl">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            {result.passed ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></svg>
                            )}
                        </div>
                        <CardTitle className="text-xl">
                            {result.passed ? "Congratulations! 🎉" : "Keep Trying!"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <div className="flex justify-center gap-6 text-sm">
                            <div>
                                <p className="text-muted-foreground">Score</p>
                                <p className="text-2xl font-bold">{result.score}%</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Correct</p>
                                <p className="text-2xl font-bold">
                                    {result.correct}/{result.total}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Passing</p>
                                <p className="text-2xl font-bold">
                                    {assessment.passingGrade}%
                                </p>
                            </div>
                        </div>

                        <Badge variant={result.passed ? "default" : "secondary"}>
                            {result.passed ? "PASSED" : "FAILED"}
                        </Badge>

                        {result.passed && (
                            <div className="pt-4">
                                <Button>Download Certificate</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Header */}
            <div>
                <Link
                    href={`/courses/${assessment.courseId}`}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    ← Back to Course
                </Link>
                <h1 className="text-2xl font-bold tracking-tight mt-2">
                    {assessment.title}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {assessment.courseTitle} • Passing grade: {assessment.passingGrade}%
                </p>
            </div>

            {/* Progress */}
            <Card>
                <CardContent className="py-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">
                            Question {currentQuestion + 1} of {totalQuestions}
                        </span>
                        <span>{answeredCount} answered</span>
                    </div>
                    <Progress value={progressPercent} className="h-1.5" />
                </CardContent>
            </Card>

            {/* Question */}
            <Card>
                <CardContent className="py-6">
                    <Badge variant="secondary" className="mb-4 text-xs">
                        {question.type.replace("_", " ")}
                    </Badge>

                    {question.type === "TRUE_FALSE" && (
                        <TrueFalseQuestion
                            question={question}
                            answer={answers[question.id] || ""}
                            onAnswer={(val) => handleAnswer(question.id, val)}
                        />
                    )}
                    {question.type === "MULTIPLE_CHOICE" && (
                        <MultipleChoiceQuestion
                            question={question}
                            answer={answers[question.id] || ""}
                            onAnswer={(val) => handleAnswer(question.id, val)}
                        />
                    )}
                    {question.type === "FILL_IN_BLANK" && (
                        <FillInBlankQuestion
                            question={question}
                            answer={answers[question.id] || ""}
                            onAnswer={(val) => handleAnswer(question.id, val)}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    disabled={currentQuestion === 0}
                    onClick={() => setCurrentQuestion((p) => p - 1)}
                >
                    ← Previous
                </Button>

                {currentQuestion < totalQuestions - 1 ? (
                    <Button onClick={() => setCurrentQuestion((p) => p + 1)}>
                        Next →
                    </Button>
                ) : (
                    <Button
                        onClick={handleSubmit}
                        disabled={answeredCount < totalQuestions}
                    >
                        Submit Assessment
                    </Button>
                )}
            </div>
        </div>
    );
}
