import React, { useState, useEffect, useRef } from 'react';
import UrlInput from '../components/UrlInput';
import Preview from '../components/Preview';

const Home: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [readme, setReadme] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
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
      if (data?.readme) setReadme(data.readme);
    } catch (err) {
      console.error('Failed to fetch README:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateDescription = async () => {
    if (!repoUrl) return;
    setGeneratingDesc(true);
    try {
      const res = await fetch(`/api/description?url=${encodeURIComponent(repoUrl)}`);
      const data = await res.json();
      const desc = (data?.description as string) ?? '';
      if (!desc) {
        alert('No description generated');
      } else {
        const newReadme = `# Project Description\n\n${desc}\n\n` + readme;
        setReadme(newReadme);
      }
    } catch (err) {
      console.error('Failed to generate description:', err);
    } finally {
      setGeneratingDesc(false);
    }
  };

  const handleGenerate = async () => {
    await fetchReadme(repoUrl);
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

  return (
    <div style={{ maxWidth: 1100, margin: 'auto', padding: 32 }}>
      <h1>README Generator</h1>
      <UrlInput value={repoUrl} onChange={setRepoUrl} onGenerate={handleGenerate} loading={loading} />

      <div style={{ display: 'flex', gap: 24, marginTop: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <h3 style={{ marginTop: 0 }}>Editable README</h3>
            <button onClick={generateDescription} disabled={generatingDesc || !repoUrl} style={{ marginLeft: 12 }}>
              {generatingDesc ? 'Generating...' : 'Generate description'}
            </button>
          </div>

          <textarea
            value={readme}
            onChange={e => setReadme(e.target.value)}
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
