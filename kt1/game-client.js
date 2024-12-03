const zmq = require("zeromq");
const randomInteger = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const [min, max] = process.argv.slice(2).map(Number);
const secretNumber = randomInteger(min, max);
console.log(`Загадано число: ${secretNumber}`);

const client = zmq.socket("req");
client.connect("tcp://localhost:5555");

client.on("message", (message) => {
    const response = JSON.parse(message.toString());
    console.log(`Ответ от сервера: ${JSON.stringify(response)}`);

    if (response.answer === secretNumber) {
        console.log("Угадано! Игра окончена.");
        client.close();
    } else if (response.answer < secretNumber) {
        client.send(JSON.stringify({ hint: "more" }));
    } else {
        client.send(JSON.stringify({ hint: "less" }));
    }
});

client.send(JSON.stringify({ range: `${min}-${max}` }));

