# Audio Processing Scripts

Python scripts for batch-processing raw recordings before importing into Kontakt.

Scripts will be added here as the recording pipeline develops.

---

## Planned Scripts

| Script | Purpose |
|--------|---------|
| `normalize.py` | Normalize peak level of all WAVs in a folder to -3 dBFS |
| `trim_silence.py` | Auto-trim leading/trailing silence from each sample |
| `rename.py` | Rename raw take files to the `{section}_{voice}_{note}_{vowel}_{dynamic}.wav` convention |
| `export_48k24.py` | Batch convert any format to 48 kHz / 24-bit WAV (Kontakt preferred) |

## Dependencies (planned)

```
pydub
soundfile
librosa
```

Install when ready:
```
pip install pydub soundfile librosa
```
