// Minimal Chrome DevTools Protocol driver — no dependencies (Node 22 has
// global fetch + WebSocket). Exists because `--headless --window-size` clamps
// to a ~500px minimum, so it cannot render a real 390px phone viewport.
// Emulation.setDeviceMetricsOverride has no such floor, and `mobile: true`
// plus touch emulation makes Chrome report (hover: none) and (pointer: coarse).
//
// usage: node shoot.mjs <url> <out.png> <device> [probeFile]
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

const DEVICES = {
  'iphone14':     { width: 390,  height: 844,  dsf: 3, mobile: true },
  'iphone14-land':{ width: 852,  height: 393,  dsf: 3, mobile: true },
  'iphone-se':    { width: 375,  height: 667,  dsf: 2, mobile: true },
  'ipad':         { width: 820,  height: 1180, dsf: 2, mobile: true },
  'ipad-land':    { width: 1180, height: 820,  dsf: 2, mobile: true },
  'desktop':      { width: 1440, height: 900,  dsf: 1, mobile: false },
};

const [url, out, deviceName = 'iphone14', probeFile] = process.argv.slice(2);
const dev = DEVICES[deviceName];
if (!dev) { console.error('unknown device: ' + deviceName); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio',
  '--no-first-run', '--no-default-browser-check',
  '--user-data-dir=/tmp/cdp-shoot-profile',
  `--remote-debugging-port=${PORT}`, 'about:blank',
], { stdio: 'ignore' });

async function targetWs() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(250);
  }
  throw new Error('chrome debug endpoint never came up');
}

const ws = new WebSocket(await targetWs());
await new Promise((r) => (ws.onopen = r));

let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function send(method, params = {}) {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((res, rej) => pending.set(msgId, (m) =>
    m.error ? rej(new Error(method + ': ' + m.error.message)) : res(m.result)));
}

await send('Page.enable');
await send('Runtime.enable');
// The whole point: a real viewport with no minimum-width clamp.
await send('Emulation.setDeviceMetricsOverride', {
  width: dev.width, height: dev.height,
  deviceScaleFactor: dev.dsf, mobile: dev.mobile,
});
// maxTouchPoints must be 1-16, so skip the call entirely for non-touch devices
// rather than passing 0 (which CDP rejects).
if (dev.mobile) {
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
}

await send('Page.navigate', { url });
await sleep(6500); // DC renders client-side; give it time to settle

if (probeFile && existsSync(probeFile)) {
  const r = await send('Runtime.evaluate', {
    expression: readFileSync(probeFile, 'utf8'),
    returnByValue: true, awaitPromise: true,
  });
  console.log(typeof r.result.value === 'string'
    ? r.result.value : JSON.stringify(r.result.value, null, 2));
}

if (out && out !== '-') {
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(out, Buffer.from(shot.data, 'base64'));
}

ws.close();
chrome.kill();
process.exit(0);
