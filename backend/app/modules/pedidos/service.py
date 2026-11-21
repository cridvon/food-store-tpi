from datetime import datetime

from app.modules.pedidos.models import DetallePedido, EstadoPedido, Pedido
from app.modules.pedidos.schemas import (
    PedidoCreate,
    PedidoRead,
    PedidosPaginados,
    ResumenPedidos,
)
from app.modules.pedidos.unit_of_work import PedidoUnitOfWork
from app.modules.productos.service import ProductoNoEncontrado
from app.modules.usuarios.models import ahora_utc
from app.modules.usuarios.schemas import UserPublic

# ---------------------------------------------------------------------------
# Excepciones de dominio (el Router las traduce a códigos HTTP)
# ---------------------------------------------------------------------------


class PedidoNoEncontrado(Exception):  # 404
    pass


class PedidoAjeno(Exception):  # 403
    pass


class ReglaDeNegocio(Exception):  # 400
    pass


class StockInsuficiente(ReglaDeNegocio):
    pass


class ProductoNoDisponible(ReglaDeNegocio):
    pass


class ProductoRepetido(ReglaDeNegocio):
    pass


class TransicionInvalida(ReglaDeNegocio):
    pass


# RN-02: mapa de transiciones válidas. Los estados terminales no tienen salida.
TRANSICIONES: dict[EstadoPedido, set[EstadoPedido]] = {
    EstadoPedido.PENDIENTE: {EstadoPedido.EN_PREPARACION, EstadoPedido.CANCELADO},
    EstadoPedido.EN_PREPARACION: {EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO},
    EstadoPedido.ENTREGADO: set(),
    EstadoPedido.CANCELADO: set(),
}


