BALANCE_TEST_WORKFLOW.md - THE SHATTERED CODEX
AI Coding Agent Workflow: Combat Balance Validation
Run this workflow on demand by invoking: __runBalanceWorkflow()
PHASE 0: SETUP & INVOCATION
================================

0.1 Create File
FILE: src/utils/balanceWorkflow.ts
This file is DEV ONLY. Never import in production code.

Expose to browser console at file bottom:
if (typeof window !== 'undefined') {
(window as any).__runBalanceWorkflow = (config?: Partial<WorkflowConfig>) => {
runBalanceWorkflow(config).then(r => {
console.log('\n=== BALANCE REPORT ===');
console.table(r.summary);
console.log('\nMVP Analysis:', r.mvp);
console.log('\nRecommendations:', r.recommendations);
console.log('\nFull log saved to window.__lastBattleLog');
(window as any).__lastBattleLog = r.fullLog;
});
};
}

0.2 Config Interface
interface WorkflowConfig {
iterations: number // default: 100
targetWinRate: number // default: 0.65 (65%)
winRateTolerance: number // default: 0.05 (±5%)
maxIterationCycles: number // default: 10 auto-tune cycles
logVerbose: boolean // default: false (true = log every tick)
playerArchetype: string // default: 'Conjurer'
difficulty: string // default: 'normal'
floor: number // default: 1
perks: string[] // default: [] (none)
startingRosterOverride?: Unit[] // optional override for testing specific comps
enemyRosterOverride?: Unit[] // optional override for testing specific enemies
}

PHASE 1: EQUAL BASELINE UNIT CREATION
==========================================

1.1 Balanced Test Units
Create a NORMALIZED set of units where both sides start statistically equal.
This eliminates all variables except combat logic itself.

const BASELINE_UNIT_TEMPLATE: UnitStats = {
hp: 100,
maxHp: 100,
attack: 15,
defense: 5,
speed: 1,
mana: 0,
maxMana: 100
}

function createBalancedPlayerRoster(count: number = 3): Unit[] {
return Array.from({ length: count }, (_, i) => ({
id: player_unit_${i},
name: Ally ${i + 1},
school: MagicSchool.Arcane,
tier: 1,
stats: { ...BASELINE_UNIT_TEMPLATE },
baseStats: { ...BASELINE_UNIT_TEMPLATE },
passives: [],
position: i as any,
isHero: i === 0,
isSummon: i > 0,
spriteColor: '#4488FF',
meshType: 'sphere',
weapon: null,
armor: null,
level: 1,
xp: 0,
subclass: null
}))
}

function createBalancedEnemyRoster(count: number = 3): Unit[] {
return Array.from({ length: count }, (_, i) => ({
id: enemy_unit_${i},
name: Enemy ${i + 1},
school: MagicSchool.Death,
tier: 1,
stats: { ...BASELINE_UNIT_TEMPLATE },
baseStats: { ...BASELINE_UNIT_TEMPLATE },
passives: [],
position: (i + 4) as any,
isHero: false,
isSummon: false,
spriteColor: '#FF4444',
meshType: 'box',
weapon: null,
armor: null,
level: 1,
xp: 0,
subclass: null
}))
}

1.2 Validation — Confirm Equal Footing
Before running any battle, assert:
[ ] Player total HP === Enemy total HP
[ ] Player avg attack === Enemy avg attack
[ ] Player avg defense === Enemy avg defense
[ ] Player unit count === Enemy unit count
[ ] No passives active on either side
[ ] No perks active (unless perk test mode)

Log output:
console.log('[BALANCE] Baseline validation:', {
playerTotalHP: sum(playerUnits.map(u => u.stats.hp)),
enemyTotalHP: sum(enemyUnits.map(u => u.stats.hp)),
playerAvgAtk: avg(playerUnits.map(u => u.stats.attack)),
enemyAvgAtk: avg(enemyUnits.map(u => u.stats.attack)),
equal: playerTotalHP === enemyTotalHP && playerAvgAtk === enemyAvgAtk
})

