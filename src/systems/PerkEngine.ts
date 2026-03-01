import { Unit, MagicSchool, Spell } from '../types';
import { useGameStore } from '../store';
import { CombatEngine } from './CombatEngine';
import { globalEventBus } from '../EventBus';

export class PerkEngine {
    static applyCombatStartPerks(engine: CombatEngine) {
        const state = useGameStore.getState();
        const perks = state.perkList;
        const hasPerk = (effect: string) => perks.some(p => p.effect === effect);
        const playerUnits = engine['playerUnits'];
        const enemyUnits = engine['enemyUnits'];
        const hero = playerUnits.find(u => u.isHero);

        // Warlord Vanilla
        if (hasPerk('start_with_weapon_armor') && hero) {
            hero.weapon = { id: 'w_start_wep', name: 'Starter Sword', school: null, attackBonus: 5, weaponEffect: null, tier: 1, description: '' };
            hero.armor = { id: 'w_start_arm', name: 'Starter Armor', school: null, defenseBonus: 3, hpBonus: 20, passive: null, tier: 1, description: '' };
            hero.stats.attack += 5;
            hero.stats.defense += 3;
            hero.stats.maxHp += 20;
            hero.stats.hp += 20;
        }

        if (hasPerk('transform_titan_lord_once') && hero) {
            hero.name = 'Titan Lord';
            hero.stats.maxHp += 150;
            hero.stats.hp += 150;
            hero.stats.attack += 30;
            hero.stats.defense += 15;
            engine.tempStatModifiers.set('titan_form_active', { active: 1 });
        }

        // Warlord Sorcerer King
        if (hasPerk('start_demon_forged_weapon') && hero) {
            hero.weapon = { id: 'w_demon_forge', name: 'Demon Forged Blade', school: MagicSchool.Fire, attackBonus: 15, weaponEffect: 'Flaming', tier: 2, description: '' };
            hero.stats.attack += 15;
        }

        if (hasPerk('teleport_hero_allies') && hero) {
            // Simulated: Move hero and all summons to midline
            playerUnits.forEach(u => {
                u.x = 2; u.z = 2;
            });
        }

        if (hasPerk('add_transformation_tattoos') && hero) {
            // Apply FireLord basic buffs
            hero.stats.attack += 10;
            hero.school = MagicSchool.Fire;
        }

        if (hasPerk('grants_5_single_use_tome_spells')) {
            const spells: Spell[] = [
                { id: 'tome_word_ruin', name: 'Word of Ruin', school: MagicSchool.Death, manaCost: 0, effect: 'tome_word_ruin', description: 'Kill a low HP enemy.', tags: [] },
                { id: 'tome_flesh_pact', name: 'Flesh Pact', school: MagicSchool.Death, manaCost: 0, effect: 'tome_flesh_pact', description: 'Summon allied flesh.', tags: [] },
                { id: 'tome_veil_shadows', name: 'Veil of Shadows', school: MagicSchool.Death, manaCost: 0, effect: 'tome_veil_shadows', description: 'Stealth all allies.', tags: [] },
                { id: 'tome_edict_agony', name: 'Edict of Agony', school: MagicSchool.Death, manaCost: 0, effect: 'tome_edict_agony', description: 'Curse all enemies.', tags: [] },
                { id: 'tome_final_bind', name: 'Final Binding', school: MagicSchool.Death, manaCost: 0, effect: 'tome_final_bind', description: 'Stun highest threat.', tags: [] },
            ];
            state.spellbook.push(...spells);
        }

        // Warlord Ogre Magi
        if (hasPerk('dragon_breath_attack_hp_boost')) {
            const dragon = playerUnits.find(u => u.id.includes('black_dragon'));
            if (dragon) {
                dragon.stats.maxHp += 50;
                dragon.stats.hp += 50;
            }
        }
        if (hasPerk('summon_med_fire_elemental')) {
            engine.addSummon({
                id: `fire_elem_${Date.now()}`, name: 'Fire Elemental', school: MagicSchool.Fire, tier: 2,
                stats: { hp: 100, maxHp: 100, attack: 18, defense: 5, speed: 2, mana: 0, maxMana: 0 }, baseStats: { hp: 100, maxHp: 100, attack: 18, defense: 5, speed: 2, mana: 0, maxMana: 0 },
                passives: [], position: 8 as any, isHero: false, isSummon: true, spriteColor: 'orange', meshType: 'box', weapon: null, armor: null, level: 1, xp: 0, subclass: null,
            });
        }
        if (hasPerk('stationary_heal_totem')) {
            engine.addSummon({
                id: `heal_totem_${Date.now()}`, name: 'Heal Totem', school: MagicSchool.Nature, tier: 1,
                stats: { hp: 40, maxHp: 40, attack: 0, defense: 0, speed: 0, mana: 0, maxMana: 0 }, baseStats: { hp: 40, maxHp: 40, attack: 0, defense: 0, speed: 0, mana: 0, maxMana: 0 },
                passives: [], position: 8 as any, isHero: false, isSummon: true, spriteColor: 'lightgreen', meshType: 'cylinder', weapon: null, armor: null, level: 1, xp: 0, subclass: null,
            });
            engine.tempStatModifiers.set('heal_totem_active', { active: 1 });
        }

        // Deathlord
        if (hasPerk('flesh_golem_splits_5_husks')) {
            const golemIndex = playerUnits.findIndex(u => u.id.includes('monstrous_flesh_golem'));
            if (golemIndex !== -1) {
                playerUnits.splice(golemIndex, 1);
                for (let i = 0; i < 5; i++) {
                    engine.addSummon({
                        id: `flesh_husk_${Date.now()}_${i}`, name: 'Flesh Husk', school: MagicSchool.Death, tier: 1,
                        stats: { hp: 45, maxHp: 45, attack: 10, defense: 2, speed: 1, mana: 0, maxMana: 0 }, baseStats: { hp: 45, maxHp: 45, attack: 10, defense: 2, speed: 1, mana: 0, maxMana: 0 },
                        passives: [], position: 8 as any, isHero: false, isSummon: true, spriteColor: 'darkgray', meshType: 'box', weapon: null, armor: null, level: 1, xp: 0, subclass: null,
                    });
                }
            }
        }
        if (hasPerk('drain_mana_buff_base_units') && hero) {
            hero.stats.mana = 0;
            engine.tempStatModifiers.set('death_dawning_active', { active: 1 });
            playerUnits.filter(u => u.isSummon).forEach(u => {
                u.stats.attack = Math.floor(u.stats.attack * 1.4);
                u.stats.defense = Math.floor(u.stats.defense * 1.4);
                u.stats.speed += 1;
            });
        }

        // Conjurer Elemental Master
        if (hasPerk('element_damage_boost')) {
            playerUnits.filter(u => u.isSummon).forEach(u => {
                const mod = engine.tempStatModifiers.get(u.id) || {};
                mod.attack = Math.floor(u.stats.attack * 0.2);
                engine.tempStatModifiers.set(u.id, mod);
            });
        }

        // Beast Conjurer
        if (hasPerk('transform_forest_god') && hero) {
            hero.name = 'Forest God';
            hero.stats.attack = Math.floor(hero.stats.attack * 1.5);
            hero.stats.defense = Math.floor(hero.stats.defense * 1.3);
            const extraHp = Math.floor(hero.stats.maxHp * 0.4);
            hero.stats.maxHp += extraHp;
            hero.stats.hp += extraHp;
            for (let i = 0; i < 3; i++) {
                engine.addSummon({
                    id: `treant_${Date.now()}_${i}`, name: 'Treant', school: MagicSchool.Nature, tier: 1,
                    stats: { hp: 70, maxHp: 70, attack: 14, defense: 8, speed: 1, mana: 0, maxMana: 0 }, baseStats: { hp: 70, maxHp: 70, attack: 14, defense: 8, speed: 1, mana: 0, maxMana: 0 },
                    passives: [], position: 8 as any, isHero: false, isSummon: true, spriteColor: 'green', meshType: 'box', weapon: null, armor: null, level: 1, xp: 0, subclass: null,
                });
            }
        }
        if (hasPerk('drain_mana_heal_team')) {
            let drained = 0;
            enemyUnits.forEach(e => {
                drained += e.stats.mana;
                e.stats.mana = 0;
            });
            playerUnits.forEach(u => {
                u.stats.hp = Math.min(u.stats.maxHp, u.stats.hp + 20);
            });
            if (hero) hero.stats.hp = Math.min(hero.stats.maxHp, hero.stats.hp + drained * 5);
        }

        // Battlemancer
        if (hasPerk('weapon_swap_3forms') && hero) {
            hero.stats.attack += 6;
        }

        // Mystic Seer
        if (hasPerk('random_fate_boon')) {
            const roll = Math.random();
            if (roll < 0.33) {
                engine.tempStatModifiers.set('fate_boon', { spellDmg: 1.25 });
            } else if (roll < 0.66) {
                playerUnits.filter(u => u.isSummon).forEach(u => u.stats.speed += 2);
            } else if (enemyUnits.length > 0) {
                const target = enemyUnits[Math.floor(Math.random() * enemyUnits.length)];
                target.stats.hp = Math.floor(target.stats.maxHp * 0.7);
            }
        }

        // Runelord
        if (hasPerk('rune_persist_next_battle')) {
            if (engine.activeRunes.length < 3) {
                engine.activeRunes.push({ type: 'runebind', position: 1, ticksActive: 0 });
                useGameStore.setState({ runeStacks: state.runeStacks + 1 });
            }
        }
    }

