import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import PageTitle from "@/components/page-title";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import useUpdateWorkspace from "@/hooks/mutations/workspace/use-update-workspace";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { toast } from "@/lib/toast";
import {
  getWorkspaceBooleanProfileField,
  getWorkspaceNumberProfileField,
  getWorkspaceProfileField,
} from "@/lib/workspace-profile-fields";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings/workspace/watermark",
)({
  component: RouteComponent,
});

const WATERMARK_STYLES = ["corner", "center", "tile"] as const;
const WATERMARK_CORNERS = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;

type WatermarkStyle = (typeof WATERMARK_STYLES)[number];
type WatermarkCorner = (typeof WATERMARK_CORNERS)[number];

type WatermarkFormValues = {
  watermarkEnabled: boolean;
  watermarkStyle: WatermarkStyle;
  watermarkImageUrl?: string;
  watermarkCorner: WatermarkCorner;
  watermarkSizePercent: number;
};

type NormalizedWatermarkValues = {
  watermarkEnabled: boolean;
  watermarkStyle: WatermarkStyle;
  watermarkImageUrl: string;
  watermarkCorner: WatermarkCorner;
  watermarkSizePercent: number;
};

function normalizeWatermarkValues(
  data: WatermarkFormValues,
): NormalizedWatermarkValues {
  return {
    watermarkEnabled: data.watermarkEnabled,
    watermarkStyle: data.watermarkStyle,
    watermarkImageUrl: (data.watermarkImageUrl ?? "").trim(),
    watermarkCorner: data.watermarkCorner,
    watermarkSizePercent: data.watermarkSizePercent,
  };
}

function isWatermarkStyle(value: string): value is WatermarkStyle {
  return (WATERMARK_STYLES as readonly string[]).includes(value);
}

function isWatermarkCorner(value: string): value is WatermarkCorner {
  return (WATERMARK_CORNERS as readonly string[]).includes(value);
}