PHASE 2: INSTRUMENTED BATTLE RUNNER
========================================

2.1 Tick Log Structure
Define the per-tick log entry:

interface TickLog {
tick: number
timestamp: number
actions: ActionLog[]
stateSnapshot: {
playerUnits: { id: string; name: string; hp: number; maxHp: number }[]
enemyUnits: { id: string; name: string; hp: number; maxHp: number }[]
totalPlayerHP: number
totalEnemyHP: number
}
}

interface ActionLog {
tick: number
actorId: string
actorName: string
actorTeam: 'player' | 'enemy'
actionType: ActionType
targetId: string | null
targetName: string | null
damageDealt: number
damageTaken: number
hpBefore: number
hpAfter: number
statusApplied: string | null
specialActionName: string | null
wasSpecialAction: boolean
specialActionsAvailableButSkipped: string[]
movementTaken: boolean
positionBefore: number | null
positionAfter: number | null
manaSpent: number
manaAfter: number
unitDied: boolean
revivedBy: string | null
}

type ActionType =
| 'attack'
| 'spell_cast'
| 'passive_trigger'
| 'status_tick'
| 'heal'
| 'buff'
| 'debuff'
| 'move'
| 'idle'
| 'revive'
| 'summon'

2.2 Instrumented Tick Runner
Wrap CombatEngine's tick loop with a logging interceptor:

async function runInstrumentedBattle(
playerUnits: Unit[],
enemyUnits: Unit[],
perks: string[],
config: WorkflowConfig
): Promise<BattleResult> {

text
const tickLog: TickLog[] = []
let tickNumber = 0
const MAX_TICKS = 500  // safety ceiling — no battle should exceed 500 ticks

// Deep clone units to prevent mutation across iterations
const pUnits = deepClone(playerUnits)
const eUnits = deepClone(enemyUnits)

// Track per-unit cumulative stats
const unitStats = new Map<string, UnitCombatStats>()
const allUnits = [...pUnits, ...eUnits]
for (const u of allUnits) {
  unitStats.set(u.id, {
    id: u.id,
    name: u.name,
    team: u.isHero || u.isSummon ? 'player' : 'enemy',
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    totalHealing: 0,
    actionsTotal: 0,
    specialActionsUsed: 0,
    specialActionsAvailable: 0,
    specialActionsSkipped: 0,
    movementActions: 0,
    ticksAlive: 0,
    damagePerTick: [],   // array of dmg dealt per tick (for avg calc)
    damageTakenPerTick: [],
    killedUnits: [],
    killedBy: null,
    survivedToEnd: false
  })
}

// Run headless combat loop
while (true) {
  tickNumber++

  if (tickNumber > MAX_TICKS) {
    // Safety: declare draw
    return buildResult('draw', tickLog, unitStats, tickNumber)
  }

  const alivePlayers = pUnits.filter(u => u.stats.hp > 0)
  const aliveEnemies = eUnits.filter(u => u.stats.hp > 0)

  // Check win/loss
  if (aliveEnemies.length === 0) {
    return buildResult('player_win', tickLog, unitStats, tickNumber)
  }
  if (alivePlayers.length === 0) {
    return buildResult('player_loss', tickLog, unitStats, tickNumber)
  }

  // Tick log entry
  const tickEntry: TickLog = {
    tick: tickNumber,
    timestamp: tickNumber * 600,
    actions: [],
    stateSnapshot: {
      playerUnits: alivePlayers.map(u => ({
        id: u.id, name: u.name,
        hp: u.stats.hp, maxHp: u.stats.maxHp
      })),
      enemyUnits: aliveEnemies.map(u => ({
        id: u.id, name: u.name,
        hp: u.stats.hp, maxHp: u.stats.maxHp
      })),
      totalPlayerHP: sum(alivePlayers.map(u => u.stats.hp)),
      totalEnemyHP: sum(aliveEnemies.map(u => u.stats.hp))
    }
  }

  // Process each alive unit's action this tick
  const actingUnits = [...alivePlayers, ...aliveEnemies]
    .sort((a, b) => b.stats.speed - a.stats.speed)  // speed order

  for (const actor of actingUnits) {
    if (actor.stats.hp <= 0) continue  // skip if died mid-tick

    const isPlayer = actor.isHero || actor.isSummon
    const targets = isPlayer ? aliveEnemies.filter(u => u.stats.hp > 0)
                             : alivePlayers.filter(u => u.stats.hp > 0)

    if (targets.length === 0) break

    // Determine action (replicate CombatEngine logic headlessly)
    const action = resolveUnitAction(actor, targets, perks, unitStats)

    // Log the action
    tickEntry.actions.push(action)

    // Apply action effects
    applyAction(action, actor, targets, pUnits, eUnits, unitStats)

    // Update per-unit cumulative stats
    const uStats = unitStats.get(actor.id)!
    uStats.actionsTotal++
    uStats.ticksAlive = tickNumber
    uStats.damagePerTick.push(action.damageDealt)
    if (action.wasSpecialAction) uStats.specialActionsUsed++
    if (action.specialActionsAvailableButSkipped.length > 0) {
      uStats.specialActionsSkipped += action.specialActionsAvailableButSkipped.length
      uStats.specialActionsAvailable += action.specialActionsAvailableButSkipped.length
    }
    if (action.movementTaken) uStats.movementActions++
    if (action.unitDied) {
      const targetStats = unitStats.get(action.targetId!)
      if (targetStats) {
        targetStats.killedBy = actor.id
        uStats.killedUnits.push(action.targetId!)
      }
    }
  }

  // Log status effect ticks (burning, poison, etc.)
  logStatusEffectTicks(tickEntry, pUnits, eUnits, unitStats, tickNumber)

  if (config.logVerbose) {
    console.log(`[TICK ${tickNumber}]`, tickEntry)
  }

  tickLog.push(tickEntry)
}
}

