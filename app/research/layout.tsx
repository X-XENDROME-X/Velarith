import { Sidebar } from "@/components/layout/Sidebar";

export default function ResearchLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<>
			<Sidebar />
			{/*
        Mobile:  top-[104px] = 64px header + ~40px ticker tape
        Desktop: top-[52px]  = ticker tape only (sidebar handles left offset)
      */}
			<main className="fixed inset-0 top-[104px] overflow-y-auto overflow-x-hidden bg-background lg:left-20 lg:top-[52px]">
				<div className="w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
			</main>
		</>
	);
}
