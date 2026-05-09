# Entwicklungsbrief: ChaosRing Apple Watch Ziffernblatt

**Projekt:** ChaosRing Watch Faces  
**Version:** 1.0  
**Datum:** 09. Mai 2026  
**Status:** Konzeptphase

---

## Ausgangslage

Das ChaosRing-Repository ist ein React/Three.js-Prototyp, der einen prozedural animierten Ring aus neun konzentrischen Lagen à 560 Segmenten rendert. Die Ringform folgt der Formel

```
r(θ,t) = R + n(θ,t) + s(θ,t) + c(θ,p) + i(t)
```

wobei mehrschichtiges Perlin-Rauschen, ein Spike-Feld, Cursor-Proximität und Impuls-Wellen die Radiusabweichung je Winkelposition bestimmen. Das System ist vollständig deterministisch und seedbasiert — identische Parameter erzeugen immer identische Formen.

Auf dieser Grundlage werden zwei Apple Watch Ziffernblätter entwickelt: ein **analoges** und ein **digitales**. Beide teilen dieselbe visuelle Sprache: heller Hintergrund, schwarze Ringlinien, maximaler Minimalismus.

---

## Konzept 1 — Analog: „CHAOS RING WATCH – ANALOG"

### Leitgedanke

Das Ziffernblatt **ist** der Ring. Keine klassische Stundenskala, keine Ziffern — der ChaosRing trägt die Zeit als seine eigene Form. Die Zeiger sind keine Applikation über dem Ring, sondern Teil desselben minimalen Formenraums. Der Minutenzeiger endet nicht auf einem festen Kreisradius, sondern auf der **aktuell fluktierenden Ringkontur** — seine Spitze reitet auf der lebendigen Form.

---

### Visuelles System

#### Hintergrund
- Reines Weiß `#FFFFFF` oder warmes Papierweiß `#F8F6F2`
- Absolut flach, kein Gradient, kein Rauschen
- Die Ringbewegung wirkt als reiner Hell-Dunkel-Kontrast

#### Der Ring
Drei Lagen mit steigender Opazität:

| Layer | Opazität | Charakter |
|-------|----------|-----------|
| 0 (außen) | 0.18 | Feinste Fluktuation, fast transparent |
| 1 (mitte) | 0.52 | Hauptform, volle Dynamik |
| 2 (innen) | 0.82 | Träge, stabil — niedriges `chaos`, hohes `breath` |

- **Farbe:** `#0A0A0A` (Fast-Schwarz) für alle Lagen
- **Linienbreite:** 1.2 px — schlank, präzise
- **Blending:** Normal (kein Additive) — sauberer Schwarz-auf-Weiß-Kontrast
- **Radius:** ca. 42 % des Gehäusedurchmessers

#### Ringparameter-Mapping auf Uhr- und Gesundheitsdaten

| Parameter | Datenquelle | Verhalten |
|-----------|-------------|-----------|
| `intensity` | Stunde des Tages (0–23 → 0–1) | Nachts ruhig, Mittagspeak |
| `chaos` | Herzfrequenz (40–200 BPM → 0–1) | Ruhepuls = geordnet, Sport = turbulent |
| `spikes` | Schritte (% des Tagesziels) | Inaktiv = glatt, aktiv = Spikes |
| `breath` | Atemfrequenz / Ruhemodus | Ring atmet bei Ruhephase langsam |
| `speed` | Aktivitätslevel (sitzend / gehend / Sport) | Animation beschleunigt bei Bewegung |
| `lineCount` | Akku-Ladestand (mapped 1–9 Lagen) | Visuelles Energie-Feedback |

**Mitternacht:** Ring fast perfekt kreisförmig — ruhig, minimal, nur leichtes Atmen.  
**Mittag mit Sport:** Aggressive Spikes, hohe Turbulenz — kraftvolle, lebendige Form.

---

### Die Zeiger

Jeder Zeiger ist eine einzige gerade `THREE.Line` vom Ringmittelpunkt zur Ringgrenze. Kein klassischer Pivot-Knopf — die drei Linien treffen sich im mathematischen Zentrum.

| Zeiger | Länge | Stärke | Farbe | Besonderheit |
|--------|-------|--------|-------|--------------|
| Stunde | 55 % des Ringradius | 2.2 px | `#0A0A0A` | Endet innerhalb des Rings |
| Minute | 100 % + aktueller Ringoffset bei θ | 1.0 px | `#0A0A0A` | Spitze reitet auf der Ringkontur |
| Sekunde | 108 % (ragt über Ring hinaus) | 0.6 px, opacity 0.45 | `#0A0A0A` | Kein Gegengewicht |

