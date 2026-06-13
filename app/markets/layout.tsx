import { Sidebar } from "@/components/layout/Sidebar";

export default function MarketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      <main className="fixed inset-0 top-16 overflow-y-auto overflow-x-hidden bg-background lg:left-20 lg:top-0">
        <div className="w-full min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </>
  );
}
