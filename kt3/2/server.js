const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public')); // Статические файлы из папки public

io.on('connection', (socket) => {
    console.log('Клиент подключился.');
    let userName = null;

    socket.on('set name', (name) => {
        userName = name;
        const welcomeMessage = userName 
            ? `Добро пожаловать, ${userName}.`
            : `Вы первый в чате.`;
        socket.emit('chat message', welcomeMessage);

        socket.broadcast.emit('chat message', `${userName} присоединился к чату.`);
    });

    // Обработка получения сообщения
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg); // Рассылка всем клиентам
    });

    socket.on('disconnect', () => {
        console.log('Клиент отключился.');
    });
});

server.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});
