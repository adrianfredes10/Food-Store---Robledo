import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { getMe } from "@/shared/api/endpoints/auth";
import { useAuthStore } from "@/shared/store/auth-store";

export function useMe() {
  const token = useAuthStore((s) => s.access_token);
  const setUser = useAuthStore((s) => s.setUser);
  // Incluir el token en la clave evita que, tras logout, siga mostrándose el perfil cacheado (p. ej. "Panel Admin").
  const q = useQuery({
    queryKey: ["me", token ?? ""] as const,
    queryFn: getMe,
    enabled: Boolean(token),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!q.data) return;
    setUser({
      id: q.data.id,
      nombre: q.data.nombre,
      apellido: q.data.apellido,
      email: q.data.email,
      roles: q.data.roles,
      created_at: q.data.created_at,
    });
  }, [q.data, setUser]);

  return q;
}
