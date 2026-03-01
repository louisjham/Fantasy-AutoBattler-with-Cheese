// src/utils/assetHelper.ts
// Maps game entity IDs to their asset file paths.
import type React from 'react';
// Returns a colored placeholder CSS value if the file hasn't been generated yet.
// Drop any new image into the correct public/assets/ subfolder and it auto-wires.

// ─── SCHOOL FALLBACK COLORS ───────────────────────────────────────────────────
// Used when an image asset is missing — matches each school's theme color
export const SCHOOL_COLORS: Record<string, string> = {
    fire: '#C0392B',
    ice: '#5DADE2',
    lightning: '#F4D03F',
    earth: '#7D6608',
    nature: '#27AE60',
    death: '#6C3483',
    arcane: '#2E86C1',
    life: '#F0B27A',
    void: '#1A1A2E',
}

// ─── ARCHETYPE PORTRAITS (512×512) ───────────────────────────────────────────
// Used on ArchetypeSelect main cards
export function getArchetypePortrait(archetypeId: string): string {
    return `/assets/portraits/portrait_${archetypeId}.png`
}

// ─── SUBCLASS PORTRAITS (256×256) ────────────────────────────────────────────
// Used on subclass selection hover cards
export function getSubclassPortrait(archetypeId: string, subclassId: string): string {
    return `/assets/portraits/portrait_${archetypeId}_${subclassId}.png`
}

// ─── COMPANION IMAGES (256×256) ──────────────────────────────────────────────
// Used on unit cards and subclass preview panels
export function getCompanionImage(subclassId: string): string {
    return `/assets/companions/companion_${subclassId}.png`
}

// ─── UNIT ICONS (64×64) ──────────────────────────────────────────────────────
// Used on battle screen unit cards
export function getUnitIcon(unitId: string): string {
    return `/assets/icons/units/unit_${unitId}.png`
}

// ─── PERK ICONS (32×32) ──────────────────────────────────────────────────────
// Used on perk selection cards
export function getPerkIcon(perkId: string): string {
    return `/assets/icons/perks/icon_perk_${perkId}.png`
}

// ─── SPELL ICONS (24×24) ─────────────────────────────────────────────────────
// Used on spell cards in battle and selection screens
export function getSpellIcon(spellId: string): string {
    return `/assets/icons/spells/icon_spell_${spellId}.png`
}

// ─── BACKGROUNDS (16:9) ──────────────────────────────────────────────────────
export const BACKGROUNDS = {
    archetypeSelect: '/assets/backgrounds/bg_archetypeselect.png',
    battleArena: '/assets/backgrounds/bg_battle_arena.png',
    nodeMap: '/assets/backgrounds/bg_nodemap.png',
    bossRoom: '/assets/backgrounds/bg_boss_room.png',
    treasureRoom: '/assets/backgrounds/bg_treasure_room.png',
} as const

export type BackgroundKey = keyof typeof BACKGROUNDS

export function getBackground(key: BackgroundKey): string {
    return BACKGROUNDS[key]
}

// ─── REACT IMG FALLBACK HANDLER ──────────────────────────────────────────────
// Use this as the onError handler on every <img> tag.
// If the file doesn't exist yet, replaces with a school-colored CSS gradient
// so the UI never shows a broken image icon.
//
// Usage:
//   <img
//     src={getUnitIcon(unit.id)}
//     onError={makeImgFallback(unit.school, unit.name)}
//     alt={unit.name}
//   />
//
export function makeImgFallback(school: string, label?: string) {
    return (e: React.SyntheticEvent<HTMLImageElement>) => {
        const target = e.currentTarget
        const color = SCHOOL_COLORS[school.toLowerCase()] ?? '#333'
        // Hide the broken img and replace with a colored div via data attribute
        target.style.display = 'none'
        const parent = target.parentElement
        if (parent && !parent.querySelector('.asset-placeholder')) {
            const placeholder = document.createElement('div')
            placeholder.className = 'asset-placeholder'
            placeholder.style.cssText = `
        width: 100%;
        height: 100%;
        background: ${color};
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: rgba(255,255,255,0.6);
        font-family: monospace;
      `
            placeholder.textContent = label?.slice(0, 6) ?? '?'
            parent.appendChild(placeholder)
        }
    }
}

// ─── ASSET EXISTS CHECK (optional, for preloading) ───────────────────────────
// Call this in useEffect to preload high-priority assets
export async function assetExists(path: string): Promise<boolean> {
    try {
        const res = await fetch(path, { method: 'HEAD' })
        return res.ok
    } catch {
        return false
    }
}

// ─── FULL ASSET MANIFEST ─────────────────────────────────────────────────────
// Useful for a loading screen progress bar — preload all known assets
export const ASSET_MANIFEST = {
    portraits: [
        'portrait_warlord',
        'portrait_conjurer',
        'portrait_mystic',
        'portrait_warlord_vanilla_warlord',
        'portrait_warlord_sorcerer_king',
        'portrait_warlord_ogre_magi',
        'portrait_warlord_deathlord',
        'portrait_conjurer_elemental_master',
        'portrait_conjurer_beast_conjurer',
        'portrait_conjurer_battlemancer',
        'portrait_mystic_arcanist',
        'portrait_mystic_seer',
        'portrait_mystic_runelord',
    ],
    companions: [
        'companion_vanilla_warlord',
        'companion_sorcerer_king',
        'companion_ogre_magi',
        'companion_deathlord',
        'companion_elemental_master_fire',
        'companion_elemental_master_ice',
        'companion_elemental_master_lightning',
        'companion_elemental_master_earth',
        'companion_beast_conjurer',
        'companion_battlemancer',
        'companion_arcanist',
        'companion_seer',
        'companion_runelord',
    ],
    backgrounds: Object.values(BACKGROUNDS),
}