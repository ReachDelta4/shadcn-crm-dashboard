"use client";

import React from "react";

export function A4Card({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="a4-page">
      {children}
      <div className="mt-6 pt-3 text-xs text-muted-foreground border-t">
        {footer || <span>Generated report</span>}
      </div>
    </div>
  );
}

