const zmq = require("zeromq");
const server = zmq.socket("rep");

let min, max;
let guess;

server.on("message", (message) => {
    const request = JSON.parse(message.toString());
    console.log(`Сообщение от клиента: ${JSON.stringify(request)}`);

    if (request.range) {
        [min, max] = request.range.split("-").map(Number);
        guess = Math.floor((min + max) / 2);
        server.send(JSON.stringify({ answer: guess }));
    } else if (request.hint) {
        if (request.hint === "more") {
            min = guess + 1;
        } else { 
            max = guess - 1;
        }
        guess = Math.floor((min + max) / 2);
        server.send(JSON.stringify({ answer: guess }));
    }
});

server.bindSync("tcp://*:5555");
console.log("Готов к игре...");
