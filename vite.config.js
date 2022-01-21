import builtins from "rollup-plugin-node-builtins";
import globals from "rollup-plugin-node-globals";

export default {
  server: {
    host: "0.0.0.0",
    port: 3001,
    strictPort: true
  },
  plugins: [builtins(), globals()],
  resolve: {
    alias: {
      mqtt: "mqtt/dist/mqtt.js",
    },
  },
}