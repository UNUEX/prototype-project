// Type declarations for CSS modules and side-effect CSS imports
declare module '*.css';
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}