PHASE 3: MVP ANALYSIS ENGINE
==================================

3.1 MVP Scoring Formula
After each battle, compute MVP score for every unit:

function computeMVPScore(stats: UnitCombatStats, battle: BattleResult): number {
const damageScore = stats.totalDamageDealt * 1.0
const survivalScore = stats.survivedToEnd ? stats.totalDamageDealt * 0.3 : 0
const killScore = stats.killedUnits.length * 50
const healScore = stats.totalHealing * 0.8
const specialScore = stats.specialActionsUsed * 20
const efficiencyBonus = stats.ticksAlive > 0
? (stats.totalDamageDealt / stats.ticksAlive) * 10
: 0

text
return damageScore + survivalScore + killScore + healScore + specialScore + efficiencyBonus
}

// Returns MVPs for both teams
function identifyMVPs(unitStats: Map<string, UnitCombatStats>, result: BattleResult) {
const playerUnits = [...unitStats.values()].filter(u => u.team === 'player')
const enemyUnits = [...unitStats.values()].filter(u => u.team === 'enemy')

text
const playerMVP = playerUnits.sort((a, b) =>
  computeMVPScore(b, result) - computeMVPScore(a, result))
const enemyMVP  = enemyUnits.sort((a, b) =>
  computeMVPScore(b, result) - computeMVPScore(a, result))

return {
  playerMVP: {
    unit: playerMVP,
    score: computeMVPScore(playerMVP, result),
    reason: generateMVPReason(playerMVP)
  },
  enemyMVP: {
    unit: enemyMVP,
    score: computeMVPScore(enemyMVP, result),
    reason: generateMVPReason(enemyMVP)
  }
}
}

