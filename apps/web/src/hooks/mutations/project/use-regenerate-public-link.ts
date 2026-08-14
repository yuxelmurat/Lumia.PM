import { useMutation } from "@tanstack/react-query";
import regeneratePublicLink from "@/fetchers/project/regenerate-public-link";

function useRegeneratePublicLink() {
  return useMutation({
    mutationFn: regeneratePublicLink,
  });
}

export default useRegeneratePublicLink;
