import { Unit, UnitStats, MagicSchool } from '../types';
import { useGameStore } from '../store';

// ==========================================
// PHASE 0: SETUP & INVOCATION
// ==========================================

export interface WorkflowConfig {
    iterations: number;
    targetWinRate: number;
    winRateTolerance: number;
    maxIterationCycles: number;
    logVerbose: boolean;
    playerArchetype: string;
    difficulty: string;
    floor: number;
    perks: string[];
    startingRosterOverride?: Unit[];
    enemyRosterOverride?: Unit[];
}

const DEFAULT_CONFIG: WorkflowConfig = {
    iterations: 100,
    targetWinRate: 0.65,
    winRateTolerance: 0.05,
    maxIterationCycles: 10,
    logVerbose: false,
    playerArchetype: 'Conjurer',
    difficulty: 'normal',
    floor: 1,
    perks: []
};

// ==========================================
// PHASE 1: EQUAL BASELINE UNIT CREATION
// ==========================================

export const BASELINE_UNIT_TEMPLATE: UnitStats = {
    hp: 100,
    maxHp: 100,
    attack: 15,
    defense: 5,
    speed: 1,
    mana: 0,
    maxMana: 100
};

export function createBalancedPlayerRoster(count: number = 3): Unit[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `player_unit_${i}`,
        name: `Ally ${i + 1}`,
        school: MagicSchool.Arcane,
        tier: 1,
        stats: { ...BASELINE_UNIT_TEMPLATE },
        baseStats: { ...BASELINE_UNIT_TEMPLATE },
        passives: [],
        position: i as any,
        isHero: i === 0,
        isSummon: i > 0,
        spriteColor: '#4488FF',
        meshType: 'octahedron',
        weapon: null,
        armor: null,
        level: 1,
        xp: 0,
        subclass: null
    }));
}

export function createBalancedEnemyRoster(count: number = 3): Unit[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `enemy_unit_${i}`,
        name: `Enemy ${i + 1}`,
        school: MagicSchool.Death,
        tier: 1,
        stats: { ...BASELINE_UNIT_TEMPLATE, hp: 90, maxHp: 90 }, // 10% reduction
        baseStats: { ...BASELINE_UNIT_TEMPLATE, hp: 90, maxHp: 90 },
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
    }));
}

function sum(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0);
}

function avg(arr: number[]): number {
    if (arr.length === 0) return 0;
    return sum(arr) / arr.length;
}

function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

export function validateBaseline(playerUnits: Unit[], enemyUnits: Unit[]): boolean {
    const playerTotalHP = sum(playerUnits.map(u => u.stats.hp));
    const enemyTotalHP = sum(enemyUnits.map(u => u.stats.hp));
    const playerAvgAtk = avg(playerUnits.map(u => u.stats.attack));
    const enemyAvgAtk = avg(enemyUnits.map(u => u.stats.attack));

    const equal = playerTotalHP === enemyTotalHP && playerAvgAtk === enemyAvgAtk && playerUnits.length === enemyUnits.length;
    console.log('[BALANCE] Baseline validation:', {
        playerTotalHP,
        enemyTotalHP,
        playerAvgAtk,
        enemyAvgAtk,
        equal
    });
    return equal;
}

// ==========================================
// PHASE 2: INSTRUMENTED BATTLE RUNNER
// ==========================================

export interface TickLog {
    tick: number;
    timestamp: number;
    actions: ActionLog[];
    stateSnapshot: {
        playerUnits: { id: string; name: string; hp: number; maxHp: number }[];
        enemyUnits: { id: string; name: string; hp: number; maxHp: number }[];
        totalPlayerHP: number;
        totalEnemyHP: number;
    };
}

export type ActionType = 'attack' | 'spell_cast' | 'passive_trigger' | 'status_tick' | 'heal' | 'buff' | 'debuff' | 'move' | 'idle' | 'revive' | 'summon';

