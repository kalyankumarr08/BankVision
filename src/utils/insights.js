import { isActiveAccount } from '../data/schema';
import { groupBy, share, sum, pctChange } from './aggregate';
import { inrCompact, pct, num } from './format';
import { loanAnalysis, transactionMix } from './analytics';

/** Rule-based insights, calculated from the filtered data (no hard-coded statements). */
export function buildInsights(view, stats) {
  const out = [];
  const acc = view.accounts.filter(isActiveAccount);
  const totalDep = sum(acc, (a) => a.Balance);

  const topBranch = [...stats].sort((a, b) => b.deposits - a.deposits)[0];
  if (topBranch && topBranch.deposits > 0)
    out.push({ id: 'branch', title: 'Top branch', text: `${topBranch.Branch_Name} has the highest deposit volume (${inrCompact(topBranch.deposits)}, ${pct(share(topBranch.deposits, totalDep))} of deposits).` });

  const topState = [...groupBy(acc, (a) => a.State)].map(([s, r]) => [s, sum(r, (a) => a.Balance)]).sort((a, b) => b[1] - a[1])[0];
  if (topState && topState[1] > 0)
    out.push({ id: 'state', title: 'Leading state', text: `Customers in ${topState[0]} hold the most deposits (${pct(share(topState[1], totalDep))} of the total).` });

  const seg = [...groupBy(acc, (a) => a.Customer_Segment)].map(([s, r]) => [s, sum(r, (a) => a.Balance)]).sort((a, b) => b[1] - a[1])[0];
  if (seg && seg[1] > 0) out.push({ id: 'segment', title: 'Segment contribution', text: `${seg[0]} customers contribute the largest share of deposits (${pct(share(seg[1], totalDep))}).` });

  const loans = loanAnalysis(view.loans);
  if (loans.length) {
    const total = sum(loans, (l) => l.amount);
    const top = loans[0];
    out.push({ id: 'loan-share', title: 'Loan mix', text: `${top.name}s account for the largest share of loan value (${pct(share(top.amount, total))}, ${num(top.count)} loans).` });
    if (loans.length > 1) {
      const byRate = [...loans].sort((a, b) => b.approvalRate - a.approvalRate);
      out.push({ id: 'loan-rate', title: 'Approval rates', text: `${byRate[0].name} has the highest approval rate (${pct(byRate[0].approvalRate)}); ${byRate[byRate.length - 1].name} has the lowest (${pct(byRate[byRate.length - 1].approvalRate)}).` });
    }
  }

  const months = [...groupBy(view.transactions, (t) => t.Month)].map(([m, r]) => [m, r.length]).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  if (months.length >= 2) {
    const half = Math.floor(months.length / 2);
    const first = sum(months.slice(0, half), (m) => m[1]) / half;
    const second = sum(months.slice(months.length - half), (m) => m[1]) / half;
    const ch = pctChange(second, first);
    if (ch != null)
      out.push({ id: 'txn-trend', title: 'Transaction trend', text: `Monthly transaction volume ${ch >= 0 ? 'increased' : 'decreased'} by ${pct(Math.abs(ch))} in the later half of the selected period versus the earlier half.` });
  }

  const channels = transactionMix(view.transactions, 'Channel');
  if (channels.length) out.push({ id: 'channel', title: 'Channel usage', text: `${channels[0].name} is the most used channel (${pct(share(channels[0].count, view.transactions.length))} of transactions).` });

  if (view.transactions.length) {
    const failed = view.transactions.filter((t) => t.Transaction_Status === 'Failed');
    out.push({ id: 'failed', title: 'Failed transactions', text: `${pct(share(failed.length, view.transactions.length))} of transactions failed (${num(failed.length)} records).` });
  }
  return out;
}
