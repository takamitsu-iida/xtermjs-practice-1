'use strict';

/* eslint no-unused-vars: 0 */

require('xterm/css/xterm.css');

import {Terminal} from 'xterm';
import {FitAddon} from 'xterm-addon-fit';
import io from 'socket.io-client';

// DOM element
const container = document.getElementById('terminal-container');
const status = document.getElementById('status');

// xterm.js Terminal instance
const term = new Terminal({cursorBlink: true});
const fitAddon = new FitAddon();
term.open(container);
term.loadAddon(fitAddon);
term.focus();
fitAddon.fit();

// error exists?
let errorExists = false;

// backend websocket
const socket = io.connect(null, {
  // transports: ['websocket'],
  // allowUpgrades: false,
  pingTimeout: 30000,
});

// Browser -> Backend
term.onData(function(data) {
  socket.emit('data', data);
});

// Backend -> Browser
socket.on('data', function(data) {
  term.write(data);
});

socket.on('request-resize', function() {
  resizeScreen();
});

socket.on('ssherror', function(data) {
  errorExists = true;
});

socket.on('disconnect', function(err) {
  if (!errorExists) {
    status.style.backgroundColor = 'red';
    status.innerHTML = 'WEBSOCKET SERVER DISCONNECTED: ' + err;
  }
  // socket.io.reconnection(false);
});

socket.on('error', function(err) {
  if (!errorExists) {
    status.style.backgroundColor = 'red';
    status.innerHTML = 'ERROR: ' + err;
  }
});

function generateUuid() {
  // https://github.com/GoogleChrome/chrome-platform-analytics/blob/master/src/internal/identifier.js
  // const FORMAT: string = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  const chars = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.split('');
  for (let i = 0, len = chars.length; i < len; i++) {
    switch (chars[i]) {
    case 'x':
      chars[i] = Math.floor(Math.random() * 16).toString(16);
      break;
    case 'y':
      chars[i] = (Math.floor(Math.random() * 4) + 8).toString(16);
      break;
    }
  }
  return chars.join('');
}

function resizeScreen() {
  fitAddon.fit();
  socket.emit('resize', {cols: term.cols, rows: term.rows});
}

window.addEventListener('resize', resizeScreen, false);

socket.emit('request-connect', {host: 'localhost'});

socket.emit('join', {room: 'localhost', name: 'iida', userid: generateUuid()});
