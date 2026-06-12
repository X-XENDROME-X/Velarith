import { Sidebar } from "@/components/layout/Sidebar";

export default function AssistantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="fixed inset-0 top-16 overflow-y-auto overflow-x-hidden bg-background lg:left-20 lg:top-0">
        <div className="h-full w-full min-w-0">
          {children}
        </div>
      </main>
    </>
  );
}
