class ErrorCategoria(Exception):
    """Base de errores del dominio categorías."""


class CategoriaNoEncontradaError(ErrorCategoria):
    def __init__(self, categoria_id: int) -> None:
        super().__init__(f"Categoría {categoria_id} no encontrada")
        self.categoria_id = categoria_id


class CategoriaConProductosActivosError(ErrorCategoria):
    def __init__(self, categoria_id: int) -> None:
        super().__init__(
            "No se puede eliminar esta categoría: todavía tiene productos en el catálogo "
            "(incluye productos pausados). Eliminá esos productos desde Admin → Productos "
            "o asignálos manualmente a otra categoría; no se mueven solos."
        )
        self.categoria_id = categoria_id


class CategoriaConHijosActivosError(ErrorCategoria):
    def __init__(self, categoria_id: int) -> None:
        super().__init__(
            "No se puede eliminar esta categoría: tiene subcategorías. "
            "Eliminá primero las subcategorías (o los productos que bloqueen su eliminación)."
        )
        self.categoria_id = categoria_id


class NombreCategoriaRepetidoError(ErrorCategoria):
    def __init__(self) -> None:
        super().__init__("Ya existe una categoría con ese nombre en este nivel")


class CicloJerarquicoError(ErrorCategoria):
    def __init__(self) -> None:
        super().__init__("La asignación generaría un ciclo en la jerarquía")
