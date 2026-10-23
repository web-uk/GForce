import { useEffect, useState } from "react";
import { Pause, Play, SkipForward, SkipBack, Volume2 } from "lucide-react";
import { stepsFor, exercises, safety } from "../content/exercises";
import { ExerciseDetail } from "./ExerciseDetail";
import type { Data } from "../lib/model";
export function Workout({
  data,
  save,
  onFinish,
}: {
  data: Data;
  save: (d: Data) => Promise<void>;
  onFinish: (
    partial: boolean,
    effort: "Leve" | "Moderado" | "Difícil",
    pain: boolean,
    resistance: string,
    notes: string,
    actualReps: number,
  ) => void;
}) {
  const a = data.active!;
  const steps = stepsFor(
    a.kind,
    a.short,
    a.easy ? Math.max(3, a.reps - 2) : a.reps,
    !!data.profile?.equipment.includes("Cargas leves"),
  );
  const step = steps[Math.min(a.index, steps.length - 1)];
  const [now, setNow] = useState(Date.now());
  const [audio, setAudio] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [review, setReview] = useState(false);
  const [partial, setPartial] = useState(false);
  const [effort, setEffort] = useState<"Leve" | "Moderado" | "Difícil">(
    "Moderado",
  );
  const [pain, setPain] = useState(false);
  const [resistance, setResistance] = useState("Peso corporal");
  const [notes, setNotes] = useState("");
  const [away, setAway] = useState(false);
  const [actualReps, setActualReps] = useState(
    a.easy ? Math.max(3, a.reps - 2) : a.reps,
  );
  const remaining = a.deadline
    ? Math.max(0, Math.ceil((a.deadline - now) / 1000))
    : a.remaining;
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    const handler = () => {
      if (document.hidden && a.deadline) {
        const rem = a.deadline
          ? Math.max(0, Math.ceil((a.deadline - Date.now()) / 1000))
          : a.remaining;
        void save({
          ...data,
          active: { ...a, remaining: rem, deadline: null },
        });
        setAway(true);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [data, a, save]);
  useEffect(() => {
    if (!a.deadline || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | undefined;
    void navigator.wakeLock
      .request("screen")
      .then((l) => {
        lock = l;
      })
      .catch(() => {});
    return () => {
      void lock?.release();
    };
  }, [a.deadline]);
  function cue(text: string) {
    if (audio && "speechSynthesis" in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "pt-BR";
      u.volume = volume;
      speechSynthesis.speak(u);
    }
  }
  async function move(delta: number) {
    const index = Math.max(0, Math.min(steps.length - 1, a.index + delta));
    cue(steps[index].title);
    await save({
      ...data,
      active: { ...a, index, remaining: steps[index].seconds, deadline: null },
    });
  }
  if (review)
    return (
      <section className="panel stack">
        <h1>
          {partial ? "Cada parte conta." : "Treino registrado no seu ritmo."}
        </h1>
        <p>Como foi a sessão?</p>
        <label>
          Dificuldade
          <select
            value={effort}
            onChange={(e) => setEffort(e.target.value as typeof effort)}
          >
            <option>Leve</option>
            <option>Moderado</option>
            <option>Difícil</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={pain}
            onChange={(e) => setPain(e.target.checked)}
          />
          Senti dor ou sintomas pélvicos
        </label>
        <label>
          Repetições realizadas por movimento (ou por lado)
          <input
            type="number"
            min={0}
            max={100}
            value={actualReps}
            onChange={(e) =>
              setActualReps(Math.min(100, Math.max(0, Number(e.target.value))))
            }
          />
        </label>
        <small>
          Se variou entre movimentos, use as anotações para registrar os
          detalhes. O app não mede repetições.
        </small>
        <label>
          Resistência utilizada
          <input
            maxLength={100}
            value={resistance}
            onChange={(e) => setResistance(e.target.value)}
          />
        </label>
        <label>
          Anotações (opcional)
          <textarea
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </label>
        {pain && (
          <p className="notice">
            Interrompa e procure avaliação. Não tente tratar sintomas trocando o
            exercício.
          </p>
        )}
        <button
          className="primary"
          onClick={() =>
            onFinish(partial, effort, pain, resistance, notes, actualReps)
          }
        >
          Salvar {partial ? "registro parcial" : "conclusão"}
        </button>
        <button onClick={() => setReview(false)}>Voltar à sessão</button>
      </section>
    );
  return (
    <section className="workout stack">
      <div className="row">
        <span className="eyebrow">
          SESSÃO {a.kind} · {a.short ? "CURTA" : "ESSENCIAL"}
        </span>
        <span>
          {a.index + 1}/{steps.length}
        </span>
      </div>
      <progress value={a.index + 1} max={steps.length} />
      <div className="panel stack center">
        <span className="tag">{step.phase}</span>
        <h1>{step.title}</h1>
        <div className="timer" aria-live="off">
          {String(Math.floor(remaining / 60)).padStart(2, "0")}
          <span>:</span>
          {String(Math.floor(remaining % 60)).padStart(2, "0")}
        </div>
        <p>{step.instruction}</p>
        {away && (
          <p className="notice">
            A tela ficou em segundo plano. Confira como está e confirme para
            retomar.
          </p>
        )}
        {remaining === 0 && (
          <p className="notice">
            Tempo de referência encerrado. Avance quando estiver pronta; nenhuma
            etapa avança sozinha.
          </p>
        )}
        <div className="row controls">
          <button
            aria-label="Etapa anterior"
            onClick={() => void move(-1)}
            disabled={!a.index}
          >
            <SkipBack />
          </button>
          <button
            className="primary"
            onClick={() => {
              setAway(false);
              cue(step.title);
              void save({
                ...data,
                active: {
                  ...a,
                  remaining,
                  deadline: a.deadline ? null : Date.now() + remaining * 1000,
                },
              });
            }}
          >
            {a.deadline ? <Pause /> : <Play />}
            {a.deadline ? "Pausar" : "Retomar"}
          </button>
          <button
            aria-label="Próxima etapa"
            disabled={a.index === steps.length - 1}
            onClick={() => void move(1)}
          >
            <SkipForward />
          </button>
        </div>
      </div>
      {step.exercise && (
        <div className="panel stack">
          <ExerciseDetail e={exercises.find((e) => e.id === step.exercise)!} />
          <button
            onClick={() =>
              void save({
                ...data,
                active: {
                  ...a,
                  easy: !a.easy,
                  deadline: null,
                  remaining: stepsFor(
                    a.kind,
                    a.short,
                    !a.easy ? Math.max(3, a.reps - 2) : a.reps,
                    !!data.profile?.equipment.includes("Cargas leves"),
                  )[a.index].seconds,
                },
              })
            }
          >
            {a.easy ? "Voltar à versão inicial" : "Usar alternativa mais fácil"}
          </button>
          {a.easy && (
            <p>
              Use a alternativa mais fácil descrita acima, com menos repetições.
              Não é uma adaptação para dor.
            </p>
          )}
        </div>
      )}
      <div className="panel">
        <label className="check">
          <input
            type="checkbox"
            checked={audio}
            onChange={(e) => setAudio(e.target.checked)}
          />
          <Volume2 size={18} /> Voz opcional ao usar controles
        </label>
        <label>
          Volume
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />
        </label>
        <small>
          Áudio depende do navegador e pode falhar com a tela bloqueada. O timer
          e os controles visuais continuam disponíveis.
        </small>
      </div>
      <p className="notice">{safety}</p>
      <button
        className="primary"
        onClick={() => {
          setPartial(a.index < steps.length - 1);
          if (a.index < 2) setActualReps(0);
          setReview(true);
          void save({ ...data, active: { ...a, deadline: null, remaining } });
        }}
      >
        {a.index === steps.length - 1
          ? "Concluir treino"
          : "Encerrar e registrar parcial"}
      </button>
    </section>
  );
}
