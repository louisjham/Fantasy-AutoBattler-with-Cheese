// src/data/enemyPerks.ts
// Enemy perk pool — the single source of truth for enemy special abilities.
// EnemyPerk → PassiveEffect bridge keeps CombatEngine's existing trigger
// pipeline intact while the richer metadata (name, description) lives here.

import { PassiveEffect, PassiveTrigger } from '../types';

export interface EnemyPerk {
    id: string;
    name: string;
    school: string;
    triggerOn: 'combat_start' | 'tick' | 'on_hit' | 'on_kill' | 'on_damage_taken';
    effect: string;       // snake_case effect key handled in CombatEngine
    description: string;
}

export const ENEMY_PERK_POOLS: Record<string, EnemyPerk[]> = {

    fire: [
        {
            id: 'burning_aura',
            name: 'Burning Aura',
            school: 'fire',
            triggerOn: 'tick',
            effect: 'aura_burning_damage',
            description: 'All allied player units within range 2.0 take 5 fire dmg per tick.',
        },
        {
            id: 'ignite_on_hit',
            name: 'Ignite on Hit',
            school: 'fire',
            triggerOn: 'on_hit',
            effect: 'apply_burning_on_hit',
            description: 'Each attack applies burning (5 dmg/tick, 2 ticks) to the target.',
        },
        {
            id: 'enrage',
            name: 'Enrage',
            school: 'fire',
            triggerOn: 'on_damage_taken',
            effect: 'enrage_below_30',
            description: 'Below 30% HP: +50% ATK and +1 speed permanently for this battle.',
        },
    ],

    nature: [
        {
            id: 'regeneration',
            name: 'Regeneration',
            school: 'nature',
            triggerOn: 'tick',
            effect: 'regen_5hp_per_tick',
            description: 'Regenerates 5 HP per tick.',
        },
        {
            id: 'pack_tactics',
            name: 'Pack Tactics',
            school: 'nature',
            triggerOn: 'tick',
            effect: 'pack_tactics_atk_per_ally',
            description: '+4 ATK per living allied unit on the field. Recalculates each tick.',
        },
        {
            id: 'thorns',
            name: 'Thorns',
            school: 'nature',
            triggerOn: 'on_damage_taken',
            effect: 'reflect_damage_20pct',
            description: 'Reflects 20% of incoming damage back to the attacker.',
        },
    ],

    death: [
        {
            id: 'enemy_undying',
            name: 'Undying',
            school: 'death',
            triggerOn: 'on_damage_taken',
            effect: 'revive_once_at_25',
            description: 'Once per battle: revives at 25% HP when killed.',
        },
        {
            id: 'fear_aura',
            name: 'Fear Aura',
            school: 'death',
            triggerOn: 'combat_start',
            effect: 'fear_aura_on_start',
            description: 'Battle start: all player units within range 3.0 lose 30% ATK for 2 ticks.',
        },
        {
            id: 'soul_drain',
            name: 'Soul Drain',
            school: 'death',
            triggerOn: 'on_kill',
            effect: 'heal_20_on_kill',
            description: 'Heals 20 HP each time this unit kills a player unit.',
        },
    ],

    arcane: [
        {
            id: 'spell_shield',
            name: 'Spell Shield',
            school: 'arcane',
            triggerOn: 'combat_start',
            effect: 'absorb_first_spell',
            description: 'Absorbs the first spell that hits this unit. No damage taken.',
        },
        {
            id: 'mana_burn',
            name: 'Mana Burn',
            school: 'arcane',
            triggerOn: 'on_hit',
            effect: 'drain_10_mana_on_hit',
            description: 'Each attack drains 10 mana from the target.',
        },
        {
            id: 'arcane_reflect',
            name: 'Arcane Reflect',
            school: 'arcane',
            triggerOn: 'on_damage_taken',
            effect: 'reflect_spell_30pct',
            description: '30% chance to reflect any spell back at the caster.',
        },
    ],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Returns a random EnemyPerk from the school's pool, or null if none exists. */
export function getRandomEnemyPerk(school: string): EnemyPerk | null {
    const pool = ENEMY_PERK_POOLS[school.toLowerCase()];
    if (!pool || pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Converts an EnemyPerk to a PassiveEffect so it can be stored on
 * Unit.passives and processed by CombatEngine.processEnemyPassive().
 *
 * triggerOn mapping:
 *   'combat_start'    → 'battle_start'
 *   'tick'            → 'on_tick'
 *   'on_hit'          → 'on_hit'
 *   'on_kill'         → 'on_kill'
 *   'on_damage_taken' → 'on_damaged'
 */
export function enemyPerkToPassive(perk: EnemyPerk): PassiveEffect {
    const triggerMap: Record<EnemyPerk['triggerOn'], PassiveTrigger> = {
        combat_start: 'battle_start',
        tick: 'on_tick',
        on_hit: 'on_hit',
        on_kill: 'on_kill',
        on_damage_taken: 'on_damaged',
    };

    return {
        trigger: triggerMap[perk.triggerOn],
        effect: perk.effect,
        value: 0,   // EnemyPerk effects use hard-coded values in CombatEngine
    };
}
