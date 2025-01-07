# Tether (multi)touch tracking simulator

## Quick Start

```
npm install
npm run dev
```

Or, for a more optimised build:

```
npm run preview
```

By default, launches server at port :8080 - in `dev` or `preview` modes

## URL SearchParams

For example, http://localhost:8080/?dimensions=2000,2000&origin=CENTRE_CENTRE

- `tetherHost`: Specify where the MQTT Broker is; otherwise, falls back to assuming the same host as the web page
- `dimensions`: Specify the output dimensions
- `origin`: Specify the origin mode, either TOP_LEFT, TOP_CENTRE or CENTRE_CENTER (default)
