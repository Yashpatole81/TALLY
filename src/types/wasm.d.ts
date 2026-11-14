/** Metro bundles .wasm files as assets (metro.config.js). Only web code imports them, where the value is the file's URL. */
declare module '*.wasm' {
  const url: string;
  export default url;
}
