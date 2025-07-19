import React, { useState } from 'react';
import UrlInput from '../components/UrlInput';
import Preview from '../components/Preview';

const Home: React.FC = () => {
    const [repoUrl, setRepoUrl] = useState('');
    const [readme, setReadme] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: repoUrl }),
        });
        const data = await res.json();
        setReadme(data.readme || '');
        setLoading(false);
    };

    return (
        <div style={{ maxWidth: 700, margin: 'auto', padding: 32 }}>
            <h1>README Generator</h1>
            <UrlInput value={repoUrl} onChange={setRepoUrl} onGenerate={handleGenerate} loading={loading} />
            <Preview readme={readme} />
        </div>
    );
};

export default Home;
