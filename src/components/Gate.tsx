import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { unlock } from "../lib/auth";
export function Gate({
  configured,
  onOpen,
  onReset,
}: {
  configured: boolean;
  onOpen: () => void;
  onReset: () => void;
}) {
  const [password, set] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="gate">
      <div className="wordmark">
        G<span>Force</span>
      </div>
      <section className="panel stack">
        <span className="eyebrow">SEU ESPAÇO DE MOVIMENTO</span>
        <h1>{configured ? "Bem-vinda de volta." : "Bem-vinda ao GForce!"}</h1>
        <p>Um passo de cada vez. Seu momento de cuidar de você começa aqui.</p>
        <p>
          {configured
            ? "Digite sua senha para acessar os registros deste navegador."
            : "Entre com a senha já definida. Vamos juntas, no seu ritmo! O acesso fica lembrado neste navegador."}
        </p>
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await unlock(password);
              onOpen();
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Senha
            <input
              autoCapitalize="none"
              spellCheck={false}
              autoComplete="current-password"
              type="password"
              minLength={1}
              required
              value={password}
              onChange={(e) => {
                set(e.target.value);
                setError("");
              }}
            />
          </label>
          {error && (
            <p role="alert" className="notice">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? "Verificando…" : configured ? "Desbloquear" : "Entrar"}
            <ChevronRight size={18} />
          </button>
        </form>
        {configured && (
          <button className="text-button" onClick={onReset}>
            Reinicializar dados deste navegador
          </button>
        )}
        <small>
          Controle de acesso neste aparelho. O site é público e seus registros
          ficam neste navegador. A senha não criptografa os registros.
        </small>
      </section>
    </div>
  );
}
