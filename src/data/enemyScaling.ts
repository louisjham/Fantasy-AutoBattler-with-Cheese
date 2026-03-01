// src/data/enemyScaling.ts
// Single source of truth for all enemy stat scaling.
// Imported by ProceduralGen (floor generation) and CombatEngine
// (dynamic spawns such as boss minions and skeleton raises).

export const FLOOR_MULTIPLIERS: Record<number, number> = {
    1: 1.00,
    2: 1.15,
    3: 1.35,
    4: 1.60,
    5: 1.90,
    6: 2.30,
    7: 2.75,
    8: 3.30,
};

export const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
    easy: 0.80,
    normal: 1.00,
    hard: 1.40,
    brutal: 1.90,
};

/** Flat stat shape used by the scaling function. */
export interface ScaledStats {
    hp: number;
    atk: number;
    def: number;
    spd: number;
    mana: number;
}

/**
 * Main scaling function — call this when spawning any enemy unit.
 * Speed is intentionally never scaled.
 */
export function scaleEnemyStats(
    baseStats: ScaledStats,
    floor: number,
    difficulty: string
): ScaledStats {
    const floorMult = FLOOR_MULTIPLIERS[floor] ?? 1.0;
    const diffMult = DIFFICULTY_MULTIPLIERS[difficulty] ?? 1.0;
    const total = floorMult * diffMult;

    return {
        hp: Math.round(baseStats.hp * total),
        atk: Math.round(baseStats.atk * total),
        def: Math.round(baseStats.def * total),
        spd: baseStats.spd,                       // speed never scales
        mana: Math.round(baseStats.mana * total),
    };
}

/**
 * Convenience overload that works directly with Babylon-style UnitStats
 * (hp / maxHp / attack / defense / speed / mana / maxMana).
 * Returns a new UnitStats object with scaled values.
 */
export function scaleUnitStats(
    stats: { hp: number; maxHp: number; attack: number; defense: number; speed: number; mana: number; maxMana: number },
    floor: number,
    difficulty: string
): { hp: number; maxHp: number; attack: number; defense: number; speed: number; mana: number; maxMana: number } {
    const floorMult = FLOOR_MULTIPLIERS[floor] ?? 1.0;
    const diffMult = DIFFICULTY_MULTIPLIERS[difficulty] ?? 1.0;
    const total = floorMult * diffMult;

    return {
        hp: Math.round(stats.hp * total),
        maxHp: Math.round(stats.maxHp * total),
        attack: Math.round(stats.attack * total),
        defense: Math.round(stats.defense * total),
        speed: stats.speed,
        mana: Math.round(stats.mana * total),
        maxMana: Math.round(stats.maxMana * total),
    };
}

/** Returns a human-readable label for the combined multiplier (for debug / UI). */
export function getScalingLabel(floor: number, difficulty: string): string {
    const floorMult = FLOOR_MULTIPLIERS[floor] ?? 1.0;
    const diffMult = DIFFICULTY_MULTIPLIERS[difficulty] ?? 1.0;
    const total = floorMult * diffMult;
    return `Floor ${floor} ${difficulty} — ${total.toFixed(2)}×`;
}
