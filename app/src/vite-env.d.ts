/// <reference types="vite/client" />

declare module '*.module.pcss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
