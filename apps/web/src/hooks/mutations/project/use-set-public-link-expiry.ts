import { useMutation } from "@tanstack/react-query";
import setPublicLinkExpiry from "@/fetchers/project/set-public-link-expiry";

function useSetPublicLinkExpiry() {
  return useMutation({
    mutationFn: setPublicLinkExpiry,
  });
}

export default useSetPublicLinkExpiry;
