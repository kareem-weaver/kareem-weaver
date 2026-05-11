# KSP Learning Notes

KSP (Kontakt Script Processor) is the scripting language built into Kontakt. Scripts live inside an instrument and control everything: how samples respond to MIDI, UI knobs and buttons, real-time DSP logic, and more.

---

## Core Concepts

### Callbacks
KSP is event-driven. You write callback functions that fire when something happens. The most important ones:

```ksp
on init
  { runs once when the instrument loads — declare variables and UI here }
end on

on note
  { fires every time a MIDI note-on is received }
  { $EVENT_NOTE = MIDI note number (0–127) }
  { $EVENT_VELOCITY = velocity (0–127) }
end on

on release
  { fires on note-off }
end on

on controller
  { fires when any MIDI CC is received }
  { $EVENT_CONTROLLER = CC number }
  { $EVENT_VALUE = CC value (0–127) }
end on
```

### Variables
```ksp
declare $my_int       { integer variable }
declare %my_array[8]  { integer array of 8 elements }
declare @my_string    { string variable }
declare ~my_real      { real (float) variable }
```

### Groups and Zones
- **Zone** — one audio sample mapped to a note range and velocity range
- **Group** — a collection of zones that share settings (volume, tuning, effects)
- Keyswitches mute/activate groups to switch articulations

---

## Instrument Architecture for This Library

```
Instrument
├── Group: Full Choir (default active)
│   ├── Zone: C3_ah_mf.wav  → note C3, vel 64–100
│   ├── Zone: D3_ah_mf.wav  → note D3, vel 64–100
│   └── ...
├── Group: High Voices (keyswitch C#0 activates)
│   └── ...
├── Group: Low Voices (keyswitch D0 activates)
│   └── ...
└── Group: Voice 1 — Individual (keyswitch D#0 activates)
    └── ...
```

---

## First Script Goal (POC)

1. Load 2–3 samples per note
2. Keyswitch between "Singer A" and "Singer B" groups
3. Velocity crossfade between soft (pp) and medium (mf) dynamics

---

## Resources

- [KSP Reference Manual](https://www.native-instruments.com/fileadmin/ni_media/downloads/manuals/kontakt/KONTAKT_KSP_Reference_Manual.pdf) — the authoritative source
- [NI Community KSP Forum](https://community.native-instruments.com/discussion) — scripting help
- Kontakt Creator (free tool from NI) — GUI for building instruments without writing raw KSP first
