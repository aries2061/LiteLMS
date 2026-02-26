import { Sidebar } from "@/components/lms/sidebar";
import { Header } from "@/components/lms/header";

export default function LMSLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background">
            <Sidebar />
            <div className="md:pl-64">
                <Header />
                <main className="p-6">{children}</main>
            </div>
        </div>
    );
}
