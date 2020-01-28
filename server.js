'use strict';

// see chat room
// https://qiita.com/ynunokawa/items/564757fe6dbe43d172f8

const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);

const fs = require('fs');
const path = require('path');

const nodeRoot = path.dirname(require.main.filename);
const configPath = path.join(nodeRoot, 'config.json');
let config = null;
if (fs.existsSync(configPath)) {
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.error('ERROR:\n\n  ' + err);
  }
} else {
  console.error('ERROR: ' + configPath + ' not found');
  process.exit(1);
}
if (config === null) {
  process.exit(1);
}

const SshClient = require('ssh2').Client;

const utf8 = require('utf8');

// set the template engine ejs
app.set('view engine', 'ejs');

// set ./public as a static contents root
app.use(express.static('public'));

// routes
app.get('/', (req, res) => {
  res.render('index');
});

// http server
const serverPort = 8888;
server.listen(serverPort);

// socket.io websocket connection
const io = require('socket.io')(server, {pingTimeout: 30000});

let numUsers = 0;
const store = {}; // {userid: userobj}
const idstore = {}; // {socket.id: userid}

function get_room_by_socketid(socketid) {
  if (idstore[socketid]) {
    const userobj = store[idstore[socketid]];
    return userobj.room;
  }
  return null;
}

io.on('connection', function(socket) {
  ++numUsers;
  console.log('current users: ' + numUsers);

  const ssh = new SshClient();
  let sshConnected = false;
  ssh
    .on('ready', function() {
      sshConnected = true;
      socket.emit('data', '\r\n*** SSH CONNECTION ESTABLISHED ***\r\n');
      ssh.shell(function(err, stream) {
        if (err) {
          socket.emit('data', '\r\n*** SSH SHELL ERROR: ' + err.message + ' ***\r\n');
          ssh.end();
          return;
        }

        // From Browser->Backend
        socket.on('data', function(data) {
          if (sshConnected) {
            stream.write(data); // send to ssh stream
          }
        });

        // handle browser resize event
        socket.on('resize', function(data) {
          stream.setWindow(data.rows, data.cols);
        });

        // request initial screen size
        socket.emit('request-resize');

        // From Backend->Browser
        stream.on('data', function(d) {
          // socket.emit('data', utf8.decode(d.toString('binary')));
          // socket.broadcast.emit('data', utf8.decode(d.toString('binary')));
          const room = get_room_by_socketid(socket.id);
          io.sockets.in(room).emit('data', utf8.decode(d.toString('binary')));
        });

        stream.on('close', function() {
          socket.emit('data', '\r\n*** SSH SHELL CLOSED ***\r\n');
          ssh.end();
          sshConnected = false;
          console.log('ssh stream closed');
        });
      });
    });

  ssh
    .on('close', function() {
      socket.emit('data', '\r\n*** SSH CONNECTION CLOSED ***\r\n');
      sshConnected = false;
    });

  ssh
    .on('error', function(err) {
      console.log(err);
      socket.emit('data', '\r\n*** SSH CONNECTION ERROR: ' + err.message + ' ***\r\n');
      sshConnected = false;
    });

  socket
    .on('request-connect', function(data) {
      const host = data.host;
      const param = config[host];
      // console.log(param);
      if (param == null) {
        return;
      }

      if (param.password != null) {
        ssh.connect({
          keepaliveInterval: 20000,
          host: param.host,
          port: param.port,
          username: param.username,
          password: param.password,
        });
      } else if (param.privatekey != null) {
        ssh.connect({
          keepaliveInterval: 20000,
          host: param.host,
          port: param.port,
          username: param.username,
          privateKey: fs.readFileSync(param.privatekey),
        });
      } else {
        socket.emit('data', '\r\n*** AUTHENTICATION INFORMATION IS MISSING ***\r\n');
      }
    });

  socket
    .on('join', function(data) {
      const usrobj = {
        'room': data.room,
        'name': data.name,
      };
      store[data.userid] = usrobj;
      idstore[socket.id] = data.userid;
      socket.join(data.room);
      console.log('userid: ' + data.userid);
      console.log('socket.id: ' + socket.id);
      console.log('join to the room: ' + data.room);
    });

  socket
    .on('disconnect', function(reason) {
      console.log('user disconnected because: ' + reason);
      --numUsers;
      console.log('current users: ' + numUsers);

      if (idstore[socket.id]) {
        const room = store[idstore[socket.id]].room;
        const name = store[idstore[socket.id]].name;
        socket.leave(room);
        console.log('leave from the room: ' + room);
        io.to(room).emit('data', '\r\n*** ' + name + ' exited ***\r\n');
        delete idstore[socket.id];
      }
    });
});
