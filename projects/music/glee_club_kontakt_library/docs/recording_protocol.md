# Recording Protocol

## Goals

Capture every voice at enough pitches, vowels, and dynamic levels so Kontakt can pitch-shift between recorded notes without sounding unnatural (ideally no more than a major third of stretch per sample).

---

## Note Range

Record every **3 semitones** across each voice's comfortable range. Kontakt will pitch-shift the adjacent samples to fill the gaps.

| Voice Type | Suggested Range | Notes to Record |
|-----------|----------------|-----------------|
| Tenor | C3 – G4 | C3, Eb3, F#3, A3, C4, Eb4, F#4 |
| Baritone | G2 – D4 | G2, Bb2, D3, F3, A3, C4, D4 |
| Bass | E2 – B3 | E2, G2, Bb2, D3, F3, A3, B3 |
| Soprano | C4 – G5 | C4, Eb4, F#4, A4, C5, Eb5, F#5 |
| Alto | G3 – D5 | G3, Bb3, D4, F4, A4, C5, D5 |

For the **Phase 1 POC**, record a single male voice (yourself) covering C3–C5 and a single female voice (your sister) covering C4–C5.

---

## Vowels to Record Per Note

| Vowel | IPA | Example word | Priority |
|-------|-----|--------------|----------|
| "Ah" | /ɑː/ | father | 1 (record first) |
| "Oh" | /oʊ/ | go | 2 |
| "Ee" | /iː/ | see | 3 |
| "Mm" | /m/ | humming | 4 (POC: skip) |

---

## Dynamic Levels

| Level | Abbrev | Description |
|-------|--------|-------------|
| Soft | pp | Barely audible, breathy |
| Medium | mf | Normal speaking-to-singing projection |

For POC, record at **mf only** and add velocity crossfading later.

---

## Recording Setup (POC — Phone)

- Hold phone **8–12 inches** from mouth, slightly to the side (not directly in front)
- Quiet room, no AC/fan noise, windows closed
- Record 3 seconds of room tone before each session (use this to cut noise in post)
- Sing each note for **3–4 seconds** with a clean attack, then stop
- Leave **1 second of silence** between takes before moving to the next note
- Do **3 takes** per note; keep the cleanest one

---

## File Naming Convention

```
{section}_{voice_id}_{note}_{vowel}_{dynamic}.wav
```

**Examples:**
```
full_v01_C3_ah_mf.wav
full_v01_D3_ah_mf.wav
high_v02_C4_ah_mf.wav
```

| Field | Values |
|-------|--------|
| `section` | `full`, `high`, `low`, `solo` |
| `voice_id` | `v01`, `v02`, ... (assigned per singer) |
| `note` | `C3`, `Db3`, `D3`, etc. (use `b` not `#` for flats to avoid filesystem issues) |
| `vowel` | `ah`, `oh`, `ee`, `mm` |
| `dynamic` | `pp`, `mf`, `ff` |

---

## Post-Processing Checklist (per file)

- [ ] Trim silence from head and tail
- [ ] Normalize peak to -3 dBFS
- [ ] Check for clipping — retake if clipped
- [ ] Export as **48 kHz / 24-bit WAV** (Kontakt preferred format)
