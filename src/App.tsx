import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  House,
  LockKeyhole,
  Settings,
  Utensils,
  WifiOff,
} from "lucide-react";
import { access, verify, remember, removeAccess } from "./lib/auth";
import { readData, writeData, clearData } from "./lib/storage";
import {
  addDays,
  canProgress,
  canSchedule,
  finish,
  initialData,
  localDate,
  makePlan,
  needsReview,
  parseBackup,
  type Data,
  type Profile,
} from "./lib/model";
import {
  exercises,
  safety,
  stepsFor,
  strengthSource,
  sittingSource,
} from "./content/exercises";
import { Gate } from "./components/Gate";
import { AppUpdate } from "./components/AppUpdate";
import { ProfileForm } from "./components/ProfileForm";
import { ExerciseDetail } from "./components/ExerciseDetail";
import { Workout } from "./components/Workout";
import { DailyMessage } from "./components/DailyMessage";
import { afterSessionMessage } from "./content/messages";
import { Notifications } from "./components/Notifications";
import {
  localNotification,
  stopNotifications,
  forgetReminderPreferences,
} from "./lib/notifications";
const nav = [
  { id: "hoje", label: "Hoje", icon: House },
  { id: "semana", label: "Minha semana", icon: CalendarDays },
  { id: "exercicios", label: "Exercícios", icon: Dumbbell },
  { id: "evolucao", label: "Evolução", icon: ChartNoAxesCombined },
  { id: "alimentacao", label: "Alimentação", icon: Utensils },
  { id: "configuracoes", label: "Configurações", icon: Settings },
];
export default function App() {
  const [data, setData] = useState<Data | null>(null);
  const [open, setOpen] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [route, setRoute] = useState(location.hash.slice(2) || "hoje");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [editProfile, setEditProfile] = useState(false);
  const [search, setSearch] = useState("");
  const [equip, setEquip] = useState("Todos");
  const [position, setPosition] = useState("Todas");
  const [region, setRegion] = useState("Todas");
  const [selected, setSelected] = useState<string | null>(null);
  const [week, setWeek] = useState(0);
  const [startItem, setStartItem] = useState<Data["plan"][number] | null>(null);
  const [short, setShort] = useState(false);
  const [readiness, setReadiness] = useState("Disposta");
  const [imported, setImported] = useState<Data | null>(null);
  const [reset, setReset] = useState(false);
  const [resetText, setResetText] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [update, setUpdate] = useState<ServiceWorkerRegistration | null>(null);
  useEffect(() => {
    void readData()
      .then(async (d) => {
        if (d.active) {
          d = {
            ...d,
            active: {
              ...d.active,
              remaining: d.active.deadline
                ? Math.max(
                    0,
                    Math.ceil((d.active.deadline - Date.now()) / 1000),
                  )
                : d.active.remaining,
              deadline: null,
            },
          };
          await writeData(d);
        }
        setData(d);
      })
      .catch(() =>
        setError(
          "Não foi possível ler os registros. Libere armazenamento do navegador e tente recarregar. Nenhum dado foi apagado.",
        ),
      );
    try {
      const a = access();
      setConfigured(!!a);
      setOpen(!!a && a.remember);
    } catch {
      setError(
        "Falha ao ler o controle de acesso. Permita armazenamento local ou reinicialize conscientemente.",
      );
    }
    const hash = () => {
      setRoute(location.hash.slice(2) || "hoje");
      window.scrollTo(0, 0);
    };
    const net = () => setOnline(navigator.onLine);
    const upd = (e: Event) =>
      setUpdate((e as CustomEvent<ServiceWorkerRegistration>).detail);
    window.addEventListener("hashchange", hash);
    window.addEventListener("online", net);
    window.addEventListener("offline", net);
    window.addEventListener("gforce-update", upd);
    return () => {
      window.removeEventListener("hashchange", hash);
      window.removeEventListener("online", net);
      window.removeEventListener("offline", net);
      window.removeEventListener("gforce-update", upd);
    };
  }, []);
  useEffect(() => {
    if (!startItem) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>(".modal");
    const nodes = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          "button:not(:disabled), select, input, a[href]",
        ) ?? [],
      );
    nodes()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setStartItem(null);
      if (e.key !== "Tab") return;
      const items = nodes(),
        first = items[0],
        last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [startItem]);
  async function save(d: Data) {
    try {
      await writeData(d);
      setData(d);
      setError("");
    } catch (err) {
      setError(
        "Não foi possível salvar. Verifique o espaço livre e as permissões. Mantenha esta aba aberta e tente novamente. " +
          (err instanceof Error ? err.message : ""),
      );
      throw err;
    }
  }
  const go = (id: string) => {
    window.scrollTo(0, 0);
    location.hash = "/" + id;
    setSelected(null);
    setMessage("");
  };
  const lock = () => {
    if (data?.active)
      void save({
        ...data,
        active: {
          ...data.active,
          remaining: data.active.deadline
            ? Math.max(0, Math.ceil((data.active.deadline - Date.now()) / 1000))
            : data.active.remaining,
          deadline: null,
        },
      });
    remember(false);
    setOpen(false);
  };
  async function saveProfile(p: Profile) {
    if (!data) return;
    await save({
      ...data,
      profile: p,
      plan: needsReview(p)
        ? []
        : data.plan.length
          ? data.plan
          : makePlan(localDate(), p.days === 3),
    });
    setEditProfile(false);
    go("hoje");
    setMessage("Perfil salvo. Você pode editar quando precisar.");
  }
  async function doReset() {
    if (resetText !== "APAGAR") return;
    if (open && configured && !(await verify(resetPassword))) {
      setError("Confirme sua senha atual para apagar.");
      return;
    }
    try {
      await stopNotifications();
      forgetReminderPreferences();
      await clearData();
      removeAccess();
      setData(structuredClone(initialData));
      setConfigured(false);
      setOpen(false);
      setReset(false);
      setResetText("");
      setResetPassword("");
      setError("");
      location.hash = "/hoje";
    } catch {
      setError(
        "Não foi possível apagar. Confira o armazenamento do navegador.",
      );
    }
  }
  if (reset)
    return (
      <div className="gate">
        <div className="panel stack">
          <h1>Reinicializar este navegador?</h1>
          <p className="notice">
            Isso apaga perfil, plano, sessões, medidas e senha. Sem backup, os
            registros serão perdidos. Em outros aparelhos os dados são
            independentes.
          </p>
          {open && configured && (
            <label>
              Senha atual
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
            </label>
          )}
          <label>
            Digite APAGAR para confirmar
            <input
              value={resetText}
              onChange={(e) => setResetText(e.target.value)}
            />
          </label>
          {error && <p role="alert">{error}</p>}
          <button
            className="danger"
            disabled={resetText !== "APAGAR"}
            onClick={() => void doReset()}
          >
            Apagar definitivamente
          </button>
          <button onClick={() => setReset(false)}>Cancelar</button>
        </div>
      </div>
    );
  if (!open)
    return (
      <>
        <Gate
          configured={configured}
          update={update}
          updateBlocked={!data || !!data.active}
          onOpen={() => {
            setOpen(true);
            setConfigured(true);
          }}
          onReset={() => setReset(true)}
        />
        {error && (
          <p role="alert" className="global-error">
            {error}
          </p>
        )}
      </>
    );
  if (!data)
    return (
      <div className="gate" role="status">
        {error || "Abrindo seu espaço…"}
      </div>
    );
  const today = localDate();
  const completed = new Set(data.sessions.map((s) => s.planId));
  const next = data.plan
    .filter(
      (p) =>
        p.date >= today &&
        ["A", "B", "C"].includes(p.kind) &&
        !completed.has(p.id),
    )
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const flagged = data.profile && needsReview(data.profile);
  const hasSymptoms = data.sessions.slice(-1).some((s) => s.pain);
  const compatible =
    data.profile?.equipment.includes("Cadeira") &&
    data.profile.equipment.includes("Parede");
  const canStart = !flagged && !hasSymptoms && compatible;
  const todayActivity = data.plan.find((p) => p.date === today);
  const last = data.sessions.at(-1);
  const gap = last
    ? Math.floor(
        (new Date(today + "T12:00:00").getTime() -
          new Date(last.date + "T12:00:00").getTime()) /
          86400000,
      )
    : 0;
  async function start() {
    if (!data || !startItem || !canStart) return;
    if (data.active) {
      go("treino");
      setStartItem(null);
      return;
    }
    if (
      data.sessions.some(
        (s) =>
          ["A", "B", "C"].includes(s.kind) &&
          Math.abs(
            (new Date(today + "T12:00:00").getTime() -
              new Date(s.date + "T12:00:00").getTime()) /
              86400000,
          ) < 1.5,
      )
    ) {
      setMessage(
        "Reserve ao menos um dia entre sessões de força. Hoje você pode descansar ou fazer movimento leve.",
      );
      setStartItem(null);
      return;
    }
    const isShort =
      short ||
      readiness === "Cansada" ||
      gap >= 14 ||
      data.profile!.minutes < 10;
    const startingReps = gap >= 14 ? Math.min(5, data.reps) : data.reps;
    const st = stepsFor(
      startItem.kind,
      isShort,
      startingReps,
      data.profile!.equipment.includes("Cargas leves"),
    );
    await save({
      ...data,
      reps: startingReps,
      active: {
        id: crypto.randomUUID(),
        planId: startItem.id,
        kind: startItem.kind as "A" | "B" | "C",
        short: isShort,
        index: 0,
        remaining: st[0].seconds,
        deadline: null,
        started: Date.now(),
        readiness,
        reps: startingReps,
        easy: readiness === "Cansada",
      },
    });
    setStartItem(null);
    go("treino");
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <a className="wordmark" href="#/hoje">
          G<span>Force</span>
        </a>
        <div className="sidebar-caption">FORÇA NO SEU RITMO</div>
        <nav aria-label="Principal">
          {nav.map((n) => (
            <a
              key={n.id}
              className={route === n.id ? "active" : ""}
              href={"#/" + n.id}
            >
              <n.icon size={21} />
              <span>{n.label}</span>
              {route === n.id && <i />}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="status-dot" /> Seus dados ficam aqui
          <br />
          <small>Um passo de cada vez.</small>
          <button className="text-button" onClick={lock}>
            <LockKeyhole size={16} /> Bloquear agora
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span>
            MEU ESPAÇO{" "}
            <span className="muted">
              / {nav.find((n) => n.id === route)?.label ?? "Treino"}
            </span>
          </span>
          <div className="row">
            <span className="date-label">
              {new Date().toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
              })}
            </span>
            <button
              className="avatar"
              aria-label="Abrir configurações"
              onClick={() => go("configuracoes")}
            >
              {data.profile?.name.slice(0, 1).toUpperCase() || "G"}
            </button>
          </div>
        </header>
        <main id="main">
          {!online && (
            <p role="status" className="notice">
              <WifiOff size={17} /> Você está offline. Registros e instruções
              continuam disponíveis; fontes e vídeos precisam de conexão.
            </p>
          )}
          {error && (
            <p role="alert" className="notice">
              {error}
            </p>
          )}
          {message && (
            <p role="status" className="notice">
              {message}
            </p>
          )}
          <AppUpdate registration={update} blocked={!!data.active} />
          {!data.active && route !== "configuracoes" && <Notifications />}
          {!data.profile || editProfile ? (
            <section className="panel profile">
              <ProfileForm
                profile={data.profile}
                onSave={(p) => void saveProfile(p)}
              />
              {editProfile && (
                <button onClick={() => setEditProfile(false)}>Cancelar</button>
              )}
            </section>
          ) : (
            <>
              {flagged && (
                <p className="notice">
                  Seu perfil indica necessidade de avaliação individual. Não há
                  treino automático compatível nesta versão. Converse com
                  profissional de saúde; o app não declara liberação médica.
                </p>
              )}
              {hasSymptoms && (
                <p className="notice">
                  Você relatou dor ou sintomas na última sessão. Suspenda o
                  treino automático e procure avaliação; editar o perfil não
                  equivale a uma liberação.
                </p>
              )}
              {!compatible && (
                <p className="notice">
                  Este programa usa cadeira firme sem rodas e parede livre.
                  Confira seu espaço e atualize o perfil antes de iniciar.
                </p>
              )}
              {route === "hoje" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">SEU RITMO. SUA FORÇA.</div>
                      <h1>
                        Vamos juntas
                        {data.profile.name ? ", " + data.profile.name : ""}
                        <span className="pink">.</span>
                      </h1>
                      <p>Pequenos passos. Uma rotina mais forte.</p>
                    </div>
                    <span className="pill">
                      <span className="status-dot" /> Programa introdutório · 4
                      semanas
                    </span>
                  </div>
                  <DailyMessage data={data} />
                  <div className="dashboard-grid">
                    <section className="hero">
                      <div className="hero-top">
                        <span className="tag">
                          {next?.date === today
                            ? "PARA HOJE"
                            : "SEU PRÓXIMO TREINO"}
                        </span>
                        <span className="hero-mark">GF</span>
                      </div>
                      <div className="hero-content">
                        <div className="eyebrow">FORÇA EM CASA</div>
                        <h2>
                          {data.active ? (
                            <>
                              Seu treino
                              <br />
                              espera por você.
                            </>
                          ) : next ? (
                            <>
                              O começo de
                              <br />
                              uma nova força.
                            </>
                          ) : (
                            <>
                              Seu ritmo merece
                              <br />
                              ser respeitado.
                            </>
                          )}
                        </h2>
                        <p>
                          {next
                            ? `Sessão ${next.kind} · ${next.date.split("-").reverse().slice(0, 2).join("/")} · corpo inteiro · sem saltos`
                            : "Descansar também faz parte do plano."}
                        </p>
                        <div className="hero-meta">
                          <span>
                            <Activity size={18} />
                            {next
                              ? `${Math.ceil(stepsFor(next.kind, false, data.reps, data.profile.equipment.includes("Cargas leves")).reduce((n, s) => n + s.seconds, 0) / 60)} min`
                              : "No seu tempo"}
                          </span>
                          <span>
                            <Dumbbell size={18} /> Cadeira + parede
                          </span>
                        </div>
                        {data.active ? (
                          <button
                            className="primary"
                            onClick={() => go("treino")}
                          >
                            Retomar sessão <ChevronRight size={18} />
                          </button>
                        ) : next && canStart ? (
                          <>
                            <button
                              className="primary"
                              onClick={() => {
                                setShort(false);
                                setStartItem(next);
                              }}
                            >
                              Iniciar treino <ChevronRight size={18} />
                            </button>
                            <button
                              className="hero-short"
                              onClick={() => {
                                setShort(true);
                                setStartItem(next);
                              }}
                            >
                              Tenho pouco tempo · versão de 5–8 min
                            </button>
                          </>
                        ) : (
                          <button onClick={() => go("semana")}>
                            Ver minha semana
                          </button>
                        )}
                      </div>
                      <div className="hero-art" aria-hidden="true">
                        <div className="ring r1" />
                        <div className="ring r2" />
                        <div className="barbell">
                          <span />
                          <i />
                          <span />
                        </div>
                      </div>
                    </section>
                    <div className="side-stack">
                      <section className="panel week-summary">
                        <div className="row between">
                          <h3>Sua semana em movimento</h3>
                          <CalendarDays className="pink" size={21} />
                        </div>
                        <div className="week-dots">
                          {Array.from({ length: 7 }, (_, i) => {
                            const start = new Date();
                            start.setDate(
                              start.getDate() - ((start.getDay() + 6) % 7) + i,
                            );
                            const d = localDate(start);
                            const done = data.sessions.some(
                              (s) => s.date === d && !s.partial,
                            );
                            return (
                              <div key={d}>
                                <small>
                                  {["S", "T", "Q", "Q", "S", "S", "D"][i]}
                                </small>
                                <span
                                  className={
                                    done ? "done" : d === today ? "current" : ""
                                  }
                                >
                                  {done ? <Check size={16} /> : start.getDate()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        <p>
                          <strong>
                            {
                              data.sessions.filter(
                                (s) =>
                                  !s.partial &&
                                  s.date >=
                                    addDays(
                                      today,
                                      -((new Date().getDay() + 6) % 7),
                                    ),
                              ).length
                            }
                          </strong>{" "}
                          sessões concluídas nesta semana
                        </p>
                        <a href="#/semana">
                          Organizar minha semana <ArrowUpRight size={16} />
                        </a>
                      </section>
                      <section className="panel care">
                        <div className="icon-tile">
                          <Flame size={21} />
                        </div>
                        <h3>
                          {todayActivity &&
                          !["A", "B", "C"].includes(todayActivity.kind)
                            ? `Hoje: ${todayActivity.kind.toLowerCase()}`
                            : "Consistência, sem pressa."}
                        </h3>
                        <p>
                          {todayActivity?.kind === "Movimento"
                            ? "5–15 min de caminhada leve, em ritmo de conversa. Sem saltos."
                            : todayActivity?.kind === "Mobilidade"
                              ? "5 min de movimentos suaves sentada, sem forçar. Veja as instruções na biblioteca."
                              : "Não precisa compensar dias perdidos. Volte com calma e respeite sua recuperação."}
                        </p>
                      </section>
                    </div>
                  </div>
                  <div className="section-heading">
                    <h2>Seu cuidado vai além do treino</h2>
                    <span className="muted">CADA ESCOLHA CONTA</span>
                  </div>
                  <div className="grid three">
                    {[
                      {
                        title: "Conheça os movimentos",
                        text: "Instruções claras para ganhar confiança.",
                        icon: Dumbbell,
                        id: "exercicios",
                        label: "Explorar exercícios",
                      },
                      {
                        title: "Comer bem, viver melhor",
                        text: "Ideias práticas, sem dietas restritivas.",
                        icon: Utensils,
                        id: "alimentacao",
                        label: "Cuidar da alimentação",
                      },
                      {
                        title: "Sua evolução é pessoal",
                        text: "Observe sua frequência e como se sente.",
                        icon: ChartNoAxesCombined,
                        id: "evolucao",
                        label: "Ver minha evolução",
                      },
                    ].map((c) => (
                      <button
                        className="feature-card"
                        key={c.id}
                        onClick={() => go(c.id)}
                      >
                        <div className="row between">
                          <span className="icon-tile">
                            <c.icon size={22} />
                          </span>
                          <ArrowUpRight size={19} />
                        </div>
                        <h3>{c.title}</h3>
                        <p>{c.text}</p>
                        <span className="card-link">
                          {c.label} <ChevronRight size={15} />
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="quiet-note">
                    <Activity size={19} />
                    <span>
                      Força para a vida real. Sem comparação, sem culpa.
                    </span>
                  </div>
                </>
              )}
              {route === "semana" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">ESPAÇO PARA RECUPERAR</span>
                      <h1>
                        Minha semana<span className="pink">.</span>
                      </h1>
                      <p>
                        Duas sessões de força, em dias não consecutivos. O
                        terceiro dia é opcional.
                      </p>
                    </div>
                  </div>
                  <div className="row week-switch">
                    {[0, 1, 2, 3].map((i) => (
                      <button
                        className={week === i ? "primary" : ""}
                        key={i}
                        onClick={() => setWeek(i)}
                      >
                        Semana {i + 1}
                      </button>
                    ))}
                  </div>
                  <p className="notice">
                    {
                      [
                        "Aprenda os movimentos, com 5 repetições e uma série.",
                        "Repita e observe sua recuperação. Avançar é opcional.",
                        "Consolide o hábito; altere só repetições se as últimas sessões foram toleradas.",
                        "Revise o que funcionou. Mantenha ou reduza se necessário.",
                      ][week]
                    }{" "}
                    Não há aumento automático por calendário.
                  </p>
                  <div className="stack">
                    {data.plan.slice(week * 7, week * 7 + 7).map((item) => {
                      const done = data.sessions.find(
                        (s) => s.planId === item.id,
                      );
                      const force = ["A", "B", "C"].includes(item.kind);
                      return (
                        <section className="panel calendar-item" key={item.id}>
                          <div className="calendar-date">
                            <strong>
                              {new Date(item.date + "T12:00:00").getDate()}
                            </strong>
                            <small>
                              {new Date(
                                item.date + "T12:00:00",
                              ).toLocaleDateString("pt-BR", {
                                weekday: "short",
                                month: "short",
                              })}
                            </small>
                          </div>
                          <div className="grow">
                            <span className="tag">
                              {done
                                ? done.partial
                                  ? "REGISTRO PARCIAL"
                                  : "CONCLUÍDO"
                                : item.date < today
                                  ? "PASSOU · SEM COMPENSAR"
                                  : item.date !== item.original
                                    ? "REAGENDADO"
                                    : "PLANEJADO"}
                            </span>
                            <h3>
                              {force
                                ? `Força ${item.kind}${item.kind === "C" ? " · opcional" : ""}`
                                : item.kind}
                            </h3>
                            <p>
                              {force
                                ? "Corpo inteiro · cadeira e parede"
                                : item.kind === "Movimento"
                                  ? "5–15 min de caminhada leve, sem saltos. Ritmo de conversa."
                                  : item.kind === "Mobilidade"
                                    ? "5 min: marcha sentada, abertura do peito e rotação suave, sem forçar."
                                    : "Recupere-se. Sem dívida com o calendário."}
                            </p>
                          </div>
                          <div className="calendar-actions">
                            {!done && (
                              <label>
                                Reagendar
                                <input
                                  aria-label={"Reagendar " + item.id}
                                  type="date"
                                  value={item.date}
                                  onChange={(e) => {
                                    if (!e.target.value) return;
                                    if (
                                      !canSchedule(
                                        data,
                                        item.id,
                                        e.target.value,
                                      )
                                    ) {
                                      setMessage(
                                        "Mantenha ao menos um dia sem força entre sessões.",
                                      );
                                      return;
                                    }
                                    void save({
                                      ...data,
                                      plan: data.plan.map((p) =>
                                        p.id === item.id
                                          ? { ...p, date: e.target.value }
                                          : p,
                                      ),
                                    });
                                  }}
                                />
                              </label>
                            )}
                            {force &&
                              !done &&
                              canStart &&
                              item.date >= today && (
                                <button
                                  onClick={() => {
                                    setShort(false);
                                    setStartItem(item);
                                  }}
                                >
                                  Iniciar <ChevronRight size={16} />
                                </button>
                              )}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                  <div className="panel stack">
                    <h3>Reorganizar sem acumular</h3>
                    <p>
                      Escolha novas datas acima. Sessões passadas não viram
                      dívida. Reiniciar o calendário preserva o histórico e
                      descarta apenas planos não realizados.
                    </p>
                    <button
                      onClick={() => {
                        if (data.active) {
                          setMessage(
                            "Finalize a sessão em andamento antes de reorganizar.",
                          );
                          return;
                        }
                        if (
                          confirm(
                            "Criar quatro novas semanas a partir de hoje? O histórico será preservado.",
                          )
                        )
                          void save({
                            ...data,
                            plan: makePlan(
                              today + "",
                              data.profile!.days === 3,
                            ).map((p) => ({
                              ...p,
                              id: p.id + "-" + crypto.randomUUID(),
                            })),
                          });
                      }}
                    >
                      Recomeçar calendário a partir de hoje
                    </button>
                  </div>
                </>
              )}
              {route === "treino" &&
                (data.active && canStart ? (
                  <Workout
                    data={data}
                    save={save}
                    onFinish={(
                      partial,
                      effort,
                      pain,
                      resistance,
                      notes,
                      actualReps,
                    ) => {
                      void save(
                        finish(
                          data,
                          effort,
                          pain,
                          partial,
                          resistance,
                          notes,
                          actualReps,
                        ),
                      ).then(() => {
                        go("evolucao");
                        setMessage(afterSessionMessage(partial, pain));
                        void localNotification(
                          afterSessionMessage(partial, pain),
                          `gforce-session-${data.active!.id}`,
                          "evolucao",
                        ).catch(() => {});
                      });
                    }}
                  />
                ) : (
                  <div className="panel stack">
                    <h1>
                      {data.active
                        ? "Treino indisponível para este perfil"
                        : "Nenhuma sessão em andamento"}
                    </h1>
                    <button onClick={() => go("hoje")}>Voltar ao início</button>
                  </div>
                ))}
              {route === "exercicios" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">
                        CONFIANÇA EM CADA MOVIMENTO
                      </span>
                      <h1>
                        Exercícios<span className="pink">.</span>
                      </h1>
                      <p>
                        Sem saltos, sem precisar ir ao chão. Aprenda antes de
                        começar.
                      </p>
                    </div>
                  </div>
                  <div className="filters panel">
                    <label>
                      Buscar
                      <input
                        placeholder="Nome ou região"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                    <label>
                      Equipamento
                      <select
                        value={equip}
                        onChange={(e) => setEquip(e.target.value)}
                      >
                        {[
                          "Todos",
                          "Cadeira",
                          "Parede",
                          "Cargas leves",
                          "Elástico opcional",
                        ].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Posição
                      <select
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                      >
                        {["Todas", "Em pé", "Sentada"].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Região
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                      >
                        {[
                          "Todas",
                          "Pernas",
                          "Glúteos",
                          "Peito",
                          "Braços",
                          "Abdômen",
                          "Costas",
                          "Quadril",
                        ].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="grid two">
                    {exercises
                      .filter(
                        (e) =>
                          (e.name + " " + e.region)
                            .toLocaleLowerCase("pt-BR")
                            .includes(search.toLocaleLowerCase("pt-BR")) &&
                          (equip === "Todos" || equip === e.equipment) &&
                          (position === "Todas" || position === e.position) &&
                          (region === "Todas" ||
                            e.region
                              .toLowerCase()
                              .includes(region.toLowerCase())),
                      )
                      .map((e) => (
                        <section className="panel stack" key={e.id}>
                          <div className="row between">
                            <Dumbbell className="pink" size={24} />
                            <span className="tag">{e.position}</span>
                          </div>
                          <h3>{e.name}</h3>
                          <p>{e.region}</p>
                          <button
                            aria-expanded={selected === e.id}
                            onClick={() =>
                              setSelected(selected === e.id ? null : e.id)
                            }
                          >
                            {selected === e.id
                              ? "Fechar instruções"
                              : "Ver como fazer"}
                            <ChevronRight size={16} />
                          </button>
                          {selected === e.id && <ExerciseDetail e={e} />}
                        </section>
                      ))}
                  </div>
                  <p className="muted">
                    Sem resultados? Tente remover um filtro. Referências visuais
                    estão na fonte externa e precisam de internet.
                  </p>
                  <div className="notice">{safety}</div>
                </>
              )}
              {route === "evolucao" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">
                        SEU CAMINHO, SEUS REGISTROS
                      </span>
                      <h1>
                        Evolução<span className="pink">.</span>
                      </h1>
                      <p>
                        Frequência e percepção, sem comparações ou calorias
                        estimadas.
                      </p>
                    </div>
                  </div>
                  <div className="grid three">
                    {Array.from({ length: 3 }, (_, i) => {
                      const start = addDays(
                        today,
                        -((new Date().getDay() + 6) % 7) - 7 * i,
                      );
                      const end = addDays(start, 6);
                      return (
                        <div className="panel" key={start}>
                          <span className="eyebrow">
                            {i === 0
                              ? "ESTA SEMANA"
                              : `${i} SEMANA${i > 1 ? "S" : ""} ATRÁS`}
                          </span>
                          <div className="stat">
                            {
                              data.sessions.filter(
                                (s) =>
                                  !s.partial &&
                                  s.date >= start &&
                                  s.date <= end,
                              ).length
                            }
                            <small> sessões</small>
                          </div>
                          <p>
                            {start.split("-").reverse().join("/")} –{" "}
                            {end.split("-").reverse().join("/")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <section className="panel stack">
                    <h2>Ajuste no seu ritmo</h2>
                    <p>
                      Atual: {data.reps} repetições por movimento (ou por lado),
                      uma série. A próxima sessão só muda se você decidir.
                    </p>
                    {canProgress(data) ? (
                      <>
                        <p>
                          As duas últimas sessões completas foram toleradas sem
                          dor e sem dificuldade alta. Você pode manter, reduzir
                          ou acrescentar uma repetição. Só essa variável muda.
                        </p>
                        <button
                          className="primary"
                          onClick={() => {
                            if (
                              confirm(
                                "Aumentar somente uma repetição na próxima sessão? Você pode manter ou reduzir depois.",
                              )
                            )
                              void save({
                                ...data,
                                reps: Math.min(12, data.reps + 1),
                              }).then(() =>
                                setMessage("Ajuste confirmado por você."),
                              );
                          }}
                        >
                          Confirmar +1 repetição
                        </button>
                      </>
                    ) : (
                      <p className="muted">
                        Para propor avanço, precisamos de duas sessões completas
                        toleradas, sem dor e sem dificuldade alta. Não há
                        aumento só porque o tempo passou.
                      </p>
                    )}
                    <div className="row">
                      <button
                        onClick={() =>
                          setMessage(
                            "Dificuldade mantida. Consistência também é evolução.",
                          )
                        }
                      >
                        Manter dificuldade
                      </button>
                      <button
                        disabled={data.reps <= 3}
                        onClick={() =>
                          void save({
                            ...data,
                            reps: Math.max(3, data.reps - 1),
                          }).then(() =>
                            setMessage(
                              "Repetições reduzidas para a próxima sessão.",
                            ),
                          )
                        }
                      >
                        Reduzir uma repetição
                      </button>
                    </div>
                    {gap >= 14 && (
                      <p className="notice">
                        Você ficou pelo menos duas semanas sem registrar. A
                        retomada usará versão curta e no máximo 5 repetições.
                      </p>
                    )}
                  </section>
                  <h2>Histórico real</h2>
                  {!data.sessions.length ? (
                    <div className="panel empty">
                      <ChartNoAxesCombined size={32} />
                      <h3>Seu primeiro registro vem com o primeiro passo.</h3>
                      <p>
                        Após um treino, sua disposição, repetições e percepção
                        aparecem aqui.
                      </p>
                    </div>
                  ) : (
                    <div className="stack">
                      {[...data.sessions].reverse().map((s) => (
                        <article className="panel" key={s.id}>
                          <div className="row between">
                            <h3>
                              Sessão {s.kind} ·{" "}
                              {s.partial ? "parcial" : "concluída"}
                            </h3>
                            <span className="tag">
                              {s.date.split("-").reverse().join("/")}
                            </span>
                          </div>
                          <p>
                            {s.reps} repetições · {s.resistance} · esforço{" "}
                            {s.effort.toLowerCase()}
                          </p>
                          <p>
                            Antes: {s.readiness} ·{" "}
                            {s.pain
                              ? "Dor ou sintomas relatados: procure avaliação."
                              : "Sem dor relatada"}
                          </p>
                          {s.notes && <p>{s.notes}</p>}
                        </article>
                      ))}
                    </div>
                  )}
                  <div className="panel">
                    <h3>Medidas são opcionais</h3>
                    <p>
                      Peso informado: {data.profile.weight || "não informado"}
                      {data.profile.weight ? " kg" : ""} · Cintura:{" "}
                      {data.profile.waist || "não informada"}
                      {data.profile.waist ? " cm" : ""}
                    </p>
                    <button
                      onClick={() => {
                        setEditProfile(true);
                        go("configuracoes");
                      }}
                    >
                      Editar no perfil
                    </button>
                  </div>
                </>
              )}
              {route === "alimentacao" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">CUIDADO QUE NUTRE</span>
                      <h1>
                        Alimentação<span className="pink">.</span>
                      </h1>
                      <p>
                        Organização simples para comer com variedade e
                        tranquilidade.
                      </p>
                    </div>
                  </div>
                  <div className="grid three">
                    {[
                      {
                        title: "Variedade no prato",
                        text: "Combine alimentos como arroz, feijão, legumes, frutas e uma fonte de proteína. Adapte aos alimentos disponíveis e à sua cultura.",
                      },
                      {
                        title: "Planeje o possível",
                        text: "Escolha algumas refeições práticas, reaproveite preparos com segurança e mantenha água por perto. Você não precisa comer de forma perfeita.",
                      },
                      {
                        title: "Sem metas restritivas",
                        text: "Não há meta automática de calorias, suplemento obrigatório ou promessa de emagrecimento. Necessidades específicas pedem nutricionista.",
                      },
                    ].map((c) => (
                      <div className="panel" key={c.title}>
                        <Utensils className="pink" />
                        <h3>{c.title}</h3>
                        <p>{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <FoodEditor data={data} save={save} />
                  <p className="muted">
                    Sugestões educativas, sem prescrição de dieta. Respeite
                    alergias, restrições e orientação individual.
                  </p>
                  <a
                    target="_blank"
                    rel="noreferrer"
                    href="https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/"
                  >
                    Fonte: NHS · Eatwell Guide ↗
                  </a>
                </>
              )}
              {route === "configuracoes" && (
                <>
                  <div className="page-heading">
                    <div>
                      <span className="eyebrow">DO SEU JEITO</span>
                      <h1>
                        Configurações<span className="pink">.</span>
                      </h1>
                    </div>
                  </div>
                  <Notifications settings />
                  <div className="grid two">
                    <section className="panel stack">
                      <h2>Seu perfil</h2>
                      <p>
                        {data.profile.name || "Seu espaço pessoal"} ·{" "}
                        {data.profile.experience}
                        <br />
                        {data.profile.days} dias · {data.profile.minutes} min
                        disponíveis
                      </p>
                      <button onClick={() => setEditProfile(true)}>
                        Editar respostas e medidas
                      </button>
                      <h3>Controle de acesso</h3>
                      <p>
                        Controle de acesso neste aparelho. O site é público e
                        seus registros ficam neste navegador.
                      </p>
                      <small>
                        O bloqueio local não é autenticação de servidor nem
                        criptografia dos registros. Outro navegador ou
                        instalação terá configuração independente.
                      </small>
                      <button onClick={lock}>
                        <LockKeyhole size={17} /> Bloquear agora
                      </button>
                      <p>
                        A senha é única. O acesso fica lembrado neste navegador
                        até você usar “Bloquear agora” ou limpar os dados de
                        acesso. Os registros existentes são preservados.
                      </p>
                    </section>
                    <section className="panel stack">
                      <h2>Seus dados, com você</h2>
                      <p>
                        Seus registros de treino não são enviados. Notificações
                        usam OneSignal apenas após sua autorização. Limpar dados
                        do navegador pode apagar tudo. Faça backups
                        regularmente.
                      </p>
                      <p className="notice">
                        O backup contém registros pessoais e não é
                        criptografado. Guarde em local privado. Senha,
                        verificador e desbloqueio não são exportados.
                      </p>
                      <p>
                        Último backup:{" "}
                        {data.lastBackup
                          ? new Date(data.lastBackup).toLocaleString("pt-BR")
                          : "ainda não feito · reserve um momento para salvar"}
                      </p>
                      <button
                        className="primary"
                        onClick={() => {
                          const stamp = new Date().toISOString();
                          const blob = new Blob(
                            [
                              JSON.stringify(
                                { ...data, lastBackup: stamp },
                                null,
                                2,
                              ),
                            ],
                            { type: "application/json" },
                          );
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `GForce-backup-${today}.json`;
                          a.click();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                          void save({ ...data, lastBackup: stamp });
                        }}
                      >
                        Exportar dados / backup JSON
                      </button>
                      <label>
                        Restaurar backup
                        <input
                          type="file"
                          accept="application/json,.json"
                          onChange={async (e) => {
                            try {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5_000_000) throw new Error();
                              const parsed = parseBackup(await file.text());
                              if (parsed.active) parsed.active.deadline = null;
                              setImported(parsed);
                            } catch {
                              setMessage(
                                "Backup inválido ou versão incompatível. Nenhum registro foi alterado.",
                              );
                            }
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {imported && (
                        <div className="notice stack">
                          <strong>Revise antes de substituir</strong>
                          <p>
                            {imported.profile ? "1 perfil" : "Sem perfil"} ·{" "}
                            {imported.plan.length} atividades ·{" "}
                            {imported.sessions.length} sessões ·{" "}
                            {imported.active
                              ? "1 treino interrompido"
                              : "sem treino ativo"}
                            . A senha atual será mantida. Todos os registros
                            atuais serão substituídos.
                          </p>
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "Substituir todos os registros pelos dados deste backup?",
                                )
                              )
                                void save(imported).then(() => {
                                  setImported(null);
                                  go("hoje");
                                  setMessage("Backup restaurado.");
                                });
                            }}
                          >
                            Confirmar substituição
                          </button>
                          <button onClick={() => setImported(null)}>
                            Cancelar restauração
                          </button>
                        </div>
                      )}
                      <button className="danger" onClick={() => setReset(true)}>
                        Excluir todos os dados e reinicializar
                      </button>
                    </section>
                    <section className="panel stack">
                      <h2>Instalar e usar offline</h2>
                      <p>
                        No iPhone: abra no Safari, toque em Compartilhar e em
                        “Adicionar à Tela de Início”. A instalação depende do
                        Safari; não é automática.
                      </p>
                      <p>
                        Após um carregamento completo, app e textos funcionam
                        offline. Referências visuais e vídeos externos precisam
                        de internet. A primeira abertura exige conexão.
                      </p>
                      <p>
                        Os dados podem ser independentes entre Safari, app
                        instalado e outros aparelhos. Exporte e restaure um
                        backup para transferir conscientemente.
                      </p>
                      <p>
                        Áudio e alarmes locais não são garantidos com o app
                        fechado. Lembretes Web Push dependem de autorização e
                        conexão com o serviço. Se a tela suspender, confirme
                        para retomar. Atualizações só serão aplicadas com sua
                        ação, fora do treino.
                      </p>
                    </section>
                    <section className="panel stack">
                      <h2>Privacidade e fontes</h2>
                      <p>
                        Programa educativo geral, sem revisão profissional
                        individual. Não oferece diagnóstico, supervisão ou
                        garantia de resultado físico. Atividades de uma região
                        não eliminam gordura localizada.
                      </p>
                      <p>
                        Fase inicial: padrões de força de pernas, glúteos,
                        braços, peito e estabilização abdominal; costas recebem
                        abertura dos braços, com elástico leve opcional. Sem
                        elástico, essa etapa é familiarização do gesto e não
                        equivale a força com resistência externa.
                      </p>
                      <a href={strengthSource} target="_blank" rel="noreferrer">
                        NHS · exercícios de força ↗
                      </a>
                      <a href={sittingSource} target="_blank" rel="noreferrer">
                        NHS · exercícios sentados ↗
                      </a>
                      <a
                        href="https://www.nhs.uk/live-well/exercise/how-to-improve-strength-flexibility/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        NHS · força e flexibilidade ↗
                      </a>
                      <a
                        href="https://www.nhs.uk/better-health/get-active/home-workout-videos/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        NHS · vídeos de treino em casa (internet) ↗
                      </a>
                      <a
                        href="https://www.nhs.uk/pregnancy/keeping-well/exercise/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        NHS · gestação ↗
                      </a>
                      <a
                        href="https://www.nhs.uk/symptoms/chest-pain/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        NHS · sinais de alerta ↗
                      </a>
                      <a
                        href="https://www.nhs.uk/baby/support-and-services/your-post-pregnancy-body/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        NHS · corpo após o parto ↗
                      </a>
                      <a
                        href="https://www.bhf.org.uk/informationsupport/heart-matters-magazine/activity/resistance-bands"
                        target="_blank"
                        rel="noreferrer"
                      >
                        BHF · abertura com elástico ↗
                      </a>
                      <small>
                        Fontes consultadas em 23/10/2026. Não baixamos ou
                        republicamos vídeos. Ao abrir fontes externas, aplica-se
                        a política do site de destino.
                      </small>
                      <p className="notice">{safety}</p>
                    </section>
                  </div>
                </>
              )}
              {!nav.some((n) => n.id === route) && route !== "treino" && (
                <div className="panel">
                  <h1>Página não encontrada</h1>
                  <a href="#/hoje">Voltar para Hoje</a>
                </div>
              )}
            </>
          )}
          <footer>
            GFORCE <span>FORÇA NO SEU RITMO · EDUCAÇÃO E CUIDADO</span>
          </footer>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navegação móvel">
        {nav.map((n) => (
          <a
            className={route === n.id ? "active" : ""}
            key={n.id}
            href={"#/" + n.id}
          >
            <n.icon size={21} />
            <span>
              {n.id === "configuracoes"
                ? "Ajustes"
                : n.id === "alimentacao"
                  ? "Comer bem"
                  : n.id === "semana"
                    ? "Semana"
                    : n.label}
            </span>
          </a>
        ))}
      </nav>
      {startItem && (
        <div className="modal-backdrop">
          <section
            className="panel stack modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-title"
          >
            <span className="eyebrow">ANTES DE COMEÇAR</span>
            <h2 id="start-title">Como você está hoje?</h2>
            <label>
              Disposição
              <select
                value={readiness}
                onChange={(e) => setReadiness(e.target.value)}
              >
                <option>Disposta</option>
                <option>Cansada</option>
                <option>Com dor ou sintomas</option>
              </select>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={short}
                onChange={(e) => setShort(e.target.checked)}
              />
              Versão curta · 5–8 minutos
            </label>
            {gap >= 14 && (
              <p className="notice">
                Retomada gradual após pausa: versão curta e até 5 repetições.
              </p>
            )}
            <p>
              Cadeira firme, parede livre e água. Você pode pausar e encerrar
              quando precisar.
            </p>
            {readiness === "Com dor ou sintomas" ? (
              <p className="notice">
                Hoje não iniciaremos treino. Procure avaliação, sem tentar
                tratar sintomas substituindo movimentos.
              </p>
            ) : (
              <button className="primary" onClick={() => void start()}>
                Confirmar e iniciar
              </button>
            )}
            <button onClick={() => setStartItem(null)}>Agora não</button>
          </section>
        </div>
      )}
    </div>
  );
}
function FoodEditor({
  data,
  save,
}: {
  data: Data;
  save: (d: Data) => Promise<void>;
}) {
  const [meals, setMeals] = useState(data.meals);
  const [shopping, setShopping] = useState(data.shopping);
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="grid two"
      onSubmit={(e) => {
        e.preventDefault();
        void save({ ...data, meals, shopping }).then(() => setSaved(true));
      }}
    >
      <section className="panel stack">
        <h2>Ideias para minhas refeições</h2>
        <label>
          Edite conforme sua rotina
          <textarea
            rows={10}
            maxLength={10000}
            value={meals}
            onChange={(e) => {
              setMeals(e.target.value);
              setSaved(false);
            }}
          />
        </label>
        <button className="primary">Salvar organização</button>
        {saved && (
          <p role="status">Refeições e compras salvas neste navegador.</p>
        )}
      </section>
      <section className="panel stack">
        <h2>Lista de compras</h2>
        <label>
          Um item por linha
          <textarea
            rows={10}
            maxLength={10000}
            value={shopping}
            onChange={(e) => {
              setShopping(e.target.value);
              setSaved(false);
            }}
          />
        </label>
        <button>Salvar lista</button>
      </section>
    </form>
  );
}
