import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { createSlug } from "@/lib/utils/create-slug";

type UpdateWorkspaceRequest = {
  workspaceId: string;
  name?: string;
  description?: string;
  slug?: string;
  logo?: string;
  metadata?: Record<string, unknown>;
  legalName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  contactEmail?: string;
  watermarkEnabled?: boolean;
  watermarkStyle?: string;
  watermarkImageUrl?: string;
  watermarkCorner?: string;
  watermarkSizePercent?: number;
};

function useUpdateWorkspace() {
  return useMutation({
    mutationFn: async ({
      workspaceId,
      name,
      description,
      slug,
      logo,
      metadata,
      legalName,
      taxId,
      address,
      phone,
      contactEmail,
      watermarkEnabled,
      watermarkStyle,
      watermarkImageUrl,
      watermarkCorner,
      watermarkSizePercent,
    }: UpdateWorkspaceRequest) => {
      const updateData: {
        name?: string;
        description?: string;
        slug?: string;
        logo?: string;
        metadata?: Record<string, unknown>;
        legalName?: string;
        taxId?: string;
        address?: string;
        phone?: string;
        contactEmail?: string;
        watermarkEnabled?: boolean;
        watermarkStyle?: string;
        watermarkImageUrl?: string;
        watermarkCorner?: string;
        watermarkSizePercent?: number;
      } = {};

      if (name !== undefined) {
        updateData.name = name;
        if (slug === undefined) {
          updateData.slug = createSlug(name);
        }
      }

      if (slug !== undefined) {
        updateData.slug = slug;
      }

      if (description !== undefined) {
        updateData.description = description;
      }

      if (logo !== undefined) {
        updateData.logo = logo;
      }

      if (metadata !== undefined) {
        updateData.metadata = metadata;
      }

      if (legalName !== undefined) {
        updateData.legalName = legalName;
      }

      if (taxId !== undefined) {
        updateData.taxId = taxId;
      }

      if (address !== undefined) {
        updateData.address = address;
      }

      if (phone !== undefined) {
        updateData.phone = phone;
      }

      if (contactEmail !== undefined) {
        updateData.contactEmail = contactEmail;
      }

      if (watermarkEnabled !== undefined) {
        updateData.watermarkEnabled = watermarkEnabled;
      }

      if (watermarkStyle !== undefined) {
        updateData.watermarkStyle = watermarkStyle;
      }

      if (watermarkImageUrl !== undefined) {
        updateData.watermarkImageUrl = watermarkImageUrl;
      }

      if (watermarkCorner !== undefined) {
        updateData.watermarkCorner = watermarkCorner;
      }

      if (watermarkSizePercent !== undefined) {
        updateData.watermarkSizePercent = watermarkSizePercent;
      }

      const { data, error } = await authClient.organization.update({
        data: updateData,
        organizationId: workspaceId,
      });

      if (error) {
        throw new Error(error.message || "Failed to update workspace");
      }

      return data;
    },
  });
}

export default useUpdateWorkspace;