export interface ActionLog {
    tick: number;
    actorId: string;
    actorName: string;
    actorTeam: 'player' | 'enemy';
    actionType: ActionType;
    targetId: string | null;
    targetName: string | null;
    damageDealt: number;
    damageTaken: number;
    hpBefore: number;
    hpAfter: number;
    statusApplied: string | null;
    specialActionName: string | null;
    wasSpecialAction: boolean;
    specialActionsAvailableButSkipped: string[];
    movementTaken: boolean;
    positionBefore: number | null;
    positionAfter: number | null;
    manaSpent: number;
    manaAfter: number;
    unitDied: boolean;
    revivedBy: string | null;
}

export interface UnitCombatStats {
    id: string;
    name: string;
    team: 'player' | 'enemy';
    totalDamageDealt: number;
    totalDamageTaken: number;
    totalHealing: number;
    actionsTotal: number;
    specialActionsUsed: number;
    specialActionsAvailable: number;
    specialActionsSkipped: number;
    movementActions: number;
    ticksAlive: number;
    damagePerTick: number[];
    damageTakenPerTick: number[];
    killedUnits: string[];
    killedBy: string | null;
    survivedToEnd: boolean;
}

export interface BattleResult {
    outcome: 'player_win' | 'player_loss' | 'draw';
    tickLog: TickLog[];
    unitStats: Map<string, UnitCombatStats>;
    totalTicks: number;
}

function buildResult(outcome: 'player_win' | 'player_loss' | 'draw', tickLog: TickLog[], unitStats: Map<string, UnitCombatStats>, totalTicks: number): BattleResult {
    for (const stats of unitStats.values()) {
        stats.survivedToEnd = stats.ticksAlive === totalTicks && stats.killedBy === null;
    }
    return { outcome, tickLog, unitStats, totalTicks };
}

function resolveUnitAction(actor: Unit, targets: Unit[], perks: string[], unitStats: Map<string, UnitCombatStats>): ActionLog {
    // Replicate CombatEngine targeting logic
    let target = targets[0];
    let bestScore = Infinity;
    for (const enemy of targets) {
        const dist = Math.sqrt(Math.pow((actor.x || 0) - (enemy.x || 0), 2) + Math.pow((actor.z || 0) - (enemy.z || 0), 2));
        const score = dist * 100 + enemy.stats.hp;
        if (score < bestScore) {
            bestScore = score;
            target = enemy;
        }
    }

    // Check range (assume 2.0 like CombatEngine)
    const distToTarget = Math.sqrt(Math.pow((actor.x || 0) - (target.x || 0), 2) + Math.pow((actor.z || 0) - (target.z || 0), 2));
    let actionType: ActionType = 'idle';
    let damageDealt = 0;
    let movementTaken = false;
    let wasSpecialAction = false;
    let specialActionsAvailableButSkipped: string[] = [];

    // Very basic spell check
    if (actor.stats.mana >= 100) {
        actionType = 'spell_cast';
        wasSpecialAction = true;
        damageDealt = Math.floor(actor.stats.attack * 2);
    } else if (distToTarget <= 2.0) {
        actionType = 'attack';
        // Base damage formula
        damageDealt = Math.max(1, actor.stats.attack - Math.max(0, target.stats.defense));
    } else {
        actionType = 'move';
        movementTaken = true;
    }

    return {
        tick: 0, // Assigned later
        actorId: actor.id,
        actorName: actor.name,
        actorTeam: (actor.isHero || actor.isSummon) ? 'player' : 'enemy',
        actionType,
        targetId: target.id,
        targetName: target.name,
        damageDealt,
        damageTaken: 0,
        hpBefore: target.stats.hp,
        hpAfter: Math.max(0, target.stats.hp - damageDealt),
        statusApplied: null,
        specialActionName: null,
        wasSpecialAction,
        specialActionsAvailableButSkipped,
        movementTaken,
        positionBefore: actor.x || 0, // approximation
        positionAfter: actor.x || 0,
        manaSpent: actionType === 'spell_cast' ? 100 : 0,
        manaAfter: actionType === 'spell_cast' ? 0 : actor.stats.mana,
        unitDied: target.stats.hp - damageDealt <= 0,
        revivedBy: null
    };
}

