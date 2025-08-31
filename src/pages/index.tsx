import React, { useState, useEffect, useRef } from 'react';
import UrlInput from '../components/UrlInput';
import Preview from '../components/Preview';

const Home: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [readme, setReadme] = useState('');
  const [loading, setLoading] = useState(false);
  // history for undo/redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const debounceRef = useRef<number | null>(null);

  const fetchReadme = async (url: string) => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data?.readme) updateReadme(data.readme || '');
    } catch (err) {
      console.error('Failed to fetch README:', err);
    } finally {
      setLoading(false);
    }
  };

  // helper to manage readme state plus history stack for undo/redo
  const updateReadme = (next: string, pushHistory = true) => {
    setReadme(next);
    try {
      // save to localStorage
      localStorage.setItem('readmeDraft', next);
    } catch (e) {
      // ignore storage errors
    }

    if (!pushHistory) return;
    setHistory(prev => {
      const cut = prev.slice(0, historyIdx + 1);
      // avoid pushing duplicate consecutive states
      if (cut.length && cut[cut.length - 1] === next) return cut;
      const max = 100;
      const combined = [...cut, next].slice(-max);
      setHistoryIdx(combined.length - 1);
      return combined;
    });
  };

  const handleGenerate = async () => {
    await fetchReadme(repoUrl);
  };

  const undo = () => {
    setHistoryIdx(i => {
      const nextIdx = Math.max(0, i - 1);
      const val = history[nextIdx] ?? '';
      setReadme(val);
      try { localStorage.setItem('readmeDraft', val); } catch {}
      return nextIdx;
    });
  };

  const redo = () => {
    setHistoryIdx(i => {
      const nextIdx = Math.min(history.length - 1, i + 1);
      const val = history[nextIdx] ?? '';
      setReadme(val);
      try { localStorage.setItem('readmeDraft', val); } catch {}
      return nextIdx;
    });
  };

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!repoUrl) return;
    debounceRef.current = window.setTimeout(() => {
      fetchReadme(repoUrl);
    }, 800);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [repoUrl]);

  // restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('readmeDraft');
      if (saved) {
        setReadme(saved);
        setHistory([saved]);
        setHistoryIdx(0);
      }
    } catch (e) {}
  }, []);

  // keyboard shortcuts for undo/redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (!meta) return;
      if (e.key === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [history, historyIdx]);

  return (
    <div style={{ maxWidth: 1100, margin: 'auto', padding: 32 }}>
      <h1>README Generator</h1>
  <UrlInput value={repoUrl} onChange={setRepoUrl} onGenerate={handleGenerate} loading={loading} />

      <div style={{ display: 'flex', gap: 24, marginTop: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Editable README</h3>
            <div style={{ marginLeft: 12, display: 'flex', gap: 8 }}>
              <button onClick={undo} disabled={historyIdx <= 0}>Undo</button>
              <button onClick={redo} disabled={historyIdx >= history.length - 1}>Redo</button>
              <button onClick={() => { updateReadme(''); }} style={{ marginLeft: 8 }}>Clear</button>
            </div>
          </div>

          <textarea
            value={readme}
            onChange={e => updateReadme(e.target.value)}
            placeholder="Generated README or edit here to update preview..."
            style={{ width: '100%', minHeight: 520, padding: 12, fontSize: 14, fontFamily: 'monospace', borderRadius: 8, border: '1px solid #e6e6e6' }}
          />
        </div>

        <div style={{ width: 560 }}>
          <Preview readme={readme} />
        </div>
      </div>
    </div>
  );
};

export default Home;
