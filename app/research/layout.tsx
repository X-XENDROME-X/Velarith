import { Sidebar } from "@/components/layout/Sidebar";

export default function ResearchLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex h-screen overflow-hidden">
			<Sidebar />
			{/* Responsive layout:
					- Mobile/Tablet: Full width with top padding for hamburger button (64px) + ticker tape (~40px) = ~104px total
					- Desktop: Left margin for collapsed sidebar (80px) + top padding for ticker tape only (~52px) */}
		<main className="flex-1 overflow-y-auto overflow-x-hidden bg-background pt-[104px] transition-all duration-500 lg:ml-20 lg:pt-[52px]">
			<div className="w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
		</main>
		</div>
	);
}
