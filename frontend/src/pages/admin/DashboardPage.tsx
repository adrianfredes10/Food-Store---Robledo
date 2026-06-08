import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAdminDashboard } from "@/features/admin";

function toNum(v: string | number) {
  return typeof v === "number" ? v : Number.parseFloat(String(v));
}

export function AdminDashboardPage() {
  const { data, isLoading, isError } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm font-bold uppercase tracking-widest text-muted animate-pulse">
          Cargando métricas...
        </p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 rounded-2xl bg-danger/5 border border-danger/20 text-center">
        <p className="text-sm font-bold text-danger uppercase tracking-widest">
          Falla en la recuperación de métricas de rendimiento.
        </p>
      </div>
    );
  }

  const barData = Object.entries(data.pedidos_por_estado).map(([estado, cantidad]) => ({
    estado,
    cantidad,
  }));

  const lineData = data.ventas_por_dia.map((v) => ({
    fecha: v.fecha,
    total: toNum(v.total),
  }));

  const totalIngresosNum = toNum(data.ingresos_totales);

  return (
    <div className="flex h-full flex-col gap-2 min-h-0">

      {/* ── KPI cards — 2×2 en mobile, 3 columnas en md+ ───────────────── */}
      <div className="shrink-0 grid grid-cols-2 gap-2 md:grid-cols-3">

        {/* Volumen pedidos */}
        <div className="flex flex-col justify-between rounded-xl border border-border bg-white p-3 shadow-sm">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted">
            Volumen Pedidos
          </span>
          <p className="mt-1 font-outfit text-2xl font-black tracking-tighter text-primary">
            {data.total_pedidos}
          </p>
        </div>

        {/* Ingresos */}
        <div className="flex flex-col justify-between rounded-xl bg-primary p-3 shadow-sm">
          <span className="text-[9px] font-bold uppercase tracking-widest text-white/75">
            Ingresos
          </span>
          <div className="mt-1">
            <p className="break-words font-outfit text-base font-black tracking-tighter text-white md:text-xl">
              {totalIngresosNum.toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS",
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="text-[9px] font-bold text-white/55">
              Órdenes finalizadas
            </p>
          </div>
        </div>

        {/* Estado de red — ocupa las 2 columnas en mobile */}
        <div className="col-span-2 flex items-center gap-3 rounded-xl border border-border bg-white p-3 shadow-sm md:col-span-1">
          <div className="h-2 w-2 shrink-0 rounded-full bg-success shadow-[0_0_8px_rgb(22_163_74_/_0.45)]" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted">
              Estado de Red
            </p>
            <p className="text-xs font-bold text-primary">Sistemas en línea</p>
          </div>
        </div>
      </div>

      {/* ── Gráficos — 2 columnas en mobile y desktop ───────────────────── */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-2">

        {/* Distribución de estados */}
        <section className="flex min-h-0 flex-col rounded-xl border border-border bg-white p-3 shadow-sm">
          <h2 className="shrink-0 mb-2 border-b border-border pb-2 text-[9px] font-black uppercase tracking-widest text-primary">
            Distribución
          </h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="estado"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 8, fontWeight: 700, fill: "var(--color-muted)" }}
                  dy={4}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 8, fill: "var(--color-muted)" }}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                />
                <Bar dataKey="cantidad" fill="var(--color-primary)" radius={[3, 3, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Evolución de ventas */}
        <section className="flex min-h-0 flex-col rounded-xl border border-border bg-white p-3 shadow-sm">
          <h2 className="shrink-0 mb-2 border-b border-border pb-2 text-[9px] font-black uppercase tracking-widest text-primary">
            Ventas
          </h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis
                  dataKey="fecha"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 8, fontWeight: 700, fill: "var(--color-muted)" }}
                  dy={4}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 8, fill: "var(--color-muted)" }}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "0.75rem",
                    border: "1px solid var(--color-border)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "11px",
                    fontWeight: "bold",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "var(--color-accent)", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
