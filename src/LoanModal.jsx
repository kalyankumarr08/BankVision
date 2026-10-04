import Modal from '../Modal';
import StatusBadge from '../StatusBadge';
import { DetailGrid } from '../DetailBits';
import { useData } from '../../context/DataContext';
import { useDrill } from '../../context/DrillContext';
import { fmtDate, inr } from '../../utils/format';

export default function LoanModal({ id, onClose }) {
  const { model } = useData();
  const { openCustomer, openBranch } = useDrill();
  const l = model.loanById.get(id);
  if (!l) return null;
  return (
    <Modal title={`${l.Loan_Type} · ${l.Loan_ID}`} subtitle={`Applied ${fmtDate(l.Application_Date)}`} onClose={onClose}>
      <p><StatusBadge status={l.Loan_Status} /></p>
      <DetailGrid
        items={[
          ['Customer', <button key="c" type="button" className="link-btn" onClick={() => openCustomer(l.Customer_ID)}>{l.Customer_Name ?? l.Customer_ID}</button>],
          ['Branch', <button key="b" type="button" className="link-btn" onClick={() => openBranch(l.Branch_ID)}>{l.Branch_Name}</button>],
          ['Loan amount', inr(l.Loan_Amount)],
          ['Outstanding', inr(l.Outstanding_Amount)],
          ['Interest rate', `${l.Interest_Rate}% p.a.`],
          ['Tenure', l.Loan_Tenure_Months ? `${l.Loan_Tenure_Months} months` : null],
          ['EMI', l.EMI_Amount != null ? inr(l.EMI_Amount) : null],
          ['Risk score', l.Risk_Score],
          ['Collateral', l.Collateral_Type],
          ['Days past due', l.DPD_Days],
        ]}
      />
    </Modal>
  );
}
