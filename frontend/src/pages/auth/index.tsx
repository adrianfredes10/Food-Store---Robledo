import { type FormEvent, useState } from "react";
import { ShoppingBag } from "lucide-react";

import { useLogin, useRegister } from "@/features/auth";
import { FormField, LoadingButton } from "@/shared/ui";

export function AuthLoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");

  const loginMut = useLogin();
  // al registrarse exitosamente vuelvo al login y limpio la contraseña
  const registerMut = useRegister(() => {
    setMode("login");
    setPassword("");
  });

  const busy = loginMut.isPending || registerMut.isPending;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    // dependiendo del modo llamo login o registro
    if (mode === "login") {
      loginMut.mutate({ email: email.trim(), password });
      return;
    }
    registerMut.mutate({
      email: email.trim(),
      password,
      nombre: nombre.trim(),
      apellido: apellido.trim() || null,
    });
  };

  const inputClass =
    "mt-1 w-full rounded-xl border border-border bg-bg-secondary px-3 py-2 text-sm font-bold text-primary transition-all focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent sm:px-4 sm:py-2.5 md:py-3";

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col justify-center pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-sm shrink-0 fade-in">
        <div className="mb-4 flex flex-col items-center text-center sm:mb-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent shadow-sm sm:mb-4 sm:h-12 sm:w-12 sm:rounded-2xl">
            <ShoppingBag className="h-5 w-5 text-white sm:h-6 sm:w-6" strokeWidth={2.2} />
          </div>
          <h1 className="font-outfit text-xl font-black tracking-tight text-primary sm:text-2xl md:text-3xl">
            {mode === "login" ? "Te damos la bienvenida" : "Creá tu cuenta"}
          </h1>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted sm:mt-2 sm:text-sm">
            {mode === "login" ? "Iniciá sesión para continuar" : "Completá tus datos"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6 md:p-8">
          <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <FormField label="Nombre">
                  <input
                    required
                    placeholder="Tu nombre"
                    className={inputClass}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </FormField>
                <FormField label="Apellido">
                  <input
                    placeholder="Tu apellido"
                    className={inputClass}
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                  />
                </FormField>
              </div>
            )}

            <FormField label="Correo electrónico">
              <input
                required
                type="email"
                placeholder="usuario@foodstore.com"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            <FormField label="Contraseña">
              <input
                required
                type="password"
                minLength={mode === "register" ? 8 : 1}
                placeholder="••••••••"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>

            <div className="pt-1 sm:pt-2">
              <LoadingButton
                type="submit"
                isLoading={busy}
                className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-[0.99] sm:py-3.5"
              >
                {mode === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
              </LoadingButton>
            </div>
          </form>

          <div className="mt-4 border-t border-border pt-4 text-center text-xs font-medium text-muted sm:mt-6 sm:pt-6 sm:text-sm">
            {mode === "login" ? "¿Primera vez acá? " : "¿Ya tenés una cuenta? "}
            <button
              type="button"
              className="font-bold text-accent transition-colors hover:text-accent-hover hover:underline"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Registrate ahora" : "Iniciá sesión"}
            </button>
          </div>

          {mode === "login" && (
            <div className="mt-3 rounded-xl border border-border bg-bg-secondary px-3 py-2 text-center sm:mt-4 sm:p-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted sm:text-[10px]">
                Credenciales demo
              </p>
              <p className="mt-1 break-all font-mono text-[10px] font-bold leading-snug text-primary sm:text-xs">
                <span className="font-sans font-medium text-muted">User </span>admin@foodstore.com
                <span className="mx-1 text-border">·</span>
                <span className="font-sans font-medium text-muted">Pass </span>Admin1234!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
