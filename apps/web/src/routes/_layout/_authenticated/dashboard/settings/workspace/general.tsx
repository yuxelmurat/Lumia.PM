import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import PageTitle from "@/components/page-title";
import useAuth from "@/components/providers/auth-provider/hooks/use-auth";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import useDeleteWorkspace from "@/hooks/mutations/workspace/use-delete-workspace";
import useTransferWorkspaceOwnership from "@/hooks/mutations/workspace/use-transfer-workspace-ownership";
import useUpdateWorkspace from "@/hooks/mutations/workspace/use-update-workspace";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import useGetFullWorkspace from "@/hooks/queries/workspace/use-get-full-workspace";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { toast } from "@/lib/toast";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings/workspace/general",
)({
  component: RouteComponent,
});

type WorkspaceFormValues = {
  name: string;
  description?: string;
  logo?: string;
  legalName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  contactEmail?: string;
};

type NormalizedWorkspaceValues = {
  name: string;
  description: string;
  logo: string;
  legalName: string;
  taxId: string;
  address: string;
  phone: string;
  contactEmail: string;
};

function normalizeWorkspaceValues(
  data: WorkspaceFormValues,
): NormalizedWorkspaceValues {
  return {
    name: data.name.trim(),
    description: (data.description ?? "").trim(),
    logo: (data.logo ?? "").trim(),
    legalName: (data.legalName ?? "").trim(),
    taxId: (data.taxId ?? "").trim(),
    address: (data.address ?? "").trim(),
    phone: (data.phone ?? "").trim(),
    contactEmail: (data.contactEmail ?? "").trim(),
  };
}

type WorkspaceWithProfileFields = {
  description?: string | null;
  logo?: string | null;
  legalName?: string | null;
  taxId?: string | null;
  address?: string | null;
  phone?: string | null;
  contactEmail?: string | null;
  metadata?: unknown;
};

/** Better Auth persists these as organization additional fields (real DB columns), not only inside metadata. */
function getWorkspaceProfileField(
  workspace: WorkspaceWithProfileFields | null | undefined,
  field: keyof Omit<WorkspaceWithProfileFields, "metadata">,
): string {
  if (!workspace) return "";
  const direct = workspace[field];
  if (typeof direct === "string") {
    return direct;
  }
  if (
    typeof workspace.metadata === "object" &&
    workspace.metadata &&
    field in workspace.metadata
  ) {
    return String((workspace.metadata as Record<string, unknown>)[field] ?? "");
  }
  return "";
}

