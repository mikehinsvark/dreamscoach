import { prospectMetrics, type ProspectMetrics } from "@shared/prospect";
import type { CSSProperties } from "react";

export function MetricEditor({ values, onChange, readOnly = false }: { values: ProspectMetrics; onChange?: (key: keyof ProspectMetrics, value: number) => void; readOnly?: boolean }) {
  return (
    <div className="app-metric-editor">
      {prospectMetrics.map((metric) => {
        const value = values[metric.key];
        const progress = (value / metric.max) * 100;
        return <div className="app-metric-row" key={metric.key} style={{ "--metric": metric.color, "--progress": `${progress}%` } as CSSProperties}>
          <div className="app-metric-name"><b>{metric.letter}</b><span><strong>{metric.shortLabel}</strong><small>{metric.label}</small></span></div>
          {readOnly ? <div className="app-metric-bar"><i style={{ width: `${progress}%` }} /></div> : <input aria-label={metric.label} type="range" min={0} max={metric.max} step={metric.step} value={value} onChange={(event) => onChange?.(metric.key, Number(event.target.value))} />}
          <output>{metric.key === "closedGcv" ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value) : `${value} ${metric.unit}`}</output>
        </div>;
      })}
    </div>
  );
}
