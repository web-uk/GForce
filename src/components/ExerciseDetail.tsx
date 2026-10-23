import type { Exercise } from "../content/exercises";
export function ExerciseDetail({ e }: { e: Exercise }) {
  return (
    <div className="exercise-detail stack">
      <p className="tag">
        {e.region} · {e.position} · {e.equipment}
      </p>
      <p>
        <strong>Prepare:</strong> {e.setup}
      </p>
      <p>
        <strong>Movimento:</strong> {e.execution}
      </p>
      <p>
        <strong>Respiração:</strong> {e.breathing}
      </p>
      <p>
        <strong>Evite:</strong> {e.mistakes}
      </p>
      <p>
        <strong>Mais fácil:</strong> {e.easy}
      </p>
      <p>
        {e.reps} · descanso de {e.rest}s, ou mais se necessário.
      </p>
      <p className="muted">{e.restrictions}</p>
      <a href={e.source} target="_blank" rel="noreferrer">
        Ver demonstração na fonte: {e.visual} ↗
      </a>
      <small>
        Imagens na seção indicada da fonte. Precisa de internet. Consulta:
        23/10/2026. Instruções acima disponíveis offline.
      </small>
    </div>
  );
}
