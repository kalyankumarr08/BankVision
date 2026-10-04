import { useRef, useState } from 'react';
import { Moon, Sun, Upload, Database } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { num } from '../utils/format';

export default function Settings() {
  const { model, source, loadFile, reload } = useData();
  const { theme, setTheme } = useTheme();
  const input = useRef(null);
  const [msg, setMsg] = useState(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const res = await loadFile(file);
    setMsg(res.ok ? { ok: true, text: `Loaded ${file.name}.` } : { ok: false, text: res.error });
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Appearance and data source" />
      <section className="card" aria-label="Appearance">
        <h3>Appearance</h3>
        <div className="segmented segmented--lg" role="group" aria-label="Theme">
          <button type="button" className={theme === 'light' ? 'is-active' : ''} aria-pressed={theme === 'light'} onClick={() => setTheme('light')}><Sun size={15} aria-hidden="true" /> Light</button>
          <button type="button" className={theme === 'dark' ? 'is-active' : ''} aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}><Moon size={15} aria-hidden="true" /> Dark</button>
        </div>
      </section>
      <section className="card" aria-label="Data source">
        <h3>Data source</h3>
        <p><Database size={15} aria-hidden="true" /> <strong>{source}</strong></p>
        <p className="muted">Educational / synthetic dataset for data-visualization demonstrations. No real customers, accounts or transactions.</p>
        {model && (
          <ul className="chips">
            {Object.entries(model.counts).map(([k, v]) => <li key={k} className="pill">{k}: {num(v)}</li>)}
          </ul>
        )}
        <div className="row">
          <input ref={input} type="file" accept=".xlsx,.xls" hidden onChange={onFile} />
          <button type="button" className="btn btn--primary" onClick={() => input.current?.click()}><Upload size={15} aria-hidden="true" /> Load another workbook</button>
          <button type="button" className="btn btn--ghost" onClick={reload}>Reload bundled dataset</button>
        </div>
        <p className="muted small">Workbooks need the sheets Customers, Accounts, Transactions, Loans and Branches with the same column names as the bundled file.</p>
        {msg && <p role="status" className={msg.ok ? 'ok-text' : 'err-text'}>{msg.text}</p>}
      </section>
    </>
  );
}
