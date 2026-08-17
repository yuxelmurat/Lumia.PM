import { useTranslation } from "react-i18next";
import useGetAssetRevisions from "@/hooks/queries/asset-revision/use-get-asset-revisions";
import { cn } from "@/lib/cn";

type ApprovalStatus = "pending" | "approved" | "changes_requested";

function RevisionStatusBadge({ status }: { status: ApprovalStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-medium text-xs",
        status === "approved" &&
          "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        status === "pending" &&
          "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        status === "changes_requested" &&
          "bg-rose-500/15 text-rose-600 dark:text-rose-400",
      )}
    >
      {t(`assetPins:approval.badge.${status}`)}
    </span>
  );
}

type RevisionTimelineProps = {
  assetId: string;
};

export default function RevisionTimeline({ assetId }: RevisionTimelineProps) {
  const { t } = useTranslation();
  const { data: revisions = [] } = useGetAssetRevisions(assetId);

  if (revisions.length < 2) return null;

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-card/70 p-3">
      <span className="font-medium text-muted-foreground text-xs">
        {t("assetPins:revision.title", "Revision history")}
      </span>
      {revisions.map((revision) => (
        <div
          key={revision.id}
          className={cn(
            "flex items-center justify-between gap-2 text-xs",
            revision.id === assetId && "font-medium",
          )}
        >
          <span className="truncate">
            {t("assetPins:revision.revisionLabel", "Rev {{n}} — {{name}}", {
              n: revision.revisionNumber,
              name:
                revision.createdByUserName ||
                t("assetPins:revision.unknownUploader", "Unknown"),
            })}
          </span>
          <div className="flex shrink-0 items-center gap-1.5">
            {revision.id === assetId && (
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                {t("assetPins:revision.current", "Current")}
              </span>
            )}
            {revision.approvalStatus && (
              <RevisionStatusBadge status={revision.approvalStatus} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
