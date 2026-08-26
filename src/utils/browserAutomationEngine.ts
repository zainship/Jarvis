import { BrowserWorkflowPlan, BrowserStep, PlaywrightScriptBundle } from "../types";
import { hostBridgeManager } from "./hostBridgeManager";

/**
 * JARVIS Autonomous Browser Automation Engine
 * Formulates human-like browser control loops, compiles real Playwright/Puppeteer
 * test specifications, and manages live visual execution feedback.
 */

export interface Point {
  x: number;
  y: number;
}

export class BrowserAutomationEngine {
  /**
   * Generates a cubic Bézier curve between two points for realistic human mouse movement
   */
  static generateHumanCursorPath(start: Point, end: Point, steps = 20): Point[] {
    const points: Point[] = [];
    // Randomize control points slightly for human micro-tremor/arc
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.hypot(dx, dy);

    const cp1: Point = {
      x: start.x + dx * 0.25 + (Math.random() - 0.5) * Math.min(distance * 0.3, 40),
      y: start.y + dy * 0.25 + (Math.random() - 0.5) * Math.min(distance * 0.3, 40),
    };

    const cp2: Point = {
      x: start.x + dx * 0.75 + (Math.random() - 0.5) * Math.min(distance * 0.2, 30),
      y: start.y + dy * 0.75 + (Math.random() - 0.5) * Math.min(distance * 0.2, 30),
    };

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      const x = uuu * start.x + 3 * uu * t * cp1.x + 3 * u * tt * cp2.x + ttt * end.x;
      const y = uuu * start.y + 3 * uu * t * cp1.y + 3 * u * tt * cp2.y + ttt * end.y;

      points.push({ x: Math.round(x), y: Math.round(y) });
    }

