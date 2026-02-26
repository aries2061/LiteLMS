"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { createQuestion, deleteQuestion } from "@/actions/admin";

interface QuestionData {
    id: string;
    type: "TRUE_FALSE" | "MULTIPLE_CHOICE" | "FILL_IN_BLANK";
    text: string;
    options: string[] | null;
    answer: string;
    order: number;
}

interface QuestionsClientProps {
    assessmentId: string;
    courseId: string;
    questions: QuestionData[];
}

const typeLabels = {
    TRUE_FALSE: "True / False",
    MULTIPLE_CHOICE: "Multiple Choice",
    FILL_IN_BLANK: "Fill in the Blank",
};

export function QuestionsClient({
    assessmentId,
    courseId,
    questions,
}: QuestionsClientProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Add question dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [qType, setQType] = useState<QuestionData["type"]>("MULTIPLE_CHOICE");
    const [qText, setQText] = useState("");
    const [qAnswer, setQAnswer] = useState("");
    const [qOptions, setQOptions] = useState(["", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [csvUploading, setCsvUploading] = useState(false);

    const handleAddQuestion = async () => {
        if (!qText.trim() || !qAnswer.trim()) return;
        setLoading(true);
        try {
            await createQuestion({
                type: qType,
                text: qText,
                answer: qAnswer,
                options:
                    qType === "MULTIPLE_CHOICE"
                        ? qOptions.filter(Boolean)
                        : undefined,
                order: questions.length + 1,
                assessmentId,
            });
            setDialogOpen(false);
            resetForm();
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuestion = async (id: string) => {
        await deleteQuestion(id);
        router.refresh();
    };

    const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCsvUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("assessmentId", assessmentId);

            const res = await fetch("/api/assessments/upload-csv", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Upload failed");
                return;
            }

            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setCsvUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const resetForm = () => {
        setQType("MULTIPLE_CHOICE");
        setQText("");
        setQAnswer("");
        setQOptions(["", "", "", ""]);
    };

    return (
        <>
            {/* Action bar */}
            <div className="flex items-center gap-3">
                <Button
                    onClick={() => {
                        resetForm();
                        setDialogOpen(true);
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    Add Question
                </Button>

                <div className="relative">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleCSVUpload}
                        className="hidden"
                        id="csv-upload"
                    />
                    <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={csvUploading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                        {csvUploading ? "Uploading..." : "Import CSV"}
                    </Button>
                </div>
            </div>

            {/* Questions list */}
            {questions.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></svg>
                        </div>
                        <p className="text-sm font-medium">No questions yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Add questions manually or import from a CSV file
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {questions.map((q, idx) => (
                        <Card key={q.id}>
                            <CardContent className="py-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs text-muted-foreground font-mono">
                                                Q{idx + 1}
                                            </span>
                                            <Badge variant="secondary" className="text-[10px]">
                                                {typeLabels[q.type]}
                                            </Badge>
                                        </div>
                                        <p className="text-sm font-medium">{q.text}</p>

                                        {q.type === "MULTIPLE_CHOICE" && q.options && (
                                            <div className="mt-2 space-y-1">
                                                {(q.options as string[]).map((opt, i) => (
                                                    <div
                                                        key={i}
                                                        className={`text-xs px-2 py-1 rounded ${opt === q.answer
                                                                ? "bg-green-500/10 text-green-600 font-medium"
                                                                : "text-muted-foreground"
                                                            }`}
                                                    >
                                                        {String.fromCharCode(65 + i)}. {opt}
                                                        {opt === q.answer && " ✓"}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {q.type === "TRUE_FALSE" && (
                                            <p className="mt-1 text-xs text-green-600 font-medium">
                                                Answer: {q.answer}
                                            </p>
                                        )}

                                        {q.type === "FILL_IN_BLANK" && (
                                            <p className="mt-1 text-xs text-green-600 font-medium">
                                                Answer: {q.answer}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDeleteQuestion(q.id)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Question Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Add Question</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Type */}
                        <div className="space-y-2">
                            <Label>Question Type</Label>
                            <Select
                                value={qType}
                                onValueChange={(v) =>
                                    setQType(v as QuestionData["type"])
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TRUE_FALSE">True / False</SelectItem>
                                    <SelectItem value="MULTIPLE_CHOICE">
                                        Multiple Choice
                                    </SelectItem>
                                    <SelectItem value="FILL_IN_BLANK">
                                        Fill in the Blank
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Question text */}
                        <div className="space-y-2">
                            <Label htmlFor="q-text">
                                Question <span className="text-destructive">*</span>
                            </Label>
                            <Textarea
                                id="q-text"
                                value={qText}
                                onChange={(e) => setQText(e.target.value)}
                                placeholder="Enter the question..."
                                rows={3}
                            />
                        </div>

                        {/* MCQ Options */}
                        {qType === "MULTIPLE_CHOICE" && (
                            <div className="space-y-2">
                                <Label>Options</Label>
                                {qOptions.map((opt, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground w-5">
                                            {String.fromCharCode(65 + i)}.
                                        </span>
                                        <Input
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...qOptions];
                                                newOpts[i] = e.target.value;
                                                setQOptions(newOpts);
                                            }}
                                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <Separator />

                        {/* Answer */}
                        <div className="space-y-2">
                            <Label htmlFor="q-answer">
                                Correct Answer <span className="text-destructive">*</span>
                            </Label>
                            {qType === "TRUE_FALSE" ? (
                                <Select value={qAnswer} onValueChange={setQAnswer}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select answer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="True">True</SelectItem>
                                        <SelectItem value="False">False</SelectItem>
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id="q-answer"
                                    value={qAnswer}
                                    onChange={(e) => setQAnswer(e.target.value)}
                                    placeholder={
                                        qType === "MULTIPLE_CHOICE"
                                            ? "Enter the correct option text"
                                            : "Enter the correct answer"
                                    }
                                />
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddQuestion} disabled={loading}>
                            {loading ? "Adding..." : "Add Question"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
