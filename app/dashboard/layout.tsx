import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />
      {/*
        Use fixed positioning (not flex-1) so main width = viewport width
        regardless of any flex/compositing quirks from the fixed sidebar.
        Mobile:  top-16 (below 64px header), full width
        Desktop: top-0, left-20 (right of 80px sidebar)
      */}
      <main className="fixed inset-0 top-16 overflow-y-auto overflow-x-hidden bg-background lg:left-20 lg:top-0">
        <div className="w-full min-w-0 px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 pb-safe">
          {children}
        </div>
      </main>
    </>
  );
}
