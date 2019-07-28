var raycaster = new THREE.Raycaster();
var allNodes = [];
var clientPlayer;
var currentScene;

//MOUSE CONTROLS
var keyState = {};
document.addEventListener('keydown', function(e){
  var keyCode = e.keyCode;
  keyState[keyCode] = true;
});
document.addEventListener('keyup', function(e){
  var keyCode = e.keyCode;
  keyState[keyCode] = false;
});

//SETTING UP RENDERER, CAMERA, AND SCENE
var scene = new THREE.Scene();
currentScene = scene;
var playersScene = new THREE.Scene();
var clientPlayerScene = new THREE.Scene();
var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.autoClear = false;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.id = 'canvas';
document.body.appendChild(renderer.domElement);

//SETTING UP ORTHOGRAPHIC CAMERA
var w = window.innerWidth;
var h = window.innerHeight;
var viewSize = h;
var aspectRatio = w / h;
var viewport = {
    viewSize: viewSize,
    aspectRatio: aspectRatio,
    left: (-aspectRatio * viewSize) / 2,
    right: (aspectRatio * viewSize) / 2,
    top: viewSize / 2,
    bottom: -viewSize / 2,
    near: -1000,
    far: 1000
}
var camera = new THREE.OrthographicCamera (
    viewport.left,
    viewport.right,
    viewport.top,
    viewport.bottom,
    viewport.near,
    viewport.far
);

//RESIZING RENDERER WITHOUT SCALING FOR ORTHOGRAPHIC CAMERA CAMERA
window.addEventListener('resize', function(){
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);

    camera.left = -window.innerWidth / 2;
    camera.right = window.innerWidth /2;
    camera.top = window.innerHeight / 2;
    camera.bottom = -window.innerHeight / 2;
    camera.updateProjectionMatrix();
});

//RESIZING RENDERER WITHOUT SCALING FOR PERSPECTIVE CAMERA
/*
var tanFOV = Math.tan( ( ( Math.PI / 180 ) * camera.fov / 2 ) );
var windowHeight = window.innerHeight;
window.addEventListener('resize', function (){
    //camera.aspect = window.innerWidth / window.innerHeight;
    //camera.fov = (360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / windowHeight));
    //camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
});
*/

//CREATER AUDIO LISTERNER AND ADD IT TO CAMERA
var audioListener = new THREE.AudioListener();
camera.add(audioListener);

//LOADERS
var textureLoader = new THREE.TextureLoader();
var audioLoader = new THREE.AudioLoader();




/* INGAME CLASSES */

class Node {
  constructor(){
    allNodes.push(this);
  }
  update(){
  }
}

//networkIdentity
class NetworkIdentity {
  constructor(){
    this.id = null;
    this.controlling = false;
  }
  setNetworkId(id, clientId) {
    this.id = id;
    if(id == clientId){
      this.controlling = true;
    }
  }
}

//player
class Player extends Node {
  constructor(){
    super();
    this.geometry = new THREE.CircleGeometry(20, 20);
    /*this.material = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0x2a0000,
      shininess: 10,
      specular: 0xffffff
    });*/
    this.material = new THREE.MeshBasicMaterial( { color: 0x4f3a1d } );
    this.node = new THREE.Mesh(this.geometry, this.material);
    this.networkIdentity = new NetworkIdentity();
    this.username = null;
    this.speed = 3;
  }
  destroy(){
    playersScene.remove(this.node);
    this.geometry.dispose();
    this.material.dispose();
    this.node = undefined;
    allNodes.remove(this);
  }
  movement(){
    if(keyState[68] || keyState[39]){
      this.node.position.x += this.speed;
    }
    if(keyState[65] || keyState[37]){
      this.node.position.x -= this.speed;
    }
    if(keyState[87] || keyState[38]){
      this.node.position.y += this.speed;
    }
    if(keyState[83] || keyState[40]){
      this.node.position.y -= this.speed;
    }
  }
  updatePosition(){
    if(keyState[68] || keyState[65] || keyState[87] || keyState[83]){
      socket.emit('updatePosition', {
        id: this.networkIdentity.id,
        x: this.node.position.x,
        y: this.node.position.y
      });
    }
  }
  input(){
    document.addEventListener('keyup', function(e){
      var keyCode = e.keyCode;
      if(keyCode==86){
        mainCamera.switchView();
      }
    });
    document.addEventListener('mouseup', function(e){
      var drop = canvasToWorldLocOrth(e.clientX, e.clientY);
    })
  }
  update(){
    if(!this.networkIdentity.controlling) return;
    this.movement();
    this.updatePosition();
  }
}

