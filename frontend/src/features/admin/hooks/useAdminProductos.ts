import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import {
  createProducto,
  deleteProducto,
  patchProducto,
  type ProductoCreateBody,
  type ProductoPatchBody,
} from "@/shared/api/endpoints/productos";
import { invalidateAfterCatalogMutate } from "@/shared/lib/queryCacheSync";

export function useActualizarProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductoPatchBody }) =>
      patchProducto(id, data),
    onSuccess: () => {
      void invalidateAfterCatalogMutate(qc);
    },
  });
}

export function useAdminProductoMutations() {
  const qc = useQueryClient();

  const crear = useMutation({
    // mando el producto nuevo al back
    mutationFn: (body: ProductoCreateBody) => createProducto(body),
    onSuccess: () => {
      toast.success(
        "Producto creado. Si usás imagen automática (Groq), puede tardar unos segundos en verse: recargamos el catálogo automáticamente.",
      );
      void invalidateAfterCatalogMutate(qc);
      // La API guarda la imagen en BackgroundTasks después de responder; sin esto casi siempre ves imagen_url vacía.
      window.setTimeout(() => void qc.invalidateQueries({ queryKey: ["productos"] }), 4000);
      window.setTimeout(() => void qc.invalidateQueries({ queryKey: ["productos"] }), 10000);
    },
    onError: (err) => {
      // si falla muestro el error en un toast
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        toast.error("No tenés permiso de administrador para crear productos.");
        return;
      }
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        toast.error("Sesión vencida. Volvé a iniciar sesión como admin.");
        return;
      }
      if (axios.isAxiosError(err) && err.response === undefined) {
        toast.error("No hay conexión con la API. Revisá que el backend esté en marcha y la URL en .env.");
        return;
      }
      const respData = axios.isAxiosError(err) ? err.response?.data : undefined;
      const detail =
        typeof respData === "object" && respData !== null && "detail" in respData
          ? String((respData as { detail: unknown }).detail)
          : err instanceof Error
            ? err.message
            : null;
      toast.error(detail ? `No se pudo crear: ${detail}` : "No se pudo crear el producto");
    },
  });

  const patch = useMutation({
    mutationFn: ({ id, body }: { id: number; body: ProductoPatchBody }) => patchProducto(id, body),
    onSuccess: () => {
      toast.success("Producto actualizado");
      void invalidateAfterCatalogMutate(qc);
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => deleteProducto(id),
    onSuccess: () => {
      toast.success("Producto eliminado");
      void invalidateAfterCatalogMutate(qc);
    },
    onError: () => toast.error("No se pudo eliminar"),
  });

  return { crear, patch, eliminar };
}
