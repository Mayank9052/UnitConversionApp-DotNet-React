import { useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, ArrowRightLeft, Check, ChevronDown, Clipboard, Gauge, History, Ruler, Scale, Thermometer, Waves } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5080').replace(/\/$/, '');
const FALLBACK = [
  { id: 'length', name: 'Length', units: [
    { id: 'meter', name: 'Meter', symbol: 'm' }, { id: 'kilometer', name: 'Kilometer', symbol: 'km' },
    { id: 'centimeter', name: 'Centimeter', symbol: 'cm' }, { id: 'millimeter', name: 'Millimeter', symbol: 'mm' },
    { id: 'mile', name: 'Mile', symbol: 'mi' }, { id: 'yard', name: 'Yard', symbol: 'yd' },
    { id: 'foot', name: 'Foot', symbol: 'ft' }, { id: 'inch', name: 'Inch', symbol: 'in' },
  ]},
  { id: 'temperature', name: 'Temperature', units: [
    { id: 'celsius', name: 'Celsius', symbol: '°C' }, { id: 'fahrenheit', name: 'Fahrenheit', symbol: '°F' },
    { id: 'kelvin', name: 'Kelvin', symbol: 'K' },
  ]},
  { id: 'mass', name: 'Weight / Mass', units: [
    { id: 'kilogram', name: 'Kilogram', symbol: 'kg' }, { id: 'gram', name: 'Gram', symbol: 'g' },
    { id: 'milligram', name: 'Milligram', symbol: 'mg' }, { id: 'pound', name: 'Pound', symbol: 'lb' },
    { id: 'ounce', name: 'Ounce', symbol: 'oz' }, { id: 'tonne', name: 'Metric tonne', symbol: 't' },
  ]},
];
const categoryIcons = { length: Ruler, temperature: Thermometer, mass: Scale };
const defaultUnits = { length: ['meter', 'foot'], temperature: ['celsius', 'fahrenheit'], mass: ['kilogram', 'pound'] };
const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 8 });

