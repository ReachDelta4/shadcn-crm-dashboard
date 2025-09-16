"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { reportSans } from "./fonts";

type Props = {
	sectionId: string;
	header?: React.ReactNode;
	children: React.ReactNode;
	textSizeClass?: string;
	pageNumber?: number;
	pageCount?: number;
	showPrintFooter?: boolean;
	className?: string;
};

export function ReportPageCard({ sectionId, header, children, textSizeClass, pageNumber, pageCount, showPrintFooter, className }: Props) {
	return (
		<section data-section-id={sectionId} id={sectionId} className={`scroll-mt-24 ${className || ""}`}>
			<Card className={`mx-auto w-full max-w-[794px] print:w-[794px] print:shadow-none print:border-0 ${reportSans.className}`}>
				{header ? (
					<CardHeader className="p-6 pb-2 sticky top-0 z-10 bg-background/80 backdrop-blur print:static print:bg-transparent">
						{header}
					</CardHeader>
				) : null}
				<CardContent className={`p-6 pt-4 space-y-5 leading-relaxed ${textSizeClass || "text-[16px]"}`} style={{ minHeight: "1122px" }}>
					{children}
					{showPrintFooter ? (
						<div className="hidden print:flex justify-end text-xs text-muted-foreground pt-4">
							Page <span className="tabular-nums ml-1">{pageNumber ?? "-"}</span> of <span className="tabular-nums ml-1">{pageCount ?? "-"}</span>
						</div>
					) : null}
				</CardContent>
			</Card>
		</section>
	);
}