//camera
class MainCamera extends Node {
  constructor(){
    super();
    this.node = camera;
    this.node.zoom = 0.3;
    this.player = null;
    this.view = 1;
    this.switchViewDirection = 0;
    this.switchView(0);
  }
  update(){
    if (this.player) {
      this.node.position.x = lerp(this.node.position.x, this.player.node.position.x, 0.02);
      this.node.position.y = lerp(this.node.position.y, this.player.node.position.y, 0.02);
    }
    this.node.zoom = lerp(this.node.zoom, this.limit, 0.02);
    this.node.updateProjectionMatrix();
  }
  setTarget(player){
    this.player = player;
  }
  switchView(view) {
    if (typeof view == 'undefined'){
      if(this.switchViewDirection==0){
        this.view++;
      } else {
        this.view--;
      }
      if(this.view==2) this.switchViewDirection = 1;
      if(this.view==0) this.switchViewDirection = 0;
    } else {
      this.view = view;
    }

    if(this.view == 0){
      this.limit = 1;
    } else if(this.view == 1){
      this.limit = 0.7;
    } else if(this.view == 2){
      this.limit = 0.3;
    }
    console.log('camera view: ' + this.view);
  }
}

//collision area
class CollisionArea extends THREE.Sprite {
  constructor(x, y, w, h){
    super(new THREE.SpriteMaterial({ color: '#69f' }));
    if(typeof w != undefined) this.scale.x = w;
    if(typeof h != undefined) this.scale.y = h;
    allNodes.push(this);
    scene.add(this);
    this.material.opacity = 0;
    this.position.set(x, y, 1);
    this.inside = false;
  }
  collision(){
    if(!clientPlayer) return;
    var col = collisionsDetection(clientPlayer.node, this);
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
class Sprite {
  constructor(path, x, y, w, h){
    var that = this;
    this.spriteMap = textureLoader.load(path, function(tex){
      if(typeof w == 'undefined' && typeof h == 'undefined'){
        that.sprite.scale.x = tex.image.width;
        that.sprite.scale.y = tex.image.height;
      }
      if(typeof h == 'undefined'){
        if(tex.image.width>w){
          var ratio = tex.image.height/tex.image.width;
          that.sprite.scale.x = w;
          that.sprite.scale.y = w*ratio;
        } else {
          that.sprite.scale.x = tex.image.width;
          that.sprite.scale.y = tex.image.height;
        }
      }
      //tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      //tex.offset.set(1, 1);
      //tex.repeat.set(5, 5);
    });
    this.spriteMap.anisotropy = 0;
    this.spriteMap.magFilter = THREE.NearestFilter;
    this.spriteMap.minFilter = THREE.NearestFilter;
    this.spriteMap.generateMipmaps = false;
    this.spriteMaterial = new THREE.SpriteMaterial( { map: this.spriteMap, transparent: true } );
    this.sprite = new THREE.Sprite(this.spriteMaterial);
    this.sprite.position.x = x;
    this.sprite.position.y = y;
    if(typeof w != 'undefined' && typeof h != 'undefined'){
      this.sprite.scale.x = w;
      this.sprite.scale.y = h;
    }
    scene.add(this.sprite);
  }
  destroy(){
    scene.remove(this.sprite);
    this.spriteMaterial.dispose();
    this.spriteMap.dispose();
    this.sprite = undefined;
  }
}

//media
class Media {
  constructor(){
    allNodes.push(this);
    this.id = null;
  }
  draggable(arrayType, onclick){
    var that = this;
    var arrayType = arrayType;
    if(typeof onclick != undefined) var onclick = onclick;
    var mouse = new THREE.Vector2();
    var held = false;
    var intersects = [];
    var pivotX=0, pivotY=0;
    var clickOrDrag = 0; //0 for click, 1 for drag

    window.addEventListener('mousedown', dragStart);
    window.addEventListener('touchstart', dragStart);
    window.addEventListener('mousemove', drag);
    window.addEventListener('touchmove', drag);
    window.addEventListener('mouseup', dragEnd);
    window.addEventListener('touchend', dragEnd);

    function dragStart(e){
      clickOrDrag = 0;
      var mouseX=0, mouseY=0;
      if (e.type === "touchstart") {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
      } else {
        mouseX = e.clientX;
        mouseY = e.clientY;
      }
      mouse.x = ( mouseX / window.innerWidth ) * 2 - 1;
      mouse.y = - ( mouseY / window.innerHeight ) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      intersects = raycaster.intersectObjects( [that.sprite.sprite] );
      if(intersects.length>0){
        held = true;
        var loc = canvasToWorldLocOrth(mouseX, mouseY);
        var obj = intersects[0].object;
        pivotX = loc.x-parseInt(obj.position.x);
        pivotY = loc.y-parseInt(obj.position.y);
      }
    }
    function drag(e){
      if(held){
        clickOrDrag = 1;
        var mouseX=0, mouseY=0;
        if (e.type === "touchstart") {
          mouseX = e.touches[0].clientX;
          mouseY = e.touches[0].clientY;
        } else {
          mouseX = e.clientX;
          mouseY = e.clientY;
        }
        var loc = canvasToWorldLocOrth(mouseX, mouseY);
        var obj = intersects[0].object;
        obj.position.x = loc.x - pivotX;
        obj.position.y = loc.y - pivotY;
        socket.emit('updateMediaPosition', {
          arrayType: arrayType,
          id: that.id,
          x: obj.position.x,
          y: obj.position.y
        });
      }
    }
    function dragEnd(){
      if(held){
        held = false;
        if(clickOrDrag==0 && onclick){ //click
          onclick();
        }
      }
    }
  }
  update(){

  }
}

//image
class Image extends Media {
  constructor(path, x, y){
    super();
    var that = this;
    this.highlighted = false;
    this.sprite = new Sprite(path, x, y, 500);
    this.collisionArea = new CollisionArea(x, y);
    this.collisionArea.onEnter = function(){
      console.log('image area entered');
      that.highlighted = true;
    }
    this.collisionArea.onExit = function(){
      console.log('image area exited');
      that.highlighted = false;
    }
    this.draggable('images');
  }
  update(){
    this.collisionArea.position.x = this.sprite.sprite.position.x;
    this.collisionArea.position.y = this.sprite.sprite.position.y;
    this.collisionArea.scale.x = this.sprite.sprite.scale.x*1.3;
    this.collisionArea.scale.y = this.sprite.sprite.scale.y*1.3;
    if (this.highlighted){
      this.sprite.spriteMaterial.rotation = lerp(this.sprite.spriteMaterial.rotation, 0.2, 0.1);
    } else {
      this.sprite.spriteMaterial.rotation = lerp(this.sprite.spriteMaterial.rotation, 0, 0.1);
    }
  }
}

class Audio extends Media {
  constructor(path, x, y){
    super();
    var that = this;
    this.audio = new THREE.Audio(audioListener);
    audioLoader.load(path, function(buffer){
      that.audio.setBuffer(buffer);
      that.audio.setLoop(true);
    });
    this.sprite = new Sprite('assets/imgs/audio.png', x, y, 150, 150);
    this.collisionArea = new CollisionArea(x, y, 300, 300);
    this.collisionArea.onEnter = function(){
      console.log('audio area entered');
      that.audio.play();
    }
    this.collisionArea.onExit = function(){
      console.log('audio area exited');
      that.audio.pause();
    }
    this.draggable('audios');
  }
  update(){
    this.collisionArea.position.x = this.sprite.sprite.position.x;
    this.collisionArea.position.y = this.sprite.sprite.position.y;
    if (this.audio.isPlaying){
      this.sprite.spriteMaterial.rotation += 0.01; //*dt;
    }
  }
}

class Hyperlink extends Media {
  constructor(x, y){
    super();
    var that = this;
    this.title = null;
    this.url = null
    this.highlighted = false;
    this.sprite = new Sprite('assets/imgs/hyperlink.png', x, y, 150, 150);
    this.collisionArea = new CollisionArea(x, y, 300, 300);
    this.collisionArea.onEnter = function(){
      console.log('hyperlink area entered');
      that.highlighted = true;
      dom.noticeText[1].innerHTML = 'Click on the hyperlink to go to the url';
    }
    this.collisionArea.onExit = function(){
      console.log('hyprlink area exited');
      that.highlighted = false;
      dom.noticeText[1].innerHTML = '';
    }
    this.draggable('hyperlinks', function(){
      window.open(that.url);
    });
  }
  update(){
    this.collisionArea.position.x = this.sprite.sprite.position.x;
    this.collisionArea.position.y = this.sprite.sprite.position.y;
    if (this.highlighted){
      this.sprite.spriteMaterial.rotation = lerp(this.sprite.spriteMaterial.rotation, Math.PI*2, 0.05);
    } else {
      this.sprite.spriteMaterial.rotation = lerp(this.sprite.spriteMaterial.rotation, 0, 0.05);
    }
  }
}

class Room extends Media {
  constructor(x, y){
    super();
    var that = this;
    this.scene = new THREE.Scene();
    this.roomName = null;
    this.sprite = new Sprite('assets/imgs/room.png', x, y, 150, 150);
    this.collisionArea = new CollisionArea(x, y, 300, 300);
    this.inCollision = false;
    this.insideRoom = false;
    this.input();
    this.collisionArea.onEnter = function(){
      console.log('room area entered');
      that.inCollision = true;
      dom.noticeText[1].innerHTML = 'click [E] to enter room: ' + that.roomName;
    }
    this.collisionArea.onExit = function(){
      if(currentScene!=scene) return;
      console.log('room area exited');
      that.inCollision = false;
      dom.noticeText[1].innerHTML = '';
    }
    this.draggable('rooms');
  }
  input(){
    var that = this;
    document.addEventListener('keyup', function(e){
      if(!that.inCollision) return;
      var keyCode = e.keyCode;
      if(keyCode==69){
        if(!that.insideRoom){
          currentScene = that.scene;
          dom.noticeText[1].innerHTML = 'click [E] to go back outside';
          that.insideRoom = true;
        } else {
          currentScene = scene;
          dom.noticeText[1].innerHTML = '';
          that.insideRoom = false;
        }
      }
    });
  }
}

class Tutorial {
  constructor(){
    this.movedLeft = false;
    this.movedRight = false;
    this.movedUp = false;
    this.movedDown = false;
    this.changedView = 0;
    this.tutorialPhase = 'movement';
    this.tutorialEvents = null;
    this.input();
  }
  switchTutorial(){
    if(this.tutorialPhase=='movement' && this.movedLeft && this.movedRight && this.movedUp && this.movedDown){
      this.tutorialPhase = 'changingView';
    }
    if(this.tutorialPhase=='changingView'){
      if(this.changedView>3){
        dom.noticeText[0].innerHTML = '';
        document.removeEventListener('keyup', this.tutorialEvents);
        return;
      }
      dom.noticeText[0].innerHTML = 'click [V] to change viewpoint';
    }
  }
  input(){
    var that = this;
    this.tutorialEvents = function(e){
      var keyCode = e.keyCode;
      switch(keyCode){
        case 68:
        case 39:
          that.movedRight = true;
          that.switchTutorial();
          break;
        case 65:
        case 37:
          that.movedLeft = true;
          that.switchTutorial();
          break;
        case 87:
        case 38:
          that.movedUp = true;
          that.switchTutorial();
          break;
        case 83:
        case 40:
          that.movedDown = true;
          that.switchTutorial();
          break;
        case 86:
          if(that.tutorialPhase=='changingView'){
            that.changedView++;
            that.switchTutorial();
          }
          break;
      }
    }
    document.addEventListener('keyup', this.tutorialEvents);
  }
}

//networkManager
class NetworkManager {
  constructor(){
    this.clientId = null;
    this.serverPlayers = {};
    this.serverMedia = {};
    this.imagesFolder = "downloadedAssets/imgs";
    this.audioFolder = "downloadedAssets/audio";
    this.socketEvents();
  }
  socketEvents(){
    var that = this;
    socket.on("register", function(data) {
      that.clientId = data.id;
      console.log(data.id + " connected to server");
    });
    socket.on("spawn", function(data) {
      console.log(data.id + " spawned in game with username: " + data.username);
      that.serverPlayers[data.id] = new Player();
      that.serverPlayers[data.id].node.position.set(data.x, data.y, 0);
      that.serverPlayers[data.id].username = data.username;
      that.serverPlayers[data.id].networkIdentity.setNetworkId(data.id, that.clientId);

      if(that.serverPlayers[data.id].networkIdentity.controlling){
        mainCamera.setTarget(that.serverPlayers[data.id]);
        that.serverPlayers[data.id].input();
        clientPlayer = that.serverPlayers[data.id];
        clientPlayerScene.add(that.serverPlayers[data.id].node);
      } else {
        playersScene.add(that.serverPlayers[data.id].node);
      }
    });
    socket.on("disconnected", function(data) {
      console.log(data.id + " disconnected from game");
      that.serverPlayers[data.id].destroy();
      delete that.serverPlayers[data.id];
    });
    socket.on("updatePosition", function(data) {
      that.serverPlayers[data.id].node.position.x = data.x;
      that.serverPlayers[data.id].node.position.y = data.y;
    });
    socket.on('updateActivePlayers', function(data){
      dom.activeUsers.innerHTML = data;
    });
    socket.on('updateTime', function(data){
      dom.clock.innerHTML = data;
      //var a = parseInt(data[6]+data[7]);
      ///var opacity = map(a,0,60,0,1);
      //console.log(a, opacity);
      //renderer.domElement.style.background = 'red';
      //renderer.domElement.style.background = 'rgba(228, 208, 165, ' + 0 + ');';
    });
    //socket.on("sendMessage", function(data) {
    //  var player = that.serverPlayers[data.id];
    //  player.node.getComponent("PlayerManager").showMessage(data.message);
    //});
    socket.on("sendImage", function(data){
      console.log(data.name + " img  instantiated");
      var path = that.imagesFolder + '/' + data.name;
      that.serverMedia[data.id] = new Image(path, data.x, data.y);
      that.serverMedia[data.id].id = data.id;
    });
    socket.on("sendAudio", function(data){
      console.log(data.name + " audio  instantiated");
      var path = that.audioFolder + '/' + data.name;
      that.serverMedia[data.id] = new Audio(path, data.x, data.y);
      that.serverMedia[data.id].id = data.id;
    });
    socket.on("sendHyperlink", function(data){
      console.log(data.id + " hyperlink instantiated from url: " + data.url);
      that.serverMedia[data.id] = new Hyperlink(data.x, data.y);
      that.serverMedia[data.id].id = data.id;
      that.serverMedia[data.id].title = data.title;
      that.serverMedia[data.id].url = data.url;
    });
    socket.on("sendRoom", function(data){
      console.log(data.id + " room instantiated with name: " + data.roomName);
      that.serverMedia[data.id] = new Room(data.x, data.y);
      that.serverMedia[data.id].id = data.id;
      that.serverMedia[data.id].roomName = data.roomName;
    });
    socket.on("updateMediaPosition", function(data){
      that.serverMedia[data.id].sprite.sprite.position.x = data.x;
      that.serverMedia[data.id].sprite.sprite.position.y = data.y;
    });
    socket.on("clearMedia", function() {
      console.log("clearing all media in client");
      console.log(that.serverMedia);
      for (var media in that.serverMedia) {
        //that.serverMedia[media].sprite.destroy();
      }
      //that.serverMedia = {};
    });
    //socket.on('uploadProgress', function(){
    //  console.log(data);
    //});
  }
}



//BUILDING THE GAME

var mainCamera = new MainCamera();
var networkManager = new NetworkManager();
var tutorial = new Tutorial();
var river = new Sprite('assets/imgs/river.png', 0, 0);
var river2 = new Sprite('assets/imgs/river.png', 1427, 1245);
var river3 = new Sprite('assets/imgs/river.png', 1427*2, 1245*2);
var river4 = new Sprite('assets/imgs/river.png', -1427, -1245);
var river5 = new Sprite('assets/imgs/river.png', -1427*2, -1245*2);
scene.add(river.sprite);



//RAYCASTING
/*
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
window.addEventListener('click', function(e){
	mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
	// calculate objects intersecting the picking ray
	var intersects = raycaster.intersectObjects( scene.children );
	for (var i = 0; i<intersects.length; i++) {
		//intersects[i].object.material.color.set(0xff0000);
    //console.log(intersects[i].object.owner.owner);
	}
});
*/

//RENDER LOOP
function animate() {
	requestAnimationFrame( animate );
  for(var i=0; i<allNodes.length; i++){
    allNodes[i].update();
  }
  renderer.clear();
  renderer.render(currentScene, camera);
  renderer.clearDepth();
  if(currentScene==scene){
    renderer.render(playersScene, camera);
    renderer.clearDepth();
  }
  renderer.render(clientPlayerScene, camera);
}
animate();


/* HELPER FUNCTION */

function collisionsDetection(rect1, rect2){
  var collision = false;
  var playerRadius = 20;
  if (parseInt(rect1.position.x)-playerRadius < parseInt(rect2.position.x) + rect2.scale.x/2 &&
    parseInt(rect1.position.x + playerRadius) > parseInt(rect2.position.x)-rect2.scale.x/2 &&
    parseInt(rect1.position.y)-playerRadius < parseInt(rect2.position.y) + rect2.scale.y/2 &&
    parseInt(rect1.position.y + playerRadius) > parseInt(rect2.position.y)-rect2.scale.y/2) {
      collision = true;
  }
  return collision;
}
/*
function collisionsDetection(rect1, rect2){
  var collision = false;
  console.log(rect1.scale.x, rect1.scale.y);
  console.log('rect');
  console.log(rect2.scale.x, rect2.scale.y);
  if (rect1.position.x < rect2.position.x + rect2.scale.x &&
    rect1.position.x + rect1.scale.x > rect2.position.x &&
    rect1.position.y < rect2.position.y + rect2.scale.y &&
    rect1.position.y + rect1.scale.y > rect2.position.y) {
      collision = true;
  }
  return collision;
}
*/
function canvasToWorldLoc(x, y){
  var vec = new THREE.Vector3(); // create once and reuse
  var pos = new THREE.Vector3(); // create once and reuse
  vec.set(
    ( x / window.innerWidth ) * 2 - 1,
    - ( y / window.innerHeight ) * 2 + 1,
    0.5
  );
  vec.unproject( camera );
  vec.sub( camera.position ).normalize();
  var distance = - camera.position.z / vec.z;
  pos.copy( camera.position ).add( vec.multiplyScalar( distance ) );
  return pos;
}
function canvasToWorldLocOrth(x, y){
  let vector = new THREE.Vector3();
  vector.set((x / window.innerWidth) * 2 - 1, - (y / window.innerHeight) * 2 + 1, 0);
  vector.unproject(camera);
  return vector;
}
function lerp (start, end, amt){
  return (1-amt)*start+amt*end
}
function map(value, in_min, in_max, out_min, out_max){
  return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};