function generateMVPReason(stats: UnitCombatStats): string {
const reasons = []
if (stats.totalDamageDealt > 80) reasons.push(High damage (${stats.totalDamageDealt} total))
if (stats.killedUnits.length > 0) reasons.push(Killed ${stats.killedUnits.length} unit(s))
if (stats.survivedToEnd) reasons.push('Survived to battle end')
if (stats.totalHealing > 30) reasons.push(Healed ${stats.totalHealing} HP)
if (stats.specialActionsUsed > 2) reasons.push(Used ${stats.specialActionsUsed} special actions)
const avgDmg = stats.damagePerTick.filter(d => d > 0)
if (avgDmg.length > 0) {
const avg = (avgDmg.reduce((a,b)=>a+b,0)/avgDmg.length).toFixed(1)
reasons.push(Avg ${avg} dmg/tick)
}
return reasons.join(' | ') || 'Consistent presence'
}

PHASE 4: WIN FACTOR ANALYSIS
==================================

4.1 Win Factor Report Structure
interface BattleAnalysis {
outcome: 'player_win' | 'player_loss' | 'draw'
totalTicks: number
totalDurationMs: number

text
// Team summaries
player: TeamSummary
enemy: TeamSummary

// MVP on each side
mvp: {
  playerMVP: MVPResult
  enemyMVP: MVPResult
}

// Deciding factors
winFactors: WinFactor[]

// Per-unit breakdown
unitBreakdown: UnitCombatStats[]

// Missed opportunities
missedOpportunities: MissedOpportunity[]
}

interface TeamSummary {
totalDamageDealt: number
totalDamageTaken: number
totalActionsPerformed: number
actionsPerTick: number // totalActions / totalTicks
specialActionsUsed: number
specialActionsSkipped: number
specialActionUsageRate: number // used / (used + skipped)
totalHealing: number
unitsAliveAtEnd: number
avgHpAtEnd: number
avgDamagePerTick: number[] // array per unit
dominantDamageSource: string // which unit dealt the most
}

interface WinFactor {
factor: string // e.g. "Damage output advantage"
playerValue: number | string
enemyValue: number | string
advantage: 'player' | 'enemy' | 'neutral'
weight: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
description: string
}

interface MissedOpportunity {
team: 'player' | 'enemy'
unitName: string
tick: number
availableAction: string
reason: string // Why it wasn't taken
estimatedImpact: string // "Could have dealt ~20 dmg"
}

4.2 Win Factor Detection Rules
Apply these rules to each battle result to populate winFactors[]:

FACTOR: 'Damage output advantage'
playerValue = player.totalDamageDealt
enemyValue = enemy.totalDamageDealt
advantage = higher value team
weight = CRITICAL if delta > 30%, else HIGH

FACTOR: 'Actions per tick advantage'
playerValue = player.actionsPerTick
enemyValue = enemy.actionsPerTick
advantage = higher value team
weight = HIGH (more actions = more damage opportunities)

FACTOR: 'Special action usage rate'
playerValue = player.specialActionUsageRate (as %)
enemyValue = enemy.specialActionUsageRate (as %)
advantage = higher rate team
weight = MEDIUM (unused specials = lost value)
flag as MissedOpportunity if either team < 50% usage rate

FACTOR: 'Healing advantage'
playerValue = player.totalHealing
enemyValue = enemy.totalHealing
advantage = higher value team (if delta > 50 HP)
weight = HIGH if healing > 50, else LOW

FACTOR: 'Survival rate'
playerValue = player.unitsAliveAtEnd / startingPlayerCount
enemyValue = enemy.unitsAliveAtEnd / startingEnemyCount
advantage = higher rate team
weight = HIGH

FACTOR: 'Speed advantage'
playerValue = avg player speed
enemyValue = avg enemy speed
advantage = higher value (acts first = slight edge)
weight = MEDIUM

FACTOR: 'Defense efficiency'
playerValue = player.totalDamageTaken / player.totalActionsPerformed
enemyValue = enemy.totalDamageTaken / enemy.totalActionsPerformed
(lower = better — takes less damage per action)
advantage = lower value team
weight = MEDIUM

