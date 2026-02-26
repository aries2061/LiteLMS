"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAssessment, deleteAssessment, updateAssessment } from "@/actions/admin";

interface AssessmentDialogProps {
    courseId: string;
    existingAssessment?: {
        id: string;
        title: string;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AssessmentDialog({
    courseId,
    existingAssessment,
    open,
    onOpenChange,
}: AssessmentDialogProps) {
    const router = useRouter();
    const isEditing = !!existingAssessment;
    const [title, setTitle] = useState(existingAssessment?.title ?? "");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) return;
        setLoading(true);
        try {
            if (isEditing) {
                await updateAssessment(existingAssessment.id, { title }, courseId);
            } else {
                await createAssessment({ title, courseId });
            }
            onOpenChange(false);
            setTitle("");
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!existingAssessment) return;
        setLoading(true);
        try {
            await deleteAssessment(existingAssessment.id, courseId);
            onOpenChange(false);
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? "Edit Assessment" : "New Assessment"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="assessment-title">
                            Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="assessment-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Final Exam"
                        />
                    </div>
                </div>
                <DialogFooter className="flex items-center justify-between">
                    {isEditing && (
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDelete}
                            disabled={loading}
                        >
                            Delete
                        </Button>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading
                                ? "Saving..."
                                : isEditing
                                    ? "Save"
                                    : "Create Assessment"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
