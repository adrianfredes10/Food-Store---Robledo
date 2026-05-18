export { useAdminDashboard } from "./hooks/useAdminDashboard";
export {
  aplanarCategoriasParaSelect,
  buildCategoriaArbol,
  useActualizarCategoria,
  useCategorias,
  useCrearCategoria,
  useEliminarCategoria,
  type CategoriaNodo,
} from "./hooks/useAdminCategorias";
export {
  useActualizarIngrediente,
  useCrearIngrediente,
  useEliminarIngrediente,
  useIngredientes,
  useIngredientesDeProducto,
  useIngredientesTodos,
  useMutarStockIngrediente,
} from "./hooks/useAdminIngredientes";
export { useAdminPedidoDetalle, useAdminPedidoTransicion, useAdminPedidosList } from "./hooks/useAdminPedidos";
export { useAdminUsuariosList } from "./hooks/useAdminUsuarios";
export { useAdminMesasCatalogo, useAdminMesasEstado, useAdminMesasMutations } from "./hooks/useAdminMesas";
export { useActualizarProducto, useAdminProductoMutations } from "./hooks/useAdminProductos";