class PedidoService:
    def __init__(self, uow: PedidoUnitOfWork) -> None:
        self.uow = uow

    # -- RN-01: creación transaccional -------------------------------------
    def crear(self, datos: PedidoCreate, usuario: UserPublic) -> PedidoRead:
        with self.uow as uow:
            ids = [item.producto_id for item in datos.items]
            if len(ids) != len(set(ids)):
                raise ProductoRepetido("Un producto no puede repetirse en el pedido")

            pedido = Pedido(
                usuario_id=usuario.id,
                estado=EstadoPedido.PENDIENTE,
                forma_pago=datos.forma_pago,
                direccion_entrega=datos.direccion_entrega.strip(),
                notas=datos.notas,
                total=0,
            )
            uow.pedidos.add(pedido)

            total = 0.0
            for item in datos.items:
                # Bloquea la fila del producto hasta el commit del Unit of Work
                producto = uow.productos.get_para_actualizar(item.producto_id)
                if producto is None or not producto.activo:
                    raise ProductoNoEncontrado(f"Producto {item.producto_id} no encontrado")
                if not producto.disponible:
                    raise ProductoNoDisponible(f"«{producto.nombre}» no está disponible")
                if producto.stock < item.cantidad:
                    raise StockInsuficiente(
                        f"Stock insuficiente de «{producto.nombre}»: "
                        f"hay {producto.stock} y se pidieron {item.cantidad}"
                    )

                producto.stock -= item.cantidad
                uow.session.add(producto)

                subtotal = round(producto.precio_base * item.cantidad, 2)
                pedido.items.append(
                    DetallePedido(
                        producto_id=item.producto_id,
                        cantidad=item.cantidad,
                        nombre_producto=producto.nombre,  # copia (RN-05)
                        precio_unitario=producto.precio_base,  # copia (RN-05)
                        subtotal=subtotal,
                    )
                )
                total += subtotal

            pedido.total = round(total, 2)
            uow.session.add(pedido)
            uow.session.flush()
            return PedidoRead.model_validate(pedido)
        # Si algo falla, el __exit__ hace rollback: no se guarda el pedido ni el descuento de stock

    # -- Consultas ---------------------------------------------------------
    def listar(
        self, usuario: UserPublic, *, estado: EstadoPedido | None, skip: int, limit: int
    ) -> PedidosPaginados:
        with self.uow as uow:
            # RN-04: el cliente ve solo los suyos; el admin, todos
            filtro_usuario = None if usuario.role == "admin" else usuario.id
            total, pedidos = uow.pedidos.list_by_usuario(
                filtro_usuario, estado=estado, skip=skip, limit=limit
            )
            return PedidosPaginados(total=total, items=[PedidoRead.model_validate(p) for p in pedidos])

    def obtener(self, pedido_id: int, usuario: UserPublic) -> PedidoRead:
        with self.uow as uow:
            pedido = self._buscar(uow, pedido_id)
            if usuario.role != "admin" and pedido.usuario_id != usuario.id:
                raise PedidoAjeno("El pedido pertenece a otro usuario")
            return PedidoRead.model_validate(pedido)

    def resumen(self) -> ResumenPedidos:
        with self.uow as uow:
            conteos = uow.pedidos.count_by_estado()
            # "Hoy" según la zona horaria del servidor
            inicio_hoy = datetime.now().astimezone().replace(hour=0, minute=0, second=0, microsecond=0)
            return ResumenPedidos(
                pendientes=conteos.get(EstadoPedido.PENDIENTE, 0),
                en_preparacion=conteos.get(EstadoPedido.EN_PREPARACION, 0),
                entregados=conteos.get(EstadoPedido.ENTREGADO, 0),
                cancelados=conteos.get(EstadoPedido.CANCELADO, 0),
                pedidos_hoy=uow.pedidos.count_desde(inicio_hoy),
                ingresos_entregados=round(uow.pedidos.suma_total_por_estado(EstadoPedido.ENTREGADO), 2),
            )

    # -- RN-02 / RN-03: cambios de estado ------------------------------------
    def cambiar_estado(self, pedido_id: int, nuevo: EstadoPedido) -> PedidoRead:
        """Admin: avanza o cancela según la máquina de estados."""
        with self.uow as uow:
            pedido = self._buscar(uow, pedido_id)
            self._aplicar_transicion(uow, pedido, nuevo)
            return PedidoRead.model_validate(pedido)

    def cancelar_propio(self, pedido_id: int, usuario: UserPublic) -> PedidoRead:
        """Dueño: cancela su pedido solo si está PENDIENTE (RN-04)."""
        with self.uow as uow:
            pedido = self._buscar(uow, pedido_id)
            if pedido.usuario_id != usuario.id:
                raise PedidoAjeno("El pedido pertenece a otro usuario")
            if pedido.estado != EstadoPedido.PENDIENTE:
                raise TransicionInvalida("Solo se puede cancelar un pedido en estado PENDIENTE")
            self._aplicar_transicion(uow, pedido, EstadoPedido.CANCELADO)
            return PedidoRead.model_validate(pedido)

    @staticmethod
    def _aplicar_transicion(uow: PedidoUnitOfWork, pedido: Pedido, nuevo: EstadoPedido) -> None:
        actual = EstadoPedido(pedido.estado)
        if nuevo not in TRANSICIONES[actual]:
            raise TransicionInvalida(f"No se puede pasar de {actual} a {nuevo}")

        if nuevo == EstadoPedido.CANCELADO:
            # RN-03: restituye el stock en la misma transacción que cambia el estado
            for linea in pedido.items:
                producto = uow.productos.get_para_actualizar(linea.producto_id)
                if producto is not None:
                    producto.stock += linea.cantidad
                    uow.session.add(producto)

        pedido.estado = nuevo
        pedido.updated_at = ahora_utc()
        uow.session.add(pedido)
        uow.session.flush()

    @staticmethod
    def _buscar(uow: PedidoUnitOfWork, pedido_id: int) -> Pedido:
        pedido = uow.pedidos.get_by_id(pedido_id)
        if pedido is None:
            raise PedidoNoEncontrado(f"Pedido {pedido_id} no encontrado")
        return pedido
