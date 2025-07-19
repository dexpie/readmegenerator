
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface Props {
    readme: string;
}

const Preview: React.FC<Props> = ({ readme }) => {
    const [copied, setCopied] = useState(false);
    const [dark, setDark] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(readme || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const handleDownload = () => {
        const blob = new Blob([readme || ''], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'README.md';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div style={{
            background: dark ? '#181a1b' : '#f8fafc',
            minHeight: '100vh',
            padding: '32px 0',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            transition: 'background 0.2s',
        }}>
            <div style={{
                maxWidth: 900,
                margin: 'auto',
                background: dark ? '#23272f' : '#fff',
                borderRadius: 16,
                boxShadow: dark ? '0 4px 24px rgba(0,0,0,0.18)' : '0 4px 24px rgba(0,0,0,0.08)',
                padding: 32,
                color: dark ? '#f3f3f3' : '#222',
                transition: 'background 0.2s, color 0.2s',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                    <h2 style={{ fontWeight: 700, margin: 0, marginRight: 16, fontSize: 28, letterSpacing: '-1px' }}>Preview</h2>
                    <button
                        onClick={() => setDark(d => !d)}
                        style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #ddd', background: dark ? '#23272f' : '#f5f5f5', color: dark ? '#f3f3f3' : '#222', cursor: 'pointer', fontSize: 16, fontWeight: 500, marginRight: 10, transition: 'background 0.2s, color 0.2s' }}
                    >
                        {dark ? '🌙 Dark' : '☀️ Light'}
                    </button>
                    <button
                        onClick={handleCopy}
                        style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #ddd', background: dark ? '#23272f' : '#f5f5f5', color: dark ? '#f3f3f3' : '#222', cursor: 'pointer', fontSize: 16, fontWeight: 500, marginRight: 10, transition: 'background 0.2s, color 0.2s' }}
                    >
                        📋 Copy README
                    </button>
                    <button
                        onClick={handleDownload}
                        style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid #ddd', background: dark ? '#23272f' : '#f5f5f5', color: dark ? '#f3f3f3' : '#222', cursor: 'pointer', fontSize: 16, fontWeight: 500, transition: 'background 0.2s, color 0.2s' }}
                    >
                        ⬇️ Download
                    </button>
                    {copied && (
                        <span style={{ marginLeft: 14, color: '#2ecc40', fontWeight: 600, fontSize: 16 }}>Copied!</span>
                    )}
                </div>
                <div
                    style={{
                        background: dark ? '#23272f' : '#f5f5f5',
                        padding: 28,
                        minHeight: 220,
                        borderRadius: 12,
                        boxShadow: dark ? '0 2px 8px rgba(0,0,0,0.18)' : '0 2px 8px rgba(0,0,0,0.07)',
                        fontFamily: 'Inter, Arial, sans-serif',
                        maxWidth: 800,
                        margin: 'auto',
                        fontSize: 17,
                        color: dark ? '#f3f3f3' : '#222',
                        transition: 'background 0.2s, color 0.2s',
                    }}
                >
                    <ReactMarkdown>{readme || 'Generated README will appear here.'}</ReactMarkdown>
                </div>
            </div>
            <footer style={{
                textAlign: 'center',
                marginTop: 32,
                padding: '18px 0 8px 0',
                color: dark ? '#aaa' : '#888',
                fontSize: 16,
            }}>
                Developed by <a href="https://github.com/dexpie" target="_blank" rel="noopener noreferrer" style={{ color: dark ? '#7abaff' : '#2d7cf0', textDecoration: 'none', fontWeight: 600 }}>dexpie</a>
            </footer>
        </div>
    );
};

export default Preview;