#### Zeitmarken
Keine Ziffern, keine Strichskala. Nur **vier Orientierungspunkte** bei 12, 3, 6, 9 Uhr: je ein 1.5 px Quadrat-Pixel (`■`) in `#0A0A0A`, außerhalb des Rings platziert (Abstand: 4 % des Gehäusedurchmessers).

---

### Dynamisches Zeitverhalten

| Ereignis | Ring-Reaktion |
|----------|---------------|
| Jede volle Stunde (`:00`) | Ripple-Impuls — Wellenfront läuft durch alle Lagen, Decay in 3 s |
| Jede halbe Stunde (`:30`) | Sanfter `autoEscalate`-Schub (+0.15 auf `intensity` für 5 s) |
| Jede Minute | Mikro-Impuls — subtile Störung der Ringkontur |
| Herzschlag-Sync (optional) | `breath`-Parameter pulst im Herzrhythmus |

---

## Konzept 2 — Digital: „CHAOS RING WATCH – DIGITAL"

### Leitgedanke

Die Ziffern sitzen im **Auge des Rings**. Der Ring fluktuiert um die Zeitanzeige herum — er kommentiert die Zeit, statt sie zu zeigen. Die Digits sind statisch und immer lesbar, der Ring ist lebendig und kontextreich.

---

### Visuelles System

#### Layout-Hierarchie

```
┌───────────────────────────────────┐
│         [Weißer Hintergrund]      │
│                                   │
│      ╔═════════════════════╗      │
│      ║     ~ChaosRing~     ║      │
│      ║                     ║      │
│      ║    ┌───────────┐    ║      │
│      ║    │   09:47   │    ║      │
│      ║    │   Fr  09  │    ║      │
│      ║    └───────────┘    ║      │
│      ║                     ║      │
│      ╚═════════════════════╝      │
│                                   │
│   [Komplikationsslot  ▸ 78 %]    │
└───────────────────────────────────┘
```

#### Die digitale Zeitanzeige

| Eigenschaft | Wert |
|-------------|------|
| Schriftart | SF Compact Rounded (watchOS-nativ) |
| Gewicht | Light (100–200) — dünn, passend zu Ringlinien |
| Größe | 32 pt auf 45 mm Watch |
| Farbe | `#0A0A0A` |
| Letter-Spacing | +0.08 em (leicht gesperrt) |
| Sekundenanzeige | Nein (Akku-Schonung) |

Unterhalb der Uhrzeit, innerhalb des Ringraums:
- Wochentag + Datum: `„Fr 09"` — 11 pt, opacity 0.45, Farbe `#0A0A0A`

#### Komplikationsslot (außerhalb des Rings, 6-Uhr-Position)

```
▸ 78 %    (Activity-Füllstand)
```

9 pt, opacity 0.55 — oder alternativ: Nächster Kalendertermin (Titel + Uhrzeit).

---

### Ring-Reaktion auf Ziffernwechsel

| Ereignis | Ring-Reaktion |
|----------|---------------|
| Minutenwechsel | Ripple von der rechten Ringseite (Minuten-Seite) |
| Stundenwechsel | Doppel-Ripple + `intensity`-Spike (0.8 für 2 s, dann zurück) |
| Herzfrequenz-Spike (+20 BPM) | `chaos` springt proportional, `spikes` erhöht sich |
| Activity-Ringe geschlossen | `breath` auf Maximum, Ring „feiert" für 5 s |

#### Das Chaos-Lesbarkeits-Prinzip

- **`chaos = 0.0`:** Ring als fast perfekter Kreis → ruhige Atmosphäre, klare Ziffern
- **`chaos = 0.8`:** Ring verformt sich stark, Spikes reichen nah an die Ziffern heran — visuelle Spannung, aber Lesbarkeit bleibt immer gewahrt

Die Ziffern selbst bleiben stets statisch und klar. Nur der Ring fluktuiert.

---

### Energiesparmodi

| Modus | Ring-Verhalten |
|-------|----------------|
| Normal (60 fps, AOD aus) | Volle Fluktuation, alle 3 Lagen aktiv |
| Always-On-Display (1 fps) | Nur Layer 1 (Hauptring), auf aktueller Form eingefroren |
| Low Power Mode | Ring als statischer Kreis, nur Ziffer und Datum sichtbar |

---

## Technische Implementierung

### Stack

