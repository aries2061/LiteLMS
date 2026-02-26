import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar />
            <div className="md:pl-60">
                <header className="sticky top-0 z-40 flex items-center h-14 px-6 border-b border-border bg-card/80 backdrop-blur-sm">
                    <h2 className="text-sm font-medium text-foreground">
                        Administration
                    </h2>
                </header>
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