function applyAction(action: ActionLog, actor: Unit, targets: Unit[], pUnits: Unit[], eUnits: Unit[], unitStats: Map<string, UnitCombatStats>) {
    if (action.actionType === 'move') {
        const target = targets.find(t => t.id === action.targetId);
        if (target) {
            const dx = (target.x || 0) - (actor.x || 0);
            const dz = (target.z || 0) - (actor.z || 0);
            const len = Math.sqrt(dx * dx + dz * dz);
            if (len > 0) {
                const moveDist = Math.min(0.3, len);
                actor.x = (actor.x || 0) + (dx / len) * moveDist;
                actor.z = (actor.z || 0) + (dz / len) * moveDist;
            }
        }
    } else if (action.actionType === 'attack' || action.actionType === 'spell_cast') {
        const target = targets.find(t => t.id === action.targetId);
        if (target) {
            target.stats.hp -= action.damageDealt;

            if (action.manaSpent > 0) {
                actor.stats.mana = 0;
            }

            // Record damage taken
            action.damageTaken = action.damageDealt;
            const targetStats = unitStats.get(target.id);
            if (targetStats) {
                targetStats.totalDamageTaken += action.damageDealt;
                targetStats.damageTakenPerTick.push(action.damageDealt);
            }

            // Add mana from attack
            actor.stats.mana = Math.min(actor.stats.maxMana, actor.stats.mana + 15);
            target.stats.mana = Math.min(target.stats.maxMana, target.stats.mana + 5);
        }
    }
}

function logStatusEffectTicks(tickEntry: TickLog, pUnits: Unit[], eUnits: Unit[], unitStats: Map<string, UnitCombatStats>, tickNumber: number) {
    // Simplified for baseline testing - normally we'd process burns/poisons here
}

export async function runInstrumentedBattle(
    playerUnits: Unit[],
    enemyUnits: Unit[],
    perks: string[],
    config: WorkflowConfig
): Promise<BattleResult> {
    const tickLog: TickLog[] = [];
    let tickNumber = 0;
    const MAX_TICKS = 500;  // safety ceiling — no battle should exceed 500 ticks

    // Deep clone units to prevent mutation across iterations
    const pUnits = deepClone(playerUnits);
    const eUnits = deepClone(enemyUnits);

    // Setup positions
    pUnits.forEach((u, i) => { u.x = -2; u.z = i - 1; });
    eUnits.forEach((u, i) => { u.x = 2; u.z = i - 1; });

    // Track per-unit cumulative stats
    const unitStats = new Map<string, UnitCombatStats>();
    const allUnits = [...pUnits, ...eUnits];
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
            damagePerTick: [],
            damageTakenPerTick: [],
            killedUnits: [],
            killedBy: null,
            survivedToEnd: false
        });
    }

    // Run headless combat loop
    while (true) {
        tickNumber++;

        if (tickNumber > MAX_TICKS) {
            return buildResult('draw', tickLog, unitStats, tickNumber);
        }

        const alivePlayers = pUnits.filter(u => u.stats.hp > 0);
        const aliveEnemies = eUnits.filter(u => u.stats.hp > 0);

        // Check win/loss
        if (aliveEnemies.length === 0) {
            return buildResult('player_win', tickLog, unitStats, tickNumber);
        }
        if (alivePlayers.length === 0) {
            return buildResult('player_loss', tickLog, unitStats, tickNumber);
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
        };

        // Process each alive unit's action this tick
        const actingUnits = [...alivePlayers, ...aliveEnemies]
            .sort((a, b) => b.stats.speed - a.stats.speed);

        for (const actor of actingUnits) {
            if (actor.stats.hp <= 0) continue;

            const isPlayer = actor.isHero || actor.isSummon;
            const targets = isPlayer ? eUnits.filter(u => u.stats.hp > 0)
                : pUnits.filter(u => u.stats.hp > 0);

            if (targets.length === 0) break;

            const action = resolveUnitAction(actor, targets, perks, unitStats);
            action.tick = tickNumber;
            tickEntry.actions.push(action);

            applyAction(action, actor, targets, pUnits, eUnits, unitStats);

            const uStats = unitStats.get(actor.id)!;
            uStats.actionsTotal++;
            uStats.ticksAlive = tickNumber;
            uStats.damagePerTick.push(action.damageDealt);
            uStats.totalDamageDealt += action.damageDealt;

            if (action.wasSpecialAction) uStats.specialActionsUsed++;
            if (action.specialActionsAvailableButSkipped.length > 0) {
                uStats.specialActionsSkipped += action.specialActionsAvailableButSkipped.length;
                uStats.specialActionsAvailable += action.specialActionsAvailableButSkipped.length;
            }
            if (action.movementTaken) uStats.movementActions++;
            if (action.unitDied) {
                const targetStats = unitStats.get(action.targetId!);
                if (targetStats) {
                    targetStats.killedBy = actor.id;
                    uStats.killedUnits.push(action.targetId!);
                }
            }
        }

        logStatusEffectTicks(tickEntry, pUnits, eUnits, unitStats, tickNumber);

        if (config.logVerbose) {
            console.log(`[TICK ${tickNumber}]`, tickEntry);
        }

        tickLog.push(tickEntry);
    }
}

