import { io } from 'socket.io-client';

const URL = "http://localhost:3000";
const role = process.argv[2] ?? "user";
const netid = process.argv[3] ?? "ce123";

// Create a client to connect to the server
const socket = io(URL, { // io is a factory function that creates a socket instance
    transports: ['websocket'], // Specifies the transport to use for the socket connection
});

socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('identify', { role, netid });
});

socket.on("identify:error", (payload) => {
    console.log("identify:error", payload);
  });
  
socket.on("eventForm:new", (payload) => {
  console.log("eventForm:new", payload);
});

socket.on("eventForm:update", (payload) => {
  console.log("eventForm:update", payload);
});

socket.on("disconnect", (reason) => {
  console.log("disconnected", reason);
});

