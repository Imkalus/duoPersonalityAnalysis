/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHOW_FILL_ALL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