FACTOR: 'Kill efficiency'
playerValue = player kills / player actions
enemyValue = enemy kills / enemy actions
advantage = higher value team
weight = HIGH

PHASE 5: MULTI-BATTLE AGGREGATE REPORT
===========================================

5.1 Run N Battles and Aggregate
interface AggregateReport {
config: WorkflowConfig
totalBattles: number
wins: number
losses: number
draws: number
winRate: number
targetWinRate: number
withinTolerance: boolean

text
// Averages across all battles
avgTicks: number
avgPlayerDamage: number
avgEnemyDamage: number
avgPlayerActionsPerTick: number
avgEnemyActionsPerTick: number
avgSpecialUsageRate: number

// Dominant win factors (appear in >50% of wins)
dominantWinFactors: string[]

// Dominant loss factors (appear in >50% of losses)
dominantLossFactors: string[]

// MVP consistency (unit that is MVP most often)
mostConsistentPlayerMVP: string
mostConsistentEnemyMVP: string

// Balance recommendations
recommendations: BalanceRecommendation[]

// Full per-battle data
battles: BattleAnalysis[]
}

5.2 Print Summary Table
After all iterations complete, print to console:

console.table({
'Win Rate': ${(report.winRate * 100).toFixed(1)}%,
'Target': ${(report.targetWinRate * 100).toFixed(1)}%,
'Within Tolerance': report.withinTolerance ? '✅ YES' : '❌ NO',
'Avg Battle Length': ${report.avgTicks} ticks (${(report.avgTicks*600/1000).toFixed(1)}s),
'Player Avg Damage': report.avgPlayerDamage.toFixed(1),
'Enemy Avg Damage': report.avgEnemyDamage.toFixed(1),
'Player Actions/Tick': report.avgPlayerActionsPerTick.toFixed(2),
'Enemy Actions/Tick': report.avgEnemyActionsPerTick.toFixed(2),
'Special Usage Rate': ${(report.avgSpecialUsageRate * 100).toFixed(1)}%,
'Top Player MVP': report.mostConsistentPlayerMVP,
'Top Enemy MVP': report.mostConsistentEnemyMVP,
'Top Win Factor': report.dominantWinFactors ?? 'N/A',
'Top Loss Factor': report.dominantLossFactors ?? 'N/A'
})

PHASE 6: AUTO-TUNE ENGINE
==============================

6.1 Recommendation Generator
After each aggregate report, generate specific balance changes:

function generateRecommendations(report: AggregateReport): BalanceRecommendation[] {
const recs: BalanceRecommendation[] = []
const wr = report.winRate
const target = report.targetWinRate
const tol = report.config.winRateTolerance

text
// Winrate too low — player is losing too much
if (wr < target - tol) {
  const delta = target - wr
  const severity = delta > 0.2 ? 'CRITICAL' : delta > 0.1 ? 'HIGH' : 'MEDIUM'

  recs.push({
    type: 'enemy_stat_reduction',
    severity,
    target: 'enemy',
    field: 'hp',
    currentValue: 'current',
    suggestedValue: 'reduce by 10%',
    rationale: `Win rate ${(wr*100).toFixed(1)}% is ${((target-wr)*100).toFixed(1)}pp below target`
  })

  if (report.dominantLossFactors.includes('Damage output advantage')) {
    recs.push({
      type: 'player_stat_increase',
      severity: 'HIGH',
      target: 'player',
      field: 'attack',
      currentValue: 'current',
      suggestedValue: 'increase by 2',
      rationale: 'Enemy damage output consistently outpaces player'
    })
  }

  if (report.avgSpecialUsageRate < 0.4) {
    recs.push({
      type: 'mechanic_fix',
      severity: 'HIGH',
      target: 'player',
      field: 'special_action_trigger',
      currentValue: `${(report.avgSpecialUsageRate*100).toFixed(0)}% usage`,
      suggestedValue: 'Review trigger conditions — specials rarely fire',
      rationale: 'Special actions available but not being used (<40% rate)'
    })
  }
}

// Winrate too high — player is winning too easily
if (wr > target + tol) {
  recs.push({
    type: 'enemy_stat_increase',
    severity: 'MEDIUM',
    target: 'enemy',
    field: 'hp',
    currentValue: 'current',
    suggestedValue: 'increase by 10%',
    rationale: `Win rate ${(wr*100).toFixed(1)}% is ${((wr-target)*100).toFixed(1)}pp above target`
  })
}

// Battles too short (< 5 ticks) — one side dominates instantly
if (report.avgTicks < 5) {
  recs.push({
    type: 'stat_rebalance',
    severity: 'HIGH',
    target: 'both',
    field: 'defense',
    currentValue: 'current',
    suggestedValue: 'increase both sides defense by 3',
    rationale: 'Battles resolving too quickly — combat feels anticlimactic'
  })
}

// Battles too long (> 100 ticks) — neither side can land kills
if (report.avgTicks > 100) {
  recs.push({
    type: 'stat_rebalance',
    severity: 'MEDIUM',
    target: 'both',
    field: 'attack',
    currentValue: 'current',
    suggestedValue: 'increase both sides attack by 3',
    rationale: 'Battles running too long — damage too low relative to HP'
  })
}

return recs
}

