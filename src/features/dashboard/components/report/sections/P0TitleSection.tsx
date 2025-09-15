"use client";

import React from "react";
import type { ReportMeta } from "../types";

export function P0TitleSection({ meta }: { meta: ReportMeta }) {
  return (
    <section data-section-id="p0_title">
      <h1 className="text-2xl font-bold">{meta.title}</h1>
      <div className="mt-3 text-sm space-y-1">
        <div><span className="font-medium">Subject:</span> {meta.subject}</div>
        <div><span className="font-medium">Sessions used:</span> consolidated variants provided by user</div>
        <div><span className="font-medium">Generated:</span> {meta.generatedAt} ({meta.timezone})</div>
      </div>
      <hr className="my-4" />
    </section>
  );
}

