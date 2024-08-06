import WebSocket from 'ws';

const server = new WebSocket.Server({ port: 8080 });

server.on('connection', (clientSocket) => {
    // console.log('conn')
    const targetSocket = new WebSocket('wss://server.meower.org'); // Replace with your target WebSocket server URL

    targetSocket.on('open', () => {
        console.log("Connected to target WebSocket server");
    });

    targetSocket.on('message', (data) => {
        clientSocket.send(data.toString());
    });

    targetSocket.on('close', () => {
        clientSocket.close();
    });

    targetSocket.on('error', (error) => {
        console.error("Error in target WebSocket server:", error);
        clientSocket.close();
    });

    clientSocket.on('message', (data) => {
        targetSocket.send(data);
    });

    clientSocket.on('close', () => {
        targetSocket.close();
    });

    clientSocket.on('error', (error) => {
        console.error("Error in client WebSocket:", error);
        targetSocket.close();
    });
});

console.log("WebSocket proxy server is running on ws://localhost:8080");