function RouteComponent() {
  const { t } = useTranslation();
  const workspaceSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .min(1, t("settings:workspaceGeneral.validation.nameRequired"))
          .min(2, t("settings:workspaceGeneral.validation.nameShort")),
        description: z.string().optional(),
        logo: z.string().optional(),
        legalName: z.string().optional(),
        taxId: z.string().optional(),
        address: z.string().optional(),
        phone: z.string().optional(),
        contactEmail: z
          .string()
          .optional()
          .refine(
            (value) => !value || z.email().safeParse(value).success,
            t("settings:workspaceGeneral.validation.contactEmailInvalid"),
          ),
      }),
    [t],
  );

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const queuedSaveRef = useRef<WorkspaceFormValues | null>(null);
  const lastSavedRef = useRef<NormalizedWorkspaceValues | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState<string>("");

  const { user: currentUser } = useAuth();
  const { data: workspace } = useActiveWorkspace();
  const { data: fullWorkspace } = useGetFullWorkspace({
    workspaceId: workspace?.id,
  });
  const { mutateAsync: updateWorkspace } = useUpdateWorkspace();
  const { mutateAsync: deleteWorkspace, isPending: isDeleting } =
    useDeleteWorkspace();
  const { mutateAsync: transferOwnership, isPending: isTransferring } =
    useTransferWorkspaceOwnership();
  const { canManageWorkspace, canDeleteWorkspace, isOwner } =
    useWorkspacePermission();
  const canEdit = canManageWorkspace();
  const canDelete = canDeleteWorkspace();
  const workspaceDescription = getWorkspaceProfileField(
    workspace,
    "description",
  );
  const workspaceLogo = getWorkspaceProfileField(workspace, "logo");
  const workspaceLegalName = getWorkspaceProfileField(workspace, "legalName");
  const workspaceTaxId = getWorkspaceProfileField(workspace, "taxId");
  const workspaceAddress = getWorkspaceProfileField(workspace, "address");
  const workspacePhone = getWorkspaceProfileField(workspace, "phone");
  const workspaceContactEmail = getWorkspaceProfileField(
    workspace,
    "contactEmail",
  );

  // Ownership transfer is owner-only. Eligible recipients are any current
  // member who isn't the owner themselves.
  const members = fullWorkspace?.members ?? [];
  const currentOwnerMember = members.find((m) => m.role === "owner");
  const eligibleNewOwners = members.filter(
    (m) => m.role !== "owner" && m.userId !== currentUser?.id,
  );
  const selectedMember = eligibleNewOwners.find(
    (m) => m.id === selectedNewOwnerId,
  );

  const workspaceForm = useForm<WorkspaceFormValues>({
    resolver: standardSchemaResolver(workspaceSchema),
    mode: "onChange",
    defaultValues: {
      name: workspace?.name || "",
      description: workspaceDescription,
      logo: workspaceLogo,
      legalName: workspaceLegalName,
      taxId: workspaceTaxId,
      address: workspaceAddress,
      phone: workspacePhone,
      contactEmail: workspaceContactEmail,
    },
  });

  useEffect(() => {
    if (!workspace) return;

    const nextValues = {
      name: workspace.name || "",
      description: workspaceDescription,
      logo: workspaceLogo,
      legalName: workspaceLegalName,
      taxId: workspaceTaxId,
      address: workspaceAddress,
      phone: workspacePhone,
      contactEmail: workspaceContactEmail,
    };
    lastSavedRef.current = normalizeWorkspaceValues(nextValues);

    if (!workspaceForm.formState.isDirty) {
      workspaceForm.reset(nextValues);
    }
  }, [
    workspace,
    workspaceDescription,
    workspaceLogo,
    workspaceLegalName,
    workspaceTaxId,
    workspaceAddress,
    workspacePhone,
    workspaceContactEmail,
    workspaceForm,
  ]);

  const saveWorkspace = useCallback(
    async (data: WorkspaceFormValues) => {
      if (!workspace?.id) return;

      const normalizedData = normalizeWorkspaceValues(data);
      const nameChanged = lastSavedRef.current?.name !== normalizedData.name;
      const descriptionChanged =
        lastSavedRef.current?.description !== normalizedData.description;
      const logoChanged = lastSavedRef.current?.logo !== normalizedData.logo;
      const legalNameChanged =
        lastSavedRef.current?.legalName !== normalizedData.legalName;
      const taxIdChanged = lastSavedRef.current?.taxId !== normalizedData.taxId;
      const addressChanged =
        lastSavedRef.current?.address !== normalizedData.address;
      const phoneChanged = lastSavedRef.current?.phone !== normalizedData.phone;
      const contactEmailChanged =
        lastSavedRef.current?.contactEmail !== normalizedData.contactEmail;
      const hasChanges =
        nameChanged ||
        descriptionChanged ||
        logoChanged ||
        legalNameChanged ||
        taxIdChanged ||
        addressChanged ||
        phoneChanged ||
        contactEmailChanged;

      if (!hasChanges) return;

      if (isSavingRef.current) {
        queuedSaveRef.current = data;
        return;
      }

      isSavingRef.current = true;

      try {
        const updatePayload: {
          workspaceId: string;
          name?: string;
          description?: string;
          logo?: string;
          legalName?: string;
          taxId?: string;
          address?: string;
          phone?: string;
          contactEmail?: string;
        } = {
          workspaceId: workspace.id,
        };

        if (nameChanged) {
          updatePayload.name = normalizedData.name;
        }

        if (descriptionChanged) {
          updatePayload.description = normalizedData.description;
        }

        if (logoChanged) {
          updatePayload.logo = normalizedData.logo;
        }

        if (legalNameChanged) {
          updatePayload.legalName = normalizedData.legalName;
        }

        if (taxIdChanged) {
          updatePayload.taxId = normalizedData.taxId;
        }

        if (addressChanged) {
          updatePayload.address = normalizedData.address;
        }

        if (phoneChanged) {
          updatePayload.phone = normalizedData.phone;
        }

        if (contactEmailChanged) {
          updatePayload.contactEmail = normalizedData.contactEmail;
        }

        await updateWorkspace(updatePayload);

        workspaceForm.reset(normalizedData, { keepDirty: false });
        lastSavedRef.current = normalizedData;
        queuedSaveRef.current = null;

        await queryClient.invalidateQueries({
          queryKey: ["active-organization"],
        });
        toast.success(t("settings:workspaceGeneral.toastUpdated"));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("settings:workspaceGeneral.toastUpdateError"),
        );
      } finally {
        isSavingRef.current = false;

        if (queuedSaveRef.current) {
          const queuedData = queuedSaveRef.current;
          queuedSaveRef.current = null;
          await saveWorkspace(queuedData);
        }
      }
    },
    [workspace, updateWorkspace, queryClient, workspaceForm, t],
  );

  const handleTransferOwnership = useCallback(async () => {
    if (!workspace?.id || !currentOwnerMember || !selectedMember) return;

    try {
      await transferOwnership({
        workspaceId: workspace.id,
        newOwnerMemberId: selectedMember.id,
        currentOwnerMemberId: currentOwnerMember.id,
      });
      toast.success(
        t("settings:workspaceGeneral.transferOwnership.toastSuccess", {
          defaultValue: "Ownership transferred",
        }),
      );
      setIsTransferModalOpen(false);
      setSelectedNewOwnerId("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:workspaceGeneral.transferOwnership.toastError", {
              defaultValue: "Failed to transfer ownership",
            }),
      );
    }
  }, [workspace?.id, currentOwnerMember, selectedMember, transferOwnership, t]);

  const handleDeleteWorkspace = useCallback(async () => {
    if (!workspace?.id) return;

    try {
      await deleteWorkspace({ workspaceId: workspace.id });
      toast.success(t("settings:workspaceGeneral.toastDeleted"));

      // Invalidate all workspace-related queries
      await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      await queryClient.invalidateQueries({
        queryKey: ["active-organization"],
      });

      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings:workspaceGeneral.toastDeleteError"),
      );
    }
  }, [workspace?.id, deleteWorkspace, queryClient, navigate, t]);

  const debouncedSave = useCallback(
    (data: WorkspaceFormValues) => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        saveWorkspace(data);
      }, 1000);
    },
    [saveWorkspace],
  );

  useEffect(() => {
    if (!canEdit) return;
    const subscription = workspaceForm.watch(() => {
      if (workspaceForm.formState.isDirty && workspaceForm.formState.isValid) {
        debouncedSave(workspaceForm.getValues());
      }
    });

    return () => subscription.unsubscribe();
  }, [workspaceForm, debouncedSave, canEdit]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <PageTitle title={t("settings:workspaceGeneral.pageTitle")} />
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {t("settings:workspaceGeneral.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("settings:workspaceGeneral.subtitle")}
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-md font-medium">
              {t("settings:workspaceGeneral.workspaceInfoTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("settings:workspaceGeneral.workspaceInfoSubtitle")}
            </p>
          </div>

          <div className="space-y-4 border border-border rounded-md p-4 bg-sidebar">
            <Form {...workspaceForm}>
              <form className="space-y-4">
                <FormField
                  control={workspaceForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            {t("settings:workspaceGeneral.nameLabel")}
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {t("settings:workspaceGeneral.nameHint")}
                          </p>
                        </div>
                        <FormControl>
                          <Input
                            className="w-full sm:w-64"
                            placeholder={t(
                              "settings:workspaceGeneral.namePlaceholder",
                            )}
                            disabled={!canEdit}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={workspaceForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            {t("settings:workspaceGeneral.descriptionLabel")}
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {t("settings:workspaceGeneral.descriptionHint")}
                          </p>
                        </div>
                        <FormControl>
                          <Input
                            className="w-full sm:w-64"
                            placeholder={t(
                              "settings:workspaceGeneral.descriptionPlaceholder",
                            )}
                            disabled={!canEdit}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-md font-medium">
              {t("settings:workspaceGeneral.companyProfileTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("settings:workspaceGeneral.companyProfileSubtitle")}
            </p>
          </div>

          <div className="space-y-4 border border-border rounded-md p-4 bg-sidebar">
            <Form {...workspaceForm}>
              <form className="space-y-4">
                <FormField
                  control={workspaceForm.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            {t("settings:workspaceGeneral.logoLabel")}
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {t("settings:workspaceGeneral.logoHint")}
                          </p>
                        </div>
                        <FormControl>
                          <Input
                            className="w-full sm:w-64"
                            placeholder={t(
                              "settings:workspaceGeneral.logoPlaceholder",
                            )}
                            disabled={!canEdit}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={workspaceForm.control}
                  name="legalName"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            {t("settings:workspaceGeneral.legalNameLabel")}
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {t("settings:workspaceGeneral.legalNameHint")}
                          </p>
                        </div>
                        <FormControl>
                          <Input
                            className="w-full sm:w-64"
                            placeholder={t(
                              "settings:workspaceGeneral.legalNamePlaceholder",
                            )}
                            disabled={!canEdit}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={workspaceForm.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            {t("settings:workspaceGeneral.taxIdLabel")}
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {t("settings:workspaceGeneral.taxIdHint")}
                          </p>
                        </div>
                        <FormControl>
                          <Input
                            className="w-full sm:w-64"
                            placeholder={t(
                              "settings:workspaceGeneral.taxIdPlaceholder",
                            )}
                            disabled={!canEdit}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={workspaceForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            {t("settings:workspaceGeneral.addressLabel")}
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {t("settings:workspaceGeneral.addressHint")}
                          </p>
                        </div>
                        <FormControl>
                          <Input
                            className="w-full sm:w-64"
                            placeholder={t(
                              "settings:workspaceGeneral.addressPlaceholder",
                            )}
                            disabled={!canEdit}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={workspaceForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            {t("settings:workspaceGeneral.phoneLabel")}
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {t("settings:workspaceGeneral.phoneHint")}
                          </p>
                        </div>
                        <FormControl>
                          <Input
                            className="w-full sm:w-64"
                            placeholder={t(
                              "settings:workspaceGeneral.phonePlaceholder",
                            )}
                            disabled={!canEdit}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <FormField
                  control={workspaceForm.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            {t("settings:workspaceGeneral.contactEmailLabel")}
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            {t("settings:workspaceGeneral.contactEmailHint")}
                          </p>
                        </div>
                        <FormControl>
                          <Input
                            className="w-full sm:w-64"
                            placeholder={t(
                              "settings:workspaceGeneral.contactEmailPlaceholder",
                            )}
                            disabled={!canEdit}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </div>

        {isOwner ? (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-md font-medium">
                {t("settings:workspaceGeneral.transferOwnership.title", {
                  defaultValue: "Transfer ownership",
                })}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("settings:workspaceGeneral.transferOwnership.subtitle", {
                  defaultValue:
                    "Hand this workspace over to another member. You'll be demoted to admin and lose owner-only abilities.",
                })}
              </p>
            </div>

            <div className="space-y-4 border border-border rounded-md p-4 bg-sidebar">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm font-medium">
                    {t(
                      "settings:workspaceGeneral.transferOwnership.pickerLabel",
                      { defaultValue: "New owner" },
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {eligibleNewOwners.length === 0
                      ? t(
                          "settings:workspaceGeneral.transferOwnership.noEligibleMembers",
                          {
                            defaultValue:
                              "Invite at least one other member before you can transfer ownership.",
                          },
                        )
                      : t(
                          "settings:workspaceGeneral.transferOwnership.pickerHint",
                          {
                            defaultValue:
                              "They become the sole owner of this workspace.",
                          },
                        )}
                  </p>
                </div>
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  <Select
                    value={selectedNewOwnerId}
                    onValueChange={(value) => {
                      if (typeof value === "string") {
                        setSelectedNewOwnerId(value);
                      }
                    }}
                    disabled={eligibleNewOwners.length === 0}
                  >
                    <SelectTrigger size="sm" className="w-full sm:w-56">
                      <SelectValue
                        placeholder={t(
                          "settings:workspaceGeneral.transferOwnership.pickerPlaceholder",
                          { defaultValue: "Select a member" },
                        )}
                      >
                        {selectedMember
                          ? selectedMember.user.name ||
                            selectedMember.user.email
                          : null}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleNewOwners.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.user.name} ({m.user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={!selectedNewOwnerId || isTransferring}
                    onClick={() => setIsTransferModalOpen(true)}
                  >
                    {t("settings:workspaceGeneral.transferOwnership.button", {
                      defaultValue: "Transfer",
                    })}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {canDelete && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-md font-medium">
                {t("settings:workspaceGeneral.dangerZone")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("settings:workspaceGeneral.dangerZoneSubtitle")}
              </p>
            </div>

            <div className="space-y-4 border border-border rounded-md p-4 bg-sidebar">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">
                    {t("settings:workspaceGeneral.deleteWorkspace")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("settings:workspaceGeneral.deleteWorkspaceDescription")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive transition-colors"
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                >
                  {t("settings:workspaceGeneral.deleteWorkspace")}
                </Button>
              </div>
            </div>
          </div>
        )}

        <AlertDialog
          open={isTransferModalOpen}
          onOpenChange={setIsTransferModalOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("settings:workspaceGeneral.transferOwnership.dialogTitle", {
                  defaultValue: "Transfer ownership?",
                })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  "settings:workspaceGeneral.transferOwnership.dialogDescription",
                  {
                    defaultValue:
                      "{{name}} will become the sole owner of {{workspace}}. You'll keep admin access but lose owner-only abilities like deleting the workspace or transferring it again.",
                    name:
                      selectedMember?.user.name ||
                      selectedMember?.user.email ||
                      "",
                    workspace: workspace?.name ?? "",
                  },
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isTransferring}
                  />
                }
              >
                {t("common:actions.cancel")}
              </AlertDialogClose>
              <AlertDialogClose
                render={
                  <Button
                    size="sm"
                    disabled={isTransferring}
                    onClick={handleTransferOwnership}
                  />
                }
              >
                {isTransferring
                  ? t(
                      "settings:workspaceGeneral.transferOwnership.transferring",
                      { defaultValue: "Transferring…" },
                    )
                  : t("settings:workspaceGeneral.transferOwnership.confirm", {
                      defaultValue: "Transfer ownership",
                    })}
              </AlertDialogClose>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={isDeleteModalOpen}
          onOpenChange={setIsDeleteModalOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("settings:workspaceGeneral.deleteModalTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("settings:workspaceGeneral.deleteModalDescription", {
                  name: workspace?.name ?? "",
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogClose render={<Button variant="outline" size="sm" />}>
                {t("common:actions.cancel")}
              </AlertDialogClose>
              <AlertDialogClose
                render={
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isDeleting}
                    onClick={handleDeleteWorkspace}
                  />
                }
              >
                {isDeleting
                  ? t("common:actions.deleting")
                  : t("settings:workspaceGeneral.deleteModalConfirm")}
              </AlertDialogClose>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