6.2 Auto-Tune Loop
async function autoTune(config: WorkflowConfig): Promise<AggregateReport> {
let cycleCount = 0
let currentConfig = { ...config }
let lastReport: AggregateReport

text
while (cycleCount < config.maxIterationCycles) {
  cycleCount++
  console.log(`\n[AUTO-TUNE] Cycle ${cycleCount}/${config.maxIterationCycles}`)

  lastReport = await runAggregateReport(currentConfig)

  console.log(`[AUTO-TUNE] Win rate: ${(lastReport.winRate*100).toFixed(1)}% | Target: ${(config.targetWinRate*100).toFixed(1)}%`)

  if (lastReport.withinTolerance) {
    console.log('[AUTO-TUNE] ✅ Target win rate achieved!')
    break
  }

  // Apply first recommendation automatically
  const topRec = lastReport.recommendations
  if (!topRec) {
    console.log('[AUTO-TUNE] ⚠️  No recommendations generated. Manual review needed.')
    break
  }

  console.log(`[AUTO-TUNE] Applying: ${topRec.type} → ${topRec.field}: ${topRec.suggestedValue}`)
  currentConfig = applyRecommendation(currentConfig, topRec)
}

if (cycleCount >= config.maxIterationCycles) {
  console.warn(`[AUTO-TUNE] ⚠️  Max cycles reached. Final win rate: ${(lastReport!.winRate*100).toFixed(1)}%`)
}

return lastReport!
}

PHASE 7: VERBOSE SINGLE BATTLE LOG FORMAT
=============================================

7.1 Human-Readable Battle Log
When logVerbose: true, print each tick in this format:

╔══ TICK 1 (t=600ms) ══════════════════════════════╗
║ Player HP: 300/300 │ Enemy HP: 300/300 ║
╠══ ACTIONS ═══════════════════════════════════════╣
║ [PLAYER] Ally 1 → attacks Enemy 2 ║
║ dmg: 10 | Enemy 2 HP: 100→90 ║
║ specials available: [none] ║
║ ║
║ [ENEMY ] Enemy 1 → attacks Ally 2 ║
║ dmg: 10 | Ally 2 HP: 100→90 ║
║ specials available: [charge_attack] ║
║ ⚠️ special skipped (mana insufficient) ║
╠══ STATUS TICKS ═══════════════════════════════════╣
║ (none this tick) ║
╚══════════════════════════════════════════════════╝

7.2 Battle End Summary
Print at end of each verbose battle:

