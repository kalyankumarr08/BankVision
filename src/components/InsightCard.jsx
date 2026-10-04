import { Lightbulb } from 'lucide-react';

export default function InsightCard({ title, text }) {
  return (
    <article className="card insight">
      <span className="insight__icon" aria-hidden="true">
        <Lightbulb size={16} />
      </span>
      <div>
        <h4>{title}</h4>
        <p>{text}</p>
      </div>
    </article>
  );
}
