var allNodes = [];
var clientPlayer;
//LOADERS
var textureLoader = new THREE.TextureLoader();
var fontLoader = new THREE.FontLoader();
//SETTING UP SCENES
var scenes = {
  playerScene: new THREE.Scene(),
  mainScene: new THREE.Scene()
}
for(var key in scenes){
  scenes[key].name = key;
}
var currentScene = scenes['mainScene'];
//SETTING UP RENDERER
var renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.autoClear = false;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.id = 'canvas';
document.body.appendChild(renderer.domElement);
//CAMERA
var worldCamera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 2000);
var playerCamera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 2000);
var cameras = [worldCamera, playerCamera]
//RESIZING RENDERER WITHOUT SCALING FOR PERSPECTIVE CAMERA
var tanFOV = [
  Math.tan( ( ( Math.PI / 180 ) * worldCamera.fov / 2 ) ),
  Math.tan( ( ( Math.PI / 180 ) * playerCamera.fov / 2 ) )
]
var windowHeight = window.innerHeight;
window.addEventListener('resize', function(){
  for(var i=0; i<cameras.length; i++){
    cameras[i].aspect = window.innerWidth / window.innerHeight;
    cameras[i].fov = (360 / Math.PI) * Math.atan(tanFOV[i] * (window.innerHeight / windowHeight));
    cameras[i].updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

//KEYBOARD CONTROLS
var keyState = {};
var keyboardEvents = function(){
  document.addEventListener('keydown', function(e){
    var keyCode = event.which || event.keyCode;
    keyState[keyCode] = true;
  });
  document.addEventListener('keyup', function(e){
    var keyCode = event.which || event.keyCode;
    keyState[keyCode] = false;
  });
}

//STOP DEFAULT TOUCH ZOOMING
window.addEventListener("touchstart", function(e){
  if(e.touches.length>1){
    e.preventDefault();
  }
}, {passive: false});

//MOUSE CONTROLS
var clickOrDrag = 0;
var doubleClick = false;
var doubleClickTimeout;

var mouseEvents = function(){
  window.addEventListener('click', dragStart);

  function dragStart(){
    if(doubleClick){
      clearTimeout(doubleClickTimeout);
    }
    doubleClick = true;
    doubleClickTimeout = setTimeout(function(){
      doubleClick = false;
    }, 500);
  }
}

//RAYCAST EVENTS
var raycaster = new THREE.Raycaster();
var selectableItems = [];
var transformableItems = [];

var raycastEvents = function(){
  var mouse = new THREE.Vector2();
  var held = false;
  var resizing = false;
  var pivotX=0, pivotY=0;
  var clickLoc;
  var initialScale = {x: 0, y:0}
  var transformable = null;
  var selectedItem = null;

  window.addEventListener('mousedown', dragStart);
  window.addEventListener('touchstart', dragStart);
  window.addEventListener('mousemove', drag);
  window.addEventListener('touchmove', drag);
  window.addEventListener('mouseup', dragEnd);
  window.addEventListener('touchend', dragEnd);

  function dragStart(e){
    clickOrDrag = 0;

    var clientX=0, clientY=0;
    if (e.type === "touchstart") {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    mouse.x = ( clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera(mouse, worldCamera);

    var itemsIntersected = raycaster.intersectObjects(selectableItems);
    var transformableItemsIntersected = raycaster.intersectObjects(transformableItems);

    if(transformableItemsIntersected.length>0){
      held = true;
      clickLoc = canvasToWorldLoc(clientX, clientY);
      for(var i=0; i<transformableItemsIntersected.length; i++){
        transformable = transformableItemsIntersected[i].object.parent;
        pivotX = clickLoc.x-transformable.position.x;
        pivotY = clickLoc.y-transformable.position.y;

        if(!transformable.scalable) return;

        var point = transformableItemsIntersected[i].point;
        var leftEdge = transformable.position.x - transformable.collisionArea.scale.x/2;
        var rightEdge = transformable.position.x + transformable.collisionArea.scale.x/2;
        var topEdge = transformable.position.y + transformable.collisionArea.scale.y/2;
        var bottomEdge = transformable.position.y - transformable.collisionArea.scale.y/2;

        if(
          (point.x < leftEdge+10 || point.x > rightEdge-10) &&
          (point.y < topEdge+10 || point.y > bottomEdge-10)
        ){
          resizing = true;
          initialScale.x = transformable.scale.x;
          initialScale.y = transformable.scale.y;
        }
      }
    } else if(transformableItems.length>0){
      transformableItems[0].parent.disableTransform();
      transformable = null;
    }

    if(itemsIntersected.length>0){
      if(transformable) return;
      if(selectedItem) selectedItem.unhighlight();
      selectedItem = itemsIntersected[0].object.parent;
      selectedItem.highlight();
      optionsMenu.activate('options', selectedItem.options);
    } else {
      if(selectedItem){
        selectedItem.unhighlight();
        selectedItem = null;
      }
    }
  }
  function drag(e){
    clickOrDrag = 1;
    if(held){
      var clientX = 0, clientY=0;
      if (e.type === "touchmove") {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      var loc = canvasToWorldLoc(clientX, clientY);

      if(resizing){
        var newScale = {
          x: (loc.x-clickLoc.x)/100,
          y: (loc.y-clickLoc.y)/100
        }
        newScale.x = Math.round(newScale.x*100)/100;
        newScale.y = Math.round(newScale.y*100)/100;
        transformable.scale.x = initialScale.x + newScale.x;
        transformable.scale.y = initialScale.y + newScale.y;
        if(transformable.scale.x<1) transformable.scale.x = 1;
        if(transformable.scale.y<1) transformable.scale.y = 1;
      } else {
        var newPosition = {
          x: loc.x - pivotX,
          y: loc.y - pivotY
        }
        newPosition.x = Math.round(newPosition.x*100)/100;
        newPosition.y = Math.round(newPosition.y*100)/100;
        transformable.position.x = newPosition.x;
        transformable.position.y = newPosition.y;

        socket.emit('updateItemPosition', {
          itemType: transformable.itemType,
          itemId: transformable.itemId,
          x: transformable.position.x,
          y: transformable.position.y
        });
      }
    }
  }
  function dragEnd(){
    if(held){
      held = false;
      resizing = false;
    }
  }
}

/* INGAME CLASSES */

class Node extends THREE.Object3D {
  constructor(x,y,scene){
    super();
    this.position.set(x,y,0);
    scenes[scene].add(this);
    allNodes.push(this);
  }
  update(){}
}

//networkManager
class NetworkManager {
  constructor(){
    this.serverPlayers = {};
    this.serverItems = {};
    this.downloadedAssets = "downloadedAssets";
    this.lobbyEvents();
  }
  lobbyEvents(){
    var that = this;

    socket.on('register', function(data){
      console.log(data.id + ' connected to server');
    });

    socket.on('spawn', function(data){
      console.log(data.id + ' spawned in game with username: ' + data.username);
      that.serverPlayers[data.id] = new Player(data.username, data.avatarOpts, 'playerScene');
      that.serverPlayers[data.id].playerId = data.id;
      that.serverPlayers[data.id].peerId = data.peerId;
      that.serverPlayers[data.id].position.x = data.x;
      that.serverPlayers[data.id].position.y = data.y;
      that.serverPlayers[data.id].changeText(data.text);

      if(socket.id == data.socketId){
        that.serverPlayers[data.id].controlling = true;
        clientPlayer = that.serverPlayers[data.id];
        start();
      } else {
        that.serverPlayers[data.id].otherPlayers();
      }
    });

    socket.on('disconnected', function(data){
      if(that.serverPlayers[data.id]){
        console.log(data.id + ' disconnected from game');
        that.serverPlayers[data.id].destroy();
        delete that.serverPlayers[data.id];
      }
    });

    socket.on('updatePosition', function(data){
      that.serverPlayers[data.id].position.x = data.x;
      that.serverPlayers[data.id].position.y = data.y;
    });
    socket.on('updateActivePlayers', function(data){
      dom.activeUsers.innerHTML = data;
    });
    socket.on('sendText', function(data){
      that.serverPlayers[data.id].changeText(data.text);
    });
    socket.on('switchScene', function(data){
      that.serverPlayers[data.id].switchScene(data.scene);
    });
  }
  ingameEvents(){
    var that = this;

    socket.on('updateTime', function(data){
      dom.clock.innerHTML = 'day: ' + data.day + ' time: ' + data.hours + ':' + data.minutes + ':' + data.seconds;
    });

    socket.on('updateItemPosition', function(data){
      that.serverItems[data.itemId].position.x = data.x;
      that.serverItems[data.itemId].position.y = data.y;
    });
    socket.on('removeItem', function(data){
      that.serverItems[data.itemId].destroy();
    });
    socket.on('addInternalPortal', function(data){
      that.serverItems[data.itemId].internalPortal = new InternalPortal(data.x, data.y, that.serverItems[data.itemId]);
    });

    socket.on('sendItem', function(data){
      console.log(data.id + ' added to ' + data.itemType + 's');

      switch(data.itemType){
        case 'image':
          var path = that.downloadedAssets + '/' + data.name;
          that.serverItems[data.id] = new BongoImage(path, data.x, data.y, data.scene);
          break;
        case 'audio':
          var path = that.downloadedAssets + '/' + data.name;
          that.serverItems[data.id] = new BongoAudio(path, data.x, data.y, data.scene);
          break;
        case 'room':
          that.serverItems[data.id] = new BongoRoom(data.roomName, data.x, data.y, data.scene);
          break;
        case 'portal':
          that.serverItems[data.id] = new BongoPortal(data.x, data.y, data.portalX, data.portalY, data.scene);
          break;
        case 'text':
          that.serverItems[data.id] = new BongoText(data.text, data.x, data.y, data.size, data.scene);
          break;
        case 'iframe':
          that.serverItems[data.id] = new DomIframe(data.url, data.x, data.y);
          break;
      }

      that.serverItems[data.id].itemId = data.id;
      that.serverItems[data.id].itemType = data.itemType;
      that.serverItems[data.id].selectable();
      if(data.internalPortal){
        that.serverItems[data.id].internalPortal = new InternalPortal(data.internalPortal.x, data.internalPortal.y, that.serverItems[data.id]);
      }
    });
  }
}

//player
class Player extends Node {
  constructor(username, avatarOpts, scene){
    super(0,0,scene);
    this.playerId = null;
    this.peerId = null;
    this.username = username;
    this.controlling = false;

    this.avatarOpts = avatarOpts;

    var size = 30;

    this.avatar = new THREE.Object3D();
    this.face = new Sprite(globalData.avatarImgs.face, size);
    this.face.material.color = new THREE.Color(this.avatarOpts.face.color);
    this.hair = new Sprite(globalData.avatarImgs.hair[this.avatarOpts.hair.type], size*1.3, -size*0.1, size*0.4);
    this.hair.material.color = new THREE.Color(this.avatarOpts.hair.color);
    this.leftShoe = new Sprite(globalData.avatarImgs.shoes[this.avatarOpts.shoes.type], size*0.8, 0, -size*0.8);
    this.leftShoe.material.color = new THREE.Color(this.avatarOpts.shoes.color);
    this.rightShoe = new Sprite(globalData.avatarImgs.shoes[this.avatarOpts.shoes.type], size*0.8, size/2, -size*0.7);
    this.rightShoe.material.color = new THREE.Color(this.avatarOpts.shoes.color);
    this.avatar.add(this.leftShoe);
    this.avatar.add(this.rightShoe);
    this.avatar.add(this.face);
    this.avatar.add(this.hair);
    this.add(this.avatar);

    this.canvasText = new CanvasText(this.username, 2000);
    this.canvasText.position.y = 45;
    this.add(this.canvasText);

    this.direction = {x:0,y:0};
    this.speed = {x:0, y:0};
    this.maxSpeed = 1.5;
    this.acc = 0.03;
    this.target = null;

    this.cachedPosition = {
      x: this.position.x,
      y: this.position.y
    }
    this.position.z = 3;

    this.inventory = {
      cupphones: 0,
      records: []
    }
  }
  otherPlayers(){
    var that = this;
    this.collisionArea = new CollisionArea(500, 500);
    this.collisionArea.onEnter = function(){
      console.log('collision entered');

      if(voiceChat.active){
        voiceChat.call(that.peerId, that.playerId);
      }
    }
    this.collisionArea.onExit = function(){
      console.log('collision exited');

      for(var i=0; i<voiceChat.calling.length; i++){
        if(voiceChat.calling[i].playerId == that.playerId){
          voiceChat.endCall(that.peerId, that.playerId);
          return;
        }
      }
    }
    this.add(this.collisionArea);
  }
  destroy(){
    removeFromArray(allNodes, this);
    if(this.collisionArea){
      this.remove(this.collisionArea);
      this.collisionArea.destroy();
      this.collisionArea = undefined;
    }
    while(this.avatar.children.length>0){
      this.avatar.children[0].destroy();
    }
    this.remove(this.avatar);
    this.parent.remove(this);
    this.avatar = undefined;
    for(var i=0; i<voiceChat.calling.length; i++){
      if(voiceChat.calling[i].playerId == this.playerId){
        voiceChat.endCall(this.peerId, this.playerId);
        return;
      }
    }
  }
  changeText(text){
    this.canvasText.changeText(text);
  }
  switchScene(sceneName){
    this.parent.remove(this);
    scenes[sceneName].add(this);
  }
  movement(){
    if(keyState[68] || keyState[39]){
      this.direction.x = 1;
      this.target = null;
    } else if (keyState[65] || keyState[37]){
      this.direction.x = -1;
      this.target = null;
    } else if(!this.target){
      this.direction.x = 0;
    }
    if(keyState[87] || keyState[38]){
      this.direction.y = 1;
      this.target = null;
    } else if(keyState[83] || keyState[40]){
      this.direction.y = -1;
      this.target = null;
    } else if(!this.target){
      this.direction.y = 0;
    }
    /*x movememnt */
    if(this.direction.x!=0){
      this.speed.x = lerp(this.speed.x, this.maxSpeed*this.direction.x, this.acc);
    } else {
      this.speed.x = lerp(this.speed.x, 0, this.acc);
    }
    this.position.x += this.speed.x;
    /*y movement */
    if(this.direction.y!=0){
      this.speed.y = lerp(this.speed.y, this.maxSpeed*this.direction.y, this.acc);
    } else {
      this.speed.y = lerp(this.speed.y, 0, this.acc);
    }
    this.position.y += this.speed.y;
    //moving by clicking the mouse
    if(!this.target || drawingMode.active) return;
    if(this.position.x>this.target.x){
      this.direction.x = -1;
    } else if(this.position.x<this.target.x){
      this.direction.x = 1;
    } else {
      this.direction.x = 0;
    }
    if(this.position.y>this.target.y){
      this.direction.y = -1;
    } else if(this.position.y<this.target.y){
      this.direction.y = 1;
    } else {
      this.direction.y = 0;
    }
  }
  updatePosition(){
    if(this.cachedPosition.x != this.position.x || this.cachedPosition.y != this.position.y){
      socket.emit('updatePosition', {
        id: this.playerId,
        x: this.position.x,
        y: this.position.y
      });
      this.cachedPosition = {
        x: this.position.x,
        y: this.position.y,
        z: 0
      }

      dom.coordinates.innerHTML = 'x:' + ingameCoors(this.position.x) + ' y:' + ingameCoors(this.position.y);
    }
  }
  setPosFromCoors(x, y){
    this.position.x = Math.round(x*100);
    this.position.y = Math.round(y*100);
  }
  input(){
    var that = this;
    dom.clickableCanvasArea.addEventListener('click', function(e){
      if(clickOrDrag==1) return;
      if(doubleClick){
        that.target = null;
      } else {
        that.target = canvasToWorldLoc(e.clientX, e.clientY);
        that.target.x = Math.round(that.target.x);
        that.target.y = Math.round(that.target.y);
      }
    });
  }
  animation(){
  }
  updateVoiceChat(){
    for(var i=0; i<voiceChat.calling.length; i++){
      var otherPlayer = networkManager.serverPlayers[voiceChat.calling[i].playerId];
      var distance = this.position.distanceTo(otherPlayer.position);
      var mappedDistance = map(distance, 0, 500, 1, 0);
      if(mappedDistance<0) mappedDistance = 0;
      var call = voiceChat.calls[ voiceChat.calling[i].peerId ];
      call.stream.volume = mappedDistance;
    }
  }
  update(){
    if(this.controlling){
      this.movement();
      this.updatePosition();
      this.updateVoiceChat();
    }
  }
}

//camera
class CameraManager {
  constructor(){
    allNodes.push(this);
    this.worldCamera = worldCamera;
    this.playerCamera = playerCamera;
    this.target = null;
    this.zoomMin = 600;
    this.zoomMax = this.worldCamera.far-10;
    this.zoomLevel = this.zoomMax;

    this.worldCamera.position.z = this.zoomMax;
    this.playerCamera.position.z = this.zoomMin;

    this.hammertime = new Hammer(window);
    this.hammertime.get('pinch').set({ enable: true });

    this.pivot = {
      x: 0,
      y: 0
    }
    this.targetRotation = {};
    this.targetRotation.x = null;
    this.view = '2d';

    this.input();
  }
  input(){
    var that = this;
    document.addEventListener('keyup', function(e){
      var keyCode = e.keyCode;
      if(keyCode==86){
        //that.switchView();
      }
    });

    this.hammertime.on('pinchin', function(e){
      that.adjustZoom('zoomout');
    });
    this.hammertime.on('pinchout', function(e){
      that.adjustZoom('zoomin');
    });
  }
  setTarget(target){
    this.target = target;
  }
  adjustZoom(dir){
    if(dir=='zoomin'&& this.zoomLevel>this.zoomMin){
      this.zoomLevel -= 10;
    } else if(dir=='zoomout' && this.zoomLevel<this.zoomMax){
      this.zoomLevel += 10;
    }
  }
  switchView(){
    if(this.view=='2d'){
      this.targetRotation.x += 0.8;
      this.pivot.y = this.targetRotation.x*-666.66;
      this.view = '3d';
    } else {
      this.targetRotation.x = 0;
      this.pivot.y = 0;
      this.view = '2d';
    }
  }
  update(){
    if(typeof this.targetRotation.x == 'number'){
      this.worldCamera.rotation.x = lerp(this.worldCamera.rotation.x, this.targetRotation.x, 0.03);
    }
    if(this.target){
      this.worldCamera.position.x = lerp(this.worldCamera.position.x, this.target.position.x + this.pivot.x, 0.03);
      this.worldCamera.position.y = lerp(this.worldCamera.position.y, this.target.position.y + this.pivot.y, 0.03);

      this.playerCamera.position.x = this.worldCamera.position.x;
      this.playerCamera.position.y = this.worldCamera.position.y;

      this.worldCamera.position.z = lerp(this.worldCamera.position.z, this.zoomLevel, 0.02);
      this.worldCamera.updateProjectionMatrix();
      this.playerCamera.updateProjectionMatrix();
    }

    //zooming in and out
    if(keyState[187] || keyState[61]){
      this.adjustZoom('zoomin');
    }
    if(keyState[189] || keyState[173]){
      this.adjustZoom('zoomout');
    }
  }
}

//collision area
class CollisionArea extends THREE.Sprite {
  constructor(w, h){
    super(new THREE.SpriteMaterial({
      color: 0xffffff,
      transparent: true,
      depthWrite: false,
      depthTest: false
    }));
    this.scale.x = w;
    this.scale.y = h;
    allNodes.push(this);
    this.material.opacity = 0;
    this.inside = false;
  }
  destroy(){
    this.material.dispose();
    removeFromArray(allNodes, this);
  }
  collision(){
    if(!clientPlayer) return;
    var a = {
      position: {
        x: this.parent.position.x,
        y: this.parent.position.y,
      },
      scale: {
        x: this.scale.x,
        y: this.scale.y
      }
    }
    var col = collisionsDetection(clientPlayer, a);
    if(col){
      this.areaEntered();
    } else {
      this.areaExited();
    }
  }
  update(){
    this.collision();
  }
  areaEntered(){
    if(!this.inside){
      this.inside = true;
      if(this.onEnter) this.onEnter();
    }
  }
  areaExited(){
    if(this.inside){
      this.inside = false;
      if(this.onExit) this.onExit();
    }
  }
}

//sprite
class Sprite extends THREE.Mesh {
  constructor(path, width, x, y, scene){
    super();
    this.geometry = new THREE.PlaneBufferGeometry(1, 1);
    this.material = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true
    });

    var that = this;
    this.material.map = textureLoader.load(path, function(tex){
      var ratio = tex.image.height/tex.image.width;
      tex.anisotropy = 16;
      if(width && width>1){
        that.scale.x = width;
        that.scale.y = width*ratio;
      } else if(width && width<=1){
        that.scale.x = tex.image.width*width;
        that.scale.y = tex.image.height*width;
      } else if (typeof width == 'object'){
        if(width.maxWidth){
          that.scale.x = width.maxWidth;
          that.scale.y = width.maxWidth*ratio;
        }
        if(width.adjustCollisionSize){
          that.adjustCollisionSize();
        }
      } else {
        that.scale.x = tex.image.width;
        that.scale.y = tex.image.height;
      }
    });

    if(x) this.position.x = x;
    if(y) this.position.y = y;
    if(scene) scenes[scene].add(this)
  }
  adjustCollisionSize(){
    if(this.scale.x>=this.scale.y){
      this.parent.collisionArea.scale.x = this.scale.x*1.5;
      this.parent.collisionArea.scale.y = this.scale.x*1.5;
    } else {
      this.parent.collisionArea.scale.y = this.scale.y*1.5;
      this.parent.collisionArea.scale.x = this.scale.y*1.5;
    }
  }
  destroy(){
    this.geometry.dispose();
    this.material.dispose();
    this.material.map.dispose();
    if(this.parent) this.parent.remove(this);
  }
}

//portal
class InternalPortal {
  constructor(x, y, parent){
    this.x = x;
    this.y = y;
    this.parent = parent;
    this.input();
  }
  input(){
    var that = this;
    document.addEventListener('keyup', function(e){
      if(!that.parent.inCollision) return;
      var keyCode = e.keyCode;
      if(keyCode==69){
        clientPlayer.setPosFromCoors(that.x, that.y);
        centerTextControls.clear();
      }
    });
  }
}

//dom audio
class domAudio extends Audio {
  constructor(path, loop){
    super(path);
    if(loop) this.loop = true;
    allNodes.push(this);
  }
  update(){}
  fadeOut(output){
    this.update = function(){
      if(this.volume>output) this.volume -= 0.01;
    }
  }
  fadeIn(){
    this.update = function(){
      if(this.volume<1) this.volume += 0.01;
    }
  }
}

//text
class CanvasText extends THREE.Mesh {
  constructor(text, size){
    super();
    this.text = text;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.size = size;
    this.drawText(this.size);

    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.material = new THREE.MeshBasicMaterial({
      transparent: true
    });

    this.scale.x = this.canvas.width;
    this.scale.y = this.canvas.height;

    this.material.map = new THREE.Texture(this.canvas);
    this.material.map.anisotropy = 16;
    this.material.map.needsUpdate = true;
  }
  update(){
  }
  drawText(size){
    const borderSize = 100;
    const font =  size + "px 'IBM Plex Mono'";
    this.ctx.font = font;
    // measure how long the name will be
    const doubleBorderSize = borderSize * 2;
    const width = this.ctx.measureText(this.text).width + doubleBorderSize;
    const height = size + doubleBorderSize;
    this.canvas.width = width;
    this.canvas.height = height;

    //this.ctx.fillStyle = 'white';
    //this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

    this.ctx.font = font;
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = 'black';
    this.ctx.fillText(this.text, borderSize, borderSize);
  }
  changeText(text){
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.text = text;
    this.drawText(this.size);
    this.material.map.needsUpdate = true;
    const labelBaseScale = 0.01;
    this.scale.x = this.canvas.width  * labelBaseScale;
    this.scale.y = this.canvas.height * labelBaseScale;
  }
}

//user items
class Item extends Node {
  constructor(x,y,scene){
    super(x,y,scene);
    this.itemId = null;
    this.itemType = null;
    this.position.z = 2;
    this.scalable = false;
    this.options = [];
    this.optionsBucket = {};
    this.fillOptionsBucket();
  }
  fillOptionsBucket(){
    var that = this;
    this.optionsBucket['addInternalPortal'] = {
      text: 'Add Portal',
      function: function(){
        that.addInternalPortal();
      }
    }
    this.optionsBucket['transform'] = {
      text: 'Transform',
      function: function(){
        that.enableTransform();
      }
    }
    this.optionsBucket['delete'] = {
      text: 'Delete',
      function: function(){
        that.destroy();
      }
    }
    this.optionsBucket['shareLoc'] = {
      text: 'Share Location',
      function: function(){
        shareLocControls.shareLoc( ingameCoors(that.position.x), ingameCoors(that.position.y) );
        centerTextControls.tempMessage(1, 'Location copied', 5000);
      }
    }
  }
  addInternalPortal(){
    var that = this;
    ingameForm.activate(function(){
      var x = parseInt(ingameForm.dom.inputs[0].value);
      var y = parseInt(ingameForm.dom.inputs[1].value);
      console.log(x, y);
      this.internalPortal = new InternalPortal(x, y, that);
      socket.emit('addInternalPortal', {
        itemType: that.itemType,
        itemId: that.itemId,
        x: x,
        y: y
      });
    });
  }
  collide(w, h, onEnter, onExit){
    var that = this;
    this.inCollision = false;
    this.collisionArea = new CollisionArea(w, h);
    this.collisionArea.onEnter = function(){
      console.log('collision area entered');
      that.inCollision = true;
      if(typeof onEnter != 'undefined') onEnter();
    }
    this.collisionArea.onExit = function(){
      console.log('collision area exited');
      that.inCollision = false;
      if(typeof onExit != 'undefined') onExit();
    }
    this.add(this.collisionArea);
  }
  interact(key, onClick){
    var that = this;
    var onClick = onClick;
    document.addEventListener('keyup', function(e){
      if(!that.inCollision) return;
      var keyCode = e.keyCode;
      if(keyCode==key){
        onClick();
      }
    });
  }
  selectable(){
    selectableItems.push(this.sprite);
  }
  unselectable(){
    removeFromArray(selectableItems, this.sprite);
  }
  highlight(){
    this.collisionArea.material.opacity = 0.2;
  }
  unhighlight(){
    this.collisionArea.material.opacity = 0;
  }
  enableTransform(){
    transformableItems = [this.collisionArea];
    this.collisionArea.material.opacity = 0.4;
  }
  disableTransform(){
    transformableItems = [];
    this.collisionArea.material.opacity = 0;
  }
  destroy(){
    removeFromArray(allNodes, this);
    this.unselectable();
    this.remove(this.sprite);
    this.remove(this.collisionArea);
    this.parent.remove(this);
    this.sprite.destroy();
    this.sprite = undefined;
    this.collisionArea.destroy();
    this.collisionArea = undefined;
    if(this.audio) this.audio.pause();
    if(this.itemType) socket.emit('removeItem', {itemId: this.itemId, itemType: this.itemType});
  }
}

//image
class BongoImage extends Item {
  constructor(path, x, y, scene){
    super(x, y, scene);
    this.sprite = new Sprite(path, {maxWidth: 300, adjustCollisionSize: true});
    this.scalable = true;
    this.collide(1, 1);

    this.options = [
      this.optionsBucket['addInternalPortal'],
      this.optionsBucket['transform'],
      this.optionsBucket['delete'],
      this.optionsBucket['shareLoc']
    ]

    this.add(this.sprite);
  }
}

class BongoAudio extends Item {
  constructor(audio, x, y, scene){
    super(x, y, scene);
    var that = this;
    this.audio = new domAudio(audio, true);
    this.sprite = new Sprite('imgs/ui/audio_world.png', 60);

    this.collide(300, 300, function(){
      //bgmusic.fadeOut(0.2);
      that.audio.play();
    }, function(){
      //bgmusic.fadeIn();
      that.audio.pause();
    });

    this.optionsBucket['pickupRecord'] = {
      text: 'take record',
      function: function(){
        that.pickupRecord();
      }
    }
    this.optionsBucket['play'] = {
      text: 'play',
      function: function(){
        that.audio.play();
      }
    }
    this.options = [
      this.optionsBucket['addInternalPortal'],
      this.optionsBucket['transform'],
      this.optionsBucket['delete'],
      this.optionsBucket['pickupRecord'],
      this.optionsBucket['shareLoc']
    ]

    this.add(this.sprite);
  }
  pickupRecord(){
    console.log('picked up record ' + this.path);
    clientPlayer.inventory.records.push(new domAudio(this.path ,true));
  }
  calculateDistance(){
    var distance = this.position.distanceTo(clientPlayer.position);
    var mappedDistance = map(distance, this.collisionArea.scale.x/2, 0, 0, 1);
    mappedDistance = Math.round(mappedDistance * 100)/100;
    if(mappedDistance<0) mappedDistance=0;
    if(mappedDistance>1) mappedDistance=1;
    return mappedDistance;
  }
  update(){
    if(!this.audio.paused){
      this.audio.volume = this.calculateDistance();
      this.sprite.rotation.z += 0.01; //*dt;
    }
  }
}

class RadioAudio extends Item {
  constructor(path, x, y, scene){
    super(x, y, scene);
    var that = this;
    allNodes.push(this);

    this.audio = new domAudio(path, true);
    this.sprite = new Sprite('imgs/ui/slacker.png', 180);

    this.collide(700, 700, function(){
      //bgmusic.fadeOut(0.2);
      that.audio.play();
    }, function(){
      //bgmusic.fadeOut(0.2);
      that.audio.pause();
    });

    this.add(this.sprite);
  }
  calculateDistance(){
    var distance = this.position.distanceTo(clientPlayer.position);
    var mappedDistance = map(distance, this.collisionArea.scale.x/2, 0, 0, 1);
    mappedDistance = Math.round(mappedDistance * 100)/100;
    if(mappedDistance<0) mappedDistance=0;
    if(mappedDistance>1) mappedDistance=1;
    return mappedDistance;
  }
  update(){
    if(!this.audio.paused){
      this.audio.volume = this.calculateDistance();
      this.sprite.rotation.z += 0.01; //*dt;
    }
  }
}

class BongoRoom extends Item {
  constructor(roomName, x, y, scene){
    super(x, y, scene);
    var that = this;
    this.roomName = roomName;
    this.scene = new THREE.Scene();
    this.scene.name = this.roomName;
    scenes[this.roomName] = this.scene;
    this.sprite = new Sprite('imgs/ui/room.png', 65);
    this.insideRoom = false;

    this.collide(100, 100, function(){
      centerTextControls.message(0, 'click [E] to enter room: ' + that.roomName)
    }, function(){
      if(currentScene!=scenes['mainScene']) return;
      centerTextControls.clear(0);
    });

    this.interact(69, function(){
      if(!that.insideRoom){
        that.enterRoom();
      } else {
        that.exitRoom();
      }
    });

    this.options = [
      this.optionsBucket['transform'],
      this.optionsBucket['delete'],
      this.optionsBucket['shareLoc']
    ]

    this.add(this.sprite);
  }
  enterRoom(){
    currentScene = this.scene;
    centerTextControls.message(0, 'click [E] to go back outside');
    this.insideRoom = true;
    this.updateServer();
  }
  exitRoom(){
    currentScene = scenes['mainScene'];
    clientPlayer.position.x = this.position.x;
    clientPlayer.position.y = this.position.y;
    centerTextControls.clear();
    this.insideRoom = false;
    this.updateServer();
  }
  updateServer(){
    socket.emit('switchScene', {
      id: clientPlayer.playerId,
      scene: currentScene.name
    });
  }
}

class BongoPortal extends Item {
  constructor(x, y, portalX, portalY, scene){
    super(x, y,scene);
    var that = this;
    this.portalX = portalX;
    this.portalY = portalY;
    this.sprite = new Sprite('imgs/ui/portal.png', 25);

    this.collide(100, 100, function(){
      var message = 'click [E] to teleport to x: ' + that.portalX + ', y: ' + that.portalY;
      centerTextControls.message(0, message)
    }, function(){
      centerTextControls.clear(0);
    });

    this.interact(69, function(){
      clientPlayer.setPosFromCoors(that.portalX, that.portalY);
      centerTextControls.clear(0);
    });

    this.options = [
      this.optionsBucket['delete'],
      this.optionsBucket['shareLoc']
    ]

    this.add(this.sprite);
  }
  update(){
    if(this.inCollision){
      this.sprite.material.rotation = lerp(this.sprite.material.rotation, Math.PI*2, 0.05);
    } else {
      this.sprite.material.rotation = lerp(this.sprite.material.rotation, 0, 0.05);
    }
  }
}

class BongoText extends Item {
  constructor(text, x, y, size, scene){
    super(x,y,scene);
    var that = this;
    this.text = new CanvasText(text, size);

    this.collide(this.text.canvas.width*0.5, this.text.canvas.height);

    this.options = [
      this.optionsBucket['delete'],
      this.optionsBucket['shareLoc'],
      this.optionsBucket['transform']
    ]

    this.add(this.text);
  }

  selectable(){
    selectableItems.push(this.text);
  }

  destroy(){
    removeFromArray(allNodes, this);
    this.remove(this.text);
    this.remove(this.collisionArea);
    this.parent.remove(this);
    this.text.geometry.dispose();
    this.text.material.dispose();
    this.text = undefined;
    this.collisionArea.destroy();
    this.collisionArea = undefined;
    socket.emit('removeItem', {itemId: this.itemId, itemType: this.itemType});
  }
}

class BongoShape extends Item {
  constructor(x,y,points,scene){
    super(x,y,scene);

    this.shape = new THREE.Shape();
    this.shape.moveTo(0, 0);
    for(var i=0; i<points.length; i++){
      this.shape.lineTo(points[i].x, points[i].y);
    }
    this.shape.lineTo(0, 0);

    this.mesh = new THREE.Mesh();
    this.mesh.geometry = new THREE.ShapeGeometry(this.shape);
    this.mesh.material = new THREE.MeshBasicMaterial();
    this.mesh.material.color.setHex(0x00ff00);
    this.add(this.mesh);
  }
}

/* built-in items */

class Cupphone extends Item {
  constructor(x, y, scene){
    super(x, y, scene);
    var that = this;
    this.sprite = new Sprite('imgs/cupphone.png', 30);

    this.collide(100, 100, function(){
      centerTextControls.message(0, 'click [E] to collect apple');
    }, function(){
      centerTextControls.clear(0);
    });

    this.interact(69, function(){
      clientPlayer.inventory.cupphones++;
      centerTextControls.clear(0);
      console.log('You have ' + clientPlayer.inventory.cupphones + ' cupphone');
      that.destroy();
    });

    this.add(this.sprite);
  }
}

class BongoPopup extends Item {
  constructor(x, y, scene, src, type){
    super(x, y, scene);
    var that = this;
    this.dom = {
      popupContainer: document.querySelector('#popupContainer'),
      popup: document.querySelector('#popupContainer').querySelectorAll('.popup')
    }
    this.src = src;
    this.type = type;
    this.sprite = new Sprite('imgs/disney/mark.png', 80);
    this.active = false;

    this.collide(100, 100, function(){
      that.activate();
    }, function(){
      that.deactivate();
    });

    this.add(this.sprite);
    this.input();
  }
  activate(){
    console.log('enter video');
    var that = this;
    this.active = true;
    this.dom.popup[this.type].src = this.src;
    if(this.type == 0) this.dom.popup[this.type].play();

    this.dom.popupContainer.style.display = 'block';
    setTimeout(function(){
      that.dom.popup[that.type].classList.add('popupAnimation');
    },1000);
  }
  deactivate(){
    console.log('exit video');
    var that = this;
    this.active = false;
    this.dom.popup[this.type].src = this.src;

    this.dom.popup[this.type].classList.remove('popupAnimation');
    setTimeout(function(){
      that.dom.popupContainer.style.display = 'none';
    },200);
  }
  input(){
    var that = this;
    window.addEventListener('mousedown', close);
    window.addEventListener('touchstart', close);

    function close(e){
      if(!that.active) return;
      if (that.dom.popup[that.type].contains(e.target)){
        //nothing happens
      } else {
        that.deactivate();
      }
    }
  }
}

/* other */

class DomIframe {
  constructor(url, x, y){
    allNodes.push(this);
    this.itemId = null;
    this.position = {
      x: x,
      y: y
    }
    this.iframe = document.createElement('iframe');
    this.iframe.src = url;
    dom.iframesContainer.append(this.iframe);
  }
  update(){
    this.position.x = -cameraManager.camera.position.x;
    this.position.y = -cameraManager.camera.position.y;
    this.iframe.style.transform = 'translate(' + this.position.x + 'px,' + -this.position.y + 'px)';
    this.iframe.style.webkitTransform = 'translate(' + this.position.x + 'px,' + -this.position.y + 'px)';
  }
}


class Marker extends Node {
  constructor(x,y,size,scene){
    super(x,y,scene);
    this.mesh = new THREE.Mesh();
    this.mesh.geometry = new THREE.CircleGeometry(size, size);
    this.mesh.material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true
    });
    this.mesh.material.opacity = 0.5;
    this.scale.x = 0;
    this.scale.y = 0;
    this.add(this.mesh);
  }
  destroy(){
    removeFromArray(allNodes, this);
    this.remove(this.mesh);
    this.parent.remove(this);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.mesh = undefined;
  }
  popupAnimation(){
    var animationSpeed = 0.1;
    this.scale.x = lerp(this.scale.x, 1, animationSpeed);
    this.scale.y = lerp(this.scale.y, 1, animationSpeed);
  }
  update(){
    this.popupAnimation();
  }
}

class Line extends THREE.Mesh {
  constructor(length){
    super();
    this.geometry = new THREE.BoxGeometry(2,2,length);
    this.position.z = length/2;
    this.material = new THREE.MeshBasicMaterial({color: 0xffffff});
  }
}
class Box extends THREE.Mesh {
  constructor(w,h,d,color){
    super();
    this.geometry = new THREE.BoxGeometry(w,h,d);
    this.position.z = h/2;
    this.material = new THREE.MeshBasicMaterial({color: color});
  }
}
class GeoText extends THREE.Mesh {
  constructor(text){
    super();
    var that = this;
    fontLoader.load( 'fonts/gentilis_regular.typeface.json', function(font){
      that.geometry = new THREE.TextGeometry(text, {
    		font: font,
    		size: 40,
    		height: 2
    	});

      that.material = new THREE.MeshBasicMaterial({color: 0xffffff});
    });
  }
}

class House extends Node {
  constructor(x, y, scene){
    super(x, y, scene);
    this.line = new Line(200);
    this.box = new Box(100, 50, 50, 0xffffff);

    this.prism = new THREE.Object3D();
    this.prism.position.z = 25;
    this.frontBlock = new Box(100, 40, 5, 0x000);
    this.frontBlock.rotation.x = 0.785398; //45deg
    this.frontBlock.position.set(0, -15, 50);
    this.backBlock = new Box(100, 40, 7, 0x000);
    this.backBlock.rotation.x = -0.785398; //45deg
    this.backBlock.position.set(0, 15, 50);
    this.prism.add(this.frontBlock);
    this.prism.add(this.backBlock);

    this.text = new GeoText('LIBRARY');
    this.text.rotation.x = Math.PI/2;
    this.text.position.set(-100, 0, 210);

    this.add(this.line);
    this.add(this.box);
    this.add(this.prism);
    this.add(this.text);
  }
}

//BUILDING THE GAME

var cameraManager = new CameraManager();
var networkManager = new NetworkManager();

function start(){
  cameraManager.setTarget(clientPlayer);
  clientPlayer.input();
  raycastEvents();
  keyboardEvents();
  mouseEvents();
  networkManager.ingameEvents();
}

var bgmusic = new domAudio('soundfiles/bgmusic.wav', true);


var popup1 = new BongoPopup(-380, 860, 'mainScene', 'popups/brother_bear.mp4', 0);
var popup2 = new BongoPopup(0, 600, 'mainScene', 'popups/big_thunger.mp4', 0);
var popup3 = new BongoPopup(-400, 500, 'mainScene', 'popups/brother_bear.mp4', 0);
var popup4 = new BongoPopup(-50, 350, 'mainScene', 'popups/mouseplanet.jpg', 1);
var popup5 = new BongoPopup(370, -360, 'mainScene', 'popups/bug_land.mp4', 0);
var popup6 = new BongoPopup(550, -360, 'mainScene', 'popups/bug_land.mp4', 0);
var popup7 = new BongoPopup(550, -500, 'mainScene', 'popups/bug_land.mp4', 0);
var popup8 = new BongoPopup(-280, -660, 'mainScene', 'popups/kings_triton.jpg', 1);
var popup9 = new BongoPopup(-50, -900, 'mainScene', 'popups/ariels_grotto.jpg', 1);
var popup10 = new BongoPopup(300, -700, 'mainScene', 'popups/bug_land.mp4', 0);
var disneyMap = new Sprite('imgs/disney/map.png', 0.3, 0, 0, 'mainScene');

/*
var greenland = new Sprite('imgs/continents/greenland.png', 0.6, -300, 600, 'mainScene');
var northAmerica = new Sprite('imgs/continents/north_america.png', 0.6, -900, 100, 'mainScene');
var southAmerica = new Sprite('imgs/continents/south_america.png', 0.6, -450, -620, 'mainScene');
var asiaEurope = new Sprite('imgs/continents/asia_europe.png', 0.6, 700, 180, 'mainScene');
var africa = new Sprite('imgs/continents/africa.png', 0.6, 270, -400, 'mainScene');

var radioTower = new Sprite('imgs/objects/radio_tower.png', 200, 750, 500, 'mainScene');
var pyramid = new Sprite('imgs/objects/pyramid.png', 100, 320, -150, 'mainScene');
var cactus = new Sprite('imgs/objects/cactus.png', 70, -800, 0, 'mainScene');

var library = new BongoRoom('library', 400, 70, 'mainScene');
var tip = new Sprite('imgs/tip.png', 300, 0, 0, 'library');

var languageCenter = new BongoRoom('language center', 600, 150, 'mainScene');
*/

var cloud = new Sprite('imgs/cloud.png', 300, 0, -70, 'mainScene');
cloud.position.z = 1400;
var cloud2 = new Sprite('imgs/cloud.png', 300, 150, 100,  'mainScene');
cloud2.position.z = 1500;
var cloud3 = new Sprite('imgs/cloud.png', 300, -400, 60,  'mainScene');
cloud3.position.z = 1400;

/*
var house = new House(-300, 500, 'mainScene');
house.rotation.z = 0.8;
var radio = new RadioAudio('http://www.partyviberadio.com:8000/;listen.pls?sid=1', 740, 760, 'mainScene');
*/

//var flight = new BongoAudio('soundfiles/she_took_flight.wav', 200, 200, 'mainScene', true);
//flight.selectable();

//RENDER LOOP
function animate(){
	requestAnimationFrame(animate);
  for(var i=0; i<allNodes.length; i++){
    allNodes[i].update();
  }
  renderer.clear();
  renderer.render(currentScene, worldCamera);
  renderer.clearDepth();
  renderer.render(scenes['playerScene'], playerCamera);
}
animate();


/* HELPER FUNCTION */

function ingameCoors(num){ //coordinates
  var coor = num/100;
  coor = Math.round(coor);
  return coor;
}
function canvasToWorldLoc(x, y){
  var vec = new THREE.Vector3(); // create once and reuse
  var pos = new THREE.Vector3(); // create once and reuse
  vec.set(
    ( x / window.innerWidth ) * 2 - 1,
    - ( y / window.innerHeight ) * 2 + 1,
    0.5
  );
  vec.unproject(worldCamera);
  vec.sub( worldCamera.position ).normalize();
  var distance = - worldCamera.position.z / vec.z;
  pos.copy( worldCamera.position ).add( vec.multiplyScalar( distance ) );
  return pos;
}
