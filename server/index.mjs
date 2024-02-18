import WebSocket, { WebSocketServer } from "ws";
const wss = new WebSocketServer({port: 8080});

const clients = {};
const rooms = {};

wss.on("connection", (connection) => {
  console.log("新使用者已經連線");

  connection.on("message", (message) => {
    console.log(`收到訊息 => ${message}`);
    const parsedMessage = JSON.parse(message);

    if (parsedMessage.type === "register") {
      const userId = parsedMessage.userId;
      clients[userId] = connection;
      connection.userId = userId;
      const otherClients = Object.keys(clients);
      let allRooms = [];
      for (const [key, value] of Object.entries(rooms)) {
        let id = key;
        let name = value.name;
        allRooms.push({id, name});
      }
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "registered", otherClients, allRooms }));
        }
      });
      return;
    }
    
    if(parsedMessage.type === "createRoom"){
      let roomID = parsedMessage.roomID;
      rooms[roomID] = {
        id: parsedMessage.roomID,
        name: parsedMessage.roomName
      }
      rooms[roomID].userList = [];
      rooms[roomID].userList.push(parsedMessage.fromID);
      let allRooms = [];
      for (const [key, value] of Object.entries(rooms)) {
        let id = key;
        let name = value.name;
        allRooms.push({id, name});
      }
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "newRoom", allRooms }));
        }
      });
      return;
    }

    if(parsedMessage.type === "joinRoom"){
      let roomID = parsedMessage.roomID;
      let fromID = parsedMessage.fromID;
      rooms[roomID].userList.push(fromID);
      let clientList = rooms[roomID].userList;
      rooms[roomID].userList.forEach(userID=>{
        const targetClient = clients[userID];
        if (targetClient && targetClient.readyState === WebSocket.OPEN) {
          targetClient.send(JSON.stringify({ type: "joinRoom", fromID, roomID, clientList}));
        }
      });
      return;
    }

    if(parsedMessage.type === "leaveRoom"){
      let roomID = parsedMessage.roomID;
      let fromID = parsedMessage.fromID;
      rooms[roomID].userList = arrayRemove(rooms[roomID].userList , fromID)
      let clientList = rooms[roomID].userList;
      rooms[roomID].userList.forEach(userID=>{
        const targetClient = clients[userID];
        if (targetClient && targetClient.readyState === WebSocket.OPEN) {
          targetClient.send(JSON.stringify({ type: "leaveRoom", fromID, roomID, clientList}));
        }
      });
      if(rooms[roomID].userList.length === 0){
        delete rooms[roomID];
      }
      let allRooms = [];
      for (const [key, value] of Object.entries(rooms)) {
        let id = key;
        let name = value.name;
        allRooms.push({id, name});
      }
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "newRoom", allRooms }));
        }
      });
      return;
    }
    
    if (parsedMessage.type === "message") {
      const targetUserId = parsedMessage.targetUserId;
      const fromID = parsedMessage.fromID;
      const roomID = parsedMessage.roomID;
      if(roomID){
        if(targetUserId){
          const targetClient = clients[targetUserId];
          if (targetClient && targetClient.readyState === WebSocket.OPEN) {
            targetClient.send(JSON.stringify({ type: "message", "message": parsedMessage.message, fromID, roomID, targetUserId, private: true }));
          }
        }else{
          rooms[roomID].userList.forEach(userID=>{
            const targetClient = clients[userID];
            if (targetClient && targetClient.readyState === WebSocket.OPEN) {
              targetClient.send(JSON.stringify({ type: "message", message: parsedMessage.message, fromID, roomID}));
            }
          });
        }
        return false;
      }
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "message", "message": parsedMessage.message, fromID }));
        }
      });
    }
  });
  
  connection.on("close", () => {
    console.log("已經用者斷開連線");
    let dsID = connection.userId;
    if (connection.userId) {
      delete clients[connection.userId];
    }
    const otherClients = Object.keys(clients);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "disconnected", otherClients , disconnectedID: dsID}));
      }
    });
  });
});

function arrayRemove(arr, value) {
  return arr.filter(function (item) {
      return item != value;
  });
}