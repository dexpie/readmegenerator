import React from 'react';

interface Props {
    value: string;
    onChange: (val: string) => void;
    onGenerate: () => void;
    loading: boolean;
}

const UrlInput: React.FC<Props> = ({ value, onChange, onGenerate, loading }) => (
    <div style={{ marginBottom: 24 }}>
        <input
            type="text"
            placeholder="Paste GitHub/GitLab repo URL..."
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{ width: '80%', padding: 8, fontSize: 16 }}
        />
        <button onClick={onGenerate} disabled={loading || !value} style={{ marginLeft: 8, padding: '8px 16px' }}>
            {loading ? 'Generating...' : 'Generate README'}
        </button>
    </div>
);

export default UrlInput;
