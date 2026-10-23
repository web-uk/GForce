import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  defaultReminders,
  localNotification,
  permission,
  preparePushService,
  pushAppId,
  reminderPreferences,
  reminderTimeZone,
  saveReminderPreferences,
  stopNotifications,
  syncPushPreferences,
  type OneSignalSDK,
  type ReminderPreferences,
} from "../lib/notifications";
export function Notifications({ settings = false }: { settings?: boolean }) {
  const [prefs, setPrefs] = useState<ReminderPreferences>(() => {
    try {
      return reminderPreferences();
    } catch {
      return { ...defaultReminders, decision: "declined" };
    }
  });
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState<OneSignalSDK | null>(null);
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (
      prefs.decision !== "enabled" ||
      !pushAppId ||
      permission() !== "granted"
    )
      return;
    let mounted = true;
    void syncPushPreferences(prefs)
      .then((ok) => {
        if (mounted) setConnected(ok);
      })
      .catch(() => {
        if (mounted)
          setStatus(
            "Permissão salva. Sem conexão com o serviço de lembretes; tente novamente nas configurações.",
          );
      });
    return () => {
      mounted = false;
    };
  }, [prefs]);
  function persist(next: ReminderPreferences) {
    saveReminderPreferences(next);
    setPrefs(next);
  }
  async function enable() {
    setStatus("");
    if (permission() === "unsupported") {
      persist({ ...prefs, decision: "declined" });
      setStatus(
        "Para receber avisos no iPhone, adicione o GForce à Tela de Início pelo Safari e abra pelo ícone. Depois, ative em Configurações.",
      );
      return;
    }
    if (permission() === "denied") {
      persist({ ...prefs, decision: "declined" });
      setStatus(
        "Os avisos estão bloqueados no navegador. Altere a permissão nos ajustes do aparelho para tentar novamente.",
      );
      return;
    }
    if (pushAppId && !ready && permission() !== "granted") {
      setBusy(true);
      try {
        setReady(await preparePushService());
        setStatus(
          "Serviço pronto. Toque em “Permitir neste aparelho” para confirmar a permissão do navegador.",
        );
      } catch (e) {
        setStatus((e as Error).message);
      } finally {
        setBusy(false);
      }
      return;
    }
    setBusy(true);
    try {
      // A solicitação nativa acontece neste clique, sem esperar uma chamada de rede.
      if (permission() !== "granted") {
        if (ready) await ready.Notifications.requestPermission();
        else await Notification.requestPermission();
      }
      if (permission() !== "granted") {
        persist({ ...prefs, decision: "declined" });
        setStatus(
          "Tudo bem! Não voltaremos a perguntar automaticamente. Você pode ativar quando quiser nas configurações.",
        );
        return;
      }
      const next = { ...prefs, decision: "enabled" as const };
      persist(next);
      const ok = pushAppId ? await syncPushPreferences(next) : false;
      setConnected(ok);
      setStatus(
        ok
          ? "Notificações ativadas. Seu convite foi salvo e não será perguntado novamente."
          : "Permissão salva neste aparelho. Os lembretes com o app fechado aguardam a conexão e configuração do serviço.",
      );
      await localNotification(
        "Que bom ter você por aqui! Seus lembretes serão convites leves, sem pressa e no seu ritmo. 💗",
        "gforce-welcome",
      );
    } catch (e) {
      setStatus((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const show = settings || prefs.decision === "pending";
  if (!show) return null;
  return (
    <section
      className="panel stack notification-settings"
      aria-label={
        settings ? "Configurações de notificações" : "Convite para notificações"
      }
    >
      <div className="row">
        <Bell className="pink" size={22} />
        <h2>
          {settings
            ? "Notificações e carinho no dia"
            : "Quer receber um lembrete gentil?"}
        </h2>
      </div>
      <p>
        Convites para se movimentar, cuidar da alimentação e reservar tempo para
        você. Você escolhe ativar e pode parar quando quiser.
      </p>
      {settings && (
        <small>
          Com sua autorização, o OneSignal recebe dados técnicos do navegador,
          inscrição, entrega e abertura dos avisos. Não enviamos seu nome,
          perfil, medidas ou histórico. Os registros de treino continuam locais.
        </small>
      )}
      {settings && permission() === "denied" && (
        <p className="notice">
          Os avisos estão bloqueados no navegador. Altere a permissão nos
          ajustes do aparelho para tentar novamente.
        </p>
      )}
      {prefs.decision !== "enabled" ? (
        <div className="row wrap">
          <button
            className="primary"
            disabled={busy}
            onClick={() => void enable()}
          >
            {busy
              ? "Conectando…"
              : ready
                ? "Permitir neste aparelho"
                : "Ativar notificações"}
          </button>
          {!settings && (
            <button
              disabled={busy}
              onClick={() => {
                persist({ ...prefs, decision: "declined" });
                setStatus("");
              }}
            >
              Agora não
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="tag">
            {permission() !== "granted"
              ? "PERMISSÃO ALTERADA NO APARELHO"
              : connected
                ? "WEB PUSH CONECTADO"
                : "PERMISSÃO SALVA NESTE APARELHO"}
          </p>
          <p>
            Convites por volta de 9h, 13h e 18h · fuso {reminderTimeZone}.
            Horários aproximados: o navegador, conexão e modo Foco podem adiar a
            entrega.
          </p>
          {!pushAppId && (
            <p className="notice">
              O serviço de lembretes com o app fechado ainda não está
              configurado. As mensagens dentro do app já funcionam.
            </p>
          )}
          {settings && (
            <>
              {(["training", "food", "care", "celebrations"] as const).map(
                (key, i) => (
                  <label className="check" key={key}>
                    <input
                      type="checkbox"
                      checked={prefs[key]}
                      onChange={(e) => {
                        try {
                          persist({ ...prefs, [key]: e.target.checked });
                          setStatus("Preferência salva.");
                        } catch {
                          setStatus(
                            "Não foi possível salvar. Libere armazenamento no navegador e tente novamente.",
                          );
                        }
                      }}
                    />
                    {
                      [
                        "Convites para treinar",
                        "Cuidado com alimentação",
                        "Pausas e recuperação",
                        "Incentivo após registrar uma sessão",
                      ][i]
                    }
                  </label>
                ),
              )}
              <div className="row wrap">
                <button
                  disabled={busy}
                  onClick={() =>
                    void localNotification(
                      "Um lembrete de cuidado passando por aqui. Que seu dia tenha espaço para você! 💗",
                      "gforce-test",
                      "hoje",
                      true,
                    )
                      .then((ok) =>
                        setStatus(
                          ok
                            ? "Aviso de teste enviado para este aparelho."
                            : "Confira a permissão do aparelho e se os avisos estão ativados.",
                        ),
                      )
                      .catch(() =>
                        setStatus(
                          "Não foi possível exibir o aviso. Confira os ajustes do aparelho.",
                        ),
                      )
                  }
                >
                  Enviar aviso de teste
                </button>
                <button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await stopNotifications();
                      setPrefs(reminderPreferences());
                      setConnected(false);
                      setStatus(
                        "Avisos desativados. Não perguntaremos novamente automaticamente.",
                      );
                    } catch {
                      setStatus(
                        "Não foi possível desconectar do serviço. Tente novamente com internet ou bloqueie os avisos nos ajustes do aparelho.",
                      );
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Desativar notificações
                </button>
              </div>
            </>
          )}
        </>
      )}
      {status && (
        <p role="status" className="notice">
          {settings
            ? status
            : ready
              ? "Confirme a permissão para receber os convites."
              : "Não foi possível ativar agora. Tente novamente em Configurações."}
        </p>
      )}
      {settings && (
        <small>
          No iPhone, use o app adicionado à Tela de Início (iOS 16.4 ou mais
          recente). Ativar no Safari e no app instalado pode exigir
          configurações independentes. A entrega com o app fechado depende do
          Web Push e não é um alarme garantido.
        </small>
      )}
    </section>
  );
}
