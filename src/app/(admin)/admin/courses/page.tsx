export const dynamic = "force-dynamic";

import Link from "next/link";
import { getCourses } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default async function AdminCoursesPage() {
    const courses = await getCourses();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage all courses, modules, and content
                    </p>
                </div>
                <Link href="/admin/courses/new">
                    <Button>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                        New Course
                    </Button>
                </Link>
            </div>

            {courses.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" /></svg>
                        </div>
                        <p className="text-sm font-medium">No courses yet</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Create your first course to get started
                        </p>
                        <Link href="/admin/courses/new">
                            <Button variant="outline" size="sm" className="mt-4">
                                Create Course
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead className="w-[100px] text-center">Modules</TableHead>
                                <TableHead className="w-[100px] text-center">Enrolled</TableHead>
                                <TableHead className="w-[100px] text-center">Assessments</TableHead>
                                <TableHead className="w-[100px] text-center">Pass %</TableHead>
                                <TableHead className="w-[100px] text-center">Status</TableHead>
                                <TableHead className="w-[80px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {courses.map((course) => (
                                <TableRow key={course.id}>
                                    <TableCell>
                                        <Link
                                            href={`/admin/courses/${course.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {course.title}
                                        </Link>
                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                            {course.description}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {course._count.modules}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {course._count.enrollments}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {course._count.assessments}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {course.passingGrade}%
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge
                                            variant={course.isPublished ? "default" : "secondary"}
                                            className="text-xs"
                                        >
                                            {course.isPublished ? "Published" : "Draft"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/admin/courses/${course.id}`}>
                                            <Button variant="ghost" size="sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            )}
        </div>
    );
}
