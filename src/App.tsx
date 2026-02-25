/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGameStore } from './store';
import { PlayerArchetype } from './types';
import Battle from './components/Battle/Battle';
import ArchetypeSelect from './screens/ArchetypeSelect';
import NodeMap from './screens/NodeMap';
import EventScreen from './screens/EventScreen';
import PreBattleConjure from './screens/PreBattleConjure';
import TitleScreen from './screens/TitleScreen';

type Screen =
  | 'MainMenu'
  | 'ArchetypeSelect'
  | 'NodeMap'
  | 'PreBattleConjure'
  | 'Battle'
  | 'PostBattle'
  | 'Shop'
  | 'Event'
  | 'GameOver'
  | 'Victory';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('MainMenu');
  const { archetype, endRun } = useGameStore();

  const handleStartRun = () => setCurrentScreen('ArchetypeSelect');

  const handleSelectArchetype = () => {
    setCurrentScreen('NodeMap');
  };

  const handleNodeSelect = (type: string) => {
    if (type === 'shop') setCurrentScreen('Shop');
    else if (type === 'event') setCurrentScreen('Event');
    else setCurrentScreen('PreBattleConjure');
  };

  const handleStartBattle = () => setCurrentScreen('Battle');
  const handleBattleWin = () => setCurrentScreen('PostBattle');
  const handleBattleLose = () => setCurrentScreen('GameOver');
  const handleBossWin = () => setCurrentScreen('Victory');

  const handleContinue = () => setCurrentScreen('NodeMap');
  const handleRestart = () => {
    endRun();
    setCurrentScreen('MainMenu');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col relative">

        {/* Header */}
        <header className="bg-zinc-950 border-b border-zinc-800 p-4 flex justify-between items-center text-sm text-zinc-400">
          <div>The Last Fantasy</div>
          <div className="flex gap-4">
            {archetype && <span>Archetype: <span className="text-indigo-400">{archetype}</span></span>}
            <span>Screen: <span className="text-emerald-400">{currentScreen}</span></span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex flex-col items-center justify-center p-0 relative h-full">
          {currentScreen === 'MainMenu' && (
            <TitleScreen onStart={handleStartRun} />
          )}

          {currentScreen === 'ArchetypeSelect' && (
            <ArchetypeSelect onSelect={handleSelectArchetype} />
          )}

          {currentScreen === 'NodeMap' && (
            <NodeMap onNodeSelect={handleNodeSelect} />
          )}

          {currentScreen === 'PreBattleConjure' && (
            <PreBattleConjure onStartBattle={handleStartBattle} />
          )}

          {currentScreen === 'Battle' && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Battle onWin={handleBattleWin} onLose={handleBattleLose} />
            </div>
          )}

          {currentScreen === 'PostBattle' && (
            <div className="text-center space-y-6 p-8">
              <h2 className="text-2xl font-bold text-emerald-400">Victory!</h2>
              <div className="p-6 bg-zinc-800 rounded-xl inline-block text-left space-y-2">
                <p>+ 50 Gold</p>
                <p>+ 1 Spell Draft</p>
                <p>+ 1 Summon Draft</p>
              </div>
              <div>
                <button onClick={handleContinue} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium">Continue</button>
              </div>
            </div>
          )}

          {currentScreen === 'Shop' && (
            <div className="text-center space-y-6 p-8">
              <h2 className="text-2xl font-bold text-yellow-400">Shop</h2>
              <p className="text-zinc-400">Buy perks, spells, and summons here.</p>
              <button onClick={handleContinue} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium">Leave Shop</button>
            </div>
          )}

          {currentScreen === 'Event' && (
            <EventScreen onComplete={handleContinue} />
          )}

          {currentScreen === 'GameOver' && (
            <div className="text-center space-y-6 p-8">
              <h2 className="text-4xl font-bold text-red-500">Game Over</h2>
              <p className="text-zinc-400">Your run has ended.</p>
              <button onClick={handleRestart} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium">Return to Main Menu</button>
            </div>
          )}

          {currentScreen === 'Victory' && (
            <div className="text-center space-y-6 p-8">
              <h2 className="text-4xl font-bold text-yellow-400">Run Complete!</h2>
              <p className="text-zinc-400">You have conquered the final floor.</p>
              <button onClick={handleRestart} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium">Return to Main Menu</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
