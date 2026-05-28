"use client";

import { ImprovementTrendChart } from "./ImprovementTrendChart";

export function SkillGrowthChart({ data }: { data: Array<Record<string, string | number>> }) {
  return <ImprovementTrendChart data={data} />;
}
