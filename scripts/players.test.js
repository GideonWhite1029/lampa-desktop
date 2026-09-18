const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

function loadPlayers(files = []) {
  const launches = [];
  const module = { exports: {} };
  const context = {
    module,
    process: { platform: 'win32', env: { ProgramFiles: 'C:\\Program Files', 'ProgramFiles(x86)': 'C:\\Program Files (x86)' } },
    require(name) {
      if (name === 'node:fs') return { existsSync: (p) => files.includes(p), statSync: () => ({ isFile: () => true }) };
      if (name === 'node:path') return path.win32;
      if (name === 'node:os') return { homedir: () => 'C:\\Users\\test' };
      if (name === './store') return { get: () => [] };
      if (name === 'node:child_process') return { spawn: (cmd, args, options) => {
        const child = new EventEmitter();
        child.pid = 123;
        launches.push({ cmd, args, options, child });
        return child;
      } };
      throw new Error(name);
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../src/players.js'), 'utf8'), context);
  return { players: module.exports, launches };
}

test('detect both MPC-HC binaries in either Program Files directory', { timeout: 1000 }, () => {
  for (const dir of ['C:\\Program Files', 'C:\\Program Files (x86)']) {
    for (const exe of ['mpc-hc.exe', 'mpc-hc64.exe']) {
      const file = path.win32.join(dir, 'MPC-HC', exe);
      const { players } = loadPlayers([file]);
      assert.equal(players.detectDefaultPath(), file);
      assert.equal(players.detectAll()[0].path, file);
    }
  }
});

test('MPC gets one /new while original arguments and lifecycle are preserved', { timeout: 1000 }, () => {
  for (const exe of ['mpc-hc.exe', 'mpc-hc64.exe', 'mpc-be.exe', 'mpc-be64.exe']) {
    const file = path.win32.join('C:\\players', exe);
    const { players, launches } = loadPlayers([file]);
    const args = ['http://localhost/video', '/webport', '3999', '/start', '30000'];
    const events = [];
    const result = players.launch(file, args, (id, data) => events.push({ id, data }));
    assert.deepEqual(Array.from(launches[0].args), [...args, '/new']);
    assert.equal(args.includes('/new'), false);
    launches[0].child.emit('close', 0, null);
    assert.equal(events[0].id, result.id);
    assert.equal(events[0].data.type, 'close');
    players.launch(file, [...args, '/NEW'], () => {});
    assert.equal(launches[1].args.filter((arg) => arg.toLowerCase() === '/new').length, 1);
  }
});

test('other players and argument restrictions remain unchanged', { timeout: 1000 }, () => {
  const file = 'C:\\players\\vlc.exe';
  const { players, launches } = loadPlayers([file]);
  players.launch(file, ['http://localhost/video'], () => {});
  assert.deepEqual(Array.from(launches[0].args), ['http://localhost/video']);
  assert.ok(players.launch(file, ['--lua-intf=evil'], () => {}).error);
  assert.ok(players.launch('C:\\players\\unknown.exe', [], () => {}).error);
  assert.equal(launches.length, 1);
});