function RouteComponent() {
  const { t } = useTranslation();
  const { data: workspace } = useActiveWorkspace();
  const { mutateAsync: updateWorkspace } = useUpdateWorkspace();
  const queryClient = useQueryClient();
  const { canManageWorkspace } = useWorkspacePermission();
  const canEdit = canManageWorkspace();

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const queuedSaveRef = useRef<WatermarkFormValues | null>(null);
  const lastSavedRef = useRef<NormalizedWatermarkValues | null>(null);

  const watermarkSchema = useMemo(
    () =>
      z.object({
        watermarkEnabled: z.boolean(),
        watermarkStyle: z.enum(WATERMARK_STYLES),
        watermarkImageUrl: z
          .string()
          .optional()
          .refine(
            (value) => !value || z.url().safeParse(value).success,
            t("settings:workspaceWatermark.validation.imageUrlInvalid"),
          ),
        watermarkCorner: z.enum(WATERMARK_CORNERS),
        watermarkSizePercent: z
          .number()
          .min(5, t("settings:workspaceWatermark.validation.sizeRange"))
          .max(80, t("settings:workspaceWatermark.validation.sizeRange")),
      }),
    [t],
  );

  const rawStyle = getWorkspaceProfileField(workspace, "watermarkStyle");
  const rawCorner = getWorkspaceProfileField(workspace, "watermarkCorner");
  const workspaceEnabled = getWorkspaceBooleanProfileField(
    workspace,
    "watermarkEnabled",
  );
  const workspaceStyle: WatermarkStyle = isWatermarkStyle(rawStyle)
    ? rawStyle
    : "corner";
  const workspaceImageUrl = getWorkspaceProfileField(
    workspace,
    "watermarkImageUrl",
  );
  const workspaceCorner: WatermarkCorner = isWatermarkCorner(rawCorner)
    ? rawCorner
    : "bottom-right";
  const workspaceSizePercent =
    getWorkspaceNumberProfileField(workspace, "watermarkSizePercent") ?? 20;

  const watermarkForm = useForm<WatermarkFormValues>({
    resolver: standardSchemaResolver(watermarkSchema),
    mode: "onChange",
    defaultValues: {
      watermarkEnabled: workspaceEnabled,
      watermarkStyle: workspaceStyle,
      watermarkImageUrl: workspaceImageUrl,
      watermarkCorner: workspaceCorner,
      watermarkSizePercent: workspaceSizePercent,
    },
  });

  useEffect(() => {
    if (!workspace) return;

    const nextValues: WatermarkFormValues = {
      watermarkEnabled: workspaceEnabled,
      watermarkStyle: workspaceStyle,
      watermarkImageUrl: workspaceImageUrl,
      watermarkCorner: workspaceCorner,
      watermarkSizePercent: workspaceSizePercent,
    };
    lastSavedRef.current = normalizeWatermarkValues(nextValues);

    if (!watermarkForm.formState.isDirty) {
      watermarkForm.reset(nextValues);
    }
  }, [
    workspace,
    workspaceEnabled,
    workspaceStyle,
    workspaceImageUrl,
    workspaceCorner,
    workspaceSizePercent,
    watermarkForm,
  ]);

  const saveWatermark = useCallback(
    async (data: WatermarkFormValues) => {
      if (!workspace?.id) return;

      const normalizedData = normalizeWatermarkValues(data);
      const enabledChanged =
        lastSavedRef.current?.watermarkEnabled !==
        normalizedData.watermarkEnabled;
      const styleChanged =
        lastSavedRef.current?.watermarkStyle !== normalizedData.watermarkStyle;
      const imageUrlChanged =
        lastSavedRef.current?.watermarkImageUrl !==
        normalizedData.watermarkImageUrl;
      const cornerChanged =
        lastSavedRef.current?.watermarkCorner !==
        normalizedData.watermarkCorner;
      const sizePercentChanged =
        lastSavedRef.current?.watermarkSizePercent !==
        normalizedData.watermarkSizePercent;
      const hasChanges =
        enabledChanged ||
        styleChanged ||
        imageUrlChanged ||
        cornerChanged ||
        sizePercentChanged;

      if (!hasChanges) return;

      if (isSavingRef.current) {
        queuedSaveRef.current = data;
        return;
      }

      isSavingRef.current = true;

      try {
        const updatePayload: {
          workspaceId: string;
          watermarkEnabled?: boolean;
          watermarkStyle?: string;
          watermarkImageUrl?: string;
          watermarkCorner?: string;
          watermarkSizePercent?: number;
        } = {
          workspaceId: workspace.id,
        };

        if (enabledChanged) {
          updatePayload.watermarkEnabled = normalizedData.watermarkEnabled;
        }

        if (styleChanged) {
          updatePayload.watermarkStyle = normalizedData.watermarkStyle;
        }

        if (imageUrlChanged) {
          updatePayload.watermarkImageUrl = normalizedData.watermarkImageUrl;
        }

        if (cornerChanged) {
          updatePayload.watermarkCorner = normalizedData.watermarkCorner;
        }

        if (sizePercentChanged) {
          updatePayload.watermarkSizePercent =
            normalizedData.watermarkSizePercent;
        }

        await updateWorkspace(updatePayload);

        watermarkForm.reset(normalizedData, { keepDirty: false });
        lastSavedRef.current = normalizedData;
        queuedSaveRef.current = null;

        await queryClient.invalidateQueries({
          queryKey: ["active-organization"],
        });
        toast.success(t("settings:workspaceWatermark.toastUpdated"));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("settings:workspaceWatermark.toastUpdateError"),
        );
      } finally {
        isSavingRef.current = false;

        if (queuedSaveRef.current) {
          const queuedData = queuedSaveRef.current;
          queuedSaveRef.current = null;
          await saveWatermark(queuedData);
        }
      }
    },
    [workspace, updateWorkspace, queryClient, watermarkForm, t],
  );

  const debouncedSave = useCallback(
    (data: WatermarkFormValues) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        saveWatermark(data);
      }, 1000);
    },
    [saveWatermark],
  );

  useEffect(() => {
    if (!canEdit) return;
    const subscription = watermarkForm.watch(() => {
      if (watermarkForm.formState.isDirty && watermarkForm.formState.isValid) {
        debouncedSave(watermarkForm.getValues());
      }
    });

    return () => subscription.unsubscribe();
  }, [watermarkForm, debouncedSave, canEdit]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const enabled = watermarkForm.watch("watermarkEnabled");
  const style = watermarkForm.watch("watermarkStyle");
  const showCornerFields = enabled && style === "corner";
  const showSizeField = enabled && (style === "corner" || style === "center");

  const styleOptions: { value: WatermarkStyle; key: string }[] = [
    { value: "corner", key: "corner" },
    { value: "center", key: "center" },
    { value: "tile", key: "tile" },
  ];

  return (
    <>
      <PageTitle title={t("settings:workspaceWatermark.pageTitle")} />
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {t("settings:workspaceWatermark.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("settings:workspaceWatermark.subtitle")}
          </p>
        </div>

        <div className="rounded-md border border-border bg-sidebar p-4 text-xs text-muted-foreground">
          {t("settings:workspaceWatermark.scopeNotice")}
        </div>

        <div className="space-y-6">
          <div className="space-y-4 border border-border rounded-md p-4 bg-sidebar">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  {t("settings:workspaceWatermark.enableLabel")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings:workspaceWatermark.enableHint")}
                </p>
              </div>
              <Switch
                checked={enabled}
                disabled={!canEdit}
                onCheckedChange={(checked) => {
                  if (!canEdit) return;
                  watermarkForm.setValue("watermarkEnabled", checked === true, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-md font-medium">
              {t("settings:workspaceWatermark.styleTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("settings:workspaceWatermark.styleSubtitle")}
            </p>
          </div>

          <div className="space-y-4 border border-border rounded-md p-4 bg-sidebar">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("settings:workspaceWatermark.styleLabel")}
              </Label>
              <Select
                value={style}
                disabled={!canEdit || !enabled}
                onValueChange={(value) => {
                  if (!value || !isWatermarkStyle(value)) return;
                  watermarkForm.setValue("watermarkStyle", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(
                        `settings:workspaceWatermark.styles.${option.key}.label`,
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t(`settings:workspaceWatermark.styles.${style}.description`)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-md font-medium">
              {t("settings:workspaceWatermark.imageTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("settings:workspaceWatermark.imageSubtitle")}
            </p>
          </div>

          <div className="space-y-4 border border-border rounded-md p-4 bg-sidebar">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">
                  {t("settings:workspaceWatermark.imageUrlLabel")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("settings:workspaceWatermark.imageUrlHint")}
                </p>
              </div>
              <Input
                className="w-full sm:w-64"
                placeholder={t(
                  "settings:workspaceWatermark.imageUrlPlaceholder",
                )}
                disabled={!canEdit || !enabled}
                {...watermarkForm.register("watermarkImageUrl")}
              />
            </div>
            {watermarkForm.formState.errors.watermarkImageUrl ? (
              <p className="text-xs text-destructive">
                {watermarkForm.formState.errors.watermarkImageUrl.message}
              </p>
            ) : null}
          </div>
        </div>

        {(showCornerFields || showSizeField) && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-md font-medium">
                {t("settings:workspaceWatermark.positionTitle")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("settings:workspaceWatermark.positionSubtitle")}
              </p>
            </div>

            <div className="space-y-4 border border-border rounded-md p-4 bg-sidebar">
              {showCornerFields ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("settings:workspaceWatermark.cornerLabel")}
                  </Label>
                  <Select
                    value={watermarkForm.watch("watermarkCorner")}
                    disabled={!canEdit}
                    onValueChange={(value) => {
                      if (!value || !isWatermarkCorner(value)) return;
                      watermarkForm.setValue("watermarkCorner", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WATERMARK_CORNERS.map((corner) => (
                        <SelectItem key={corner} value={corner}>
                          {t(`settings:workspaceWatermark.corners.${corner}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t("settings:workspaceWatermark.cornerHint")}
                  </p>
                </div>
              ) : null}

              {showCornerFields && showSizeField ? <Separator /> : null}

              {showSizeField ? (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("settings:workspaceWatermark.sizeLabel")}
                  </Label>
                  <Input
                    type="number"
                    min={5}
                    max={80}
                    step={1}
                    className="w-full sm:w-32"
                    disabled={!canEdit}
                    value={watermarkForm.watch("watermarkSizePercent")}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      watermarkForm.setValue(
                        "watermarkSizePercent",
                        Number.isFinite(value) ? value : 0,
                        { shouldDirty: true, shouldValidate: true },
                      );
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("settings:workspaceWatermark.sizeHint")}
                  </p>
                  {style === "center" ? (
                    <p className="text-xs text-muted-foreground">
                      {t("settings:workspaceWatermark.sizeCenterHint")}
                    </p>
                  ) : null}
                  {watermarkForm.formState.errors.watermarkSizePercent ? (
                    <p className="text-xs text-destructive">
                      {
                        watermarkForm.formState.errors.watermarkSizePercent
                          .message
                      }
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
