import { HostBridgeConfig, HostBridgeExecutionEvent, RealBrowserActionType } from "../types";

const STORAGE_KEY_CONFIG = "jarvis_host_bridge_config_v1";
const STORAGE_KEY_HISTORY = "jarvis_host_bridge_history_v1";

const DEFAULT_CONFIG: HostBridgeConfig = {
  enabled: true,
  endpointUrl: "http://localhost:18500/launch",
  customUriScheme: "jarvis://open?url=",
  autoDispatchOnMedia: true,
  autoDispatchOnTab: true,
  preferredBrowser: "default",
  lastPingStatus: "unchecked",
};

export const NODE_BRIDGE_SCRIPT = `// JARVIS Local Windows Host Bridge (Node.js)
// 1. Save this file as 'jarvis-host-bridge.js'
// 2. Run in terminal/cmd: node jarvis-host-bridge.js
const http = require('http');
const { exec } = require('child_process');

const PORT = 18500;
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Webhook-Secret');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === '/health' || req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'online', platform: process.platform, port: PORT }));
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const url = data.targetUrl || data.url || 'https://www.youtube.com';
        const browser = data.browser || 'default';
        console.log(\`[JARVIS HOST BRIDGE] \${new Date().toLocaleTimeString()} -> Command: Open "\${url}" [Browser: \${browser}]\`);

        let cmd = '';
        if (process.platform === 'win32') {
          if (browser === 'chrome') cmd = \`start chrome "\${url}"\`;
          else if (browser === 'msedge') cmd = \`start msedge "\${url}"\`;
          else if (browser === 'firefox') cmd = \`start firefox "\${url}"\`;
          else if (browser === 'brave') cmd = \`start brave "\${url}"\`;
          else cmd = \`start "" "\${url}"\`;
        } else if (process.platform === 'darwin') {
          cmd = \`open "\${url}"\`;
        } else {
          cmd = \`xdg-open "\${url}"\`;
        }

        exec(cmd, (err, stdout, stderr) => {
          if (err) {
            console.error('[JARVIS HOST BRIDGE ERROR]:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ success: false, error: err.message }));
          }
          console.log(\`[SUCCESS] Windows Shell executed: \${cmd}\`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, executedCommand: cmd, url }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404).end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('================================================================');
  console.log(\`⚡ JARVIS Local Host Execution Bridge running on http://localhost:\${PORT}\`);
  console.log('⚡ Ready to open YouTube & Real Browser tabs on your Windows machine!');
  console.log('================================================================');
});
`;

export const POWERSHELL_ONE_LINER = `$listener = New-Object System.Net.HttpListener; $listener.Prefixes.Add('http://localhost:18500/'); $listener.Start(); Write-Host '⚡ JARVIS PowerShell Bridge listening on http://localhost:18500/' -ForegroundColor Cyan; while ($listener.IsListening) { $ctx = $listener.GetContext(); $req = $ctx.Request; $res = $ctx.Response; $res.Headers.Add('Access-Control-Allow-Origin', '*'); $res.Headers.Add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); $res.Headers.Add('Access-Control-Allow-Headers', 'Content-Type'); if ($req.HttpMethod -eq 'OPTIONS') { $res.StatusCode = 204; $res.Close(); continue }; if ($req.HttpMethod -eq 'POST') { $reader = New-Object System.IO.StreamReader($req.InputStream); $body = $reader.ReadToEnd(); $json = $body | ConvertFrom-Json; $url = if ($json.targetUrl) { $json.targetUrl } else { 'https://www.youtube.com' }; Write-Host "⚡ Executing in Windows: $url" -ForegroundColor Green; Start-Process $url; $buf = [System.Text.Encoding]::UTF8.GetBytes('{"success":true}'); $res.ContentType = 'application/json'; $res.OutputStream.Write($buf, 0, $buf.Length); $res.Close() } else { $buf = [System.Text.Encoding]::UTF8.GetBytes('{"status":"online"}'); $res.ContentType = 'application/json'; $res.OutputStream.Write($buf, 0, $buf.Length); $res.Close() } }`;

export const PYTHON_WEBHOOK_SCRIPT = `# JARVIS Local Python Webhook Bridge
# Save as 'jarvis_bridge.py' and run: python jarvis_bridge.py
from http.server import HTTPServer, BaseHTTPRequestHandler
import json, webbrowser

class JarvisHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'online', 'bridge': 'python'}).encode())

    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(length)
        data = json.loads(body.decode() or '{}')
        url = data.get('targetUrl') or data.get('url') or 'https://www.youtube.com'
        print(f"[JARVIS PYTHON BRIDGE] Launching Windows Browser: {url}")
        webbrowser.open(url)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'success': True, 'url': url}).encode())

print("⚡ JARVIS Python Webhook Bridge active on http://localhost:18500")
HTTPServer(('127.0.0.1', 18500), JarvisHandler).serve_forever()
`;

