import { Heart } from "lucide-react";
import { todayMessage } from "../content/messages";
import type { Data } from "../lib/model";
export function DailyMessage({ data }: { data: Data }) {
  const message = todayMessage(data);
  return (
    <section className="panel daily-message" aria-label="Mensagem de cuidado">
      <span className="icon-tile">
        <Heart size={21} />
      </span>
      <div>
        <h3>{message.title}</h3>
        <p>{message.text}</p>
      </div>
    </section>
  );
}
