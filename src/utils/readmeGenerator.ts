import { detectProjectType } from './repoFetcher';
import fs from 'fs';
import path from 'path';

export function generateReadme(repoData: any): string {
    const { meta, languages, packageJson } = repoData;
    const type = detectProjectType({ packageJson });
    const templatePath = path.join(process.cwd(), 'src', 'templates', `${type}.md`);
    let template = '';
    try {
        template = fs.readFileSync(templatePath, 'utf-8');
    } catch {
        // fallback to generic
        template = fs.readFileSync(path.join(process.cwd(), 'src', 'templates', 'generic.md'), 'utf-8');
    }

    // Generate summary (simple version: use description or fallback)
    const summary = meta.description
        ? `> ${meta.description}`
        : '> No project summary available.';

    // Replace placeholders
    return template
        .replace(/{projectName}/g, meta.name)
        .replace(/{description}/g, meta.description || '')
        .replace(/{summary}/g, summary)
        .replace(/{owner}/g, meta.owner.login)
        .replace(/{repo}/g, meta.name)
        .replace(/{license}/g, meta.license?.spdx_id || '');
}
