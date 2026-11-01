# Interaction spec

How Amanah behaves, and why. Frameworks: Saffer's microinteractions (trigger → rules → feedback → loops),
Cooper's posture and excise, Lichaw's story arcs with the peak-end rule, statecharts for the player.

## Posture

**Sovereign, immersive.** People watch for many minutes with full attention, so the interface stays quiet:
dark, low-contrast controls at the edges, art in the middle. Re-entry is **transient**: one tap on
"Continue · scene name" (title screen) or the map's glowing seal resumes exactly where they left off.

## Concept story

The title screen states it in one verse (33:72): the Trust was offered to the heavens, the earth and the
mountains; they declined, and humanity carried it. Every chapter is part of that story, ending at the Day of
Judgment, when the Trust is accounted for.

## Chapter 1 as two usage stories

| Plot point | Part 1 · From Light to the Garden | Part 2 · Adam's Family on Earth |
| --- | --- | --- |
| Exposition | 1 Heavens and earth · 2 Jinn | 11 First home · 12 Children fill the valley |
| Inciting incident | 3 A khalifah is announced | 13 One offering accepted, one refused |
| Rising action | 4 Adam created · 5 Iblis refuses | 14 The threat and the answer |
| Crisis | 6 Iblis banished · 7–8 The tree and the whisper | 15 The first murder (shown only as a drop of ink) · 16 The crow: regret |
| **Climax (peak)** | **9 Forgiveness**: light descends, "the Accepting of repentance, the Merciful" written large | **17 The lesson**: one light goes out, a shadow crosses all; one light flares, gold spreads to all (5:32) |
| Falling action | 10 Descent: "no fear… nor will they grieve" | 18 Adam's final days: the family gathered, guidance passed to Shith |
| **End** | Camera pulls back into the map; the path inks forward and *The Beginning of Humanity* lights | The scroll's light floods into the map; the path inks forward and *Prophet Idris* lights |

Peak-end: the most design effort went into scenes 9 and 17 and into the two map arrivals. Each part
ends on reward and forward motion (a node lighting up), not on a menu.

## Player statechart

```
            ┌──────── beat timer (auto) / Next / tap / swipe ← ─────────┐
[Title card 2.8s over beat 0] → [Beat n] ──→ [Beat n+1] … [Last beat] ──→ [Ended: rest on final frame]
                                   │  ▲                                     │ Next / Continue
                     Pause (P) ────┘  └──── Play                            ├─→ next scene
                     Full ayat open ─ timer frozen, play state unchanged    └─→ map arrival (then:"map";
                     Help open ────── timer frozen                              automatic when auto-advance is on)
   Prev at beat 0 → previous scene · Prev when ended → back into the scene · Esc → map
```

Rules worth naming:
- **Skip, don't block.** Next during a beat jumps to the next beat; the camera re-aims from wherever it is.
- **Reading is never rushed.** Opening the full ayat freezes the beat timer and closing it resumes (spring-loaded; no mode to remember). Hiding the tab pauses.
- **One timer drives everything.** The beat progress bar is a CSS animation; its `animationend` advances the beat, so pause is a single `animation-play-state`.
- **Beat length** = `max(beat.dur, captionHoldMs(text))`; see `src/lib/pacing.js`.

## Microinteractions

| Interaction | Trigger | Rules | Feedback | Loops / modes |
| --- | --- | --- | --- | --- |
| Next moment | → · Space · Enter · tap the picture · swipe left · wheel down · ⏭ | Advance a beat; on the last beat, rest; when resting, continue | Pip fills gold; camera glides; caption inks in right-to-left | Manual mode (auto off): ⏭ glows to show it is waiting |
| Full ayat | "The full ayat ▾" · A | Expands inside the chronicle; pauses the timer | "paused while you read" in the header | Closes with A, Esc or the chevron |
| Ambient sound | 🔈 button · S · title link | Off by default; opt-in creates audio on the gesture; preference remembered | Toast: "wind, fire and water. No music." | Re-enabled on the first touch of a later visit |
| Auto-advance | ⟳ button | On by default; off = click-to-advance (the brief's other mode) | Toast + pressed state | Remembered |
| Map seal | Click · Enter · ←/→ between seals | Selects and opens the dossier, never jumps straight into a scene | Seal scales up, dashed ring, camera flies to it | Dossier offers Begin / Continue: scene / Watch again |
| Arrival | End of a part | Camera starts at the old node; path inks to the new one; node ignites; dossier opens | Ring burst, rays, ember sound | Plays once (the query is stripped from the URL) |

## Input map (gestures always have a visible alternative)

| | Keyboard | Touch | Mouse / trackpad | Visible control |
| --- | --- | --- | --- | --- |
| Next / previous moment | → Space Enter / ← | Tap, swipe | Click, wheel | ⏮ ⏭ and the pips |
| Pause | P / K | | | ⏯ |
| Map | M / Esc | | | Map button |
| Pan / zoom map | ←/→ between seals, + / − | Drag, pinch | Drag, wheel, ctrl+wheel | + − ⌖ buttons, era chips, List view |

## States inventory

| Element | States designed |
| --- | --- |
| App | Loading (eight-point star draws itself until fonts arrive, capped at 3.5 s) · missing scene ("This page of the chronicle is missing" + back to map) |
| Chronicle | Open · folded to a one-line pill (remembered) · empty ("The page waits for its first words…") · playing (current line only) · ended (full recap) |
| Caption | Ink-wash backdrop on dark scenes · parchment on bright scenes · Arabic hidden when the same words are written into the scene |
| Map seal | Unlit · lit (pulsing halo) · in progress (arc of gold = share watched) · complete (gold + check) · in preparation (faded under mist) · selected · focus ring · igniting |
| Buttons | Default · hover · focus-visible (2 px gold) · pressed (`aria-pressed`) · disabled (40 %) · active (scale .95) |

## Excise removed

- No confirmation dialogs: everything is reversible (Prev, Watch again, "Start again" only on the title screen).
- Progress, sound, auto-advance and chronicle fold are remembered; Continue labels name the exact scene.
- The chronicle shows one line while playing so it never covers the art; the recap appears at rest.
- Verses never appear twice: when calligraphy is painted into the scene, the caption shows English only.

## Motion and access

- `prefers-reduced-motion`: camera moves become cuts, ambient loops stop, particles drop to 30 %.
- Touch targets ≥ 44 px; visible focus everywhere; narration is an `aria-live` region; Arabic carries `lang="ar"`.
- Pause on tab hide; nothing auto-plays sound.
