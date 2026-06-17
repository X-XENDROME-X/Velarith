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
      <main className="fixed inset-0 top-16 max-w-full overflow-y-auto overflow-x-hidden bg-background lg:left-20 lg:top-0">
        {/* Change start: keep dashboard content inside narrow mobile viewports */}
        <div className="w-full max-w-full min-w-0 overflow-x-clip px-3 py-5 pb-safe min-[380px]:px-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </div>
        {/* Change end: keep dashboard content inside narrow mobile viewports */}
      </main>
    </>
  );
}
