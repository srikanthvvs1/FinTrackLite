const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9334;
const profilePath = path.join(__dirname, 'capture-profile');
const outputPath = path.resolve(__dirname, '..', 'screenshots');
const sizes = [
  { width: 1440, height: 900 },
  { width: 768, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 700 },
];

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function getDebuggerTarget() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const targets = await fetch(`http://127.0.0.1:${port}/json`);
      const pages = await targets.json();
      const page = pages.find((target) => target.type === 'page');
      if (page) return page;
    } catch (_error) {
      // Edge may still be starting.
    }
    await delay(100);
  }
  throw new Error('Timed out waiting for the Edge debugging target.');
}

async function main() {
  fs.mkdirSync(outputPath, { recursive: true });
  fs.mkdirSync(profilePath, { recursive: true });
  const edge = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profilePath}`,
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    const target = await getDebuggerTarget();
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    const pending = new Map();
    let nextId = 0;
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) return;
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    };
    await new Promise((resolve, reject) => {
      socket.onopen = resolve;
      socket.onerror = reject;
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

    await send('Page.enable');
    for (const size of sizes) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: size.width,
        height: size.height,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
      await delay(800);
      const metrics = await send('Runtime.evaluate', {
        expression: `JSON.stringify({innerWidth,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,ready:document.querySelector('#accounts-view')&&!document.querySelector('#accounts-view').hidden})`,
        returnByValue: true,
      });
      const screenshot = await send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
        fromSurface: true,
      });
      const name = `prompt02-accounts-${size.width}.png`;
      fs.writeFileSync(path.join(outputPath, name), Buffer.from(screenshot.data, 'base64'));
      console.log(`${name} ${metrics.result.value}`);
    }
    socket.close();
  } finally {
    edge.kill();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
