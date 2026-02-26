import { simulateRun } from './src/utils/winrateTest';
import { PlayerArchetype } from './src/types';

console.log("Running in node:");
const result = simulateRun(PlayerArchetype.Conjurer, 'normal', 100);
console.log(result);
