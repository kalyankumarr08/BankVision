import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useData } from './DataContext';
import { REQUIRED_SHEETS } from '../data/schema';
import { UploadError, buildDataset, checkFile, pickDefaultSheet, readWorkbook, tick } from '../utils/excelParser';

/**
 * Generic "upload any workbook" state. Everything happens in the browser; the file is never sent anywhere.
 * The original demo dataset lives in DataContext and is never modified here, so Reset is always safe.
 */
const UploadContext = createContext(null);

export const UPLOAD_STEPS = ['Reading workbook', 'Detecting sheets', 'Detecting columns', 'Generating visualizations'];
const IDLE = { status: 'idle', stage: 0, file: null, sheets: [], active: null, datasets: {}, error: null, compatible: false, switching: false };

/** Does the workbook have every sheet/column the original BankVision dashboards need? */
function matchesBankVisionSchema(sheets) {
  return Object.entries(REQUIRED_SHEETS).every(([name, spec]) => {
    const sh = sheets.find((s) => s.name === name);
    return sh && sh.rowCount > 0 && spec.required.every((c) => sh.headers.includes(c));
  });
}

const friendly = (e) => (e instanceof UploadError ? { title: e.title, message: e.message } : { title: 'Unable to read this Excel file.', message: 'Please upload a valid .xlsx or .xls file.' });

export function UploadProvider({ children }) {
  const { loadFile, reload, kind } = useData();
  const [state, setState] = useState(IDLE);
  const raw = useRef(new Map()); // sheet name -> raw rows (released once the sheet is analysed)
  const run = useRef(0); // guards against out-of-order async results

  const analyse = (name) => {
    const sheet = raw.current.get(name);
    const ds = buildDataset(sheet);
    sheet.dataRows = []; // typed rows now live in the dataset; free the raw copy
    return ds;
  };

  const upload = useCallback(async (file) => {
    const id = ++run.current;
    setState({ ...IDLE, status: 'processing', file: file ? { name: file.name, size: file.size } : null });
    const stage = (n) => run.current === id && setState((s) => ({ ...s, stage: n }));
    try {
      checkFile(file);
      await tick();
      const buffer = await file.arrayBuffer();
      stage(1);
      await tick();
      const sheets = readWorkbook(buffer);
      if (!sheets.some((s) => s.rowCount > 0)) throw new UploadError('Please upload a file that contains data rows.', 'This workbook is empty');
      raw.current = new Map(sheets.map((s) => [s.name, s]));
      stage(2);
      await tick();
      const active = pickDefaultSheet(sheets);
      stage(3);
      await tick();
      const dataset = analyse(active);
      const compatible = matchesBankVisionSchema(sheets) && (await loadFile(file)).ok;
      if (!compatible && kind === 'upload') reload(); // a previous upload must not linger on the main dashboard
      if (run.current !== id) return;
      setState({
        ...IDLE,
        status: 'ready',
        stage: UPLOAD_STEPS.length,
        file: { name: file.name, size: file.size },
        sheets: sheets.map(({ name, rowCount, colCount }) => ({ name, rowCount, colCount })),
        active,
        datasets: { [active]: dataset },
        compatible,
      });
    } catch (e) {
      if (run.current !== id) return;
      raw.current = new Map();
      setState({ ...IDLE, status: 'error', file: file ? { name: file.name, size: file.size } : null, error: friendly(e) });
    }
  }, [loadFile, reload, kind]);

  const selectSheet = useCallback(async (name) => {
    if (state.datasets[name]) return setState((s) => ({ ...s, active: name }));
    setState((s) => ({ ...s, active: name, switching: true }));
    await tick();
    try {
      const ds = analyse(name);
      setState((s) => ({ ...s, switching: false, datasets: { ...s.datasets, [name]: ds } }));
    } catch {
      setState((s) => ({ ...s, switching: false, error: { title: 'Unable to analyze this sheet', message: 'Please choose another worksheet.' } }));
    }
    return undefined;
  }, [state.datasets]);

  /** Back to the original BankVision demo dataset. */
  const reset = useCallback(() => {
    run.current += 1;
    raw.current = new Map();
    setState(IDLE);
    if (kind === 'upload') reload();
  }, [kind, reload]);

  const value = useMemo(
    () => ({ ...state, dataset: state.datasets[state.active] ?? null, upload, selectSheet, reset, remove: reset }),
    [state, upload, selectSheet, reset],
  );
  return <UploadContext.Provider value={value}>{children}</UploadContext.Provider>;
}

export const useUpload = () => useContext(UploadContext);