╔══ BATTLE RESULT: PLAYER WIN (Tick 24, 14.4s) ════╗
║ ║
║ PLAYER TEAM ║
║ Total Damage Dealt: 245 ║
║ Total Damage Taken: 180 ║
║ Actions Performed: 72 ║
║ Actions/Tick: 3.0 ║
║ Specials Used: 4 / 6 available (67%) ║
║ Units Alive at End: 2 / 3 ║
║ ║
║ ENEMY TEAM ║
║ Total Damage Dealt: 180 ║
║ Total Damage Taken: 245 ║
║ Actions Performed: 68 ║
║ Actions/Tick: 2.8 ║
║ Specials Used: 1 / 5 available (20%) ║
║ Units Alive at End: 0 / 3 ║
║ ║
║ ⭐ PLAYER MVP: Ally 1 ║
║ Score: 312 | Dealt 145 dmg | Killed 2 units ║
║ Avg 6.0 dmg/tick | Survived to end ║
║ ║
║ ⭐ ENEMY MVP: Enemy 3 ║
║ Score: 187 | Dealt 95 dmg | Killed 1 unit ║
║ Avg 3.9 dmg/tick | Died tick 22 ║
║ ║
║ 🏆 KEY WIN FACTORS: ║
║ 1. [CRITICAL] Damage output advantage ║
║ Player 245 vs Enemy 180 (+36%) ║
║ 2. [HIGH] Survival rate ║
║ Player 67% vs Enemy 0% ║
║ 3. [MEDIUM] Special action usage ║
║ Player 67% vs Enemy 20% ║
║ ║
║ ⚠️ MISSED OPPORTUNITIES: ║
║ Enemy: charge_attack available tick 1,4,7,11 ║
║ but never used (mana check bug?) ║
╚══════════════════════════════════════════════════╝

PHASE 8: INVOCATION GUIDE
==============================

8.1 Console Commands
// Run 100 battles with defaults, auto-tune until 65% winrate
window.__runBalanceWorkflow()

// Run 50 battles targeting 70% winrate on floor 3
window.__runBalanceWorkflow({
iterations: 50,
targetWinRate: 0.70,
floor: 3
})

// Run 1 verbose battle (see every tick logged)
window.__runBalanceWorkflow({
iterations: 1,
logVerbose: true
})

// Test with perks active
window.__runBalanceWorkflow({
iterations: 100,
perks: ['pyromaniac', 'death_explosion'],
targetWinRate: 0.65
})

// Test specific unit compositions
window.__runBalanceWorkflow({
iterations: 100,
startingRosterOverride: [/* your units /],
enemyRosterOverride: [/ enemy units */]
})

// View last battle's full tick-by-tick log
window.__lastBattleLog

// View full data from last run
window.__lastBalanceReport

8.2 Expected Output Sequence
[BALANCE] Baseline validation: { ... equal: true }

[AUTO-TUNE] Cycle 1/10

[AUTO-TUNE] Win rate: 35.0% | Target: 65.0%

[AUTO-TUNE] Applying: enemy_stat_reduction → hp: reduce by 10%

[AUTO-TUNE] Cycle 2/10

[AUTO-TUNE] Win rate: 52.0% | Target: 65.0%
... (continues until target met or max cycles)

[AUTO-TUNE] ✅ Target win rate achieved!

=== BALANCE REPORT ===
(console.table with full summary)

MVP Analysis: { playerMVP: {...}, enemyMVP: {...} }

Recommendations: [...]

QUALITY GATES
==================

Before shipping this workflow, confirm:
[ ] window.__runBalanceWorkflow() callable from browser console
[ ] Baseline validation asserts equal stats before battle start
[ ] Every action in every tick is logged to tickLog
[ ] damageDealt and damageTaken match on both ends of each attack
[ ] specialActionsAvailableButSkipped populated even when specials not used
[ ] MVP score computed for every unit, both teams
[ ] winFactors array populated with at least 3 factors per battle
[ ] Auto-tune loop terminates (either hits target or hits maxIterationCycles)
[ ] console.table summary prints after every aggregate run
[ ] window.__lastBattleLog contains full verbose log of most recent battle
[ ] tsc --noEmit passes with zero errors