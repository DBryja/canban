export interface Project {
  id: string;
  name: string;
  description: string | null;
  creatorId: string;
  createdAt?: string;
  updatedAt?: string;
  creator?: {
    id: string;
    name: string | null;
    email: string;
  };
  tasks?: Array<{
    id: string;
    number: number | null;
    title: string;
    description: string | null;
    tags?: Array<{
      id: string;
      name: string;
      color: string | null;
    }>;
  }>;
  columns?: Array<{
    id: string;
    projectId: string;
    tagId: string;
    order: number;
    tag: {
      id: string;
      name: string;
      color: string | null;
    };
  }>;
}

/**
 * Helper function to create slug from project name
 */
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Helper function to find project by slug or ID
 */
export function findProjectBySlug(
  projects: Project[],
  slug: string
): Project | undefined {
  return projects.find((p) => createSlug(p.name) === slug || p.id === slug);
}

/**
 * Get project URL by project object
 */
export function getProjectUrl(project: Project): string {
  return `/dashboard/${createSlug(project.name)}`;
}

/**
 * Get project URL by project ID (requires projects array)
 */
export function getProjectUrlById(
  projects: Project[],
  projectId: string
): string | null {
  const project = projects.find((p) => p.id === projectId);
  return project ? getProjectUrl(project) : null;
}
