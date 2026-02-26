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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createSection, deleteSection, updateSection } from "@/actions/admin";

interface SectionDialogProps {
    moduleId: string;
    nextOrder: number;
    existingSection?: {
        id: string;
        title: string;
        contentType: "IMAGE" | "PDF" | "VIDEO";
        contentUrl: string;
        order: number;
    };
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SectionDialog({
    moduleId,
    nextOrder,
    existingSection,
    open,
    onOpenChange,
}: SectionDialogProps) {
    const router = useRouter();
    const isEditing = !!existingSection;
    const [title, setTitle] = useState(existingSection?.title ?? "");
    const [contentType, setContentType] = useState<"IMAGE" | "PDF" | "VIDEO">(
        existingSection?.contentType ?? "PDF"
    );
    const [contentUrl, setContentUrl] = useState(
        existingSection?.contentUrl ?? ""
    );
    const [order, setOrder] = useState(existingSection?.order ?? nextOrder);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim() || !contentUrl.trim()) return;
        setLoading(true);
        try {
            if (isEditing) {
                await updateSection(existingSection.id, {
                    title,
                    contentType,
                    contentUrl,
                    order,
                });
            } else {
                await createSection({
                    title,
                    contentType,
                    contentUrl,
                    order,
                    moduleId,
                });
            }
            onOpenChange(false);
            setTitle("");
            setContentUrl("");
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!existingSection) return;
        setLoading(true);
        try {
            await deleteSection(existingSection.id);
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
                        {isEditing ? "Edit Section" : "Add Section"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="section-title">
                            Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="section-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Introduction Video"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Content Type</Label>
                        <Select
                            value={contentType}
                            onValueChange={(v) =>
                                setContentType(v as "IMAGE" | "PDF" | "VIDEO")
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="IMAGE">Image</SelectItem>
                                <SelectItem value="PDF">PDF</SelectItem>
                                <SelectItem value="VIDEO">Video</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section-url">
                            Content URL / Path <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="section-url"
                            value={contentUrl}
                            onChange={(e) => setContentUrl(e.target.value)}
                            placeholder="e.g., /uploads/course-1/intro.mp4"
                        />
                        <p className="text-xs text-muted-foreground">
                            Path to local file on the server
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="section-order">Order</Label>
                        <Input
                            id="section-order"
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
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? "Saving..." : isEditing ? "Save" : "Add Section"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
