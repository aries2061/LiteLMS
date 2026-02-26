"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { createCourse, updateCourse } from "@/actions/admin";

interface CourseFormProps {
    course?: {
        id: string;
        title: string;
        description: string;
        passingGrade: number;
        isPublished: boolean;
    };
}

export function CourseForm({ course }: CourseFormProps) {
    const router = useRouter();
    const isEditing = !!course;

    const [title, setTitle] = useState(course?.title ?? "");
    const [description, setDescription] = useState(course?.description ?? "");
    const [passingGrade, setPassingGrade] = useState(course?.passingGrade ?? 70);
    const [isPublished, setIsPublished] = useState(course?.isPublished ?? false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim()) {
            setError("Title is required");
            return;
        }
        if (!description.trim()) {
            setError("Description is required");
            return;
        }

        setLoading(true);
        try {
            if (isEditing) {
                await updateCourse(course.id, {
                    title,
                    description,
                    passingGrade,
                    isPublished,
                });
                router.push(`/admin/courses/${course.id}`);
            } else {
                const newCourse = await createCourse({
                    title,
                    description,
                    passingGrade,
                    isPublished,
                });
                router.push(`/admin/courses/${newCourse.id}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{isEditing ? "Edit Course" : "New Course"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">
                            Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Introduction to Web Development"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe this course..."
                            rows={4}
                        />
                    </div>

                    {/* Passing Grade */}
                    <div className="space-y-2">
                        <Label htmlFor="passingGrade">Passing Grade (%)</Label>
                        <Input
                            id="passingGrade"
                            type="number"
                            min={0}
                            max={100}
                            value={passingGrade}
                            onChange={(e) => setPassingGrade(Number(e.target.value))}
                        />
                        <p className="text-xs text-muted-foreground">
                            Students must achieve this score to pass the final assessment
                        </p>
                    </div>

                    {/* Published */}
                    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                        <div>
                            <Label htmlFor="published" className="text-sm font-medium">
                                Published
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Make this course visible to students
                            </p>
                        </div>
                        <Switch
                            id="published"
                            checked={isPublished}
                            onCheckedChange={setIsPublished}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <Button type="submit" disabled={loading}>
                            {loading
                                ? "Saving..."
                                : isEditing
                                    ? "Save Changes"
                                    : "Create Course"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.back()}
                        >
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
