export const strengthSource =
  "https://www.nhs.uk/live-well/exercise/strength-exercises/";
export const sittingSource =
  "https://www.nhs.uk/live-well/exercise/sitting-exercises/";
export type Exercise = {
  id: string;
  name: string;
  region: string;
  equipment: string;
  position: string;
  setup: string;
  execution: string;
  breathing: string;
  mistakes: string;
  easy: string;
  restrictions: string;
  reps: string;
  seconds: number;
  rest: number;
  source: string;
  visual: string;
};
const shared = {
  breathing:
    "Solte o ar no esforço e inspire ao retornar. Respire continuamente.",
  restrictions:
    "Não continue com dor, tontura ou sintomas pélvicos. Limitação individual exige avaliação.",
  rest: 35,
};
export const exercises: Exercise[] = [
  {
    ...shared,
    id: "pull",
    name: "Abertura dos braços",
    region: "Costas · ombros",
    equipment: "Elástico opcional",
    position: "Sentada",
    setup:
      "Sentada em cadeira firme, pés apoiados, braços à frente na altura dos ombros. Elástico leve opcional, íntegro e sem rachaduras.",
    execution:
      "Abra os braços lentamente para os lados, aproximando suavemente as escápulas. Retorne com controle. Sem elástico, pratique o gesto sem resistência externa como familiarização.",
    mistakes:
      "Subir os ombros, prender a respiração ou tensionar um elástico danificado.",
    easy: "Retire o elástico e use um movimento menor. A versão sem resistência é introdutória e não equivale à puxada com carga.",
    reps: "5 repetições lentas",
    seconds: 6,
    source:
      "https://www.bhf.org.uk/informationsupport/heart-matters-magazine/activity/resistance-bands",
    visual:
      "1. Pull apart (imagem e vídeo; sem elástico é adaptação introdutória)",
  },
  {
    ...shared,
    id: "sit",
    name: "Sentar e levantar",
    region: "Pernas · glúteos",
    equipment: "Cadeira",
    position: "Em pé",
    setup:
      "Cadeira firme sem rodas, encostada na parede. Pés inteiros no chão, afastados na largura do quadril.",
    execution:
      "Incline um pouco o tronco, levante devagar e sente com controle. Mantenha o olhar à frente.",
    mistakes: "Deixar o joelho cair para dentro ou despencar na cadeira.",
    easy: "Use as mãos como apoio e faça uma amplitude confortável.",
    reps: "5 repetições lentas",
    seconds: 6,
    source: strengthSource,
    visual: "Sit-to-stand",
  },
  {
    ...shared,
    id: "wall",
    name: "Flexão na parede",
    region: "Peito · braços · abdômen",
    equipment: "Parede",
    position: "Em pé",
    setup:
      "De frente para uma parede livre, mãos na altura do peito e pés estáveis.",
    execution:
      "Dobre os cotovelos aproximando o corpo inteiro da parede. Empurre suavemente para voltar, sem dobrar a cintura.",
    mistakes: "Prender o ar, arquear a lombar ou encolher os ombros.",
    easy: "Aproxime os pés da parede e reduza a amplitude.",
    reps: "5 repetições lentas",
    seconds: 5,
    source: strengthSource,
    visual: "Wall press-up",
  },
  {
    ...shared,
    id: "side",
    name: "Elevação lateral da perna",
    region: "Quadril · glúteos",
    equipment: "Cadeira",
    position: "Em pé",
    setup: "Em pé atrás da cadeira, mãos apoiadas no encosto.",
    execution:
      "Eleve uma perna lateralmente sem inclinar o tronco. Retorne e alterne os lados.",
    mistakes: "Inclinar o tronco ou girar os quadris.",
    easy: "Eleve menos e mantenha as duas mãos apoiadas.",
    reps: "5 de cada lado",
    seconds: 8,
    source: strengthSource,
    visual: "Sideways leg lift",
  },
  {
    ...shared,
    id: "back",
    name: "Perna para trás",
    region: "Glúteos · posterior da coxa",
    equipment: "Cadeira",
    position: "Em pé",
    setup: "Em pé atrás da cadeira com apoio firme e coluna confortável.",
    execution:
      "Leve uma perna estendida um pouco para trás, sem arquear a lombar. Sustente até 5 segundos e retorne. Alterne.",
    mistakes: "Compensar o movimento arqueando as costas.",
    easy: "Movimento menor, sem sustentar no alto.",
    reps: "5 de cada lado",
    seconds: 14,
    source: strengthSource,
    visual: "Leg extension",
  },
  {
    ...shared,
    id: "calf",
    name: "Elevação dos calcanhares",
    region: "Pernas · panturrilhas",
    equipment: "Cadeira",
    position: "Em pé",
    setup: "Pés paralelos e mãos no encosto da cadeira.",
    execution:
      "Suba os calcanhares lentamente e desça com controle. Mantenha o apoio.",
    mistakes: "Balançar o corpo ou tirar as mãos antes de ter estabilidade.",
    easy: "Suba menos, mantendo apoio nas duas mãos.",
    reps: "5 repetições",
    seconds: 5,
    source: strengthSource,
    visual: "Calf raises",
  },
  {
    ...shared,
    id: "curl",
    name: "Flexão dos braços com carga leve",
    region: "Braços",
    equipment: "Cargas leves",
    position: "Sentada",
    setup:
      "Sente em cadeira firme, pés no chão. Use garrafas bem fechadas e leves.",
    execution:
      "Com cotovelos junto ao corpo, dobre os braços até perto dos ombros. Abaixe lentamente.",
    mistakes: "Balançar o tronco ou elevar os ombros.",
    easy: "Faça sem carga; não aumente peso nesta fase.",
    reps: "5 repetições",
    seconds: 5,
    source: strengthSource,
    visual: "Biceps curls",
  },
  {
    ...shared,
    id: "march",
    name: "Marcha sentada",
    region: "Quadril · abdômen · pernas",
    equipment: "Cadeira",
    position: "Sentada",
    setup: "Sente ereta, sem apoiar no encosto. Segure as laterais da cadeira.",
    execution:
      "Eleve um joelho de cada vez até onde for confortável, colocando o pé no chão com controle.",
    mistakes: "Inclinar para trás ou prender a respiração.",
    easy: "Tire o pé apenas um pouco do chão.",
    reps: "5 de cada lado",
    seconds: 8,
    source: sittingSource,
    visual: "Hip marching",
  },
  {
    ...shared,
    id: "twist",
    name: "Rotação suave do tronco",
    region: "Costas · mobilidade",
    equipment: "Cadeira",
    position: "Sentada",
    setup: "Sentada com pés no chão e braços cruzados no peito.",
    execution:
      "Gire o tronco suavemente para um lado sem mover os quadris. Sustente 5 segundos, volte e alterne.",
    breathing: "Respire suavemente durante toda a rotação.",
    mistakes: "Forçar o limite ou girar os quadris junto.",
    easy: "Faça um giro menor sem sustentar.",
    reps: "5 de cada lado",
    seconds: 14,
    source: sittingSource,
    visual: "Upper-body twist",
  },
  {
    ...shared,
    id: "chest",
    name: "Abertura suave do peito",
    region: "Peito · costas · mobilidade",
    equipment: "Cadeira",
    position: "Sentada",
    setup: "Sente ereta, ombros relaxados. Braços abertos ao lado do corpo.",
    execution:
      "Abra suavemente o peito, levando os ombros para trás e para baixo. Sustente 5 segundos e relaxe.",
    breathing: "Respire normalmente, sem segurar o ar.",
    mistakes: "Forçar os ombros para trás ou arquear a lombar.",
    easy: "Abra menos os braços.",
    reps: "5 sustentações de 5 segundos",
    seconds: 8,
    source: sittingSource,
    visual: "Chest stretch",
  },
];
export type Step = {
  title: string;
  seconds: number;
  exercise?: string;
  instruction: string;
  phase: string;
};
export function stepsFor(
  kind: string,
  short: boolean,
  reps: number,
  lightWeights: boolean,
): Step[] {
  const ids = short
    ? ["sit", "wall", "march"]
    : kind === "B"
      ? ["sit", "wall", "back", "march", "pull", lightWeights ? "curl" : "side"]
      : ["sit", "wall", "side", "march", "calf", "pull"];
  const steps: Step[] = [
    {
      title: "Prepare seu espaço",
      seconds: short ? 50 : 60,
      instruction:
        "Confira cadeira e parede firmes, piso livre e água por perto. Caminhe devagar no lugar, sem saltar; se preferir, mova os pés sentada.",
      phase: "Aquecimento",
    },
    {
      title: "Solte o corpo",
      seconds: short ? 45 : 60,
      instruction:
        "Mova os ombros suavemente e alterne passos confortáveis. Aumente o ritmo só se estiver confortável.",
      phase: "Aquecimento",
    },
  ];
  for (const id of ids) {
    const e = exercises.find((e) => e.id === id)!;
    steps.push(
      {
        title: e.name,
        seconds: e.seconds * reps,
        exercise: id,
        instruction: `1 série · ${reps}${["side", "back", "march", "twist"].includes(id) ? " de cada lado" : " repetições"} · no seu ritmo. O tempo é uma referência, avance quando terminar.`,
        phase: "Parte principal",
      },
      {
        title: "Recupere o fôlego",
        seconds: short ? 25 : e.rest,
        instruction:
          "Respire normalmente. Descanse mais se precisar. Você deve conseguir conversar.",
        phase: "Descanso",
      },
    );
  }
  steps.push({
    title: "Finalize com calma",
    seconds: short ? 75 : 90,
    instruction:
      "Diminua o ritmo, mova os tornozelos e relaxe os ombros. Não force alongamentos. Beba água conforme sua sede.",
    phase: "Finalização",
  });
  return steps;
}
export const safety =
  "Esforço muscular é diferente de dor. Pare se houver dor, tontura, mal-estar, perda urinária ou peso pélvico; procure avaliação antes de retomar. Dor no peito persistente, falta de ar intensa ou desmaio exigem ajuda urgente (SAMU 192 no Brasil).";
