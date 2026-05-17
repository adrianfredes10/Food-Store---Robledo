import { useQuery } from "@tanstack/react-query";

import { getAdminUsuarios } from "@/shared/api/endpoints/admin";

export function useAdminUsuariosList(page: number) {
  return useQuery({
    queryKey: ["admin", "usuarios", page] as const,
    queryFn: () => getAdminUsuarios(page, 20),
  });
}
