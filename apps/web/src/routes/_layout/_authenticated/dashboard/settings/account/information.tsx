import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import PageTitle from "@/components/page-title";
import useAuth from "@/components/providers/auth-provider/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import useUpdateUserProfile from "@/hooks/mutations/use-update-user-profile";
import { getInitials } from "@/lib/get-initials";
import { toast } from "@/lib/toast";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings/account/information",
)({
  component: RouteComponent,
});

type ProfileFormValues = {
  name: string;
  email: string;
};

type NormalizedProfileValues = {
  name: string;
  email: string;
};

function normalizeProfileValues(
  data: ProfileFormValues,
): NormalizedProfileValues {
  return {
    name: data.name.trim(),
    email: data.email,
  };
}

function RouteComponent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { mutateAsync: updateProfile } = useUpdateUserProfile();
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);
  const queuedSaveRef = useRef<ProfileFormValues | null>(null);
  const lastSavedRef = useRef<NormalizedProfileValues | null>(null);
  const profileSchema = z.object({
    name: z
      .string()
      .min(1, t("settings:informationPage.validation.nameRequired"))
      .min(2, t("settings:informationPage.validation.nameShort")),
    email: z
      .string()
      .email(t("settings:informationPage.validation.invalidEmail")),
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: standardSchemaResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
    },
  });

  useEffect(() => {
    if (!user) return;

    const nextValues = {
      name: user.name || "",
      email: user.email || "",
    };
    lastSavedRef.current = normalizeProfileValues(nextValues);

    if (!profileForm.formState.isDirty) {
      profileForm.reset(nextValues);
    }
  }, [user, profileForm]);

  const saveProfile = useCallback(
    async (data: ProfileFormValues) => {
      const normalizedData = normalizeProfileValues(data);

      if (lastSavedRef.current?.name === normalizedData.name) {
        return;
      }

      if (isSavingRef.current) {
        queuedSaveRef.current = data;
        return;
      }

      isSavingRef.current = true;

      try {
        await updateProfile({
          name: normalizedData.name,
        });

        profileForm.reset(normalizedData, { keepDirty: false });
        lastSavedRef.current = normalizedData;
        queuedSaveRef.current = null;

        await queryClient.invalidateQueries({ queryKey: ["session"] });
        toast.success(t("settings:informationPage.updateSuccess"));
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("settings:informationPage.updateError"),
        );
      } finally {
        isSavingRef.current = false;

        if (queuedSaveRef.current) {
          const queuedData = queuedSaveRef.current;
          queuedSaveRef.current = null;
          await saveProfile(queuedData);
        }
      }
    },
    [t, updateProfile, queryClient, profileForm],
  );

  const debouncedSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // `formState.isValid` is a stale snapshot when read synchronously right
    // after a change — Zod validation runs asynchronously, so it still
    // reflects the *previous* value for at least this tick. Re-validating
    // with `trigger()` once the debounce has elapsed reads the real,
    // settled result instead of silently skipping the save.
    debounceTimeoutRef.current = setTimeout(async () => {
      // Both `isDirty` and `isValid` are stale Proxy snapshots when read
      // synchronously inside a `watch()` callback — they only reflect
      // reality after React has re-rendered with the change, which hasn't
      // happened yet at the moment `watch()` fires. Re-checking both here,
      // a full tick (and a render) later, reads the settled values instead.
      if (!profileForm.formState.isDirty) return;
      const isValid = await profileForm.trigger();
      if (!isValid) return;
      saveProfile(profileForm.getValues());
    }, 1000);
  }, [saveProfile, profileForm]);

  useEffect(() => {
    const subscription = profileForm.watch(() => {
      debouncedSave();
    });

    return () => subscription.unsubscribe();
  }, [profileForm, debouncedSave]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <PageTitle title={t("settings:informationPage.pageTitle")} />
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {t("settings:informationPage.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("settings:informationPage.subtitle")}
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-md font-medium">
              {t("settings:informationPage.sectionTitle")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("settings:informationPage.sectionSubtitle")}
            </p>
          </div>

          <div className="space-y-4 border border-border rounded-md p-4 bg-sidebar">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {t("settings:informationPage.profilePicture")}
                </p>
              </div>
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.image ?? ""} alt={user?.name || ""} />
                <AvatarFallback className="text-xs font-medium border border-border/30">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </div>

            <Separator />

            <Form {...profileForm}>
              <form className="space-y-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            {t("settings:informationPage.fullName")}
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            className="w-full sm:w-48"
                            placeholder={t(
                              "settings:informationPage.fullNamePlaceholder",
                            )}
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
                  control={profileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm font-medium">
                            {t("settings:informationPage.email")}
                          </FormLabel>
                        </div>
                        <FormControl>
                          <Input
                            className="w-full sm:w-48"
                            placeholder={t(
                              "settings:informationPage.emailPlaceholder",
                            )}
                            {...field}
                            disabled
                            value={user?.email || ""}
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
      </div>
    </>
  );
}
