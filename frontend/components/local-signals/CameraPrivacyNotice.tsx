import { ShieldCheck } from "lucide-react";

type Props = {
  className?: string;
  compact?: boolean;
};

export function CameraPrivacyNotice({ className = "", compact = false }: Props) {
  return (
    <div className={`rounded-2xl bg-emerald-50 p-4 text-sm font-medium leading-6 text-emerald-950 ring-1 ring-emerald-100 dark:bg-emerald-300/10 dark:text-emerald-50 dark:ring-emerald-200/15 ${className}`}>
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 shrink-0" size={18} />
        <p>
          {compact
            ? "Your camera video is processed locally in your browser. We do not record, upload, or store video/images."
            : "Your camera video is processed locally in your browser. We do not record, upload, or store video/images. Only optional numeric timing signals may be stored if you allow telemetry."}
        </p>
      </div>
    </div>
  );
}
