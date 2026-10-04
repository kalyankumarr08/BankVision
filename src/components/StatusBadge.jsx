import { CheckCircle2, Clock, XCircle, AlertTriangle, MinusCircle, PauseCircle } from 'lucide-react';

// Icon + text + tone: status is never communicated by colour alone.
const MAP = {
  Approved: ['success', CheckCircle2],
  Success: ['success', CheckCircle2],
  Active: ['success', CheckCircle2],
  Pending: ['warning', Clock],
  Dormant: ['warning', PauseCircle],
  Rejected: ['danger', XCircle],
  Failed: ['danger', XCircle],
  Defaulted: ['danger', AlertTriangle],
  Closed: ['neutral', MinusCircle],
};

export default function StatusBadge({ status }) {
  const [tone, Icon] = MAP[status] ?? ['neutral', MinusCircle];
  return (
    <span className={`badge badge--${tone}`}>
      <Icon size={13} aria-hidden="true" />
      {status}
    </span>
  );
}
