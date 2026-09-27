declare module '*.css' {}

declare module '*.module.pcss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.png' {
  const url: string;
  export default url;
}

declare module '*.svg' {
  const url: string;
  export default url;
}
