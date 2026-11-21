from app.modules.categorias.models import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.unit_of_work import CategoriaUnitOfWork


class CategoriaNoEncontrada(Exception):
    pass


class NombreDuplicado(Exception):
    pass


class CategoriaService:
    def __init__(self, uow: CategoriaUnitOfWork) -> None:
        self.uow = uow

    def listar(self) -> list[CategoriaRead]:
        with self.uow as uow:
            return [CategoriaRead.model_validate(c) for c in uow.categorias.list_activas()]

    def obtener(self, categoria_id: int) -> CategoriaRead:
        with self.uow as uow:
            return CategoriaRead.model_validate(self._buscar_activa(uow, categoria_id))

    def crear(self, datos: CategoriaCreate) -> CategoriaRead:
        with self.uow as uow:
            nombre = datos.nombre.strip()
            if uow.categorias.get_by_nombre(nombre):
                raise NombreDuplicado(f"Ya existe una categoría llamada «{nombre}»")
            categoria = Categoria(nombre=nombre, descripcion=datos.descripcion)
            uow.categorias.add(categoria)
            return CategoriaRead.model_validate(categoria)

    def actualizar(self, categoria_id: int, datos: CategoriaUpdate) -> CategoriaRead:
        with self.uow as uow:
            categoria = self._buscar_activa(uow, categoria_id)
            cambios = datos.model_dump(exclude_unset=True)
            if cambios.get("nombre") is not None:
                nombre = cambios["nombre"].strip()
                otra = uow.categorias.get_by_nombre(nombre)
                if otra is not None and otra.id != categoria.id:
                    raise NombreDuplicado(f"Ya existe una categoría llamada «{nombre}»")
                cambios["nombre"] = nombre
            elif "nombre" in cambios:
                del cambios["nombre"]  # el nombre es obligatorio: un null no lo borra
            categoria.sqlmodel_update(cambios)
            uow.session.add(categoria)
            uow.session.flush()
            return CategoriaRead.model_validate(categoria)

    def eliminar(self, categoria_id: int) -> None:
        """Baja lógica. No da de baja sus productos ni libera el nombre."""
        with self.uow as uow:
            categoria = self._buscar_activa(uow, categoria_id)
            categoria.activo = False
            uow.session.add(categoria)

    @staticmethod
    def _buscar_activa(uow: CategoriaUnitOfWork, categoria_id: int) -> Categoria:
        categoria = uow.categorias.get_by_id(categoria_id)
        if categoria is None or not categoria.activo:
            raise CategoriaNoEncontrada(f"Categoría {categoria_id} no encontrada")
        return categoria