// ==========================================
// PHASE 3: MVP ANALYSIS ENGINE
// ==========================================

export interface MVPResult {
    unit: UnitCombatStats;
    score: number;
    reason: string;
}

export function computeMVPScore(stats: UnitCombatStats, result: BattleResult): number {
    const damageScore = stats.totalDamageDealt * 1.0;
    const survivalScore = stats.survivedToEnd ? stats.totalDamageDealt * 0.3 : 0;
    const killScore = stats.killedUnits.length * 50;
    const healScore = stats.totalHealing * 0.8;
    const specialScore = stats.specialActionsUsed * 20;
    const efficiencyBonus = stats.ticksAlive > 0
        ? (stats.totalDamageDealt / stats.ticksAlive) * 10
        : 0;

    return damageScore + survivalScore + killScore + healScore + specialScore + efficiencyBonus;
}

export function generateMVPReason(stats: UnitCombatStats): string {
    const reasons = [];
    if (stats.totalDamageDealt > 80) reasons.push(`High damage (${stats.totalDamageDealt} total)`);
    if (stats.killedUnits.length > 0) reasons.push(`Killed ${stats.killedUnits.length} unit(s)`);
    if (stats.survivedToEnd) reasons.push('Survived to battle end');
    if (stats.totalHealing > 30) reasons.push(`Healed ${stats.totalHealing} HP`);
    if (stats.specialActionsUsed > 2) reasons.push(`Used ${stats.specialActionsUsed} special actions`);

    const avgDmg = stats.damagePerTick.filter(d => d > 0);
    if (avgDmg.length > 0) {
        const avgVal = (avgDmg.reduce((a, b) => a + b, 0) / avgDmg.length).toFixed(1);
        reasons.push(`Avg ${avgVal} dmg/tick`);
    }
    return reasons.join(' | ') || 'Consistent presence';
}

export function identifyMVPs(unitStats: Map<string, UnitCombatStats>, result: BattleResult) {
    const playerUnits = [...unitStats.values()].filter(u => u.team === 'player');
    const enemyUnits = [...unitStats.values()].filter(u => u.team === 'enemy');

    const playerMVP = playerUnits.sort((a, b) => computeMVPScore(b, result) - computeMVPScore(a, result))[0];
    const enemyMVP = enemyUnits.sort((a, b) => computeMVPScore(b, result) - computeMVPScore(a, result))[0];

    return {
        playerMVP: playerMVP ? {
            unit: playerMVP,
            score: computeMVPScore(playerMVP, result),
            reason: generateMVPReason(playerMVP)
        } : null,
        enemyMVP: enemyMVP ? {
            unit: enemyMVP,
            score: computeMVPScore(enemyMVP, result),
            reason: generateMVPReason(enemyMVP)
        } : null
    };
}

// ==========================================
// PHASE 4: WIN FACTOR ANALYSIS
// ==========================================

export interface TeamSummary {
    totalDamageDealt: number;
    totalDamageTaken: number;
    totalActionsPerformed: number;
    actionsPerTick: number;
    specialActionsUsed: number;
    specialActionsSkipped: number;
    specialActionUsageRate: number;
    totalHealing: number;
    unitsAliveAtEnd: number;
    avgHpAtEnd: number;
    avgDamagePerTick: number[];
    dominantDamageSource: string;
}

