# 2026 Glee Club — Kontakt Vocal Library (Working Title)

A custom Kontakt 7 instrument built from recordings of the **Morehouse College Glee Club**. Individual voices and choir sections are mapped to MIDI notes and keyswitches so the library plays like a real instrument — not just static sample playback.

## Concept

Capture each Glee Club member singing individual notes across their range (multiple vowels, multiple dynamic levels), then assemble those recordings into a fully playable Kontakt instrument. Users will be able to:

- Select individual voices or blend sections (high voices, low voices, full choir)
- Trigger sustained notes chromatically across the keyboard
- Switch between articulations (sustained, staccato, vowel types) via keyswitches

## Current Status

**Phase 1 — Proof of Concept (in progress)**

Recording myself and one other singer on a phone to learn the full technical pipeline before approaching the Morehouse music department for a production recording session.

## Roadmap

| Phase | Goal | Status |
|-------|------|--------|
| 1 | POC: 2 voices, phone recordings, basic Kontakt mapping | In progress |
| 2 | Pitch to Morehouse music dept, plan full recording session | Not started |
| 3 | Full glee club recording session, complete KSP scripting | Not started |
| 4 | Polish, UI design, publishable release | Not started |

## What Lives in This Repo

| Path | What it is |
|------|-----------|
| `docs/ksp_learning_notes.md` | Running notes on KSP (Kontakt Script Processor) |
| `docs/recording_protocol.md` | How to record each voice correctly |
| `docs/voice_mapping.md` | MIDI layout design — keyswitches, sections, CC assignments |
| `scripts/` | Future Python scripts for batch audio processing (normalize, trim, rename) |

## What Does NOT Live in This Repo

Audio files (`.wav`, `.aif`) and Kontakt binary files (`.nki`, `.nkx`) are excluded via `.gitignore` — they are too large for git. Store sample recordings in Google Drive or a dedicated cloud storage location. KSP scripts (plain `.ksp` text files) are tracked in git once written.

## Setup

**Software required:**
- Native Instruments Kontakt 7
- FL Studio (or any DAW with VST3 support)
- Kontakt Creator (free, for building the instrument)

**To open the instrument:**  
Load the `.nki` file (once built) into Kontakt as a standalone instrument or VST within FL Studio.

## Stack

- **KSP** — Kontakt Script Processor (the scripting language built into Kontakt)
- **Python** — batch audio processing scripts (normalizing levels, trimming silence, file renaming)
- **FL Studio** — DAW for testing playback and MIDI triggering
