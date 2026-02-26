---
description: Run the Combat Balance Validation Workflow
---
Executes a highly verbose balance battle in a headless browser and streams the output directly to the terminal console.

1. Write the following TypeScript script to `run_balance.ts` exactly as follows:
```typescript
import { chromium } from 'playwright';

async function runBalance() {
    console.log("Launching headless browser to run balance workflow on port 3000...");
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let silenceLogs = false;

    page.on('console', msg => {
        if (silenceLogs) return;

        const text = msg.text();
        // Filter out React DevTools and Babylon JS noise
        if (text.includes('Download the React DevTools')) return;
        if (text.includes('Parallel shader compilation')) return;
        if (text.includes('Babylon.js v')) return;
        if (text.includes('=== SUMMARY TABLE ===')) return;
        if (text.includes('=== BALANCE REPORT ===')) {
            silenceLogs = true; // Silence the built-in printing so we can print it prettily natively
            return;
        }
        console.log(text);
    });

    try {
        await page.goto('http://localhost:3000');
        await page.waitForTimeout(2000);

        await page.evaluate(async () => {
            // Overwrite console log to properly stringify objects during tick logs
            const originalConsoleLog = console.log;
            console.log = (...args) => {
                const strArgs = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a));
                originalConsoleLog(...strArgs);
            };

            return new Promise<boolean>((resolve) => {
                (window as any).__runBalanceWorkflow({
                    iterations: 1,
                    logVerbose: true
                });

                const check = setInterval(() => {
                    if ((window as any).__lastBalanceReport) {
                        clearInterval(check);
                        resolve(true);
                    }
                }, 500);
            });
        });

        // Natively pull the objects out of the window context so NodeJS can format them
        const reportRaw = await page.evaluate(() => {
            const r = (window as any).__lastBalanceReport;
            return {
                summary: r.summary,
                mvp: r.mvp,
                recommendations: r.recommendations
            };
        });

        console.log("\n=== BALANCE REPORT ===");
        console.table(reportRaw.summary);
        console.log("\nMVP Analysis:");
        console.log(JSON.stringify(reportRaw.mvp, null, 2));
        console.log("\nRecommendations:");
        console.log(JSON.stringify(reportRaw.recommendations, null, 2));

        await page.waitForTimeout(500);
        console.log("\nBalance Workflow Completed.");
    } catch (err) {
        console.error("Workflow execution failed:", err);
    } finally {
        await browser.close();
    }
}

runBalance();
```

// turbo-all
2. Run `npx tsx run_balance.ts`
3. Run `Remove-Item run_balance.ts` to clean up the temporary script.
