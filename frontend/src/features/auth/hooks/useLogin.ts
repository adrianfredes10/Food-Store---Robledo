import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { getMe, loginRequest, type LoginBody } from "@/shared/api/endpoints/auth";
import { useAuthStore } from "@/shared/store/auth-store";

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (body: LoginBody) => loginRequest(body),
    onSuccess: async (data) => {
      // guardo los tokens y traigo el perfil del usuario
      setTokens(data.access_token, data.refresh_token);
      let profile: Awaited<ReturnType<typeof getMe>> | null = null;
      try {
        profile = await getMe();
        setUser({
          id: profile.id,
          nombre: profile.nombre,
          apellido: profile.apellido,
          email: profile.email,
          roles: profile.roles,
          created_at: profile.created_at,
        });
      } catch {
        setUser(null);
      }
      void qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Sesión iniciada");

      if (profile?.roles?.includes("ADMIN")) {
        navigate("/admin", { replace: true });
        return;
      }

      const from = (location.state as { from?: string } | null)?.from;
      const target =
        typeof from === "string" && from.length > 0 && !from.startsWith("/login") ? from : "/";
      navigate(target, { replace: true });
    },
    onError: (err) => {
      // si falla muestro el error en un toast
      if (axios.isAxiosError(err) && err.response === undefined) {
        toast.error("No se pudo conectar con la API. Revisá que el backend esté en marcha y VITE_API_BASE_URL.");
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        const respData = err.response.data;
        const detail =
          typeof respData === "object" && respData !== null && "detail" in respData
            ? String((respData as { detail: unknown }).detail)
            : null;
        toast.error(detail ?? "Demasiados intentos. Esperá unos minutos.");
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        toast.error("Email o contraseña incorrectos");
        return;
      }
      toast.error("No se pudo iniciar sesión. Intentá de nuevo.");
    },
  });
}