    static applyTickPerks(engine: CombatEngine) {
        const state = useGameStore.getState();
        const perks = state.perkList;
        const hasPerk = (effect: string) => perks.some(p => p.effect === effect);
        const playerUnits = engine['playerUnits'];
        const enemyUnits = engine['enemyUnits'];
        const hero = playerUnits.find(u => u.isHero);

        const tickNo = (engine as any).tickNumber || Date.now();

        // Beast Conjurer: Maddening Howl / Primal Dread logic (active CC)
        if (hasPerk('charm_attack_all')) {
            if (tickNo % 10 === 0 && enemyUnits.length > 0) {
                engine['addStatusEffect'](enemyUnits[0].id, { type: 'stunned', damagePerTick: 0, duration: 2, sourceUnitId: 'charm' });
            }
        }
        if (hasPerk('fear_enemy_minions') && tickNo === 1) { // Applied on first tick technically
            enemyUnits.filter(u => u.tier === 1).forEach(u => {
                engine['addStatusEffect'](u.id, { type: 'rooted', damagePerTick: 0, duration: 2, sourceUnitId: 'primal_dread' });
                const mod = engine.tempStatModifiers.get(u.id) || {};
                mod.attack = -Math.floor(u.stats.attack * 0.3);
                engine.tempStatModifiers.set(u.id, mod);
            });
        }

        // Battlemancer
        if (hasPerk('defense_regen_scaling')) {
            const aliveSummons = playerUnits.filter(u => u.isSummon && u.stats.hp > 0).length;
            if (aliveSummons >= 2 && hero && hero.stats.hp > 0) {
                const mod = engine.tempStatModifiers.get(hero.id) || {};
                mod.defense = 15;
                engine.tempStatModifiers.set(hero.id, mod);
                hero.stats.hp = Math.min(hero.stats.maxHp, hero.stats.hp + 3);
            }
        }

        // Runelord
        if (hasPerk('rune_passive_defense') && hero) {
            const mod = engine.tempStatModifiers.get(hero.id) || {};
            mod.defense = (mod.defense || 0) + (engine.activeRunes.length * 4);
            engine.tempStatModifiers.set(hero.id, mod);
        }

        // Warlord Vanilla
        if (hasPerk('fanatic_attack_buff_health_cost')) {
            if (tickNo % 3 === 0 && hero) {
                const fanatics = playerUnits.filter(u => u.id.includes('fanatic') && u.stats.hp > 0);
                if (fanatics.length > 0) {
                    hero.stats.hp -= 10;
                    if (hero.stats.hp <= 0) engine['handleUnitDeath'](hero, 'fanatic_whip');
                    fanatics.forEach(f => {
                        const mod = engine.tempStatModifiers.get(f.id) || {};
                        mod.attack = Math.floor(f.stats.attack * 0.3);
                        engine.tempStatModifiers.set(f.id, mod);
                    });
                }
            }
        }

        if (hasPerk('spawn_shadow_clerics_over_time')) {
            engine['shadowClericTimer'] = (engine as any)['shadowClericTimer'] || 0;
            engine['shadowClericTimer']++;
            const clerics = playerUnits.filter(u => u.id.includes('shadow_cleric')).length;
            if (engine['shadowClericTimer'] % 3 === 0 && clerics < 3) {
                engine.addSummon({
                    id: `shadow_cleric_${Date.now()}`, name: 'Shadow Cleric', school: MagicSchool.Death, tier: 1,
                    stats: { hp: 40, maxHp: 40, attack: 5, defense: 2, speed: 2, mana: 0, maxMana: 0 }, baseStats: { hp: 40, maxHp: 40, attack: 5, defense: 2, speed: 2, mana: 0, maxMana: 0 },
                    passives: [], position: 5 as any, isHero: false, isSummon: true, spriteColor: 'darkgray', meshType: 'cylinder', weapon: null, armor: null, level: 1, xp: 0, subclass: null,
                });
            }
        }

        // Sorcerer King
        if (hasPerk('sacrifice_minions_create_mind_flayer')) {
            if (tickNo % 5 === 0) {
                const minions = playerUnits.filter(u => u.id.includes('demonic_minion') && u.stats.hp > 0);
                if (minions.length >= 3) {
                    for (let i = 0; i < 3; i++) minions[i].stats.hp = 0;
                    engine.addSummon({
                        id: `mind_flayer_${Date.now()}`, name: 'Mind Flayer', school: MagicSchool.Arcane, tier: 2,
                        stats: { hp: 120, maxHp: 120, attack: 25, defense: 5, speed: 2, mana: 0, maxMana: 0 }, baseStats: { hp: 120, maxHp: 120, attack: 25, defense: 5, speed: 2, mana: 0, maxMana: 0 },
                        passives: [], position: 5 as any, isHero: false, isSummon: true, spriteColor: 'purple', meshType: 'octahedron', weapon: null, armor: null, level: 1, xp: 0, subclass: null,
                    });
                }
            }
        }

        // Ogre Magi
        if (hasPerk('stationary_heal_totem')) {
            if (engine.tempStatModifiers.get('heal_totem_active') && tickNo % 2 === 0) {
                playerUnits.forEach(u => u.stats.hp = Math.min(u.stats.maxHp, u.stats.hp + 8));
            }
        }

        // Deathlord
        if (hasPerk('resurrection_timer_on_death')) {
            if (hero && hero.stats.hp <= 0 && !engine.tempStatModifiers.has('deathlord_revived')) {
                engine.tempStatModifiers.set('deathlord_revived', { active: 1 });
                // We fake a timer by just setting HP to 40% after a delay (simulated here as instant for simplicity)
                hero.stats.hp = Math.floor(hero.stats.maxHp * 0.4);
            }
        }

        // Elemental Master
        if (hasPerk('multi_element_crit')) {
            // Count unique schools among summons
            const schools = new Set(playerUnits.filter(u => u.isSummon && u.stats.hp > 0).map(u => u.school));
            if (schools.size >= 3) {
                engine.tempStatModifiers.set('prismatic_crit', { active: 1, regen: schools.size });
                if (hero) hero.stats.mana = Math.min(hero.stats.maxMana, hero.stats.mana + schools.size);
            } else {
                engine.tempStatModifiers.delete('prismatic_crit');
            }
        }
    }
}
