import type { ReactNode } from "react";

export default function GodAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:gap-8 md:py-10">
        {children}
      </div>
    </div>
  );
}
