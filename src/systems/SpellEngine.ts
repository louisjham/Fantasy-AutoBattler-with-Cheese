import { Spell, Unit, MagicSchool } from '../types';
import { CombatEngine } from './CombatEngine';
import { globalEventBus } from '../EventBus';
import { useGameStore } from '../store';

export class SpellEngine {
    static executeSpell(spell: Spell, engine: CombatEngine) {
        const pUnits = engine['playerUnits'];
        const eUnits = engine['enemyUnits'];
        const hero = pUnits.find(u => u.isHero);
        if (!hero) return;

        // If Necronomicon spell, remove it from action pool
        if (spell.id.startsWith('tome_')) {
            engine.usedNecronomiconSpells.add(spell.id);
            // Hide it from future use - simplified by marking tags
            spell.tags.push('used');
        }

        const getBestTarget = () => {
            let target = eUnits[0];
            let minHp = Infinity;
            for (const e of eUnits) {
                if (e.stats.hp < minHp) { minHp = e.stats.hp; target = e; }
            }
            return target;
        };

        const target = getBestTarget();
        if (!target) return;

        const applyDamage = (unit: Unit, amount: number) => {
            let mult = 1.0;
            const tb = engine.tempStatModifiers.get('fate_boon');
            if (tb && tb.spellDmg) mult = tb.spellDmg;
            const dmg = engine['applyDamageToUnit'](unit, Math.floor(amount * mult), true, spell.school);
            globalEventBus.emit('unit:attacked', { attacker: hero, target: unit, damage: dmg });
            if (unit.stats.hp <= 0) engine['handleUnitDeath'](unit, hero.id);
        };

        const handleEcho = (dmgFn: () => void) => {
            const hasEcho = useGameStore.getState().perkList.some(p => p.effect === 'spell_repeat_on_crit');
            const hasPrism = engine.tempStatModifiers.has('prismatic_crit');
            let isCrit = false;
            if (hasPrism && Math.random() < 0.25) isCrit = true;
            if (useGameStore.getState().perkList.some(p => p.effect === 'spell_crit_chance') && Math.random() < 0.25) isCrit = true;

            if (engine.grandRiteReady) {
                engine.grandRiteReady = false;
                dmgFn(); dmgFn(); // double effect
            } else {
                dmgFn();
                if (isCrit && hasEcho) dmgFn();
            }
        };

        switch (spell.effect) {
            // MYSTIC
            case 'm_arcane_bolt': handleEcho(() => applyDamage(target, 28)); break;
            case 'm_blink': engine.tempStatModifiers.set(hero.id, { nextSpellDiscount: 5 }); break;
            case 'm_arcane_shield': engine['addStatusEffect'](hero.id, { type: 'regen', damagePerTick: -10, duration: 3, sourceUnitId: hero.id }); break;
            case 'm_mind_spike':
                if (target.stats.mana >= 20) { target.stats.mana -= 20; handleEcho(() => applyDamage(target, 20)); }
                else { handleEcho(() => applyDamage(target, 30)); } break;
            case 'm_meteor_storm': eUnits.forEach(u => { handleEcho(() => applyDamage(u, 40)); engine['addStatusEffect'](u.id, { type: 'stunned', damagePerTick: 0, duration: 1, sourceUnitId: hero.id }); }); break;
            case 'm_temporal_stasis': eUnits.forEach(u => engine['addStatusEffect'](u.id, { type: 'frozen', damagePerTick: 0, duration: 2, sourceUnitId: hero.id })); break;
            case 'm_cascade_bolt': let cdmg = 20; for (let i = 0; i < Math.min(5, eUnits.length); i++) { handleEcho(() => applyDamage(eUnits[i], cdmg)); cdmg *= 0.9; } break;
            case 'm_singularity': eUnits.forEach(u => { engine['addStatusEffect'](u.id, { type: 'rooted', damagePerTick: 15, duration: 2, sourceUnitId: hero.id }); const eMod = engine.tempStatModifiers.get(u.id) || {}; eMod.defense = -Math.floor(u.stats.defense * 0.5); engine.tempStatModifiers.set(u.id, eMod); }); break;
            case 'm_mana_void': let dr = 0; eUnits.forEach(u => { if (u.stats.mana > 0) { dr += u.stats.mana; u.stats.mana = 0; } }); hero.stats.mana = Math.min(hero.stats.maxMana, hero.stats.mana + Math.floor(dr / 30)); break;

            // MYSTIC SEER
            case 'm_prophecy': eUnits.forEach(u => { const m = engine.tempStatModifiers.get(u.id) || {}; m.defense = -2; engine.tempStatModifiers.set(u.id, m); }); break;
            case 'm_hex_misfortune': engine['addStatusEffect'](target.id, { type: 'stunned', damagePerTick: 0, duration: 1, sourceUnitId: hero.id }); break;
            case 'm_astral_vision': pUnits.forEach(u => { const m = engine.tempStatModifiers.get(u.id) || {}; m.attack = (m.attack || 0) + 5; engine.tempStatModifiers.set(u.id, m); }); break;
            case 'm_fate_weave': if (eUnits.length >= 2) { eUnits[0].stats.attack = Math.floor(eUnits[0].stats.attack * 0.7); eUnits[1].stats.attack = Math.floor(eUnits[1].stats.attack * 0.7); } break;

            // MYSTIC RUNELORD
            case 'm_rune_of_power': engine.activeRunes.push({ type: 'power', position: 5, ticksActive: 0 }); useGameStore.setState({ runeStacks: useGameStore.getState().runeStacks + 1 }); pUnits.forEach(u => { const rMod = engine.tempStatModifiers.get(u.id) || {}; rMod.attack = (rMod.attack || 0) + 12; engine.tempStatModifiers.set(u.id, rMod); }); break;
            case 'm_rune_of_warding': engine.activeRunes.push({ type: 'runebind', position: 5, ticksActive: 0 }); useGameStore.setState({ runeStacks: useGameStore.getState().runeStacks + 1 }); break;
            case 'm_rune_of_ending': engine.activeRunes.push({ type: 'runebind', position: 5, ticksActive: 0 }); useGameStore.setState({ runeStacks: useGameStore.getState().runeStacks + 1 }); break;

            // WARLORD VANILLA
            case 'w_fortify': pUnits.forEach(u => { const fMod = engine.tempStatModifiers.get(u.id) || {}; fMod.defense = (fMod.defense || 0) + 5; engine.tempStatModifiers.set(u.id, fMod); u.stats.hp = Math.min(u.stats.maxHp, u.stats.hp + 10); }); break;
            case 'w_rallying_cry': pUnits.forEach(u => { const fMod = engine.tempStatModifiers.get(u.id) || {}; fMod.attack = (fMod.attack || 0) + 8; if (u.stats.hp < u.stats.maxHp * 0.3) fMod.speed = (fMod.speed || 0) + 2; engine.tempStatModifiers.set(u.id, fMod); }); break;
            case 'w_war_stomp': eUnits.forEach(u => { applyDamage(u, 10); engine['addStatusEffect'](u.id, { type: 'stunned', damagePerTick: 0, duration: 1, sourceUnitId: hero.id }); }); break;

            // WARLORD SORCERER KING & NECRONOMICON
            case 'w_hellfire': eUnits.forEach(u => { applyDamage(u, 30); engine['addStatusEffect'](u.id, { type: 'burning', damagePerTick: 5, duration: 3, sourceUnitId: hero.id }); }); break;
            case 'w_drain_life': let hl = 0; eUnits.forEach(u => { const d = Math.min(u.stats.hp, 20); applyDamage(u, 20); hl += d; }); hero.stats.hp = Math.min(hero.stats.maxHp, hero.stats.hp + hl); break;
            case 'w_demonic_possession': engine['addStatusEffect'](target.id, { type: 'stunned', damagePerTick: 0, duration: 2, sourceUnitId: hero.id }); target.stats.hp -= 30; break;
            case 'w_dark_ritual': hero.stats.hp -= 25; pUnits.forEach(u => { if (u.id.includes('daemon') || u.id.includes('minion')) { u.stats.attack = Math.floor(u.stats.attack * 1.5); } }); break;
            case 'tome_word_ruin': target.stats.hp = 0; engine['handleUnitDeath'](target, hero.id); break;
            case 'tome_flesh_pact': engine.addSummon({ id: `flesh_${Date.now()}`, name: 'Flesh Abomination', school: MagicSchool.Death, tier: 2, stats: { hp: 100, maxHp: 100, attack: 15, defense: 5, speed: 1, mana: 0, maxMana: 0 }, baseStats: { hp: 100, maxHp: 100, attack: 15, defense: 5, speed: 1, mana: 0, maxMana: 0 }, passives: [], position: 6 as any, isHero: false, isSummon: true, spriteColor: 'purple', meshType: 'octahedron', weapon: null, armor: null, level: 1, xp: 0, subclass: null }); break;
            case 'tome_veil_shadows': pUnits.forEach(u => { const sm = engine.tempStatModifiers.get(u.id) || {}; sm.defense += 20; engine.tempStatModifiers.set(u.id, sm); }); break;
            case 'tome_edict_agony': eUnits.forEach(u => applyDamage(u, 25)); break;
            case 'tome_final_bind': engine['addStatusEffect'](target.id, { type: 'stunned', damagePerTick: 0, duration: 4, sourceUnitId: hero.id }); break;

            // WARLORD OGRE MAGI
            case 'w_tribal_war_cry': pUnits.filter(u => u.id.includes('gnoll') || u.id.includes('war_dog')).forEach(u => { u.stats.attack += 10; u.stats.speed += 2; }); break;
            case 'w_beast_call': engine.addSummon({ id: `warp_dog_${Date.now()}`, name: 'War Dog', school: MagicSchool.Nature, tier: 1, stats: { hp: 60, maxHp: 60, attack: 20, defense: 3, speed: 3, mana: 0, maxMana: 0 }, baseStats: { hp: 60, maxHp: 60, attack: 20, defense: 3, speed: 3, mana: 0, maxMana: 0 }, passives: [], position: 8 as any, isHero: false, isSummon: true, spriteColor: 'brown', meshType: 'cylinder', weapon: null, armor: null, level: 1, xp: 0, subclass: null }); break;
            case 'w_primal_fury': hero.stats.attack *= 2; hero.stats.defense = Math.floor(hero.stats.defense / 2); eUnits.forEach(u => applyDamage(u, hero.stats.attack)); break;

            // WARLORD DEATHLORD
            case 'w_unholy_resurrection': // pseudo handled in CombatEngine reviving queue
                break;
            case 'w_death_coil': applyDamage(target, 30); hero.stats.hp = Math.min(hero.stats.maxHp, hero.stats.hp + 15); break;
            case 'w_plague': eUnits.forEach(u => engine['addStatusEffect'](u.id, { type: 'poisoned', damagePerTick: 8, duration: 4, sourceUnitId: hero.id })); break;
            case 'w_soul_harvest': eUnits.forEach(u => { if (u.stats.mana > 0) { u.stats.mana = 0; } }); if (engine.tempStatModifiers.has('death_dawning_active')) { pUnits.forEach(u => u.stats.attack += 10); } break;

            // CONJURER BASE & EM
            case 'c_fireball': eUnits.forEach(u => { applyDamage(u, 30); engine['addStatusEffect'](u.id, { type: 'burning', damagePerTick: 6, duration: 3, sourceUnitId: hero.id }); }); break;
            case 'c_frost_nova': eUnits.forEach(u => { applyDamage(u, 25); const sMod = engine.tempStatModifiers.get(u.id) || {}; sMod.speed = -Math.floor(u.stats.speed * 0.5); engine.tempStatModifiers.set(u.id, sMod); }); break;
            case 'c_chain_lightning': applyDamage(eUnits[0], 35); if (eUnits.length > 1) applyDamage(eUnits[1], 20); if (eUnits.length > 2) { applyDamage(eUnits[2], 20); for (let i = 0; i < 3; i++) engine['addStatusEffect'](eUnits[i].id, { type: 'stunned', damagePerTick: 0, duration: 1, sourceUnitId: hero.id }); } break;
            case 'c_summon_elemental': engine.addSummon({ id: `elem_adept_${Date.now()}`, name: 'Elemental Adept', school: MagicSchool.Arcane, tier: 1, stats: { hp: 75, maxHp: 75, attack: 16, defense: 4, speed: 2, mana: 0, maxMana: 0 }, baseStats: { hp: 75, maxHp: 75, attack: 16, defense: 4, speed: 2, mana: 0, maxMana: 0 }, passives: [], position: 8 as any, isHero: false, isSummon: true, spriteColor: 'cyan', meshType: 'octahedron', weapon: null, armor: null, level: 1, xp: 0, subclass: null }); break;
            case 'c_pyroclasm': eUnits.forEach(u => { applyDamage(u, 40); engine['addStatusEffect'](u.id, { type: 'burning', damagePerTick: 8, duration: 3, sourceUnitId: hero.id }); }); break;
            case 'c_blizzard': eUnits.forEach(u => { let dmg = 35; if (u.stats.hp < u.stats.maxHp * 0.5) dmg *= 1.5; applyDamage(u, dmg); engine['addStatusEffect'](u.id, { type: 'frozen', damagePerTick: 0, duration: 1, sourceUnitId: hero.id }); }); break;
            case 'c_maelstrom': applyDamage(eUnits[0], 45); for (let i = 1; i < Math.min(4, eUnits.length); i++) { applyDamage(eUnits[i], 30); engine['addStatusEffect'](eUnits[i].id, { type: 'stunned', damagePerTick: 0, duration: 1, sourceUnitId: hero.id }); } break;
            case 'c_prismatic_barrier': pUnits.filter(u => u.isSummon).forEach(u => u.stats.hp += 15); break;

            // CONJURER BEAST CONJURER
            case 'c_hydra_strike': applyDamage(target, 40); engine.hydraHeadIndex = (engine.hydraHeadIndex + 1) % 3; break;
            case 'c_beast_empowerment': pUnits.filter(u => u.isSummon).forEach(u => { const fMod = engine.tempStatModifiers.get(u.id) || {}; fMod.attack = (fMod.attack || 0) + 15; fMod.speed = (fMod.speed || 0) + 2; engine.tempStatModifiers.set(u.id, fMod); }); break;
            case 'c_summon_feral_pack': for (let i = 0; i < 2; i++) engine.addSummon({ id: `werewolf_${Date.now()}_${i}`, name: 'Werewolf', school: MagicSchool.Nature, tier: 1, stats: { hp: 85, maxHp: 85, attack: 20, defense: 4, speed: 3, mana: 0, maxMana: 0 }, baseStats: { hp: 85, maxHp: 85, attack: 20, defense: 4, speed: 3, mana: 0, maxMana: 0 }, passives: [], position: 8 as any, isHero: false, isSummon: true, spriteColor: 'brown', meshType: 'cylinder', weapon: null, armor: null, level: 1, xp: 0, subclass: null }); break;
            case 'c_primal_roar': eUnits.forEach(u => { applyDamage(u, 15); engine['addStatusEffect'](u.id, { type: 'stunned', damagePerTick: 0, duration: 1, sourceUnitId: hero.id }); }); break;

            // CONJURER BATTLEMANCER
            case 'c_conjure_flaming_blade': hero.stats.attack += 10; hero.weapon = { id: 'flaming_blade', name: 'Flaming Blade', school: MagicSchool.Fire, attackBonus: 10, weaponEffect: 'Flaming', tier: 1, description: '' }; break;
            case 'c_arcane_bulwark': pUnits.forEach(u => { const fMod = engine.tempStatModifiers.get(u.id) || {}; fMod.defense = (fMod.defense || 0) + 8; engine.tempStatModifiers.set(u.id, fMod); u.stats.hp += 20; }); break;
            case 'c_summon_runic_defender': engine.addSummon({ id: `runic_def_${Date.now()}`, name: 'Runic Defender', school: MagicSchool.Arcane, tier: 1, stats: { hp: 100, maxHp: 100, attack: 18, defense: 7, speed: 1, mana: 0, maxMana: 0 }, baseStats: { hp: 100, maxHp: 100, attack: 18, defense: 7, speed: 1, mana: 0, maxMana: 0 }, passives: [], position: 8 as any, isHero: false, isSummon: true, spriteColor: 'gold', meshType: 'box', weapon: null, armor: null, level: 1, xp: 0, subclass: null }); break;
            case 'c_forge_strike': applyDamage(target, 32); break;

            default:
                applyDamage(target, 20);
                break;
        }

        // Apply Cascade Perk
        if (useGameStore.getState().perkList.some(p => p.effect === 'spell_summon_synergy')) {
            pUnits.filter(u => u.isSummon).forEach(u => {
                u.stats.mana = Math.min(u.stats.maxMana, u.stats.mana + 3);
            });
        }
    }
}
