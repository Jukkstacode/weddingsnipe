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
- `goalie-targets.mjs` — lists all goalies on seller/trade partner teams
- Output CSV: `analysis/output/rosters.csv`
- Cache: `analysis/output/roster-stats-cache.json` (delete to refresh stats)

## Scoring Formula
Goals×3, Assists×2, +/-×1, PIM×0.25, PPP×1, SHP×1, GWG×1.5
Goalie: Wins×3, GA×-1.5, Saves×0.2, Shutouts×6

## Bimm's Current Roster (as of Mar 2 2026)
**Rakell and Hanifin have been dropped.** Zadorov picked up.
- C: Scheifele (3.39, 1yr RFA), Marner (2.91, 4yr locked)
- LW: Crouse (1.89)
- RW: Buchnevich (1.53, 2yr locked), Eklund (1.43)
- Util: Zuccarello (2.41)
- BN: Verhaeghe (1.98), Thompson (3.00, 1yr RFA), Larkin (3.06, 1yr RFA), McCann (2.86), Benn (2.03)
- D: Manson (2.03), Dahlin (2.54, 2yr locked), Zadorov (1.49), empty D slot
- IR+: Morrissey (2.21, 3yr locked)
- G: Woll (3.09, 27 GP, skidding), Knight (2.85, 41 GP, skidding)

## Trade Rules
- Multi-year contracts: NOT tradeable (but can be dumped to another GM who accepts)
- 1yr contracts (RFAs): Tradeable. Acquiring = signing. Bimm can sign **exactly 2 RFAs**
- No contract (UFAs): Freely tradeable, disappear at year end
- Draft picks: Tradeable. All 7 rounds available (1st-7th)
- RFAs are MORE valuable than picks to rebuilding GMs
- Bottom GMs don't want UFAs — they want RFAs and picks
- Only target teams **6th and below** for trades (top 5 are contenders)

## Pick Valuation (from real league trades)
- **Necas (RFA) traded straight up for Kaprizov (RFA)** — Mike to Hordo. RFA-for-RFA, no picks.
- **Girard (worthless) + 1st round pick → Chychrun (2.88 D) + 6th round pick** — Mike to Adam.
- **1st round pick ≈ one ~2.88 FP/G player.** Picks are expensive. 1st probably doesn't get 2 players from one GM.
- Kaprizov is now on Mike's team (5th). Off the table for Bimm.
- Seedo is signing Carlsson — off the table.

## CURRENT TRADE PLAN (Revised Mar 2 2026)

### Trade 1: Thompson → Charlie (8th)
**Send:** Tage Thompson (RFA, 3.00) + Pavel Buchnevich (2yr, 1.53) + William Eklund (UFA, 1.43) + 4th round pick
**Get:** Brandon Hagel (RFA LW/RW, 3.67 → **SIGN**) + John Gibson (UFA G, 3.49) + Drake Batherson (UFA F, 2.67)
**Status:** Charlie indicated willingness for Hagel + UFAs for Thompson. May want a pick (4th).

### Trade 2: Scheifele → Marinos (13th)
**Send:** Mark Scheifele (RFA, 3.39) + 2nd round pick
**Get:** Nick Suzuki (RFA C, 3.71 → **SIGN**) + Logan Thompson (UFA G, 3.27)
**Notes:** Marinos has McDavid (4yr) + Eichel (2yr) locked — doesn't need another center. Suzuki is nearly as good as Kaprizov (3.71 vs 3.77). Logan Thompson fixes goalie weakness.

### Trade 3: Larkin → Dan (9th)
**Send:** Dylan Larkin (RFA, 3.06)
**Get:** Darren Raddysh (UFA D, 3.47) + Juraj Slafkovsky (UFA F, 2.54)
**Notes:** Raddysh is the #1 D in the league by FP/G (3.47). Dan gets a signable elite center. Push for Slafkovsky as a throw-in — he's a UFA walking at year end.

### Trade 4: 1st pick → Dave (10th)
**Send:** 1st round pick
**Get:** Lucas Raymond (UFA RW, 3.23, 58 GP)
**Notes:** Best remaining UFA forward. High FP/G + high GP volume. Dave is 10th, selling.

### Trade 5 (OPTIONAL): 3rd pick → Jordan (12th)
**Send:** 3rd round pick
**Get:** Matthew Schaefer (UFA D, 2.30)
**Notes:** Only +0.27 over Manson (2.03). Marginal. May not be worth a 3rd. Could skip this.

### Picks Remaining After Trades
- 1st: sent to Dave
- 2nd: sent to Marinos
- 3rd: available (or sent to Jordan for Schaefer)
- 4th: sent to Charlie
- 5th-7th: available

### Signing Slots
- Slot 1: **Hagel** (3.67, from Charlie)
- Slot 2: **Suzuki** (3.71, from Marinos)

### Players Dropped
- Crouse, Benn, Verhaeghe, Zadorov, Eklund, Buchnevich (traded), Woll or Knight (one goalie dropped)

### Projected Final Roster (16-17 players + IR+)
**Forwards:** Suzuki (3.71), Hagel (3.67), Raymond (3.23), Marner (2.91), McCann (2.86), Batherson (2.67), Slafkovsky (2.54), Zuccarello (2.41)
**Defense:** Raddysh (3.47), Dahlin (2.54), Manson (2.03), Morrissey (2.21 IR+)
**Goalies:** Gibson (3.49), Logan Thompson (3.27), Woll (3.09) or Knight (2.85)

## Key Decisions Still Open
- **Stone (4.51, Trevor):** Was the top target but got hurt. Monitor injury status. If healthy, could revisit Trevor trade.
- **Werenski (3.33, Hordo):** Better D than Schaefer but costs a 1st. Raddysh already covers D need. Only pursue if Raddysh trade falls through.
- **Schaefer (2.30, Jordan):** Marginal upgrade over Manson (+0.27). 3rd round pick might be too expensive for the gain.
- **Shesterkin (3.13 RFA, Jordan):** Creative option — RFA-for-RFA swap with Larkin. Uses a signing slot on a goalie instead of forward. Only if Hagel/Suzuki plans change.
- **Bussi (3.88 G, Dave):** Elite goalie. If Gibson trade falls through, target Bussi from Dave instead.

## Notes
- Cache must be deleted before re-running roster-stats.mjs to get fresh data
- "No ID found for 1 player" warning is Luke Evangelista (Dave's roster) — known issue
- Mason McTavish and Luke Hughes show ??? team but stats are correct
- All analysis scripts use `new URL('./output/rosters.csv', import.meta.url)` for cross-platform paths
