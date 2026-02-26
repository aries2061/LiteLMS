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
import { createModule, deleteModule, updateModule } from "@/actions/admin";

interface ModuleDialogProps {
    courseId: string;
    nextOrder: number;
    existingModule?: {
        id: string;
        title: string;
        order: number;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ModuleDialog({
    courseId,
    nextOrder,
    existingModule,
    open,
    onOpenChange,
}: ModuleDialogProps) {
    const router = useRouter();
    const isEditing = !!existingModule;
    const [title, setTitle] = useState(existingModule?.title ?? "");
    const [order, setOrder] = useState(existingModule?.order ?? nextOrder);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) return;
        setLoading(true);
        try {
            if (isEditing) {
                await updateModule(existingModule.id, { title, order }, courseId);
            } else {
                await createModule({ title, order, courseId });
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
        if (!existingModule) return;
        setLoading(true);
        try {
            await deleteModule(existingModule.id, courseId);
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
                        {isEditing ? "Edit Module" : "Add Module"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="module-title">
                            Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="module-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Getting Started"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="module-order">Order</Label>
                        <Input
                            id="module-order"
                            type="number"
                            min={1}
                            value={order}
                            onChange={(e) => setOrder(Number(e.target.value))}
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
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? "Saving..." : isEditing ? "Save" : "Add Module"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
