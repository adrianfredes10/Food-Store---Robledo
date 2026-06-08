"""Display de cocina (KDS): listado, transiciones por rol y eventos."""

from __future__ import annotations

from decimal import Decimal

import pytest
from sqlmodel import Session

from app.core.enums import EstadoPedido, TipoServicioPedido
from app.core.security.password import hash_password
from app.core.uow.unit_of_work import UnitOfWork
from app.modules.mesas.model import Mesa
from app.modules.pagos.model import FormaPago
from app.modules.pedidos.service import PedidoService
from app.modules.productos.model import Categoria, Producto
from app.modules.usuarios.model import Rol, Usuario, UsuarioRol


@pytest.fixture
def cocina_token(client) -> str:
    r = client.post(
        "/api/v1/auth/login",
        json={"email": "cocina@foodstore.com", "password": "Cocina1234!"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture
def headers_cocina(cocina_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {cocina_token}"}


def _pedido_confirmado_en_cocina(engine) -> int:
    with Session(engine) as session:
        uow = UnitOfWork(session)
        if session.get(FormaPago, "MERCADOPAGO") is None:
            session.add(FormaPago(codigo="MERCADOPAGO", nombre="MP", habilitado=True))
        cat = Categoria(nombre="CatCocina", parent_id=None)
        session.add(cat)
        session.flush()
        assert cat.id is not None
        prod = Producto(
            categoria_id=cat.id,
            nombre="Plato Cocina",
            precio=Decimal("100.00"),
            disponible=True,
        )
        session.add(prod)
        user = Usuario(
            email="cliente_cocina@test.com",
            hashed_password=hash_password("secretito123"),
            nombre="Cli",
            activo=True,
        )
        session.add(user)
        session.flush()
        for n in range(1, 31):
            session.add(Mesa(numero=n, activa=True))
        session.flush()
        assert prod.id is not None and user.id is not None
        svc = PedidoService()
        pedido = svc.crear_pedido(
            uow,
            usuario_id=user.id,
            lineas=[(prod.id, 1, [1, 2])],
            tipo_servicio=TipoServicioPedido.RETIRO_EN_LOCAL,
            numero_mesa=3,
            observaciones_cliente="Sin sal",
        )
        session.flush()
        assert pedido.id is not None
        svc.transicionar_estado(uow, pedido.id, EstadoPedido.CONFIRMADO)
        session.commit()
        return pedido.id


class TestCocinaListado:
    def test_listar_confirmado_en_prep_y_en_camino(self, client, headers_cocina, engine):
        pid = _pedido_confirmado_en_cocina(engine)
        r = client.get("/api/v1/cocina/pedidos", headers=headers_cocina)
        assert r.status_code == 200
        items = r.json()["items"]
        ids = [x["id"] for x in items]
        assert pid in ids
        match = next(x for x in items if x["id"] == pid)
        assert match["estado"] == "CONFIRMADO"
        assert match["numero_mesa"] == 3
        assert match["observaciones_cliente"] == "Sin sal"
        assert len(match["detalles"]) == 1
        assert match["detalles"][0]["nombre_producto"] == "Plato Cocina"
        assert match["detalles"][0]["personalizacion"] == [1, 2]
        assert "confirmado_en" in match

        client.post(
            f"/api/v1/cocina/pedidos/{pid}/transicion",
            headers=headers_cocina,
            json={"estado": "EN_PREP"},
        )
        client.post(
            f"/api/v1/cocina/pedidos/{pid}/transicion",
            headers=headers_cocina,
            json={"estado": "EN_CAMINO"},
        )
        r2 = client.get("/api/v1/cocina/pedidos", headers=headers_cocina)
        finalizado = next(x for x in r2.json()["items"] if x["id"] == pid)
        assert finalizado["estado"] == "EN_CAMINO"

    def test_cliente_no_accede(self, client, headers_client):
        r = client.get("/api/v1/cocina/pedidos", headers=headers_client)
        assert r.status_code == 403


class TestCocinaTransiciones:
    def test_cocina_confirmado_a_en_prep(self, client, headers_cocina, engine):
        pid = _pedido_confirmado_en_cocina(engine)
        r = client.post(
            f"/api/v1/cocina/pedidos/{pid}/transicion",
            headers=headers_cocina,
            json={"estado": "EN_PREP"},
        )
        assert r.status_code == 200
        assert r.json()["estado"] == "EN_PREP"

    def test_cocina_en_prep_a_en_camino(self, client, headers_cocina, engine):
        pid = _pedido_confirmado_en_cocina(engine)
        client.post(
            f"/api/v1/cocina/pedidos/{pid}/transicion",
            headers=headers_cocina,
            json={"estado": "EN_PREP"},
        )
        r = client.post(
            f"/api/v1/cocina/pedidos/{pid}/transicion",
            headers=headers_cocina,
            json={"estado": "EN_CAMINO"},
        )
        assert r.status_code == 200
        assert r.json()["estado"] == "EN_CAMINO"

    def test_cocina_no_puede_cancelar_403(self, client, headers_cocina, engine):
        pid = _pedido_confirmado_en_cocina(engine)
        r = client.post(
            f"/api/v1/cocina/pedidos/{pid}/transicion",
            headers=headers_cocina,
            json={"estado": "CANCELADO"},
        )
        assert r.status_code == 403

    def test_cocina_no_puede_entregado_403(self, client, headers_cocina, engine):
        pid = _pedido_confirmado_en_cocina(engine)
        client.post(
            f"/api/v1/cocina/pedidos/{pid}/transicion",
            headers=headers_cocina,
            json={"estado": "EN_PREP"},
        )
        client.post(
            f"/api/v1/cocina/pedidos/{pid}/transicion",
            headers=headers_cocina,
            json={"estado": "EN_CAMINO"},
        )
        r = client.post(
            f"/api/v1/cocina/pedidos/{pid}/transicion",
            headers=headers_cocina,
            json={"estado": "ENTREGADO"},
        )
        assert r.status_code == 403

    def test_admin_puede_en_prep_desde_confirmado(self, client, headers_admin, engine):
        pid = _pedido_confirmado_en_cocina(engine)
        r = client.post(
            f"/api/v1/admin/pedidos/{pid}/transicion",
            headers=headers_admin,
            json={"estado": "EN_PREP"},
        )
        assert r.status_code == 200
        assert r.json()["estado"] == "EN_PREP"


class TestCocinaEventosUow:
    def test_transicion_encola_evento(self, engine) -> None:
        with Session(engine) as session:
            uow = UnitOfWork(session)
            if session.get(Rol, "COCINA") is None:
                session.add(Rol(codigo="COCINA", nombre="Cocina", activo=True))
            if session.get(FormaPago, "MERCADOPAGO") is None:
                session.add(FormaPago(codigo="MERCADOPAGO", nombre="MP", habilitado=True))
            cat = Categoria(nombre="E", parent_id=None)
            session.add(cat)
            session.flush()
            prod = Producto(categoria_id=cat.id, nombre="P", precio=Decimal("10"))
            user = Usuario(
                email="ev@test.com",
                hashed_password=hash_password("x"),
                nombre="U",
                activo=True,
            )
            session.add(prod)
            session.add(user)
            session.flush()
            for n in range(1, 5):
                session.add(Mesa(numero=n, activa=True))
            svc = PedidoService()
            p = svc.crear_pedido(
                uow,
                usuario_id=user.id,
                lineas=[(prod.id, 1, None)],
                tipo_servicio=TipoServicioPedido.RETIRO_EN_LOCAL,
                numero_mesa=1,
            )
            session.flush()
            svc.transicionar_estado(uow, p.id, EstadoPedido.CONFIRMADO)
            uow.drain_cocina_events()
            svc.transicionar_estado(
                uow,
                p.id,
                EstadoPedido.EN_PREP,
                roles_actor=frozenset({"COCINA"}),
            )
            events = uow.drain_cocina_events()
            assert len(events) == 1
            assert events[0]["type"] == "PEDIDO_EN_PREPARACION"
            session.commit()

    def test_enrich_ws_incluye_pedido_completo(self, engine) -> None:
        from app.modules.cocina.emit import enrich_cocina_events_for_broadcast
        from app.modules.cocina.events import PEDIDO_CONFIRMADO, PEDIDO_EN_PREPARACION

        with Session(engine) as session:
            uow = UnitOfWork(session)
            if session.get(FormaPago, "MERCADOPAGO") is None:
                session.add(FormaPago(codigo="MERCADOPAGO", nombre="MP", habilitado=True))
            cat = Categoria(nombre="WS", parent_id=None)
            session.add(cat)
            session.flush()
            prod = Producto(categoria_id=cat.id, nombre="WS Plato", precio=Decimal("50"))
            user = Usuario(
                email="ws@test.com",
                hashed_password=hash_password("x"),
                nombre="U",
                activo=True,
            )
            session.add(prod)
            session.add(user)
            session.flush()
            for n in range(1, 5):
                session.add(Mesa(numero=n, activa=True))
            svc = PedidoService()
            p = svc.crear_pedido(
                uow,
                usuario_id=user.id,
                lineas=[(prod.id, 2, [3])],
                tipo_servicio=TipoServicioPedido.RETIRO_EN_LOCAL,
                numero_mesa=2,
                observaciones_cliente="Extra picante",
            )
            session.flush()
            assert p.id is not None
            svc.transicionar_estado(uow, p.id, EstadoPedido.CONFIRMADO)
            session.commit()

            raw = [{"type": PEDIDO_CONFIRMADO, "pedido_id": p.id}]
            enriched = enrich_cocina_events_for_broadcast(uow, raw)
            assert enriched[0]["type"] == PEDIDO_CONFIRMADO
            pedido = enriched[0]["pedido"]
            assert pedido["id"] == p.id
            assert pedido["estado"] == "CONFIRMADO"
            assert pedido["observaciones_cliente"] == "Extra picante"
            assert pedido["numero_mesa"] == 2
            assert len(pedido["detalles"]) == 1
            assert pedido["detalles"][0]["nombre_producto"] == "WS Plato"
            assert "confirmado_en" in pedido

            svc.transicionar_estado(
                uow,
                p.id,
                EstadoPedido.EN_PREP,
                roles_actor=frozenset({"COCINA"}),
            )
            session.commit()
            raw_prep = [{"type": PEDIDO_EN_PREPARACION, "pedido_id": p.id}]
            enriched_prep = enrich_cocina_events_for_broadcast(uow, raw_prep)
            assert enriched_prep[0]["pedido"]["estado"] == "EN_PREP"

            svc.transicionar_estado(
                uow,
                p.id,
                EstadoPedido.EN_CAMINO,
                roles_actor=frozenset({"COCINA"}),
            )
            session.commit()
            from app.modules.cocina.events import PEDIDO_EN_CAMINO

            raw_camino = [{"type": PEDIDO_EN_CAMINO, "pedido_id": p.id}]
            enriched_camino = enrich_cocina_events_for_broadcast(uow, raw_camino)
            assert enriched_camino[0]["pedido"]["estado"] == "EN_CAMINO"
