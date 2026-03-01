/**
 * Session 9D Balance Verification Script
 * Runs the real CombatEngine via Playwright to measure winrates.
 *
 * Usage: npx tsx run_balance_session9d.ts
 */
import { chromium } from 'playwright';

const MAX_WAIT_MS = 180_000;

interface TestConfig {
    label: string;
    floor: number;
    difficulty: string;
    archetype: string;
    subclass: string;
    iterations: number;
    targetMin: number;
    targetMax: number;
}

const TESTS: TestConfig[] = [
    // Step 1: Baseline tests
    { label: 'Floor 1 normal', floor: 1, difficulty: 'normal', archetype: 'conjurer', subclass: 'elemental_master', iterations: 50, targetMin: 75, targetMax: 85 },
    { label: 'Floor 3 normal', floor: 3, difficulty: 'normal', archetype: 'conjurer', subclass: 'elemental_master', iterations: 50, targetMin: 60, targetMax: 70 },
    { label: 'Floor 5 normal', floor: 5, difficulty: 'normal', archetype: 'conjurer', subclass: 'elemental_master', iterations: 50, targetMin: 55, targetMax: 65 },
    { label: 'Floor 5 hard', floor: 5, difficulty: 'hard', archetype: 'conjurer', subclass: 'elemental_master', iterations: 50, targetMin: 40, targetMax: 55 },
    // Step 4: Per-archetype at floor 3
    { label: 'Floor 3 Warlord', floor: 3, difficulty: 'normal', archetype: 'warlord', subclass: 'vanilla_warlord', iterations: 50, targetMin: 50, targetMax: 80 },
    { label: 'Floor 3 Conjurer', floor: 3, difficulty: 'normal', archetype: 'conjurer', subclass: 'elemental_master', iterations: 50, targetMin: 50, targetMax: 80 },
    { label: 'Floor 3 Mystic', floor: 3, difficulty: 'normal', archetype: 'mystic', subclass: 'arcanist', iterations: 50, targetMin: 50, targetMax: 80 },
];

async function runTest(page: any, config: TestConfig): Promise<number> {
    // Clear previous report
    await page.evaluate(() => {
        (window as any).__lastBalanceReport = null;
    });

    // Run the simulation
    await page.evaluate(({ iterations, archetype, subclass, difficulty, floor }: any) => {
        (window as any).__runBalanceWorkflow({ iterations, archetype, subclass, difficulty, floor });
    }, config);

    // Wait for completion
    await page.waitForFunction(
        () => !!(window as any).__lastBalanceReport,
        { timeout: MAX_WAIT_MS }
    );

    // Extract winrate
    const result = await page.evaluate(() => {
        const r = (window as any).__lastBalanceReport;
        return r?.summary || r;
    });

    const winRate = typeof result.winRate === 'number'
        ? result.winRate * 100
        : parseFloat(String(result['Win Rate'] ?? '0'));

    return Math.round(winRate);
}

async function main() {
    console.log('🎮 Session 9D Balance Verification');
    console.log('═'.repeat(60));

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // Suppress noisy console output
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Starting balance simulation')) console.log(`  → ${text}`);
        if (text.includes('Lost at node')) { /* suppress */ }
    });

    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(3000);

        const results: { label: string; winrate: number; target: string; status: string }[] = [];

        // Run all tests
        for (const test of TESTS) {
            console.log(`\n📊 Running: ${test.label} (${test.iterations} iters)...`);
            const winrate = await runTest(page, test);
            const inTarget = winrate >= test.targetMin && winrate <= test.targetMax;
            const status = inTarget ? '✅' : '❌';
            const target = `${test.targetMin}-${test.targetMax}%`;
            results.push({ label: test.label, winrate, target, status });
            console.log(`   Result: ${winrate}% [target: ${target}] ${status}`);
        }

        // Print summary table
        console.log('\n\n' + '═'.repeat(65));
        console.log(' BALANCE VERIFICATION REPORT — Session 9D');
        console.log('═'.repeat(65));
        console.log('| Test                        | Winrate | Target    | Status |');
        console.log('|-----------------------------|---------|-----------|--------|');
        for (const r of results) {
            console.log(`| ${r.label.padEnd(27)} | ${(r.winrate + '%').padEnd(7)} | ${r.target.padEnd(9)} | ${r.status.padEnd(6)} |`);
        }
        console.log('═'.repeat(65));

        // Archetype balance check (last 3 tests)
        const archTests = results.slice(4);
        if (archTests.length === 3) {
            const rates = archTests.map(t => t.winrate);
            const maxDiff = Math.max(...rates) - Math.min(...rates);
            console.log(`\nArchetype spread: ${Math.min(...rates)}% - ${Math.max(...rates)}% (Δ${maxDiff}%)`);
            if (maxDiff > 10) {
                const highest = archTests.reduce((a, b) => a.winrate > b.winrate ? a : b);
                const lowest = archTests.reduce((a, b) => a.winrate < b.winrate ? a : b);
                console.log(`⚠️  OUTLIER: ${lowest.label} (${lowest.winrate}%) is ${maxDiff}% below ${highest.label} (${highest.winrate}%)`);
                console.log('   → Flagged for manual review');
            } else {
                console.log('✅ All archetypes within 10% of each other');
            }
        }

        // Check if any adjustments needed
        const failedTests = results.filter(r => r.status === '❌');
        if (failedTests.length > 0) {
            console.log(`\n⚠️  ${failedTests.length} test(s) outside target range — tuning needed`);
            for (const f of failedTests) {
                const target = f.target.replace('%', '').split('-').map(Number);
                if (f.winrate > target[1]) {
                    console.log(`   ${f.label}: ${f.winrate}% > ${target[1]}% → enemies too weak, increase FLOOR_MULTIPLIER`);
                } else {
                    console.log(`   ${f.label}: ${f.winrate}% < ${target[0]}% → enemies too strong, decrease FLOOR_MULTIPLIER`);
                }
            }
        } else {
            console.log('\n✅ ALL TESTS PASSED — Session 9D balance verified!');
        }

    } catch (err) {
        console.error('Balance test failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

main();