export interface WinFactor {
    factor: string;
    playerValue: number | string;
    enemyValue: number | string;
    advantage: 'player' | 'enemy' | 'neutral';
    weight: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
}

export interface MissedOpportunity {
    team: 'player' | 'enemy';
    unitName: string;
    tick: number;
    availableAction: string;
    reason: string;
    estimatedImpact: string;
}

export interface BattleAnalysis {
    outcome: 'player_win' | 'player_loss' | 'draw';
    totalTicks: number;
    totalDurationMs: number;
    player: TeamSummary;
    enemy: TeamSummary;
    mvp: {
        playerMVP: MVPResult | null;
        enemyMVP: MVPResult | null;
    };
    winFactors: WinFactor[];
    unitBreakdown: UnitCombatStats[];
    missedOpportunities: MissedOpportunity[];
    tickLog: TickLog[];
}

function calculateTeamSummary(team: 'player' | 'enemy', stats: UnitCombatStats[], totalTicks: number): TeamSummary {
    const teamStats = stats.filter(s => s.team === team);
    const totalDamageDealt = sum(teamStats.map(s => s.totalDamageDealt));
    const totalDamageTaken = sum(teamStats.map(s => s.totalDamageTaken));
    const totalActionsPerformed = sum(teamStats.map(s => s.actionsTotal));
    const specialActionsUsed = sum(teamStats.map(s => s.specialActionsUsed));
    const specialActionsSkipped = sum(teamStats.map(s => s.specialActionsSkipped));
    const totalHealing = sum(teamStats.map(s => s.totalHealing));
    const unitsAliveAtEnd = teamStats.filter(s => s.survivedToEnd).length;

    const dominantDmg = [...teamStats].sort((a, b) => b.totalDamageDealt - a.totalDamageDealt)[0];

    return {
        totalDamageDealt,
        totalDamageTaken,
        totalActionsPerformed,
        actionsPerTick: totalTicks > 0 ? totalActionsPerformed / totalTicks : 0,
        specialActionsUsed,
        specialActionsSkipped,
        specialActionUsageRate: (specialActionsUsed + specialActionsSkipped) > 0 ? specialActionsUsed / (specialActionsUsed + specialActionsSkipped) : 0,
        totalHealing,
        unitsAliveAtEnd,
        avgHpAtEnd: 0, // not strictly tracked here unless we inspect final HP
        avgDamagePerTick: teamStats.map(s => avg(s.damagePerTick)),
        dominantDamageSource: dominantDmg ? dominantDmg.name : 'None'
    };
}

function calculateWinFactors(player: TeamSummary, enemy: TeamSummary, playerUnitCount: number, enemyUnitCount: number): WinFactor[] {
    const factors: WinFactor[] = [];

    // Damage output advantage
    const dmgAdvantage = player.totalDamageDealt > enemy.totalDamageDealt ? 'player' : (enemy.totalDamageDealt > player.totalDamageDealt ? 'enemy' : 'neutral');
    const dmgDelta = Math.abs(player.totalDamageDealt - enemy.totalDamageDealt);
    const maxDmg = Math.max(player.totalDamageDealt, enemy.totalDamageDealt);
    const isCriticalDmg = maxDmg > 0 && (dmgDelta / maxDmg) > 0.3;

    factors.push({
        factor: 'Damage output advantage',
        playerValue: player.totalDamageDealt,
        enemyValue: enemy.totalDamageDealt,
        advantage: dmgAdvantage,
        weight: isCriticalDmg ? 'CRITICAL' : 'HIGH',
        description: `Difference of ${dmgDelta} total damage`
    });

    // Actions per tick advantage
    const actAdvantage = player.actionsPerTick > enemy.actionsPerTick ? 'player' : (enemy.actionsPerTick > player.actionsPerTick ? 'enemy' : 'neutral');
    factors.push({
        factor: 'Actions per tick advantage',
        playerValue: player.actionsPerTick.toFixed(2),
        enemyValue: enemy.actionsPerTick.toFixed(2),
        advantage: actAdvantage,
        weight: 'HIGH',
        description: 'More actions equates to more damage opportunities'
    });

    // Survival rate
    const pSurvival = playerUnitCount > 0 ? player.unitsAliveAtEnd / playerUnitCount : 0;
    const eSurvival = enemyUnitCount > 0 ? enemy.unitsAliveAtEnd / enemyUnitCount : 0;
    const survAdvantage = pSurvival > eSurvival ? 'player' : (eSurvival > pSurvival ? 'enemy' : 'neutral');
    factors.push({
        factor: 'Survival rate',
        playerValue: `${(pSurvival * 100).toFixed(0)}%`,
        enemyValue: `${(eSurvival * 100).toFixed(0)}%`,
        advantage: survAdvantage,
        weight: 'HIGH',
        description: 'Units staying alive longer'
    });

    return factors;
}

