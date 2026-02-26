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
import MainMenu from './screens/MainMenu';
import GameOver from './screens/GameOver';
import Victory from './screens/Victory';
import PostBattle from './screens/PostBattle';
import Shop from './screens/Shop';
import IntroVideo from './screens/IntroVideo';

type Screen =
  | 'IntroVideo'
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
  const [currentScreen, setCurrentScreen] = useState<Screen>('IntroVideo');
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
  const handleBattleWin = () => {
    const state = useGameStore.getState();
    const node = state.currentNodeMap[state.currentNodeIndex];
    if (node?.type === 'boss' && state.floor >= 5) {
      setCurrentScreen('Victory');
    } else {
      setCurrentScreen('PostBattle');
    }
  };
  const handleBattleLose = () => setCurrentScreen('GameOver');

  const handleContinue = () => setCurrentScreen('NodeMap');
  const handleMenu = () => {
    endRun(false); // Reset on going to menu from loss
    setCurrentScreen('MainMenu');
  };
  const handleVictoryMenu = () => {
    endRun(true); // Reset on win
    setCurrentScreen('MainMenu');
  };
  const handleRestart = () => {
    endRun(false);
    setCurrentScreen('ArchetypeSelect');
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
          {currentScreen === 'IntroVideo' && (
            <IntroVideo onComplete={() => setCurrentScreen('MainMenu')} />
          )}

          {currentScreen === 'MainMenu' && (
            <MainMenu onStart={handleStartRun} />
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
            <PostBattle onContinue={handleContinue} />
          )}

          {currentScreen === 'Shop' && (
            <Shop onContinue={handleContinue} />
          )}

          {currentScreen === 'Event' && (
            <EventScreen onComplete={handleContinue} />
          )}

          {currentScreen === 'GameOver' && (
            <GameOver onRestart={handleRestart} onMenu={handleMenu} />
          )}

          {currentScreen === 'Victory' && (
            <Victory onMenu={handleVictoryMenu} />
          )}
        </main>
      </div>
    </div>
  );
}
