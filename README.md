# Chaos Ring

Interaktiver Three.js/React-Prototyp für einen dynamischen Ring aus vielen kleinen Linien. Der aktuelle Stand fokussiert auf:

- zentrale Ringdarstellung als Web-App,
- manuelle Eingaben über eine Control Surface,
- direkt ablesbare Output-Telemetrie,
- Railway-Deployment über Nixpacks.

## Lokale Entwicklung

```bash
npm install
npm run dev
```

## Produktionsbuild

```bash
npm run build
npm run start
```

`npm run start` nutzt `vite preview` und bindet an `0.0.0.0` sowie an die von Railway gesetzte `PORT`-Variable.

## Railway Deployment

Railway kann das Projekt direkt aus dem Repository bauen. Die Deployment-Konfiguration liegt in `railway.json`:

1. Build: `npm ci && npm run build`
2. Start: `npm run start`

## Erste Iterationsziele

- Der Ring ist als Website erreichbar und kann als gemeinsames Referenzobjekt weiterentwickelt werden.
- Inputs sind normalisiert und bewusst einfach gehalten: Intensität, Chaos, Spitzen, Geschwindigkeit, Cursor-Kraft, Atmung und Layer-Anzahl.
- Outputs werden als Telemetrie sichtbar gemacht: Divergenz, Kohärenz, Energie, aktive Samples und Layer.
- Die Renderer-Logik bleibt lokal deterministisch, damit spätere Datenfeeds nur eine Input-Schicht ergänzen müssen.
