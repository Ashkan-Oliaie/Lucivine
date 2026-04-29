/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** When set, axios talks to this origin's /api. Omit in dev to use same-origin /api (Vite proxy). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
