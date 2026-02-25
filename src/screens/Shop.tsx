import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store';
import { WEAPONS, ARMORS } from '../data/equipment';
import { Weapon, Armor, Consumable, MagicSchool } from '../types';
import { SCHOOL_COLORS } from '../constants';

interface ShopProps {
    onContinue: () => void;
}

const CONSUMABLES: Consumable[] = [
    { id: 'health_potion', name: 'Health Potion', effect: 'heal_all_40', value: 40, useTiming: 'anytime', description: 'Heal all allies 40 HP' },
    { id: 'mana_crystal', name: 'Mana Crystal', effect: 'gain_mana_30', value: 30, useTiming: 'anytime', description: 'Gain 30 mana in next battle' },
    { id: 'summon_scroll', name: 'Summon Scroll', effect: 'add_summon', value: 1, useTiming: 'anytime', description: 'Add random summon to roster' },
    { id: 'perk_reroll', name: 'Perk Reroll', effect: 'reroll_perk', value: 1, useTiming: 'anytime', description: 'Reroll your next perk choice' }
];

export default function Shop({ onContinue }: ShopProps) {
    const { gold, floor, summonRoster, addToInventory, upgradeSummon, useGold } = useGameStore(state => ({
        gold: state.gold,
        floor: state.floor,
        summonRoster: state.summonRoster,
        addToInventory: state.addToInventory,
        upgradeSummon: state.upgradeSummon,
        useGold: (amount: number) => useGameStore.setState(s => ({ gold: s.gold - amount }))
    }));

    const [weapons, setWeapons] = useState<Weapon[]>([]);
    const [armors, setArmors] = useState<Armor[]>([]);
    const [consumables, setConsumables] = useState<(Consumable & { price: number })[]>([]);

    useEffect(() => {
        // Generate shop inventory based on floor
        const allowedTiers = floor <= 2 ? [1] : floor === 3 ? [1, 2] : [2, 3];

        const availableWeapons = WEAPONS.filter(w => allowedTiers.includes(w.tier));
        const rollWeapons = [...availableWeapons].sort(() => 0.5 - Math.random()).slice(0, 3);
        setWeapons(rollWeapons);

        const availableArmors = ARMORS.filter(a => allowedTiers.includes(a.tier));
        const rollArmors = [...availableArmors].sort(() => 0.5 - Math.random()).slice(0, 2);
        setArmors(rollArmors);

        const prices = { health_potion: 30, mana_crystal: 25, summon_scroll: 40, perk_reroll: 35 };
        const rollConsumables = [...CONSUMABLES].sort(() => 0.5 - Math.random()).slice(0, 2).map(c => ({
            ...c,
            price: prices[c.id as keyof typeof prices] || 30
        }));
        setConsumables(rollConsumables);
    }, [floor]);

    const getWeaponPrice = (tier: number) => tier === 1 ? 50 : tier === 2 ? 120 : 250;
    const getArmorPrice = (tier: number) => tier === 1 ? 40 : tier === 2 ? 100 : 200;
    const getUpgradePrice = (tier: number) => tier === 1 ? 40 : tier === 2 ? 80 : tier === 3 ? 150 : 999;

    const buyWeapon = (w: Weapon) => {
        const price = getWeaponPrice(w.tier);
        if (gold >= price) {
            useGold(price);
            addToInventory({ type: 'weapon', item: w, quantity: 1 });
            setWeapons(weapons.filter(x => x.id !== w.id));
        }
    };

    const buyArmor = (a: Armor) => {
        const price = getArmorPrice(a.tier);
        if (gold >= price) {
            useGold(price);
            addToInventory({ type: 'armor', item: a, quantity: 1 });
            setArmors(armors.filter(x => x.id !== a.id));
        }
    };

    const buyConsumable = (c: Consumable & { price: number }) => {
        if (gold >= c.price) {
            useGold(c.price);
            addToInventory({ type: 'consumable', item: c, quantity: 1 });
            setConsumables(consumables.filter(x => x.id !== c.id));
        }
    };

    const handleUpgradeSummon = (summonId: string, currentTier: number) => {
        const price = getUpgradePrice(currentTier);
        if (gold >= price && currentTier < 4) {
            useGold(price);
            upgradeSummon(summonId);
        }
    };

    return (
        <div className="w-full h-full flex flex-col p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
                <h2 className="text-3xl font-bold text-yellow-500" style={{ fontFamily: "'Press Start 2P', monospace", textShadow: '2px 2px 0 #000' }}>MERCHANT</h2>
                <div className="text-xl text-yellow-400 font-bold" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                    GOLD: {gold}
                </div>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-6 overflow-y-auto pr-2">

                {/* WEAPONS */}
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-4">
                    <h3 className="text-zinc-400 font-bold mb-4 border-b border-zinc-800 pb-2">WEAPONS</h3>
                    {weapons.map(w => (
                        <div key={w.id} className="bg-zinc-950 p-3 rounded flex justify-between items-center border border-zinc-800">
                            <div>
                                <div className="font-bold flex items-center gap-2" style={{ color: w.school ? SCHOOL_COLORS[w.school] : '#fff' }}>
                                    {w.name} <span className="text-xs text-zinc-500">T{w.tier}</span>
                                </div>
                                <div className="text-xs text-zinc-400 mt-1">{w.description}</div>
                            </div>
                            <button
                                disabled={gold < getWeaponPrice(w.tier)}
                                onClick={() => buyWeapon(w)}
                                className={`ml-4 px-3 py-1 rounded font-bold text-sm min-w-[60px] ${gold >= getWeaponPrice(w.tier) ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-600'}`}
                            >
                                {getWeaponPrice(w.tier)}g
                            </button>
                        </div>
                    ))}
                    {weapons.length === 0 && <div className="text-zinc-600 italic">Sold out!</div>}
                </div>

                {/* ARMOR & CONSUMABLES */}
                <div className="space-y-6">
                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-4">
                        <h3 className="text-zinc-400 font-bold mb-4 border-b border-zinc-800 pb-2">ARMOR</h3>
                        {armors.map(a => (
                            <div key={a.id} className="bg-zinc-950 p-3 rounded flex justify-between items-center border border-zinc-800">
                                <div>
                                    <div className="font-bold flex items-center gap-2" style={{ color: a.school ? SCHOOL_COLORS[a.school] : '#fff' }}>
                                        {a.name} <span className="text-xs text-zinc-500">T{a.tier}</span>
                                    </div>
                                    <div className="text-xs text-zinc-400 mt-1">{a.description}</div>
                                </div>
                                <button
                                    disabled={gold < getArmorPrice(a.tier)}
                                    onClick={() => buyArmor(a)}
                                    className={`ml-4 px-3 py-1 rounded font-bold text-sm min-w-[60px] ${gold >= getArmorPrice(a.tier) ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-600'}`}
                                >
                                    {getArmorPrice(a.tier)}g
                                </button>
                            </div>
                        ))}
                        {armors.length === 0 && <div className="text-zinc-600 italic">Sold out!</div>}
                    </div>

                    <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-4">
                        <h3 className="text-zinc-400 font-bold mb-4 border-b border-zinc-800 pb-2">CONSUMABLES</h3>
                        {consumables.map(c => (
                            <div key={c.id} className="bg-zinc-950 p-3 rounded flex justify-between items-center border border-zinc-800">
                                <div>
                                    <div className="font-bold text-indigo-300">{c.name}</div>
                                    <div className="text-xs text-zinc-400 mt-1">{c.description}</div>
                                </div>
                                <button
                                    disabled={gold < c.price}
                                    onClick={() => buyConsumable(c)}
                                    className={`ml-4 px-3 py-1 rounded font-bold text-sm min-w-[60px] ${gold >= c.price ? 'bg-yellow-600 hover:bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-600'}`}
                                >
                                    {c.price}g
                                </button>
                            </div>
                        ))}
                        {consumables.length === 0 && <div className="text-zinc-600 italic">Sold out!</div>}
                    </div>
                </div>

                {/* SUMMON UPGRADES */}
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-4">
                    <h3 className="text-zinc-400 font-bold mb-4 border-b border-zinc-800 pb-2">SUMMON UPGRADES</h3>
                    {summonRoster.map(s => (
                        <div key={s.id} className="bg-zinc-950 p-3 rounded flex justify-between items-center border border-zinc-800">
                            <div>
                                <div className="font-bold flex items-center gap-2" style={{ color: SCHOOL_COLORS[s.school] }}>
                                    {s.name} <span className="text-xs text-zinc-500">T{s.tier}</span>
                                </div>
                                <div className="text-xs text-zinc-400 mt-1 font-mono">
                                    HP: {s.stats.maxHp} | ATK: {s.stats.attack}
                                </div>
                            </div>
                            {s.tier < 4 ? (
                                <button
                                    disabled={gold < getUpgradePrice(s.tier)}
                                    onClick={() => handleUpgradeSummon(s.id, s.tier)}
                                    className={`ml-4 px-3 py-1 rounded font-bold text-sm min-w-[60px] ${gold >= getUpgradePrice(s.tier) ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-zinc-800 text-zinc-600'}`}
                                >
                                    {getUpgradePrice(s.tier)}g
                                </button>
                            ) : (
                                <div className="ml-4 px-3 py-1 text-xs text-yellow-500 font-bold">MAX</div>
                            )}
                        </div>
                    ))}
                    {summonRoster.length === 0 && <div className="text-zinc-600 italic">No summons available.</div>}
                </div>

            </div>

            <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                    onClick={onContinue}
                    className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded font-bold text-lg"
                    style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                    LEAVE SHOP
                </button>
            </div>
        </div>
    );
}
