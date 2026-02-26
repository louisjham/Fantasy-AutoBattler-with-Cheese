import { chromium } from 'playwright';

const args = process.argv.slice(2);
const iterations = parseInt(args[0]) || 1;
const verbose = args.includes('--verbose');
const floor = parseInt(args.find(a => a.startsWith('--floor='))?.split('=')[1] || '1');
const MAX_WAIT_MS = 120_000;

async function runBalance() {
    console.log(`🎮 Launching balance test: ${iterations} iteration(s), floor ${floor}...`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('Download the React DevTools')) return;
        if (text.includes('Parallel shader compilation')) return;
        if (text.includes('Babylon.js v')) return;
        console.log(text);
    });

    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);

        // Patch console + run workflow
        await page.evaluate(({ iterations, verbose, floor }) => {
            const _orig = console.log;
            const _origTable = console.table;

            // Save originals just in case
            (window as any)._origConsoleLog = _orig;
            (window as any)._origConsoleTable = _origTable;

            console.log = (...args) => _orig(
                ...args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))
            );
            console.table = (...args) => {
                _orig('\n=== SUMMARY TABLE ===');
                _orig(...args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)));
            };
            (window as any).__runBalanceWorkflow({ iterations, logVerbose: verbose, floor });
        }, { iterations, verbose, floor });

        // Wait for report (with timeout)
        await page.waitForFunction(
            () => !!(window as any).__lastBalanceReport,
            { timeout: MAX_WAIT_MS }
        );

        // Pull results back to Node and restore consoles
        const report = await page.evaluate(() => {
            // Restore console object methods
            if ((window as any)._origConsoleLog) console.log = (window as any)._origConsoleLog;
            if ((window as any)._origConsoleTable) console.table = (window as any)._origConsoleTable;

            const r = (window as any).__lastBalanceReport;
            return { summary: r.summary, mvp: r.mvp, recommendations: r.recommendations };
        });

        console.log('\n=== SUMMARY TABLE ===');
        console.table(report.summary);
        console.log('\nMVP Analysis:');
        console.log(JSON.stringify(report.mvp, null, 2));
        console.log('\nRecommendations:');
        console.log(JSON.stringify(report.recommendations, null, 2));

        // CI exit code
        const pct = parseFloat(String(report.summary?.['Win Rate'] ?? '0'));
        if (pct < 60 || pct > 70) {
            console.error(`\n❌ Win rate ${pct}% outside 60-70% target`);
            process.exit(1);
        }
        console.log(`\n✅ Win rate ${pct}% — within target range`);

    } catch (err) {
        console.error('Workflow failed:', err);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

runBalance();
