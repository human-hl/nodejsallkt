const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const users = new Map();

io.on('connection', (socket) => {
    console.log('Клиент подключился.');

    socket.on('set name', ({ name, color }) => {
        users.set(socket.id, { name, color });
        socket.emit('chat message', `Добро пожаловать, ${name}!`);
        socket.broadcast.emit('chat message', `${name} присоединился к чату.`);
    });

    socket.on('chat message', (msg) => {
        const user = users.get(socket.id);
        if (user) {
            io.emit('chat message', { user: user.name, text: msg, color: user.color });
        }
    });

    socket.on('disconnect', () => {
        const user = users.get(socket.id);
        if (user) {
            io.emit('chat message', `${user.name} покинул чат.`);
            users.delete(socket.id);
        }
    });
});

server.listen(3000, () => console.log('Server is running on http://localhost:3000'));
