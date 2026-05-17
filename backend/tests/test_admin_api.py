"""Panel admin: pedidos con datos de cliente y listado de usuarios registrados."""

from __future__ import annotations


def _post_pedido(client, headers_client, producto_seed, direccion_seed, *, cantidad: int = 1):
    return client.post(
        "/api/v1/pedidos",
        headers=headers_client,
        json={
            "items": [{"producto_id": producto_seed["id"], "cantidad": cantidad}],
            "direccion_entrega_id": direccion_seed["id"],
        },
    )


class TestAdminPedidosCliente:
    def test_listado_incluye_cliente(self, client, headers_admin, headers_client, producto_seed, direccion_seed):
        me = client.get("/api/v1/auth/me", headers=headers_client)
        assert me.status_code == 200
        email_esperado = me.json()["email"]
        nombre_esperado = me.json()["nombre"]
        apellido_esperado = me.json().get("apellido") or ""

        r0 = _post_pedido(client, headers_client, producto_seed, direccion_seed)
        assert r0.status_code == 201, r0.text
        pid = r0.json()["id"]

        r = client.get("/api/v1/admin/pedidos", headers=headers_admin)
        assert r.status_code == 200
        items = r.json()["items"]
        match = next((x for x in items if x["id"] == pid), None)
        assert match is not None
        assert match["cliente_email"] == email_esperado
        assert nombre_esperado in (match["cliente_nombre"] or "")
        if apellido_esperado:
            assert apellido_esperado in (match["cliente_nombre"] or "")

    def test_detalle_incluye_cliente(self, client, headers_admin, headers_client, producto_seed, direccion_seed):
        me = client.get("/api/v1/auth/me", headers=headers_client)
        assert me.status_code == 200
        email_esperado = me.json()["email"]

        r0 = _post_pedido(client, headers_client, producto_seed, direccion_seed)
        assert r0.status_code == 201
        pid = r0.json()["id"]

        r = client.get(f"/api/v1/admin/pedidos/{pid}", headers=headers_admin)
        assert r.status_code == 200
        body = r.json()
        assert body["cliente_email"] == email_esperado
        assert body["cliente_nombre"]


class TestAdminUsuarios:
    def test_listar_usuarios_solo_admin(self, client, headers_client):
        r = client.get("/api/v1/admin/usuarios", headers=headers_client)
        assert r.status_code == 403

    def test_listar_usuarios_incluye_registrados(self, client, headers_admin, headers_client):
        r = client.get("/api/v1/admin/usuarios", headers=headers_admin)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1
        emails = {u["email"] for u in data["items"]}
        me = client.get("/api/v1/auth/me", headers=headers_client)
        assert me.status_code == 200
        assert me.json()["email"] in emails


class TestAdminMesas:
    def test_mesas_solo_admin(self, client, headers_client):
        r = client.get("/api/v1/admin/mesas", headers=headers_client)
        assert r.status_code == 403

    def test_crear_y_estado(self, client, headers_admin):
        r0 = client.post("/api/v1/admin/mesas", headers=headers_admin, json={"numero": 7, "etiqueta": "Ventana"})
        assert r0.status_code == 201, r0.text
        mid = r0.json()["id"]

        r_list = client.get("/api/v1/admin/mesas", headers=headers_admin)
        assert r_list.status_code == 200
        nums = {m["numero"] for m in r_list.json()}
        assert 7 in nums

        r_est = client.get("/api/v1/admin/mesas/estado", headers=headers_admin)
        assert r_est.status_code == 200
        body = r_est.json()
        assert body["resumen"]["total_mesas_activas"] >= 1
        assert any(it["mesa_id"] == mid for it in body["items"])

        r_dup = client.post("/api/v1/admin/mesas", headers=headers_admin, json={"numero": 7})
        assert r_dup.status_code == 409

        r_del = client.delete(f"/api/v1/admin/mesas/{mid}", headers=headers_admin)
        assert r_del.status_code == 204

    def test_mesa_ocupacion_solo_tras_pago_y_liberar_post(
        self,
        client,
        headers_admin,
        headers_client,
        producto_seed,
        engine,
    ) -> None:
        import uuid
        from decimal import Decimal

        from sqlmodel import Session

        from app.core.enums import EstadoPedido, EstadoPago
        from app.core.uow.unit_of_work import UnitOfWork
        from app.modules.pagos.model import Pago
        from app.modules.pedidos.service import PedidoService

        r_p = client.post(
            "/api/v1/pedidos",
            headers=headers_client,
            json={
                "items": [{"producto_id": producto_seed["id"], "cantidad": 1}],
                "forma_pago_codigo": "MERCADOPAGO",
                "tipo_servicio": "RETIRO_EN_LOCAL",
                "numero_mesa": 8,
            },
        )
        assert r_p.status_code == 201, r_p.text
        pid = r_p.json()["id"]
        total = Decimal(str(r_p.json()["total"]))

        r_mesas = client.get("/api/v1/admin/mesas", headers=headers_admin)
        assert r_mesas.status_code == 200
        mid = next(m["id"] for m in r_mesas.json() if m["numero"] == 8)

        r_e0 = client.get("/api/v1/admin/mesas/estado", headers=headers_admin)
        it0 = next(i for i in r_e0.json()["items"] if i["numero"] == 8)
        assert not it0["ocupada"]

        with Session(engine) as session:
            session.add(
                Pago(
                    pedido_id=pid,
                    forma_pago_codigo="MERCADOPAGO",
                    monto=total,
                    estado=EstadoPago.APROBADO,
                    idempotency_key=uuid.uuid4().hex,
                    external_reference=f"pytest-{pid}",
                ),
            )
            session.commit()

        with Session(engine) as session:
            uow = UnitOfWork(session)
            PedidoService().transicionar_estado(uow, pid, EstadoPedido.CONFIRMADO)
            session.commit()

        r_e1 = client.get("/api/v1/admin/mesas/estado", headers=headers_admin)
        it1 = next(i for i in r_e1.json()["items"] if i["numero"] == 8)
        assert it1["ocupada"]
        assert it1["pedido"] is not None
        assert it1["pedido"]["id"] == pid

        r_lib = client.post(f"/api/v1/admin/mesas/{mid}/liberar", headers=headers_admin)
        assert r_lib.status_code == 204

        r_e2 = client.get("/api/v1/admin/mesas/estado", headers=headers_admin)
        it2 = next(i for i in r_e2.json()["items"] if i["numero"] == 8)
        assert not it2["ocupada"]

    def test_liberar_mesa_libre_es_idempotente(self, client, headers_admin) -> None:
        r0 = client.post("/api/v1/admin/mesas", headers=headers_admin, json={"numero": 77})
        assert r0.status_code == 201
        mid = r0.json()["id"]
        r = client.post(f"/api/v1/admin/mesas/{mid}/liberar", headers=headers_admin)
        assert r.status_code == 204