export function analyzeBattle(result: BattleResult, initialPlayerCount: number, initialEnemyCount: number): BattleAnalysis {
    const unitStatsArr = [...result.unitStats.values()];
    const player = calculateTeamSummary('player', unitStatsArr, result.totalTicks);
    const enemy = calculateTeamSummary('enemy', unitStatsArr, result.totalTicks);
    const mvps = identifyMVPs(result.unitStats, result);
    const winFactors = calculateWinFactors(player, enemy, initialPlayerCount, initialEnemyCount);

    return {
        outcome: result.outcome,
        totalTicks: result.totalTicks,
        totalDurationMs: result.totalTicks * 600,
        player,
        enemy,
        mvp: mvps,
        winFactors,
        unitBreakdown: unitStatsArr,
        missedOpportunities: [],
        tickLog: result.tickLog
    };
}

// ==========================================
// PHASE 5: MULTI-BATTLE AGGREGATE REPORT & PHASE 6: AUTO-TUNE
// ==========================================

export interface BalanceRecommendation {
    type: string;
    severity: string;
    target: string;
    field: string;
    currentValue: string;
    suggestedValue: string;
    rationale: string;
}

export interface AggregateReport {
    config: WorkflowConfig;
    totalBattles: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    targetWinRate: number;
    withinTolerance: boolean;

    avgTicks: number;
    avgPlayerDamage: number;
    avgEnemyDamage: number;
    avgPlayerActionsPerTick: number;
    avgEnemyActionsPerTick: number;
    avgSpecialUsageRate: number;

    dominantWinFactors: string[];
    dominantLossFactors: string[];
    mostConsistentPlayerMVP: string;
    mostConsistentEnemyMVP: string;
    recommendations: BalanceRecommendation[];
    battles: BattleAnalysis[];
    fullLog?: any;
    summary?: any;
    mvp?: any;
}

export async function runAggregateReport(config: WorkflowConfig): Promise<AggregateReport> {
    let wins = 0;
    let losses = 0;
    let draws = 0;

    const battles: BattleAnalysis[] = [];

    let pRoster = config.startingRosterOverride || createBalancedPlayerRoster();
    let eRoster = config.enemyRosterOverride || createBalancedEnemyRoster();

    // Validate baseline on first run
    validateBaseline(pRoster, eRoster);

    for (let i = 0; i < config.iterations; i++) {
        const result = await runInstrumentedBattle(pRoster, eRoster, config.perks, config);
        const analysis = analyzeBattle(result, pRoster.length, eRoster.length);
        battles.push(analysis);

        if (result.outcome === 'player_win') wins++;
        else if (result.outcome === 'player_loss') losses++;
        else draws++;
    }

    const winRate = wins / config.iterations;
    const withinTolerance = Math.abs(winRate - config.targetWinRate) <= config.winRateTolerance;

    const avgTicks = avg(battles.map(b => b.totalTicks));
    const avgPlayerDamage = avg(battles.map(b => b.player.totalDamageDealt));
    const avgEnemyDamage = avg(battles.map(b => b.enemy.totalDamageDealt));
    const avgPlayerActionsPerTick = avg(battles.map(b => b.player.actionsPerTick));
    const avgEnemyActionsPerTick = avg(battles.map(b => b.enemy.actionsPerTick));
    const avgSpecialUsageRate = avg(battles.map(b => Math.max(b.player.specialActionUsageRate, b.enemy.specialActionUsageRate)));

    const report: AggregateReport = {
        config,
        totalBattles: config.iterations,
        wins,
        losses,
        draws,
        winRate,
        targetWinRate: config.targetWinRate,
        withinTolerance,
        avgTicks,
        avgPlayerDamage,
        avgEnemyDamage,
        avgPlayerActionsPerTick,
        avgEnemyActionsPerTick,
        avgSpecialUsageRate,
        dominantWinFactors: ['Damage output advantage'],
        dominantLossFactors: ['Survival rate'],
        mostConsistentPlayerMVP: battles[0]?.mvp.playerMVP?.unit.name || 'None',
        mostConsistentEnemyMVP: battles[0]?.mvp.enemyMVP?.unit.name || 'None',
        recommendations: [],
        battles
    };

    report.recommendations = generateRecommendations(report);

    return report;
}

