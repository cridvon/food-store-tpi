"""Carga inicial idempotente: ejecutar con `python -m app.db.seed`.

Crea el usuario admin, un cliente de prueba, 4 categorías y 10 productos.
Si un registro ya existe (por username o por nombre) no lo duplica.
"""

from sqlmodel import Session, select

from app.core.database import create_all_tables, engine
from app.core.security import hash_password
from app.modules.categorias.models import Categoria
from app.modules.productos.models import Producto
from app.modules.usuarios.models import Usuario

IMG = "https://images.unsplash.com/{}?w=600&q=80"

USUARIOS = [
    {"username": "admin", "full_name": "Administrador Food Store", "email": "admin@foodstore.com",
     "password": "Admin1234!", "role": "admin"},
    {"username": "cliente", "full_name": "Cliente de Prueba", "email": "cliente@foodstore.com",
     "password": "Cliente1234!", "role": "user"},
]

CATEGORIAS = {
    "Hamburguesas": "Hamburguesas caseras con papas",
    "Pizzas": "Pizzas a la piedra",
    "Bebidas": "Gaseosas, aguas y cervezas",
    "Postres": "Dulces para cerrar la comida",
}

PRODUCTOS = [
    ("Hamburguesas", "Hamburguesa clásica", "Medallón de 180 g, lechuga, tomate y cheddar", 8500,
     "photo-1568901346375-23c9450c58cd", 25),
    ("Hamburguesas", "Hamburguesa doble bacon", "Doble medallón, panceta crocante y cheddar", 11200,
     "photo-1550547660-d9450f859349", 15),
    ("Hamburguesas", "Hamburguesa veggie", "Medallón de lentejas, rúcula y alioli", 9000,
     "photo-1585109649139-366815a0d713", 10),
    ("Pizzas", "Pizza muzzarella", "Salsa de tomate, muzzarella y aceitunas", 9800,
     "photo-1513104890138-7c749659a591", 20),
    ("Pizzas", "Pizza napolitana", "Muzzarella, tomate en rodajas, ajo y albahaca", 11500,
     "photo-1574071318508-1cdbab80d002", 12),
    ("Pizzas", "Pizza fugazzeta", "Muzzarella y cebolla caramelizada", 10900,
     "photo-1565299624946-b28f40a0ae38", 8),
    ("Bebidas", "Gaseosa 500 ml", "Cola, lima-limón o naranja", 2200,
     "photo-1622483767028-3f66f32aef97", 60),
    ("Bebidas", "Agua mineral 500 ml", "Con o sin gas", 1600,
     "photo-1554866585-cd94860890b7", 50),
    ("Postres", "Flan casero", "Con dulce de leche o crema", 3800,
     "photo-1571877227200-a0d98ea607e9", 18),
    ("Postres", "Brownie con helado", "Brownie tibio con una bocha de helado de crema", 5200,
     "photo-1563805042-7684c019e1cb", 14),
]


def seed() -> None:
    create_all_tables()
    with Session(engine) as session:
        for u in USUARIOS:
            if session.exec(select(Usuario).where(Usuario.username == u["username"])).first() is None:
                session.add(Usuario(
                    username=u["username"], full_name=u["full_name"], email=u["email"],
                    hashed_password=hash_password(u["password"]), role=u["role"],
                ))

        categorias: dict[str, Categoria] = {}
        for nombre, descripcion in CATEGORIAS.items():
            categoria = session.exec(select(Categoria).where(Categoria.nombre == nombre)).first()
            if categoria is None:
                categoria = Categoria(nombre=nombre, descripcion=descripcion)
                session.add(categoria)
                session.flush()
            categorias[nombre] = categoria

        for cat, nombre, descripcion, precio, imagen, stock in PRODUCTOS:
            if session.exec(select(Producto).where(Producto.nombre == nombre)).first() is None:
                session.add(Producto(
                    categoria_id=categorias[cat].id, nombre=nombre, descripcion=descripcion,
                    precio_base=precio, imagen_url=IMG.format(imagen), stock=stock,
                ))

        session.commit()
    print("Seed completo: admin / Admin1234!, cliente / Cliente1234!, 4 categorías y 10 productos.")


if __name__ == "__main__":
    seed()