// Chrome DevTools Protocol (CDP) Node.js Controller Script
export const CHROME_CDP_NODE_SCRIPT = `// JARVIS Real Chrome Browser CDP Controller (Node.js)
// Step 1: Start Chrome with Remote Debugging:
// Windows: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222
// macOS: /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222
// Linux: google-chrome --remote-debugging-port=9222
//
// Step 2: Install dependencies: npm install puppeteer-core ws
// Step 3: Run: node jarvis-cdp-daemon.js

const http = require('http');
const puppeteer = require('puppeteer-core');

const PORT = 18500;
const CDP_PORT = 9222;

async function executeInRealBrowser(action, url, searchQuery) {
  try {
    const browser = await puppeteer.connect({
      browserURL: \`http://127.0.0.1:\${CDP_PORT}\`,
      defaultViewport: null
    });
    
    const page = await browser.newPage();
    console.log(\`[JARVIS CDP] Connected to real Chrome! Navigating to \${url}...\`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    if (searchQuery && url.includes('youtube.com')) {
      await page.waitForSelector('input#search', { timeout: 4000 }).catch(() => {});
      await page.type('input#search', searchQuery);
      await page.keyboard.press('Enter');
    } else if (searchQuery && url.includes('google.com')) {
      await page.waitForSelector('textarea[name="q"], input[name="q"]', { timeout: 4000 }).catch(() => {});
      await page.type('textarea[name="q"], input[name="q"]', searchQuery);
      await page.keyboard.press('Enter');
    }
    
    await browser.disconnect();
    return { success: true, message: \`Navigated real Chrome to \${url}\` };
  } catch (err) {
    console.error('[JARVIS CDP ERROR]:', err.message);
    return { success: false, error: err.message };
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === '/health' || req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'online', type: 'cdp_bridge', port: PORT }));
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const url = data.targetUrl || data.url || 'https://www.youtube.com';
        const query = data.query || data.title;
        console.log(\`[JARVIS COMMAND] Real Chrome Action: \${data.action || 'OPEN_TAB'} -> \${url}\`);
        
        const result = await executeInRealBrowser(data.action, url, query);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }
  res.writeHead(404).end();
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('================================================================');
  console.log(\`⚡ JARVIS Real Chrome CDP Bridge running on http://localhost:\${PORT}\`);
  console.log(\`⚡ Connecting to your real Google Chrome on port \${CDP_PORT}\`);
  console.log('================================================================');
});
`;

// Chrome Extension Manifest V3
export const CHROME_EXTENSION_MANIFEST = `{
  "manifest_version": 3,
  "name": "J.A.R.V.I.S. Real Browser Controller",
  "version": "1.0.0",
  "description": "Connects J.A.R.V.I.S. Autonomous AI directly to your real Google Chrome & Edge browser tabs and windows.",
  "permissions": [
    "tabs",
    "activeTab",
    "scripting",
    "storage"
  ],
  "host_permissions": [
    "<all_urls>",
    "http://localhost:18500/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "action": {
    "default_title": "J.A.R.V.I.S. Browser Controller"
  }
}`;

// Chrome Extension Background Service Worker
export const CHROME_EXTENSION_BACKGROUND = `// J.A.R.V.I.S. Chrome Extension Background Service Worker
console.log("[JARVIS Extension] Background worker active. Polling JARVIS Local Bridge...");

const BRIDGE_URL = "http://localhost:18500/events";

async function pollJarvisCommands() {
  try {
    const res = await fetch("http://localhost:18500/status");
    if (res.ok) {
      console.log("[JARVIS Extension] Connected to JARVIS Bridge!");
    }
  } catch (e) {
    // Bridge offline
  }
}

setInterval(pollJarvisCommands, 5000);

// Listen to external messages from web apps
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  if (request.action === "OPEN_REAL_TAB") {
    chrome.tabs.create({ url: request.url }, (tab) => {
      sendResponse({ success: true, tabId: tab.id });
    });
    return true;
  }
  if (request.action === "EXECUTE_SCRIPT") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (code) => { eval(code); },
          args: [request.code]
        });
      }
    });
    sendResponse({ success: true });
    return true;
  }
});
`;

type ConfigListener = (config: HostBridgeConfig) => void;
type EventListener = (event: HostBridgeExecutionEvent) => void;

class HostBridgeManager {
  private config: HostBridgeConfig;
  private history: HostBridgeExecutionEvent[] = [];
  private configListeners: Set<ConfigListener> = new Set();
  private eventListeners: Set<EventListener> = new Set();

  constructor() {
    this.config = this.loadConfig();
    this.history = this.loadHistory();
  }

