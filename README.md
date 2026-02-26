<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# The Last Fantasy: AutoBattler with Cheese

**The Last Fantasy** is an engaging 3D roguelike auto-battler built with modern web technologies. Dive into a tactical fantasy world where you build a party of heroes and summons, cast powerful magic across multiple schools, and engage in epic battles to conquer the procedural dungeon floors!

## 🎮 Current Features

* **Roguelike Node-Based Progression:** Navigate a procedurally generated map featuring various node types including Combat, Elite encounters, immersive Events, Shops, Rest sites, and challenging Floor Bosses.
* **Distinct Player Archetypes:** Choose your playstyle from three powerful archetypes:
  * **The Conjurer:** Master of summons and swarming tactics.
  * **The Warlord:** Focuses on buffing strong frontline heroes.
  * **The Mystic:** Specializes in spellcasting and heavy mana usage.
* **Deep 3D Auto-Battler Combat System:** Built with Babylon.js for dynamic 3D combat rendering. Features grid-based positioning, automatic attacks, passives, and active spell casting.
* **Complex Unit Mechanics:** Manage a roster of unique heroes and summons, each belonging to specific Magic Schools (Fire, Death, Nature, Arcane, Life). Units have robust stats, distinct tiers, and game-changing passives.
* **Inventory & Equipment System:** Equip your heroes with powerful Weapons and Armor, and manage Consumables to survive grueling gauntlets.
* **Meta-Progression & Stats Tracking:** Tracks your runs with extensive statistics (enemies defeated, most used schools) and meta-experience points for future unlocks.

## 📥 How to Install & Run Locally

**Prerequisites:** Node.js (v18 or higher recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Fantasy-AutoBattler-with-Cheese
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   The game utilizes the Gemini API for dynamic generation capabilities.
   Set the `GEMINI_API_KEY` in your `.env.local` file (create it based on the `.env.example` if applicable):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The game will be available at `http://localhost:3000`.

## 🗺️ Development Roadmap

* [ ] **Expanded Bestiary & Magic Schools:** Introduce more units, spells, and synergy effects between different magic schools.
* [ ] **Deeper Meta-progression:** Fully implement persistent database saves using the included `better-sqlite3` and `express` backend layout to carry over unlocks and meta-resources across sessions.
* [ ] **Dynamic AI Integration:** Leverage the `@google/genai` integration to generate completely dynamic narrative encounters and unique boss mechanics during Event nodes.
* [ ] **New Biomes & Floor Hazards:** Add distinct 3D environments and stage hazards that affect combat placement and strategy.
* [ ] **Animations & VFX Polish:** Enhance the Babylon.js 3D rendering with advanced particle systems, attack animations, and dynamic lighting.
* [ ] **Asynchronous Multiplayer (PvP):** Allow players to pit their best run defensive layouts against other players' conquering runs.
