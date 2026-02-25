export interface EventChoice {
    text: string;
    effect: string;
    value: number;
    preview: string;
}

export interface GameEvent {
    id: string;
    title: string;
    description: string;
    choices: EventChoice[];
}

export const GAME_EVENTS: GameEvent[] = [
    {
        id: 'dying_mage',
        title: "A Dying Mage",
        description: "A wounded mage offers forbidden knowledge in exchange for your help. His eyes glow with arcane fire.",
        choices: [
            { text: 'Accept', effect: 'add_spell_random_death', value: 1, preview: 'Gain a random Death spell, lose 20 max HP' },
            { text: 'Refuse', effect: 'add_gold', value: 30, preview: 'Gain 30 gold' }
        ]
    },
    {
        id: 'fire_elemental',
        title: "Wounded Elemental",
        description: "A Fire elemental lies injured by the roadside, its flames guttering low.",
        choices: [
            { text: 'Help', effect: 'add_fire_ally_temp', value: 1, preview: 'Fire elemental joins for next battle only' },
            { text: 'Absorb', effect: 'fire_damage_bonus_permanent', value: 15, preview: 'All Fire units gain +15% damage permanently' }
        ]
    },
    {
        id: 'void_journal',
        title: "The Sovereign's Journal",
        description: "You find a journal bearing the Void Sovereign's seal. Its pages writhe with dark energy.",
        choices: [
            { text: 'Read', effect: 'reveal_boss_abilities', value: 1, preview: 'Preview next boss abilities before the fight' },
            { text: 'Burn', effect: 'all_attack_bonus', value: 10, preview: 'All allies gain +10 attack from righteous fury' }
        ]
    },
    {
        id: 'crossroads_merchant',
        title: "Crossroads Merchant",
        description: "A cloaked figure offers a trade. Their wares seem too good to be true.",
        choices: [
            { text: 'Trade weapon', effect: 'upgrade_weapon_tier', value: 1, preview: 'Upgrade one hero weapon by 1 tier (lose old weapon)' },
            { text: 'Trade gold', effect: 'add_random_perk', value: 1, preview: 'Spend 60 gold for a random perk' },
            { text: 'Walk away', effect: 'nothing', value: 0, preview: 'Nothing happens' }
        ]
    },
    {
        id: 'ancient_shrine',
        title: "Ancient Shrine",
        description: "A shrine to one of the Five Schools still pulses with faint magical energy.",
        choices: [
            { text: 'Pray Fire', effect: 'school_bonus_fire', value: 20, preview: 'All Fire units +20% stats for this run' },
            { text: 'Pray Death', effect: 'school_bonus_death', value: 20, preview: 'All Death units +20% stats for this run' },
            { text: 'Pray Nature', effect: 'school_bonus_nature', value: 20, preview: 'All Nature units +20% stats for this run' },
            { text: 'Pray Arcane', effect: 'school_bonus_arcane', value: 20, preview: 'All Arcane units +20% stats for this run' },
            { text: 'Pray Life', effect: 'school_bonus_life', value: 20, preview: 'All Life units +20% stats for this run' }
        ]
    },
    {
        id: 'wounded_hero',
        title: "Fallen Comrade",
        description: "One of your heroes lies wounded, unable to continue without aid.",
        choices: [
            { text: 'Heal', effect: 'heal_hero_full', value: 1, preview: 'Spend 50 gold to fully heal your weakest hero' },
            { text: 'Leave', effect: 'nothing', value: 0, preview: 'Hero enters next battle at current HP' }
        ]
    },
    {
        id: 'cursed_chest',
        title: "Cursed Chest",
        description: "A chest radiates dark energy. Opening it may be profitable — or catastrophic.",
        choices: [
            { text: 'Open', effect: 'cursed_chest_gamble', value: 1, preview: '50% chance: gain tier 2 weapon. 50%: lose 30 HP all' },
            { text: 'Leave', effect: 'nothing', value: 0, preview: 'Nothing happens' }
        ]
    },
    {
        id: 'arcane_anomaly',
        title: "Arcane Anomaly",
        description: "A rift in reality offers you a glimpse of power beyond your current understanding.",
        choices: [
            { text: 'Enter', effect: 'add_random_spell', value: 1, preview: 'Gain a random spell from any school' },
            { text: 'Study', effect: 'add_gold', value: 50, preview: 'Gain 50 gold from studying the anomaly safely' }
        ]
    },
    {
        id: 'nature_spirit',
        title: "Nature Spirit",
        description: "A forest spirit offers to strengthen your bonds with the natural world.",
        choices: [
            { text: 'Accept bond', effect: 'upgrade_summon_free', value: 1, preview: 'Upgrade one summon tier for free' },
            { text: 'Decline', effect: 'heal_all_allies', value: 25, preview: 'All allies heal 25 HP' }
        ]
    },
    {
        id: 'death_collector',
        title: "The Collector",
        description: "A robed figure offers coin for the souls of your fallen enemies.",
        choices: [
            { text: 'Deal', effect: 'add_gold_per_kill', value: 3, preview: 'Gain 3 gold per enemy killed this run' },
            { text: 'Refuse', effect: 'ally_attack_bonus', value: 8, preview: 'All allies gain +8 attack' }
        ]
    },
    {
        id: 'time_crack',
        title: "Crack in Time",
        description: "A fissure in time allows you to briefly revisit a previous moment.",
        choices: [
            { text: 'Revisit', effect: 'reroll_node_map', value: 1, preview: 'Regenerate the current floor map (keep progress)' },
            { text: 'Ignore', effect: 'add_random_perk', value: 1, preview: 'Gain a random perk' }
        ]
    },
    {
        id: 'life_fountain',
        title: "Life Fountain",
        description: "A fountain of pure Life magic bubbles up from the cracked earth.",
        choices: [
            { text: 'Drink', effect: 'heal_all_full', value: 1, preview: 'All allies fully restored to max HP' },
            { text: 'Empower', effect: 'max_hp_bonus_all', value: 20, preview: 'All allies gain +20 max HP permanently' }
        ]
    },
    {
        id: 'shadow_broker',
        title: "Shadow Broker",
        description: "An informant offers intelligence on the enemy forces ahead — for a price.",
        choices: [
            { text: 'Buy info', effect: 'reveal_next_combat', value: 1, preview: 'Spend 40 gold to see next combat enemies' },
            { text: 'Rob them', effect: 'add_gold_risky', value: 1, preview: '50% gain 80 gold, 50% lose 40 HP all units' }
        ]
    },
    {
        id: 'forge_master',
        title: "Wandering Forge Master",
        description: "A dwarven smith sets up a portable forge, offering to enhance your equipment.",
        choices: [
            { text: 'Enhance weapon', effect: 'weapon_attack_bonus', value: 8, preview: 'Spend 45 gold: one hero weapon +8 attack' },
            { text: 'Enhance armor', effect: 'armor_defense_bonus', value: 6, preview: 'Spend 45 gold: one hero armor +6 defense' },
            { text: 'Pass', effect: 'nothing', value: 0, preview: 'Nothing happens' }
        ]
    },
    {
        id: 'void_whisper',
        title: "Voice from the Void",
        description: "The Void Sovereign speaks directly to your mind, offering a dark bargain.",
        choices: [
            { text: 'Accept', effect: 'void_bargain', value: 1, preview: 'Gain 2 random perks, but one hero loses 40 max HP' },
            { text: 'Resist', effect: 'xp_bonus_all', value: 30, preview: 'All heroes gain 30 XP from resisting temptation' }
        ]
    }
];
