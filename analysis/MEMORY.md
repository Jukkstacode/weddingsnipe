# WeddingSnipe Fantasy Hockey Analysis

## Who the User Is
- User is **Bimm** (team: "Killin me Scheifle", **3rd place** in standings)
- League has 14 GMs
- Goal: **Win this year** — willing to spend all picks

## GM → Team Name Mapping (Standings Order)
1. Andy — Birth2Girth
2. Colin — The Real West Coast Chat
3. **Bimm — Killin me Scheifle**
4. Ryan — Monkey Butt
5. Mike — Shit The Driveway
6. Adam — SpudKick
7. Hordo — Travis Fan Club
8. Charlie — Medium Chuck
9. Dan — Mack Miller
10. Dave — Tiny Muscles Big Hustle
11. Seedo — Saltiest Spring
12. Jordan — It's Jibbers!
13. Marinos — Murricle on Ice
14. Trevor — Willy Stylez

## Key Analysis Scripts (all in `analysis/`)
- `roster-stats.mjs` — fetches NHL game logs, calculates FP per player, outputs markdown + CSV
- `positional-analysis.mjs` — ranks all 14 GMs by position group (F/D/G), IR players included
- `goalie-value.mjs` — ranks all goalies by **Total FP** for playoff relevance
- `rfa-trade-analysis.mjs` — maps Bimm's 1yr RFA trade chips vs seller GM packages
- `ufa-forwards.mjs` — lists all UFA forwards on seller teams above 2.40 FP/G
- `goalie-targets.mjs` — lists all goalies on trade partner/seller teams
- `goalie-deep-dive.mjs` — compares goalie FP/G by time period (season, last 30 days, since Dec 20)
- Output CSV: `analysis/output/rosters.csv`
- Cache: `analysis/output/roster-stats-cache.json` (delete to refresh stats)

## Scoring Formula
Goals×3, Assists×2, +/-×1, PIM×0.25, PPP×1, SHP×1, GWG×1.5
Goalie: Wins×3, GA×-1.5, Saves×0.2, Shutouts×6

## COMPLETED TRADES (Mar 3 2026)

### Trade 1: Thompson → Charlie (8th) ✅
**Sent:** Tage Thompson (RFA, 3.00) + Pavel Buchnevich (2yr, 1.53) + Carter Verhaeghe (UFA, 1.98) + 2nd round pick
**Got:** Brandon Hagel (RFA LW/RW, 3.67 → **SIGNED**) + John Gibson (UFA G, 3.49) + Drake Batherson (UFA F, 2.67)

### Trade 2: Larkin → Dan (9th) ✅
**Sent:** Dylan Larkin (RFA C, 3.06) + Nikita Zadorov (UFA D, 1.49)
**Got:** Darren Raddysh (UFA D, 3.47) + Juraj Slafkovsky (UFA F, 2.54)

### Trade 3: Scheifele → Dave (10th) ✅
**Sent:** Mark Scheifele (RFA C, 3.39) + 4th round pick
**Got:** Brandon Bussi (UFA G, 3.88) + 1st round pick (draft only, cannot trade)

### Trade 4: Picks → Jordan (12th) ✅
**Sent:** 1st round pick + 5th round pick
**Got:** Bo Horvat (UFA C, 3.16) + Gabriel Vilardi (UFA C/RW, 2.58)

### Failed: Marinos (Suzuki) ❌
Suzuki traded for Stutzle before deal could close.

## Bimm's Current Roster (Post All Trades, Mar 3 2026)

### Forwards (10)
| Player | Pos | FP/G | Contract | Source |
|--------|-----|------|----------|--------|
| Hagel | LW/RW | 3.67 | **SIGNED** (RFA) | Charlie trade |
| Horvat | C | 3.16 | UFA | Jordan trade |
| Marner | C/LW/RW | 2.91 | 4yr locked | Original |
| McCann | C/LW | 2.86 | Kept | Original |
| Batherson | LW/RW | 2.67 | UFA | Charlie trade |
| Vilardi | C/RW | 2.58 | UFA | Jordan trade |
| Slafkovsky | LW/RW | 2.54 | UFA | Dan trade |
| Zuccarello | RW | 2.41 | Kept | Original |
| Benn | C/LW/RW | 2.03 | Kept | Original |
| Eklund | LW/RW | 1.43 | UFA | Original (drop when Morrissey returns) |

### Defense (3 + IR+)
| Player | Pos | FP/G | Contract | Source |
|--------|-----|------|----------|--------|
| Raddysh | D | 3.47 | UFA | Dan trade |
| Dahlin | D | 2.54 | 2yr locked | Original |
| Manson | D | 2.03 | Kept | Original |
| Morrissey | D | 2.21 | 3yr locked (IR+) | Original |

### Goalies (4)
| Player | Pos | FP/G | Contract | Source |
|--------|-----|------|----------|--------|
| Bussi | G | 3.88 | UFA (CAR starter) | Dave trade |
| Gibson | G | 3.49 | UFA | Charlie trade |
| Woll | G | 3.09 (skidding, 1.53 last 30d) | Kept | Original |
| Knight | G | 2.85 (skidding, 1.33 last 30d) | Kept | Original |

### Available Assets
- **Draft picks:** 3rd, 6th, 7th + Dave's 1st (draft only, can't trade)
- **Signing slots:** 1 remaining (Hagel used 1). Plan: save for next year's draft.
- **Drop target:** Eklund (1.43) when Morrissey returns from IR+

## Trade Rules
- Multi-year contracts: NOT tradeable (but can be dumped)
- 1yr contracts (RFAs): Tradeable. Acquiring = signing. Bimm can sign 2 total (1 used on Hagel, 1 saved for draft)
- No contract (UFAs): Freely tradeable, disappear at year end
- Draft picks tradeable: 3rd, 6th, 7th available
- RFAs > picks in value to rebuilding GMs

## Pick Valuation (from real league trades)
- **Necas (RFA) traded straight up for Kaprizov (RFA)** — RFA-for-RFA.
- **Girard (worthless) + 1st → Chychrun (2.88 D) + 6th** — 1st ≈ one ~2.88 FP/G player.

## Goalie Trends (as of Mar 3 2026)
- **Gibson:** 5.03 FP/G last 30 days, 4.21 since Dec 20 — elite and improving
- **Bussi:** 5.77 FP/G last 30 days, 3.53 since Dec 20 — CAR starter since Dec 20 injury
- **Woll:** 1.53 FP/G last 30 days — cratering hard
- **Knight:** 1.33 FP/G last 30 days — worst of the bunch

## Long-term Core (signed/locked)
- Hagel (signed) — 3.67 FP/G
- Marner (4yr) — 2.91 FP/G
- Dahlin (2yr) — 2.54 FP/G
- Morrissey (3yr) — 2.21 FP/G

## Notes
- Cache must be deleted before re-running roster-stats.mjs to get fresh data
- "No ID found for 1 player" warning is Luke Evangelista (Dave's roster) — known issue
- All analysis scripts use `new URL('./output/rosters.csv', import.meta.url)` for cross-platform paths
- Newhook was on roster at some point but was dropped in the Jordan trade
- Bussi plays for Carolina, became starter after original starter injured Dec 20 (out for season)