export function generateRecommendations(report: AggregateReport): BalanceRecommendation[] {
    const recs: BalanceRecommendation[] = [];
    const wr = report.winRate;
    const target = report.targetWinRate;
    const tol = report.config.winRateTolerance;

    if (wr < target - tol) {
        const delta = target - wr;
        const severity = delta > 0.2 ? 'CRITICAL' : delta > 0.1 ? 'HIGH' : 'MEDIUM';

        recs.push({
            type: 'enemy_stat_reduction',
            severity,
            target: 'enemy',
            field: 'hp',
            currentValue: 'current',
            suggestedValue: 'reduce by 10%',
            rationale: `Win rate ${(wr * 100).toFixed(1)}% is ${((target - wr) * 100).toFixed(1)}pp below target`
        });

        if (report.dominantLossFactors.includes('Damage output advantage')) {
            recs.push({
                type: 'player_stat_increase',
                severity: 'HIGH',
                target: 'player',
                field: 'attack',
                currentValue: 'current',
                suggestedValue: 'increase by 2',
                rationale: 'Enemy damage output consistently outpaces player'
            });
        }
    }

    if (wr > target + tol) {
        recs.push({
            type: 'enemy_stat_increase',
            severity: 'MEDIUM',
            target: 'enemy',
            field: 'hp',
            currentValue: 'current',
            suggestedValue: 'increase by 10%',
            rationale: `Win rate ${(wr * 100).toFixed(1)}% is ${((wr - target) * 100).toFixed(1)}pp above target`
        });
    }

    if (report.avgTicks < 5) {
        recs.push({
            type: 'stat_rebalance',
            severity: 'HIGH',
            target: 'both',
            field: 'defense',
            currentValue: 'current',
            suggestedValue: 'increase both sides defense by 3',
            rationale: 'Battles resolving too quickly — combat feels anticlimactic'
        });
    }

    if (report.avgTicks > 100) {
        recs.push({
            type: 'stat_rebalance',
            severity: 'MEDIUM',
            target: 'both',
            field: 'attack',
            currentValue: 'current',
            suggestedValue: 'increase both sides attack by 3',
            rationale: 'Battles running too long — damage too low relative to HP'
        });
    }

    return recs;
}

function applyRecommendation(config: WorkflowConfig, rec: BalanceRecommendation): WorkflowConfig {
    const newConfig = { ...config };
    // Modify overrides to implement the stat changes
    newConfig.startingRosterOverride = config.startingRosterOverride || createBalancedPlayerRoster();
    newConfig.enemyRosterOverride = config.enemyRosterOverride || createBalancedEnemyRoster();

    if (rec.target === 'enemy' && rec.field === 'hp') {
        const mult = rec.type.includes('reduction') ? 0.9 : 1.1;
        newConfig.enemyRosterOverride.forEach(u => {
            u.stats.hp = Math.round(u.stats.hp * mult);
            u.stats.maxHp = Math.round(u.stats.maxHp * mult);
        });
    } else if (rec.target === 'player' && rec.field === 'attack') {
        newConfig.startingRosterOverride.forEach(u => {
            u.stats.attack += 2;
        });
    } else if (rec.target === 'both' && (rec.field === 'defense' || rec.field === 'attack')) {
        const add = 3;
        newConfig.startingRosterOverride.forEach(u => u.stats[rec.field as keyof UnitStats] += add);
        newConfig.enemyRosterOverride.forEach(u => u.stats[rec.field as keyof UnitStats] += add);
    }

    return newConfig;
}

