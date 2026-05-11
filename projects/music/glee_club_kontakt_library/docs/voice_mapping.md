# Voice Mapping Design

This document defines how MIDI notes, keyswitches, and CC messages map to samples and sections inside the Kontakt instrument.

---

## Keyboard Layout

```
Octave -1 (C-1 to B-1) — Keyswitches (no audio)
Octave 0  (C0  to B0)  — Keyswitches continued
Octave 1+ (C1  and up) — Playable range (audio output)
```

### Keyswitch Assignments

Keyswitches are low notes (below the audible range) that silently switch the active group/section.

| MIDI Note | Note Name | Section Activated |
|-----------|-----------|------------------|
| C0 (12)   | C0        | Full Choir (default) |
| C#0 (13)  | C#0       | High Voices (tenor/soprano) |
| D0 (14)   | D0        | Low Voices (baritone/bass/alto) |
| D#0 (15)  | D#0       | Voice 1 Solo |
| E0 (16)   | E0        | Voice 2 Solo |
| F0 (17)   | F0        | Voice 3 Solo |
| F#0 (18)  | F#0       | (reserved for future voices) |

### Playable Range

| MIDI Notes | Range | Purpose |
|-----------|-------|---------|
| C1 – B6 (24–107) | 7 octaves | Main playable zone |

Kontakt pitch-shifts samples to fill notes between recorded pitches (every 3 semitones).

---

## CC (Continuous Controller) Assignments

| CC # | Name | Function |
|------|------|----------|
| CC1  | Mod Wheel | Crossfade soft → loud (pp → ff) |
| CC11 | Expression | Overall volume swell |
| CC21 | Vowel | Crossfade between vowel layers (ah → oh → ee) |

CC21 is a custom assignment (not standard MIDI). Map it in FL Studio via the MIDI CC automation clip.

---

## Velocity Layers

| Velocity Range | Dynamic | Layer |
|---------------|---------|-------|
| 0–42          | pp      | Soft samples |
| 43–85         | mf      | Medium samples |
| 86–127        | ff      | Loud samples |

For POC (single dynamic level recorded), velocity controls volume only — no layer switching until multiple dynamics are recorded.

---

## Group Structure in Kontakt

```
Instrument: 2026 Glee Club
│
├── Group 0: Full Choir          [active by default, keyswitch C0]
│   ├── Subgroup: Voice 1 (v01)
│   └── Subgroup: Voice 2 (v02)
│
├── Group 1: High Voices         [keyswitch C#0]
│   └── Subgroup: Voice 2 (v02, soprano/tenor range)
│
├── Group 2: Low Voices          [keyswitch D0]
│   └── Subgroup: Voice 1 (v01, baritone/bass range)
│
├── Group 3: Voice 1 Solo        [keyswitch D#0]
│   └── All notes for v01
│
└── Group 4: Voice 2 Solo        [keyswitch E0]
    └── All notes for v02
```

---

## POC Minimum Viable Mapping

For the first working prototype with 2 voices and "ah" vowel only at mf dynamic:

1. Import all `v01_*_ah_mf.wav` files into Group 3 (Voice 1 Solo), one zone per note
2. Import all `v02_*_ah_mf.wav` files into Group 4 (Voice 2 Solo)
3. Set Group 3 + Group 4 as children of Group 0 (Full Choir), both playing simultaneously
4. Add keyswitch logic so C#0 silences Group 3, D#0 silences Group 4
5. Test: play a C major scale and confirm it sounds like singing, not a keyboard patch
