from app.modules.categorias.service import CategoriaNoEncontrada
from app.modules.productos.models import Producto
from app.modules.productos.schemas import (
    ProductoCreate,
    ProductoRead,
    ProductosPaginados,
    ProductoStockUpdate,
    ProductoUpdate,
)
from app.modules.productos.unit_of_work import ProductoUnitOfWork


class ProductoNoEncontrado(Exception):
    pass


class ProductoService:
    def __init__(self, uow: ProductoUnitOfWork) -> None:
        self.uow = uow

    def listar(
        self,
        *,
        skip: int,
        limit: int,
        search: str | None,
        categoria_id: int | None,
        disponible: bool | None,
    ) -> ProductosPaginados:
        with self.uow as uow:
            total, productos = uow.productos.search(
                skip=skip, limit=limit, search=search, categoria_id=categoria_id, disponible=disponible
            )
            return ProductosPaginados(
                total=total, items=[ProductoRead.model_validate(p) for p in productos]
            )

    def obtener(self, producto_id: int) -> ProductoRead:
        with self.uow as uow:
            return ProductoRead.model_validate(self._buscar_activo(uow, producto_id))

    def crear(self, datos: ProductoCreate) -> ProductoRead:
        with self.uow as uow:
            self._validar_categoria(uow, datos.categoria_id)
            producto = Producto.model_validate(datos)
            uow.productos.add(producto)
            return ProductoRead.model_validate(producto)

    def actualizar(self, producto_id: int, datos: ProductoUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._buscar_activo(uow, producto_id)
            # Solo los campos enviados; un null en un campo obligatorio se ignora
            cambios = datos.model_dump(exclude_unset=True)
            for campo in ("nombre", "precio_base", "stock", "disponible", "categoria_id"):
                if cambios.get(campo, 0) is None:
                    del cambios[campo]
            if "categoria_id" in cambios:
                self._validar_categoria(uow, cambios["categoria_id"])
            producto.sqlmodel_update(cambios)
            return self._guardar(uow, producto)

    def actualizar_stock(self, producto_id: int, datos: ProductoStockUpdate) -> ProductoRead:
        with self.uow as uow:
            producto = self._buscar_activo(uow, producto_id)
            producto.stock = datos.stock
            producto.disponible = datos.disponible
            return self._guardar(uow, producto)

    def eliminar(self, producto_id: int) -> None:
        with self.uow as uow:
            producto = self._buscar_activo(uow, producto_id)
            producto.activo = False
            uow.session.add(producto)

    @staticmethod
    def _guardar(uow: ProductoUnitOfWork, producto: Producto) -> ProductoRead:
        uow.session.add(producto)
        uow.session.flush()
        uow.session.refresh(producto)  # recarga la categoría si cambió categoria_id
        return ProductoRead.model_validate(producto)

    @staticmethod
    def _buscar_activo(uow: ProductoUnitOfWork, producto_id: int) -> Producto:
        producto = uow.productos.get_by_id(producto_id)
        if producto is None or not producto.activo:
            raise ProductoNoEncontrado(f"Producto {producto_id} no encontrado")
        return producto

    @staticmethod
    def _validar_categoria(uow: ProductoUnitOfWork, categoria_id: int) -> None:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada(f"Categoría {categoria_id} no encontrada o dada de baja")