| Schicht | Technologie |
|---------|-------------|
| Watch-Framework | SwiftUI + `TimelineView(.animation)` |
| Rendering | `Canvas { context, size }` — direktes Pfad-Zeichnen |
| Ringformel | Swift-Reimplementierung der JS-Noisefunktionen |
| Segmente | 140 je Layer (reduziert von 560 für Apple Watch S9-Performance) |
| Gesundheitsdaten | HealthKit (BPM, Schritte, Atemfrequenz) |
| Zeitplanung | `TimelineSchedule` mit `.animation`-Frequenz |

### Pseudocode-Struktur (digital)

```swift
struct ChaosRingDigitalFace: View {
    @State var ringParams: ChaosRingParams
    
    var body: some View {
        TimelineView(.animation) { context in
            ZStack {
                Color.white
                
                ChaosRingCanvas(
                    params: ringParams,
                    time: context.date.timeIntervalSince1970,
                    layers: 3,
                    segments: 140,
                    color: Color(hex: "#0A0A0A")
                )
                
                VStack(spacing: 2) {
                    Text(context.date, format: .dateTime.hour().minute())
                        .font(.system(size: 32, weight: .light, design: .rounded))
                        .foregroundColor(Color(hex: "#0A0A0A"))
                        .kerning(2.5)
                    
                    Text(context.date, format: .dateTime.weekday(.abbreviated).day())
                        .font(.system(size: 11, weight: .light))
                        .foregroundColor(Color(hex: "#0A0A0A").opacity(0.45))
                }
            }
        }
        .onReceive(heartRatePublisher) { bpm in
            ringParams.chaos = normalize(bpm, min: 40, max: 180)
        }
    }
}
```

### Ringformel in Swift

Die JavaScript-Noisefunktionen aus `DynamicChaosCirclePage.jsx` werden 1:1 nach Swift portiert:

```swift
func hashNoise(_ x: Double) -> Double {
    sin(x * 127.1 + 311.7) * 43758.5453
}

func smoothNoise(_ x: Double) -> Double {
    let i = floor(x)
    let f = x - i
    let u = f * f * (3 - 2 * f)  // Hermite easing
    return mix(hashNoise(i), hashNoise(i + 1), t: u)
}

func layeredNoise(_ x: Double, _ t: Double) -> Double {
    var v = 0.0
    v += smoothNoise(x * 1.2 + t * 0.5)  * 0.52
    v += smoothNoise(x * 2.8 - t * 0.3)  * 0.28
    v += smoothNoise(x * 7.5 + t * 0.7)  * 0.15
    v += smoothNoise(x * 17.0 - t * 1.1) * 0.05
    return v
}
```

---

## Gemeinsame Designprinzipien

1. **Ring = Zustand, Zeiger/Ziffer = Zeit** — klare Trennung der Informationsschichten
2. **Schwarz auf Weiß** — keine Grautöne für Ringe, keine Farbakzente
3. **Liniengewicht = Hierarchie** — dünnere Linien = weniger dominante Information
4. **Bewegung kommt von innen** — Fluktuation entsteht aus echten Trägerdaten
5. **Deterministisch** — identische Parameter erzeugen immer identische Formen
6. **Vier-Punkte-Navigation** — bei Analog; bei Digital durch Ringform ersetzt

---

## Vergleich beider Konzepte

| Dimension | Analog | Digital |
|-----------|--------|---------|
| Zeitablesung | Ring + Zeiger | Ziffer im Ringzentrum |
| Primäraussage | Zeit als Form | Zeit als Text, Zustand als Form |
| Ring-Rolle | Ist das Ziffernblatt | Umrahmt das Ziffernblatt |
| Minimalismus | Maximal (keine Ziffern) | Hoch (Ziffern + 4 Dots) |
| Lesbarkeit bei hohem Chaos | Zeiger immer lesbar | Ziffern immer lesbar |
| Persönlichkeit | Meditativ, abstrakt | Präzise mit lebendigem Rahmen |
| Implementierungskomplexität | Hoch (Zeiger-auf-Ring-Mathematik) | Mittel (Ring + statische Ziffern) |

---

## Referenzdatei

Die bestehende **HELL-Theme** in `/src/DynamicChaosCirclePage.jsx` (Zeilen 22–26, 532–548, 865–931) ist die direkte Vorstufe beider Konzepte und dient als Referenz für:

- Farb- und Opazitätswerte
- Noisefunktionen (`hashNoise`, `smoothNoise`, `layeredNoise`)
- Spike-Feld-Logik und Ripple-System
- Gruppen-Transforms (Rotation, Scale, Breath)

---

*Dieses Dokument beschreibt den Entwicklungsauftrag für beide Watch Faces auf Basis des ChaosRing-Prototyps. Die Implementierung erfolgt als natives watchOS-Target in Swift/SwiftUI.*
