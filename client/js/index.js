const ws = new WebSocket("ws://localhost:8080");
const leftArea = document.querySelector(".left .list");
const leftTitle = document.querySelector(".left h3");
const rightArea = document.querySelector(".right .list");
const rightTitle = document.querySelector(".right h3");
const btnSend = document.querySelector(".btn-send");
const btnCroom = document.querySelector(".btn-croom");
const msgInput = document.querySelector("[name=msg]");
const userId = new Date().getTime().toString();
let clientList, targetUserId, roomID, roomList;
let roomName = "";

ws.addEventListener("open", () => {
  console.log("Connected to the WebSocket");
  leftArea.innerHTML += `<div>已進入聊天室，你的ID是：${userId}</div>`;
  let prarms = {
    type: "register",
    userId: userId
  }
  ws.send(JSON.stringify(prarms));
});

btnSend.addEventListener("click", ()=>{
  sendMessage()
});
msgInput.addEventListener("keydown", (e)=>{
  if(e.key === "Enter"){
    sendMessage()
  }
});
btnCroom.addEventListener("click", ()=>{
  createRoom()
});


ws.addEventListener("message", async (event) => {
  let resutlt = JSON.parse(event.data);
  if(resutlt.type === "registered"){
    roomList = resutlt.allRooms;
    setRoomList();
    return false;
  }

  if(resutlt.type === "joinRoom"){
    clientList = resutlt.clientList;
    setClientList();
    return false;
  }
  if(resutlt.type === "leaveRoom"){
    clientList = resutlt.clientList;
    setClientList();
    return false;
  }
  if(resutlt.type === "newRoom"){
    roomList = resutlt.allRooms;
    setRoomList();
    return false;
  }

  if(resutlt.type === "message"){
    if(roomID && !resutlt.roomID){
      return false;
    }
    let fromID = resutlt.fromID;
    let toFix = `<span class="px-2">說</span>`;
    let icon;
    if(resutlt.private === true){
      toFix = `<span class="px-2">對你悄悄說: </span>`;
    }
    if(fromID === userId){
      icon = `<span class="badge bg-primary d-flex align-itmes-center">我自己</span>`
      if(targetUserId){
        toFix = `對<span class="badge bg-danger px-2">${targetUserId}</span>悄悄說: `;
      }else{
        toFix = `說: `;
      }
    }else{
      if(resutlt.private === true){
        icon = `<span class="badge bg-danger d-flex align-itmes-center">${fromID}</span>`
      }else{
        icon = `<span class="badge bg-primary d-flex align-itmes-center">${fromID}</span>`
      }
    }
    let msg = `<span">${resutlt.message}</span>`;
    leftArea.innerHTML += `<div class="d-flex align-itmes-center mb-1">${icon}${toFix}${msg}</div>`;
    scrollToBottom();
    return false;
  }

  if(resutlt.type === "disconnected"){
    if(!roomID){
      return false;
    }
    if(roomID !== resutlt.roomID){
      return false;
    }
    clientList = resutlt.otherClients;
    setClientList();
    return false;
  }
});

function createRoom(){
  if(roomID){
    let prarms = {
      type: "leaveRoom",
      fromID: userId,
      roomID: roomID
    }
    ws.send(JSON.stringify(prarms));
    rightTitle.innerHTML = "小房間列表";
    leftTitle.innerHTML = `聊天室`;
    leftArea.innerHTML = "";
    rightArea.innerHTML = "更新中...";
    btnCroom.innerHTML = "建立房間";
    btnCroom.classList.remove("btn-danger");
    roomID = undefined;
    roomName = undefined;
    return false;
  }
  roomID = `room${new Date().getTime().toString()}`;
  roomName = document.querySelector("[name=roomName]").value;
  if(roomName === ""){
    return false;
  }
  let prarms = {
    type: "createRoom",
    fromID: userId,
    roomName: roomName,
    roomID: roomID
  }
  ws.send(JSON.stringify(prarms));
  rightTitle.innerHTML = "使用者列表";
  leftTitle.innerHTML = `位於聊天室 ${roomName} 中`;
  leftArea.innerHTML = "";
  rightArea.innerHTML = "等待加入...";
  btnCroom.innerHTML = "離開房間";
  btnCroom.classList.add("btn-danger");
}

function sendMessage() {
  var message = msgInput.value;
  let prarms = {
    type: "message",
    message: message,
    fromID: userId
  }
  if(targetUserId){
    prarms.targetUserId = targetUserId;
  }
  if(roomID){
    prarms.roomID = roomID;
  }
  ws.send(JSON.stringify(prarms));
  console.log(prarms)
  msgInput.value = "";
}

function setRoomList(){
  if(roomID){
    return false;
  }
  let clientDOM = "";
  roomList.forEach((clientRoom)=>{
    let clientRoomID = clientRoom.id;
    let clientRoomName = clientRoom.name;
    let dom = `<div roomname="${clientRoomName}" roomid="${clientRoomID}" class="btn btn-secondary w-100 mb-1">${clientRoomName}</div>`
    clientDOM+=dom;
  });
  rightArea.innerHTML = clientDOM;
  let btns = rightArea.querySelectorAll(".btn");
  btns.forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      let roomid = e.currentTarget.getAttribute("roomid");
      let roomname = e.currentTarget.getAttribute("roomname");
      roomID = roomid;
      let prarms = {
        type: "joinRoom",
        fromID: userId,
        roomID: roomID
      }
      ws.send(JSON.stringify(prarms));
      rightTitle.innerHTML = "使用者列表";
      leftTitle.innerHTML = `位於聊天室 ${roomname} 中`;
      leftArea.innerHTML = "";
      rightArea.innerHTML = "更新中...";
      btnCroom.innerHTML = "離開房間";
      btnCroom.classList.add("btn-danger");
    })
  })
}

function setClientList(){
  console.log(clientList)
  clientDOM = "";
  clientList.forEach((client)=>{
    if(client !== userId){
      let dom = `<div idn="${client}" class="btn btn-secondary w-100 mb-1">${client}</div>`
      clientDOM+=dom;
    }
  });
  rightArea.innerHTML = clientDOM;
  let btns = rightArea.querySelectorAll(".btn");
  btns.forEach(btn=>{
    btn.addEventListener("click", (e)=>{
      let target = e.currentTarget;
      let idn = e.currentTarget.getAttribute("idn");
      if(targetUserId && targetUserId !== idn){
        return false;
      }
      if(target.classList.contains("btn-danger")){
        target.classList.remove("btn-danger");
        targetUserId = undefined;
      }else{
        target.classList.add("btn-danger");
        targetUserId = idn;
      }
    })
  })
}

function scrollToBottom() {
  leftArea.scrollTop = leftArea.scrollHeight - leftArea.clientHeight;
}


