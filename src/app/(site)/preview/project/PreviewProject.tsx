'use client';

import { useEffect, useState } from 'react';
import { ProjectPage } from '@/components/site/ProjectPage';
import type { Copy } from '@/content/copy';
import type { ProjectFull } from '@/lib/data';

/** Reads the draft the editor stored in this browser and renders it exactly as the live page would. */
export function PreviewProject({ copy }: { copy: Copy }) {
  const [project, setProject] = useState<ProjectFull | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rf-preview');
      const parsed = raw ? (JSON.parse(raw) as { project: ProjectFull }) : null;
      setProject(parsed?.project ? { ...parsed.project, updatedAt: new Date(parsed.project.updatedAt) } : null);
    } catch {
      setProject(null);
    }
  }, []);

  if (project === undefined) return null;
  if (project === null) {
    return (
      <p
        style={{
          padding: '160px clamp(20px,4.44vw,64px)',
          font: '500 20px/1.5 var(--font-body)',
          color: 'rgba(244,242,239,0.78)',
        }}
      >
        There is no draft to preview. Open a project in the admin and press Preview.
      </p>
    );
  }
  return <ProjectPage copy={copy} project={project} next={null} />;
}