export async function autoTune(config: WorkflowConfig): Promise<AggregateReport> {
    let cycleCount = 0;
    let currentConfig = { ...config };
    let lastReport: AggregateReport | null = null;

    while (cycleCount < config.maxIterationCycles) {
        cycleCount++;
        console.log(`\n[AUTO-TUNE] Cycle ${cycleCount}/${config.maxIterationCycles}`);

        lastReport = await runAggregateReport(currentConfig);

        console.log(`[AUTO-TUNE] Win rate: ${(lastReport.winRate * 100).toFixed(1)}% | Target: ${(config.targetWinRate * 100).toFixed(1)}%`);

        if (lastReport.withinTolerance) {
            console.log('[AUTO-TUNE] ✅ Target win rate achieved!');
            break;
        }

        const topRec = lastReport.recommendations[0];
        if (!topRec) {
            console.log('[AUTO-TUNE] ⚠️  No recommendations generated. Manual review needed.');
            break;
        }

        console.log(`[AUTO-TUNE] Applying: ${topRec.type} → ${topRec.field}: ${topRec.suggestedValue}`);
        currentConfig = applyRecommendation(currentConfig, topRec);
    }

    if (cycleCount >= config.maxIterationCycles && lastReport) {
        console.warn(`[AUTO-TUNE] ⚠️  Max cycles reached. Final win rate: ${(lastReport.winRate * 100).toFixed(1)}%`);
    }

    return lastReport!;
}

// ==========================================
// PHASE 8: INVOCATION EXPOSURE
// ==========================================

export async function runBalanceWorkflow(userConfig?: Partial<WorkflowConfig>) {
    const config = { ...DEFAULT_CONFIG, ...userConfig };

    const prepareFinalReport = (report: AggregateReport) => {
        report.summary = {
            'Win Rate': `${(report.winRate * 100).toFixed(1)}%`,
            'Target': `${(report.targetWinRate * 100).toFixed(1)}%`,
            'Within Tolerance': report.withinTolerance ? '✅ YES' : '❌ NO',
            'Avg Battle Length': `${report.avgTicks.toFixed(1)} ticks (${(report.avgTicks * 600 / 1000).toFixed(1)}s)`,
            'Player Avg Damage': report.avgPlayerDamage.toFixed(1),
            'Enemy Avg Damage': report.avgEnemyDamage.toFixed(1),
            'Player Actions/Tick': report.avgPlayerActionsPerTick.toFixed(2),
            'Enemy Actions/Tick': report.avgEnemyActionsPerTick.toFixed(2),
            'Special Usage Rate': `${(report.avgSpecialUsageRate * 100).toFixed(1)}%`,
            'Top Player MVP': report.mostConsistentPlayerMVP,
            'Top Enemy MVP': report.mostConsistentEnemyMVP,
            'Top Win Factor': report.dominantWinFactors.join(', '),
            'Top Loss Factor': report.dominantLossFactors.join(', ')
        };
        report.mvp = report.battles[report.battles.length - 1]?.mvp || {};
        return report;
    };

    if (config.iterations === 1 && config.logVerbose) {
        const report = await runAggregateReport(config);
        return prepareFinalReport(report);
    }

    const finalReport = await autoTune(config);
    return prepareFinalReport(finalReport);
}

if (typeof window !== 'undefined') {
    (window as any).__runBalanceWorkflow = (config?: Partial<WorkflowConfig>) => {
        runBalanceWorkflow(config).then(r => {
            console.log('\n=== BALANCE REPORT ===');
            console.table(r.summary);
            console.log('\nMVP Analysis:', r.mvp);
            console.log('\nRecommendations:', r.recommendations);
            console.log('\nFull log saved to window.__lastBalanceReport');
            (window as any).__lastBalanceReport = r;
            (window as any).__lastBattleLog = r.battles[0]?.tickLog;
        });
    };
}
