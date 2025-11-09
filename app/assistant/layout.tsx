import { Sidebar } from "@/components/layout/Sidebar";

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* Responsive layout:
          - Mobile/Tablet: Full width with top padding for hamburger button
          - Desktop: Left margin for collapsed sidebar (80px) */}
  <main className="flex-1 overflow-y-auto pt-16 lg:pt-0 lg:ml-20 bg-background transition-all duration-500">
        <div className="h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