  private loadConfig(): HostBridgeConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (raw) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn("Failed to load Host Bridge config from localStorage:", e);
    }
    return { ...DEFAULT_CONFIG };
  }

  private loadHistory(): HostBridgeExecutionEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (raw) {
        return JSON.parse(raw).slice(0, 30);
      }
    } catch (e) {}
    return [];
  }

  public getConfig(): HostBridgeConfig {
    return { ...this.config };
  }

  public updateConfig(patch: Partial<HostBridgeConfig>): HostBridgeConfig {
    this.config = { ...this.config, ...patch };
    try {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
    } catch (e) {}
    this.configListeners.forEach((l) => l(this.config));
    return this.config;
  }

  public getHistory(): HostBridgeExecutionEvent[] {
    return [...this.history];
  }

  public clearHistory(): void {
    this.history = [];
    try {
      localStorage.removeItem(STORAGE_KEY_HISTORY);
    } catch (e) {}
  }

  public onConfigChange(listener: ConfigListener): () => void {
    this.configListeners.add(listener);
    return () => this.configListeners.delete(listener);
  }

  public onExecutionEvent(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  public generateWindowsCommand(url: string, browser?: string): string {
    const selectedBrowser = browser || this.config.preferredBrowser || "default";
    switch (selectedBrowser) {
      case "chrome":
        return `start chrome "${url}"`;
      case "msedge":
        return `start msedge "${url}"`;
      case "firefox":
        return `start firefox "${url}"`;
      case "brave":
        return `start brave "${url}"`;
      default:
        return `start "" "${url}"`;
    }
  }

  public generatePowerShellCommand(url: string, browser?: string): string {
    const selectedBrowser = browser || this.config.preferredBrowser || "default";
    if (selectedBrowser === "default") {
      return `Start-Process "${url}"`;
    }
    return `Start-Process "${selectedBrowser}.exe" -ArgumentList "${url}"`;
  }

  public async pingHostBridge(): Promise<boolean> {
    const endpoint = this.config.endpointUrl.replace(/\/launch|\/exec$/, "/health");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      const res = await fetch(endpoint, {
        method: "GET",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const isOk = res.ok || res.status === 204;
      this.updateConfig({
        lastPingStatus: isOk ? "online" : "offline",
        lastPingTime: Date.now(),
      });
      return isOk;
    } catch (e) {
      this.updateConfig({
        lastPingStatus: "offline",
        lastPingTime: Date.now(),
      });
      return false;
    }
  }

  /**
   * Main Dispatch Pipeline: Commands Windows host machine via Local Bridge / Webhook / URI Scheme & window.open
   */
  public async dispatchHostExecution(params: {
    action: RealBrowserActionType;
    targetUrl: string;
    title?: string;
    videoId?: string;
  }): Promise<HostBridgeExecutionEvent> {
    const url = params.targetUrl.startsWith("http://") || params.targetUrl.startsWith("https://")
      ? params.targetUrl
      : `https://${params.targetUrl}`;

    const title = params.title || params.targetUrl;
    const windowsCommand = this.generateWindowsCommand(url, this.config.preferredBrowser);
    const powershellCommand = this.generatePowerShellCommand(url, this.config.preferredBrowser);

    const event: HostBridgeExecutionEvent = {
      id: "hbe_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      action: params.action,
      targetUrl: url,
      title,
      videoId: params.videoId,
      windowsCommand,
      powershellCommand,
      status: "dispatched",
    };

    // 1. Direct Browser Window Open Strategy (Standard Browser Security Policy Fallback)
    try {
      const win = window.open(url, "_blank", "noopener,noreferrer");
      if (win) win.focus();
    } catch (e) {
      console.warn("Direct window.open blocked by popup policy:", e);
    }

    // 2. Invisible Anchor Click Fallback
    try {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) document.body.removeChild(a);
      }, 150);
    } catch (e) {}

    // 3. Custom URI Protocol Scheme (if configured)
    if (this.config.customUriScheme && this.config.customUriScheme.trim()) {
      try {
        const uriSchemeUrl = `${this.config.customUriScheme.trim()}${encodeURIComponent(url)}`;
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = uriSchemeUrl;
        document.body.appendChild(iframe);
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 1000);
      } catch (e) {}
    }

    // 4. Local Node.js Bridge / Webhook HTTP POST Dispatch
    if (this.config.enabled && this.config.endpointUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800);

        const payload = {
          action: params.action,
          targetUrl: url,
          url,
          title,
          videoId: params.videoId,
          browser: this.config.preferredBrowser,
          windowsCommand,
          powershellCommand,
          timestamp: new Date().toISOString(),
          secret: this.config.webhookSecret || undefined,
        };

        const res = await fetch(this.config.endpointUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.config.webhookSecret ? { "X-Webhook-Secret": this.config.webhookSecret } : {}),
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok || res.status === 204) {
          event.status = "success";
          event.httpStatus = res.status;
          this.updateConfig({ lastPingStatus: "online", lastPingTime: Date.now() });
        } else {
          event.status = "fallback_window_open";
          event.httpStatus = res.status;
        }
      } catch (err: any) {
        event.status = "local_bridge_offline";
        event.error = err.message || "Local host bridge unreachable at " + this.config.endpointUrl;
        this.updateConfig({ lastPingStatus: "offline", lastPingTime: Date.now() });
      }
    } else {
      event.status = "fallback_window_open";
    }

    // Record in history
    this.history = [event, ...this.history].slice(0, 30);
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(this.history));
    } catch (e) {}

    // Notify listeners
    this.eventListeners.forEach((l) => l(event));

    return event;
  }
}

export const hostBridgeManager = new HostBridgeManager();
