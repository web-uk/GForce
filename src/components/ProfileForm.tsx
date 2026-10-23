import { useState } from "react";
import { defaultProfile, needsReview, type Profile } from "../lib/model";
export function ProfileForm({
  profile,
  onSave,
}: {
  profile: Profile | null;
  onSave: (p: Profile) => void;
}) {
  const [p, set] = useState(profile ?? defaultProfile);
  const field = (k: keyof Profile, v: Profile[keyof Profile]) =>
    set({ ...p, [k]: v });
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(p);
      }}
    >
      <div className="eyebrow">SEU PONTO DE PARTIDA</div>
      <h1>
        Uma rotina que cabe
        <br />
        na sua vida.
      </h1>
      <p>
        Responda sem pressa. Peso e medidas não são necessários. Este programa
        geral não substitui avaliação individual.
      </p>
      <label>
        Nome ou apelido (opcional)
        <input
          value={p.name}
          maxLength={60}
          onChange={(e) => field("name", e.target.value)}
        />
      </label>
      <div className="grid two">
        <label>
          Faixa etária
          <select
            required
            defaultValue={profile?.age ?? ""}
            onChange={(e) => field("age", e.target.value)}
          >
            <option value="" disabled>
              Selecione
            </option>
            {["Menos de 18", "18–39", "40–59", "60+"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Experiência
          <select
            required
            defaultValue={profile?.experience ?? ""}
            onChange={(e) => field("experience", e.target.value)}
          >
            <option value="" disabled>
              Selecione
            </option>
            {["Iniciante", "Retomando", "Pratico regularmente"].map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Dias de força disponíveis
          <select
            value={p.days}
            onChange={(e) => field("days", Number(e.target.value))}
          >
            <option value={2}>2 dias · início recomendado</option>
            <option value={3}>3 dias · terceiro opcional</option>
          </select>
        </label>
        <label>
          Tempo por sessão
          <select
            value={p.minutes}
            onChange={(e) => field("minutes", Number(e.target.value))}
          >
            {[5, 10, 15, 20, 30].map((v) => (
              <option key={v} value={v}>
                {v} minutos
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset>
        <legend>Equipamentos disponíveis</legend>
        {(["Cadeira", "Parede", "Cargas leves", "Elástico"] as const).map(
          (v) => (
            <label className="check" key={v}>
              <input
                type="checkbox"
                checked={p.equipment.includes(v as never)}
                onChange={(e) =>
                  field(
                    "equipment",
                    e.target.checked
                      ? [...p.equipment, v]
                      : p.equipment.filter((x) => x !== v),
                  )
                }
              />
              {v}
            </label>
          ),
        )}
      </fieldset>
      <label>
        Espaço
        <select
          value={p.space}
          onChange={(e) => field("space", e.target.value)}
        >
          <option>Pequeno</option>
          <option>Livre</option>
        </select>
      </label>
      <label className="check">
        <input
          type="checkbox"
          checked={p.floor}
          onChange={(e) => field("floor", e.target.checked)}
        />
        Posso usar o chão (o plano inicial também funciona sem chão)
      </label>
      <label>
        Limitações, lesões ou dores relevantes
        <textarea
          value={p.limitations}
          maxLength={1000}
          placeholder="Se não houver, deixe em branco"
          onChange={(e) => field("limitations", e.target.value)}
        />
      </label>
      <label>
        Gestação ou recuperação de parto
        <select
          required
          defaultValue={profile?.pregnancy ?? ""}
          onChange={(e) => field("pregnancy", e.target.value)}
        >
          <option value="" disabled>
            Selecione, sem presumir sua situação
          </option>
          {[
            "Não se aplica",
            "Gestação",
            "Recuperação do parto",
            "Prefiro orientação individual",
          ].map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <label>
        Sintomas pélvicos: perda urinária, dor ou sensação de peso
        <select
          required
          defaultValue={
            profile
              ? profile.pelvic
                ? "Sim"
                : "Não percebo esses sintomas"
              : ""
          }
          onChange={(e) =>
            field("pelvic", e.target.value !== "Não percebo esses sintomas")
          }
        >
          <option value="" disabled>
            Selecione
          </option>
          <option>Não percebo esses sintomas</option>
          <option>Sim</option>
          <option>Não sei / prefiro avaliação</option>
        </select>
      </label>
      <label>
        Objetivos
        <input
          value={p.goals}
          maxLength={300}
          onChange={(e) => field("goals", e.target.value)}
        />
      </label>
      <div className="grid two">
        <label>
          Peso (opcional, kg)
          <input
            value={p.weight}
            maxLength={30}
            onChange={(e) => field("weight", e.target.value)}
          />
        </label>
        <label>
          Cintura (opcional, cm)
          <input
            value={p.waist}
            maxLength={30}
            onChange={(e) => field("waist", e.target.value)}
          />
        </label>
      </div>
      {needsReview(p) && (
        <p className="notice">
          Suas respostas pedem avaliação individual. O app manterá biblioteca e
          registros acessíveis, mas não gerará treino automático. Isso não é um
          diagnóstico.
        </p>
      )}
      <button className="primary" type="submit">
        Salvar meu perfil
      </button>
    </form>
  );
}
