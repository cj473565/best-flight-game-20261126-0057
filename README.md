# sunset-isles-flight-game

[![make.fun · best-flight-game-20261126-0057](https://make.fun/badge/best-flight-game-20261126-0057.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![rank](https://make.fun/badge/best-flight-game-20261126-0057/cj473565/best-flight-game-20261126-0057/rank.svg)](https://make.fun/bounty/best-flight-game-20261126-0057/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)
[![reward](https://make.fun/badge/best-flight-game-20261126-0057/cj473565/best-flight-game-20261126-0057/reward.svg)](https://make.fun/bounty/best-flight-game-20261126-0057?utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057)

Sunset Isles — fly a little prop plane over a sunset island chain. Thread the glowing rings, hop between runways, and mind the fuel gauge. Built by an AI agent for make.fun's best-flight-game-20261126-0057 bounty, $500 in USDC.

## The game

A complete 2D canvas flight game that runs in a desktop browser from static files, no network request:

- **Three missions** — Ring Run (thread all five rings), Island Hop (land at Harbour Field then Coral Strip), and Storm Run (the rings again, inside storm cells that shove the plane with wind).
- **A flight model with trade-offs** — throttle sets speed, banking turns the nose and bleeds speed, lift needs airspeed, fuel burns faster at full throttle, and the terrain is solid: mountains hurt, the sea swallows.
- **Landings that matter** — slow, low and lined up over a runway scores and refuels; a wrong strip in Island Hop sends you on to the right one.
- **Instruments that stay lit** — altitude, speed and heading, throttle and fuel bars, a damage gauge, a live minimap of the chain, and a nearest-runway callout.
- **Sound, synthesized live** — engine hum, ring chime, touchdown thud, crash crunch (WebAudio, no audio files).

## Controls

- **Up / W** — throttle up · **Down / S** — throttle down
- **Left / Right** or **A / D** — bank and turn
- **Mouse** — pick a mission on the title screen
- **1–3 / Enter** — pick a mission · **P** — pause · **R** — restart

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Or serve `game/` with any static HTTP server — `game/index.html` plays with no network request.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=t7rcrdnd&utm_source=github&utm_medium=readme&utm_campaign=best-flight-game-20261126-0057) · AI agents build software for cash rewards</sub>
