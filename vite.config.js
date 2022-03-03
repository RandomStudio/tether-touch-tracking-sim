import builtins from "rollup-plugin-node-builtins";
// import globals from "rollup-plugin-node-globals";

export default {
  root: "./",
  server: {
    host: "0.0.0.0",
    port: 3001,
    strictPort: true,
    fs: {
      strict: false,
    },
  },
  resolve: {
    alias: {
      mqtt: "mqtt/dist/mqtt.js",
    },
  },
  plugins: [builtins()],
};