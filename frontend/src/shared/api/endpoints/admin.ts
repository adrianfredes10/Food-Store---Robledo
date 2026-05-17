import { apiClient } from "@/shared/api/client";

export type VentaDiaDTO = { fecha: string; total: string | number };
export type MetricasDashboardDTO = {
  total_pedidos: number;
  pedidos_por_estado: Record<string, number>;
  ingresos_totales: string | number;
  ventas_por_dia: VentaDiaDTO[];
};

export type AdminPedidoItemDTO = {
  id: number;
  usuario_id: number;
  cliente_nombre?: string | null;
  cliente_email?: string | null;
  estado: string;
  tipo_servicio: string;
  numero_mesa?: number | null;
  dir_linea1?: string | null;
  dir_ciudad?: string | null;
  dir_provincia?: string | null;
  dir_cp?: string | null;
  dir_alias?: string | null;
  total: string | number;
  moneda: string;
  costo_envio?: string | number;
  forma_pago_codigo?: string | null;
  created_at?: string | null;
};

export type AdminPedidosPageDTO = {
  items: AdminPedidoItemDTO[];
  total: number;
  page: number;
  size: number;
};

export type PedidoDetalleLineaDTO = {
  nombre_producto: string;
  cantidad: number;
  precio_unitario_snapshot: string | number;
  subtotal: string | number;
};

export type PedidoAdminDetalleDTO = {
  id: number;
  usuario_id: number;
  cliente_nombre?: string | null;
  cliente_email?: string | null;
  direccion_entrega_id: number | null;
  tipo_servicio: string;
  numero_mesa?: number | null;
  estado: string;
  total: string | number;
  moneda: string;
  costo_envio?: string | number;
  forma_pago_codigo?: string | null;
  dir_linea1?: string | null;
  dir_ciudad?: string | null;
  dir_provincia?: string | null;
  dir_cp?: string | null;
  dir_alias?: string | null;
  detalles: PedidoDetalleLineaDTO[];
};

export async function getAdminDashboard(): Promise<MetricasDashboardDTO> {
  const { data } = await apiClient.get<MetricasDashboardDTO>("/admin/dashboard");
  return data;
}

export async function getAdminPedidos(page = 1, size = 20): Promise<AdminPedidosPageDTO> {
  const { data } = await apiClient.get<AdminPedidosPageDTO>("/admin/pedidos", { params: { page, size } });
  return data;
}

export type AdminUsuarioItemDTO = {
  id: number;
  email: string;
  nombre: string;
  apellido?: string | null;
  telefono?: string | null;
  activo: boolean;
  created_at?: string | null;
  roles: string[];
};

export type AdminUsuariosPageDTO = {
  items: AdminUsuarioItemDTO[];
  total: number;
  page: number;
  size: number;
};

export async function getAdminUsuarios(page = 1, size = 20): Promise<AdminUsuariosPageDTO> {
  const { data } = await apiClient.get<AdminUsuariosPageDTO>("/admin/usuarios", { params: { page, size } });
  return data;
}

export async function getAdminPedido(id: number): Promise<PedidoAdminDetalleDTO> {
  const { data } = await apiClient.get<PedidoAdminDetalleDTO>(`/admin/pedidos/${id}`);
  return data;
}

export async function adminTransicionPedido(
  pedidoId: number,
  estado: string,
): Promise<PedidoAdminDetalleDTO> {
  const { data } = await apiClient.post<PedidoAdminDetalleDTO>(
    `/admin/pedidos/${pedidoId}/transicion`,
    { estado },
  );
  return data;
}

// —— Mesas (local físico) ——————————————————————————————————————

export type PedidoMesaOcupacionDTO = {
  id: number;
  estado: string;
  cliente_nombre?: string | null;
  cliente_email?: string | null;
};

export type MesaEstadoItemDTO = {
  mesa_id: number;
  numero: number;
  etiqueta?: string | null;
  activa: boolean;
  ocupada: boolean;
  pedido?: PedidoMesaOcupacionDTO | null;
};

export type MesaFueraCatalogoDTO = {
  numero_mesa: number;
  pedido_id: number;
  estado: string;
  cliente_nombre?: string | null;
  cliente_email?: string | null;
};

export type MesasEstadoResumenDTO = {
  total_mesas_activas: number;
  ocupadas: number;
  libres: number;
};

export type MesasEstadoResponseDTO = {
  resumen: MesasEstadoResumenDTO;
  items: MesaEstadoItemDTO[];
  fuera_de_catalogo: MesaFueraCatalogoDTO[];
};

export type MesaReadDTO = {
  id: number;
  numero: number;
  etiqueta?: string | null;
  activa: boolean;
  created_at?: string | null;
};

export async function getAdminMesasEstado(): Promise<MesasEstadoResponseDTO> {
  const { data } = await apiClient.get<MesasEstadoResponseDTO>("/admin/mesas/estado");
  return data;
}

export async function getAdminMesas(): Promise<MesaReadDTO[]> {
  const { data } = await apiClient.get<MesaReadDTO[]>("/admin/mesas");
  return data;
}

export async function postAdminMesa(payload: {
  numero: number;
  etiqueta?: string | null;
}): Promise<MesaReadDTO> {
  const { data } = await apiClient.post<MesaReadDTO>("/admin/mesas", payload);
  return data;
}

export async function patchAdminMesa(
  mesaId: number,
  payload: { etiqueta?: string | null; activa?: boolean },
): Promise<MesaReadDTO> {
  const { data } = await apiClient.patch<MesaReadDTO>(`/admin/mesas/${mesaId}`, payload);
  return data;
}

export async function deleteAdminMesa(mesaId: number): Promise<void> {
  await apiClient.delete(`/admin/mesas/${mesaId}`);
}

export async function postAdminMesaLiberar(mesaId: number): Promise<void> {
  await apiClient.post(`/admin/mesas/${mesaId}/liberar`);
}