export default function App() {
  const [categories, setCategories] = useState(FALLBACK);
  const [category, setCategory] = useState('length');
  const [value, setValue] = useState('10');
  const [fromUnit, setFromUnit] = useState('meter');
  const [toUnit, setToUnit] = useState('foot');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);

  const active = categories.find(c => c.id === category) || categories[0];
  const units = active?.units || [];
  const from = units.find(u => u.id === fromUnit) || units[0];
  const to = units.find(u => u.id === toUnit) || units[1] || units[0];

  useEffect(() => {
    fetch(`${API_BASE}/api/conversions/units`)
      .then(r => { if (!r.ok) throw new Error('API unavailable'); return r.json(); })
      .then(setCategories)
      .catch(() => setCategories(FALLBACK));
  }, []);

  useEffect(() => {
    if (!units.length) return;
    const defaults = defaultUnits[category] || [units[0].id, (units[1] || units[0]).id];
    setFromUnit(defaults[0]); setToUnit(defaults[1]); setResult(null); setError('');
  }, [category]);

  const canConvert = useMemo(() => value.trim() !== '' && Number.isFinite(Number(value)), [value]);

  async function convert() {
    setError(''); setResult(null);
    if (!canConvert) { setError('Enter a valid number to convert.'); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/conversions/convert`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: Number(value), fromUnit, toUnit }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Conversion failed. Check that the API is running.');
      setResult(data);
      setHistory(prev => [{ id: Date.now(), value: Number(value), from, to, result: data.result }, ...prev].slice(0, 6));
    } catch (e) {
      setError(e.message.includes('fetch') ? 'Cannot reach the API. Start the .NET backend and try again.' : e.message);
    } finally { setLoading(false); }
  }

  function swap() { setFromUnit(toUnit); setToUnit(fromUnit); setResult(null); }
  async function copyResult() {
    if (!result) return;
    try { await navigator.clipboard.writeText(`${value} ${from?.symbol} = ${fmt(result.result)} ${to?.symbol}`); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch { setError('Clipboard access is unavailable in this browser.'); }
  }

  return <main className="app-shell">
    <nav className="topbar">
      <a className="brand" href="#"><span className="brand-mark"><ArrowRightLeft size={20}/></span><span>unit<span className="brand-light">flow</span></span></a>
      <div className="top-links"><span className="live-dot"/> <span>Precision, made simple</span></div>
    </nav>

    <section className="hero">
      <div className="eyebrow"><span className="eyebrow-line"/> THE EVERYDAY CONVERTER</div>
      <h1>Every unit.<br/><span>One simple answer.</span></h1>
      <p className="hero-copy">From tiny measurements to big ideas, turn numbers into the units that make sense to you.</p>
      <div className="hero-stats"><span><Check size={15}/> Instant results</span><span><Check size={15}/> 3 conversion categories</span><span><Check size={15}/> Always precise</span></div>
    </section>

    <section className="workspace">
      <div className="category-row" role="tablist" aria-label="Conversion category">
        {categories.map(c => {
          const Icon = categoryIcons[c.id] || Waves;
          return <button key={c.id} className={`category-tab ${category === c.id ? 'active' : ''}`} onClick={() => setCategory(c.id)} role="tab" aria-selected={category === c.id}>
            <Icon size={18}/><span>{c.name}</span>
          </button>;
        })}
      </div>

      <div className="converter-card">
        <div className="card-heading"><div><span className="step-label">01 / CONVERT</span><h2>Make the switch</h2></div><span className="secure-label"><Gauge size={15}/> Accurate conversion</span></div>
        <div className="conversion-grid">
          <div className="unit-panel">
            <label htmlFor="value">From</label>
            <div className="number-wrap"><input id="value" type="number" value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && convert()} placeholder="Enter a value"/></div>
            <div className="select-wrap"><select aria-label="Source unit" value={fromUnit} onChange={e => {setFromUnit(e.target.value); setResult(null);}}>{units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}</select><ChevronDown size={16}/></div>
            <div className="unit-hint">Unit to convert from</div>
          </div>
          <button className="swap-button" onClick={swap} aria-label="Swap units"><ArrowDownUp size={19}/></button>
          <div className="unit-panel">
            <label htmlFor="target-unit">To</label>
            <div className="target-value">{result ? fmt(result.result) : '—'}</div>
            <div className="select-wrap"><select id="target-unit" aria-label="Target unit" value={toUnit} onChange={e => {setToUnit(e.target.value); setResult(null);}}>{units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.symbol})</option>)}</select><ChevronDown size={16}/></div>
            <div className="unit-hint">Unit to convert to</div>
          </div>
        </div>
        {error && <div className="error-message" role="alert">{error}</div>}
        <button className="convert-button" onClick={convert} disabled={loading}>{loading ? <span className="spinner"/> : <ArrowRightLeft size={18}/>} {loading ? 'Converting…' : 'Convert units'} <span className="button-arrow">↗</span></button>
        {result && <div className="result-strip"><div><span className="result-caption">YOUR CONVERSION</span><div className="result-equation">{fmt(result.inputValue)} <small>{from?.symbol}</small><span className="equals">=</span>{fmt(result.result)} <small>{to?.symbol}</small></div></div><button className="copy-button" onClick={copyResult}>{copied ? <Check size={16}/> : <Clipboard size={16}/>} {copied ? 'Copied' : 'Copy'}</button></div>}
        <div className="card-footer"><span><span className="footer-dot"/> Conversion runs through your local API</span><span>UNITFLOW / 01</span></div>
      </div>

      <aside className="history-card">
        <div className="history-heading"><div className="history-title"><History size={17}/><h3>Recent conversions</h3></div><span>{history.length} / 6</span></div>
        {history.length ? <div className="history-list">{history.map(item => <button className="history-item" key={item.id} onClick={() => {setValue(String(item.value)); setFromUnit(item.from.id); setToUnit(item.to.id); setCategory(categories.find(c => c.units.some(u => u.id === item.from.id))?.id || 'length'); setResult({inputValue:item.value, result:item.result});}}><span className="history-symbol">{item.from.symbol}</span><span className="history-description"><strong>{fmt(item.value)} {item.from.symbol} <span>→</span> {fmt(item.result)} {item.to.symbol}</strong><small>{item.from.name} to {item.to.name}</small></span><ArrowRightLeft size={15}/></button>)}</div> : <div className="empty-history"><span className="empty-icon"><History size={19}/></span><p>Your conversions will appear here.</p><small>Make a conversion to start your history.</small></div>}
      </aside>
    </section>
    <footer className="footer"><span>UNITFLOW <span>© 2026</span></span><span>Built for curious minds. <span>✳</span></span></footer>
  </main>;
}
