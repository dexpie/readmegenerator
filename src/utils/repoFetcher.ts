import axios from 'axios';

export function detectProjectType({ packageJson }: { packageJson: any }) {
    if (packageJson) {
        if (packageJson.dependencies?.react || packageJson.devDependencies?.react) {
            return 'react';
        }
        return 'nodejs';
    }
    // TODO: Add more detection for python, cli, etc. (can be extended)
    return 'generic';
}

export async function fetchGitHubRepoData(repoUrl: string) {
    // Example: https://github.com/user/repo
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error('Invalid GitHub URL');
    const [_, owner, repo] = match;

    // Fetch repo metadata
    const repoMeta = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);
    // Fetch languages
    const languages = await axios.get(`https://api.github.com/repos/${owner}/${repo}/languages`);
    // Try to fetch package.json
    let packageJson = null;
    try {
        const pkgRes = await axios.get(`https://raw.githubusercontent.com/${owner}/${repo}/main/package.json`);
        packageJson = pkgRes.data;
    } catch { }

    return {
        meta: repoMeta.data,
        languages: languages.data,
        packageJson,
    };
}