    return points;
  }

  /**
   * Compiles an array of BrowserSteps into production-ready Playwright and Puppeteer code
   */
  static compileToPlaywright(plan: BrowserWorkflowPlan): PlaywrightScriptBundle {
    const steps = plan.steps || [];
    const targetUrl = plan.targetWebsite?.startsWith("http")
      ? plan.targetWebsite
      : `https://${plan.targetWebsite || "www.google.com"}`;

    const stepCodeLines: string[] = [];
    const pythonCodeLines: string[] = [];

    steps.forEach((step, idx) => {
      const comment = `  // Step ${idx + 1}: ${step.description}`;
      const pyComment = `    # Step ${idx + 1}: ${step.description}`;

      switch (step.actionType) {
        case "NAVIGATE": {
          const url = step.targetUrl || targetUrl;
          stepCodeLines.push(`${comment}\n  await page.goto('${url}', { waitUntil: 'domcontentloaded' });\n  await page.waitForTimeout(1000);`);
          pythonCodeLines.push(`${pyComment}\n    page.goto('${url}', wait_until='domcontentloaded')\n    page.wait_for_timeout(1000)`);
          break;
        }
        case "TYPE": {
          const sel = step.cssSelector || step.targetElement || "input[type='search'], input[name='q'], input#search";
          const val = (step.inputValue || "").replace(/'/g, "\\'");
          stepCodeLines.push(`${comment}\n  await page.locator('${sel}').first().waitFor({ state: 'visible', timeout: 8000 });\n  await page.locator('${sel}').first().click();\n  await page.locator('${sel}').first().fill('${val}');\n  await page.waitForTimeout(600);`);
          pythonCodeLines.push(`${pyComment}\n    page.locator('${sel}').first.wait_for(state='visible', timeout=8000)\n    page.locator('${sel}').first.click()\n    page.locator('${sel}').first.fill('${val}')\n    page.wait_for_timeout(600)`);
          break;
        }
        case "CLICK": {
          const sel = step.cssSelector || step.targetElement || "button[type='submit'], #search-icon-legacy, a";
          stepCodeLines.push(`${comment}\n  await page.locator('${sel}').first().waitFor({ state: 'visible', timeout: 8000 });\n  await page.locator('${sel}').first().hover();\n  await page.locator('${sel}').first().click();\n  await page.waitForTimeout(1200);`);
          pythonCodeLines.push(`${pyComment}\n    page.locator('${sel}').first.wait_for(state='visible', timeout=8000)\n    page.locator('${sel}').first.hover()\n    page.locator('${sel}').first.click()\n    page.wait_for_timeout(1200)`);
          break;
        }
        case "PRESS_KEY": {
          const key = step.inputValue || "Enter";
          stepCodeLines.push(`${comment}\n  await page.keyboard.press('${key}');\n  await page.waitForTimeout(1000);`);
          pythonCodeLines.push(`${pyComment}\n    page.keyboard.press('${key}')\n    page.wait_for_timeout(1000)`);
          break;
        }
        case "SCROLL": {
          stepCodeLines.push(`${comment}\n  await page.evaluate(() => window.scrollBy({ top: 500, behavior: 'smooth' }));\n  await page.waitForTimeout(1200);`);
          pythonCodeLines.push(`${pyComment}\n    page.evaluate("window.scrollBy({ top: 500, behavior: 'smooth' })")\n    page.wait_for_timeout(1200)`);
          break;
        }
        case "WAIT": {
          stepCodeLines.push(`${comment}\n  await page.waitForTimeout(2000);`);
          pythonCodeLines.push(`${pyComment}\n    page.wait_for_timeout(2000)`);
          break;
        }
        case "EXTRACT":
        case "ANALYZE": {
          stepCodeLines.push(`${comment}\n  const extractedText = await page.evaluate(() => {\n    const items = Array.from(document.querySelectorAll('h1, h2, h3, article, .title, [id*=\"title\"]'));\n    return items.slice(0, 8).map(el => el.textContent?.trim()).filter(Boolean);\n  });\n  console.log('Extracted DOM Findings:', extractedText);`);
          pythonCodeLines.push(`${pyComment}\n    extracted_text = page.evaluate("Array.from(document.querySelectorAll('h1, h2, h3, article, .title')).slice(0, 8).map(el => el.textContent.trim())")\n    print('Extracted:', extracted_text)`);
          break;
        }
        case "ASSERT":
        case "VISION_INSPECT": {
          stepCodeLines.push(`${comment}\n  await page.screenshot({ path: 'step_${idx + 1}_vision_checkpoint.png' });\n  console.log('Vision checkpoint captured for step ${idx + 1}');`);
          pythonCodeLines.push(`${pyComment}\n    page.screenshot(path='step_${idx + 1}_vision_checkpoint.png')\n    print('Vision checkpoint captured')`);
          break;
        }
        case "COMPLETE": {
          stepCodeLines.push(`${comment}\n  console.log('JARVIS Autonomous Workflow completed successfully.');`);
          pythonCodeLines.push(`${pyComment}\n    print('JARVIS Autonomous Workflow completed successfully.')`);
          break;
        }
      }
    });

    const testFileTypescript = `import { test, expect, chromium } from '@playwright/test';

/**
 * JARVIS Autonomous Browser Agent Workflow: ${plan.workflowName}
 * Target: ${plan.targetWebsite}
 * Objective: ${plan.objectiveSummary}
 */
test('${plan.workflowName.replace(/'/g, "\\'")}', async () => {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100, // Human-like execution pacing
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

${stepCodeLines.join("\n\n")}

  await page.waitForTimeout(3000);
  await browser.close();
});
`;

    const standaloneNodeScript = `// Run directly with: node jarvis_browser_runner.mjs
import { chromium } from 'playwright';

async function runAutonomousWorkflow() {
  console.log('🤖 JARVIS Autonomous Browser Agent launching Chrome...');
  const browser = await chromium.launch({
    headless: false,
    slowMo: 120,
    args: ['--start-maximized'],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  try {
${stepCodeLines.join("\n\n")}
    console.log('✅ Mission objective accomplished, sir.');
  } catch (error) {
    console.error('❌ Automation exception:', error);
  } finally {
    await page.waitForTimeout(4000);
    await browser.close();
  }
}

runAutonomousWorkflow();
`;

    const pythonScript = `# Run directly with: python jarvis_browser_runner.py
from playwright.sync_api import sync_playwright
import time

def run():
    print("🤖 JARVIS Autonomous Browser Agent initializing...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, slow_mo=120)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

${pythonCodeLines.join("\n\n")}

        time.sleep(3)
        browser.close()

if __name__ == "__main__":
    run()
`;

    const cliCommand = `npx playwright test jarvis_automation.spec.ts --headed`;

    return {
      testFileTypescript,
      standaloneNodeScript,
      pythonScript,
      cliCommand,
    };
  }

  /**
   * Dispatches the workflow to the user's running local host bridge daemon
   */
  static async dispatchToLocalBridge(plan: BrowserWorkflowPlan): Promise<{ success: boolean; message: string }> {
    try {
      const bundle = this.compileToPlaywright(plan);
      const bridgeEndpoint = hostBridgeManager.getConfig().endpointUrl?.replace(/\/launch$/, "") || "http://localhost:18500";
      
      const res = await fetch(`${bridgeEndpoint}/autonomous-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowName: plan.workflowName,
          targetWebsite: plan.targetWebsite,
          script: bundle.standaloneNodeScript,
          pythonScript: bundle.pythonScript,
          steps: plan.steps,
          timestamp: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        return { success: true, message: `Dispatched to local Playwright host daemon on ${bridgeEndpoint}` };
      } else {
        return { success: false, message: `Host bridge returned status ${res.status}` };
      }
    } catch (e: any) {
      return { success: false, message: `Local host bridge not reachable: ${e.message}` };
    }
  }
}
