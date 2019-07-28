var allNodes = [];
var collisionGroups = {
  audioArea: [],
  imageArea: [],
  hyperlinkArea: []
}
var clientPlayer;
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
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000);
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.id = 'canvas';
document.body.appendChild(renderer.domElement);

//RESIZING RENDERER WITHOUT SCALING
var tanFOV = Math.tan( ( ( Math.PI / 180 ) * camera.fov / 2 ) );
var windowHeight = window.innerHeight;
window.addEventListener('resize', function (){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.fov = (360 / Math.PI) * Math.atan(tanFOV * (window.innerHeight / windowHeight));
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
});

//CREATER AUDIO LISTERNER AND ADD IT TO CAMERA
var audioListener = new THREE.AudioListener();
camera.add(audioListener);

//LOADERS
var textureLoader = new THREE.TextureLoader();
var audioLoader = new THREE.AudioLoader();

//CHANGE BACKGROUND COLOR
scene.background = new THREE.Color(0xe4d0a5);

//MY GAME CLASSES
class Node {
  constructor(){
    allNodes.push(this);
  }
  update(){

  }
}

//networkIdentity
class NetworkIdentity {
  constructor(owner){
    this.id = null;
    this.controlling = false;
    this.owner = owner;
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
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    this.material = new THREE.MeshPhongMaterial({
      color: 0xff0000,
      emissive: 0x2a0000,
      shininess: 10,
      specular: 0xffffff
    });
    this.node = new THREE.Mesh(this.geometry, this.material);
    scene.add(this.node);
    this.networkIdentity = new NetworkIdentity(this);
    this.username = null;
    this.scale = 0;
    this.node.scale.set(this.scale,this.scale,this.scale);
    this.speed = 0.005;
  }
  destroy(){
    scene.remove(this.node);
    this.geometry.dispose();
    this.material.dispose();
    this.node = undefined;
    allNodes.remove(this)
  }
  introAnimation (dt) {
    this.scale = lerp(this.scale, 0.1, 0.05);;
    this.node.scale.set(this.scale,this.scale, 0.1);
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
      var drop = canvasToWorldLoc(e.clientX, e.clientY);
    })
  }
  collisions(){
    for(var i=0; i<collisionGroups.audioArea.length; i++){
      var audioCA = collisionGroups.audioArea[i];
      audioCA.onEnter = function(){
        console.log('audio area entered');
        audioCA.owner.play();
      }
      audioCA.onExit = function(){
        console.log('audio area exited');
        audioCA.owner.pause();
      }
    }
    for(var i=0; i<collisionGroups.imageArea.length; i++){
      var imageCA = collisionGroups.imageArea[i];
      imageCA.onEnter = function(){
        console.log('image area entered');
        imageCA.owner.highlighted = true;
      }
      imageCA.onExit = function(){
        console.log('image area exited');
        imageCA.owner.highlighted = false;
      }
    }
    for(var i=0; i<collisionGroups.hyperlinkArea.length; i++){
      var hyperlinkCA = collisionGroups.hyperlinkArea[i];
      hyperlinkCA.onEnter = function(){
        console.log('hyperlink area entered');
        hyperlinkCA.owner.highlighted = true;
      }
      hyperlinkCA.onExit = function(){
        console.log('hyprlink area exited');
        hyperlinkCA.owner.highlighted = false;
      }
    }
  }
  update(){
    this.introAnimation();
    if(!this.networkIdentity.controlling) return;
    this.movement();
    this.updatePosition();
    this.collisions();
  }
}

//camera
class MainCamera extends Node {
  constructor(){
    super();
    this.node = camera;
    this.player = null;
    this.view = 1;
    this.switchViewDirection = 0;
    this.switchView(1);
  }
  update(){
    if (this.player) {
      this.node.position.x = lerp(this.node.position.x, this.player.node.position.x, 0.02);
      this.node.position.y = lerp(this.node.position.y, this.player.node.position.y, 0.02);
    }
    this.node.position.z = lerp(this.node.position.z, this.limit, 0.02);
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
      this.limit = 5;
    } else if(this.view == 1){
      this.limit = 1;
    } else if(this.view == 2){
      this.limit = 0.5;
    }
    console.log('camera view: ' + this.view);
  }
}

//collision area
class CollisionArea extends THREE.Sprite {
  constructor(collisionGroup, x, y, owner){
    super(new THREE.SpriteMaterial({ color: '#69f' }));
    allNodes.push(this);
    scene.add(this);
    this.material.opacity = 0.5;
    this.position.set(x, y, 0);
    this.owner = owner;
    collisionGroup.push(this);
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

//image

class Sprite {
  constructor(path, x, y){
    var that = this;
    //this.spriteMap = textureLoader.load(path);
    this.spriteMap = textureLoader.load(path, function(tex){
      //var ratio = tex.image.height/tex.image.width;
      //that.sprite.scale.x = 1/ratio;
      //that.sprite.scale.y = 1;

      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      //tex.offset.set( 1, 1 );
      tex.repeat.set( 5, 5 );
    });
    this.spriteMap.anisotropy = 0;
    this.spriteMap.magFilter = THREE.NearestFilter;
    this.spriteMap.minFilter = THREE.NearestFilter;
    this.spriteMap.generateMipmaps = false;
    this.spriteMaterial = new THREE.SpriteMaterial( { map: this.spriteMap, transparent: true } );
    this.sprite = new THREE.Sprite(this.spriteMaterial);
    this.sprite.position.x = x;
    this.sprite.position.y = y;
    scene.add(this.sprite);
  }
  destroy(){
    scene.remove(this.sprite);
    this.spriteMaterial.dispose();
    this.spriteMap.dispose();
    this.sprite = undefined;
  }
}

class Image extends Sprite {
  constructor(path, x, y){
    super(path, x, y);
    allNodes.push(this);
    this.name = null;
    this.highlighted = false;
    //this.scaleX = 1;
    //this.scaleY = 1;
    this.collisionArea = new CollisionArea(collisionGroups.imageArea, this.position.x, this.position.y, this);
  }
  update(){
/*    if (this.highlighted){
      this.scaleX = lerp(this.scaleX, 2, 0.1);
      this.scaleY = lerp(this.scaleY, 2, 0.1);
      this.sprite.scale.set(this.scaleX, this.scaleY, 1);
    } else {
      this.scaleX = lerp(this.scaleX, 1, 0.1);
      this.scaleY = lerp(this.scaleY, 1, 0.1);
      this.sprite.scale.set(this.scaleX, this.scaleY, 1);
    }*/
  }
}

class Audio extends THREE.Audio {
  constructor(path, x, y){
    super(audioListener);
    allNodes.push(this);
    this.name = null;
    var that = this;
    audioLoader.load(path, function(buffer){
      that.setBuffer(buffer);
      that.setLoop(true);
    });
    // create an object for the sound to play from
    this.sprite = new Sprite('assets/imgs/audio.png', x, y);
    this.collisionArea = new CollisionArea(collisionGroups.audioArea, x, y, this);
  }
  update(){
    if (this.isPlaying){
      this.sprite.spriteMaterial.rotation += 0.01; //*dt;
    }
  }
}

class Hyperlink {
  constructor(x, y){
    allNodes.push(this);
    this.name = name;
    this.title = null;
    this.url = null
    this.highlighted = false;
    this.scaleX = 1;
    this.scaleY = 1;
    this.iconSprite = new Sprite('assets/imgs/hyperlink.png', x, y);
    this.collisionArea = new CollisionArea(collisionGroups.hyperlinkArea, 2, 2, this);
  }
  update(){
    if (this.highlighted){
      this.scaleX = lerp(this.scaleX, 2, 0.1);
      this.scaleY = lerp(this.scaleY, 2, 0.1);
      this.iconSprite.scale.set(this.scaleX, this.scaleY, 1);
    } else {
      this.scaleX = lerp(this.scaleX, 1, 0.1);
      this.scaleY = lerp(this.scaleY, 1, 0.1);
      this.iconSprite.scale.set(this.scaleX, this.scaleY, 1);
    }
  }
}

/*
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
window.addEventListener( 'mousemove', onMouseMove, false );
function onMouseMove( event ) {
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}
collisionArea.update = function(){
	// update the picking ray with the camera and mouse position
	raycaster.setFromCamera( mouse, camera );
	// calculate objects intersecting the picking ray
	var intersects = raycaster.intersectObjects( collisionGroup );

	for ( var i = 0; i < intersects.length; i++ ) {
    console.log(intersects[i]);
    intersects[ i ].object.material.color.set( 0xff0000 );
	}
}
var raycaster = new THREE.Raycaster();
var mouseVector = new THREE.Vector3();
function getIntersects( x, y ) {
  x = ( x / window.innerWidth ) * 2 - 1;
  y = - ( y / window.innerHeight ) * 2 + 1;
  mouseVector.set( x, y, 0.5 );
  raycaster.setFromCamera( mouseVector, camera );
  return raycaster.intersectObject( collisionGroup, true );
}
var selectedObject = null;
window.addEventListener('mousemove', onDocumentMouseMove);
		function onDocumentMouseMove( event ) {
			event.preventDefault();
			if ( selectedObject ) {
				selectedObject.material.color.set( '#69f' );
				selectedObject = null;
			}
			var intersects = getIntersects( event.layerX, event.layerY );
			if ( intersects.length > 0 ) {
				var res = intersects.filter( function ( res ) {
					return res && res.object;
				} )[ 0 ];
				if ( res && res.object ) {
					selectedObject = res.object;
					selectedObject.material.color.set( '#f00' );
				}
			}
		}


*/


//networkManager
class NetworkManager {
  constructor(){
    this.clientId = null;
    this.serverPlayers = [];
    this.serverMedia = [];
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
      var player = new Player();
      player.node.position.set(data.x, data.y, 0);
      player.username = data.username;
      player.networkIdentity.setNetworkId(data.id, that.clientId);
      that.serverPlayers[data.id] = player.networkIdentity;
      if(player.networkIdentity.controlling){
        mainCamera.setTarget(player);
        player.input();
        clientPlayer = player;
      }
    });
    socket.on("disconnected", function(data) {
      console.log(data.id + " disconnected from game");
      that.serverPlayers[data.id].owner.destroy();
      delete that.serverPlayers[data.id];
    });
    socket.on("updatePosition", function(data) {
      var player = that.serverPlayers[data.id];
      player.owner.node.position.x = data.x;
      player.owner.node.position.y = data.y;
    });
    socket.on('updateActivePlayers', function(data){
      dom.activeUsers.innerHTML = data;
    });
    socket.on('updateTime', function(data){
      dom.clock.innerHTML = data;
    });
    //socket.on("sendMessage", function(data) {
    //  var player = that.serverPlayers[data.id];
    //  player.node.getComponent("PlayerManager").showMessage(data.message);
    //});

    socket.on("sendImage", function(data){
      console.log(data.name + " img  instantiated");
      var path = that.imagesFolder + '/' + data.name;
      var image = new Image(path, data.x, data.y);
      image.name = data.id;
      that.serverMedia[data.id] = data;
    });
    socket.on("sendAudio", function(data){
      console.log(data.name + " audio  instantiated");
      var path = that.audioFolder + '/' + data.name;
      var audio = new Audio(path, data.x, data.y);
      audio.name = audio.id;
      that.serverMedia[data.id] = data;
    });
    socket.on("sendHyperlink", function(data){
      console.log(data.id + " hyperlink instantiated from url: " + data.url);
      var hyperlink = new Hyperlink(data.x, data.y);
      hyperlink.name = hyperlink.id;
      hyperlink.title = data.title;
      hyperlink.url = data.url;
      that.serverMedia[data.id] = data;
    });
    /*
    socket.on("updateMediaPosition", function(data) {
      //var player = that.serverPlayers[data.id];
      //player.node.x = data.x;
      //player.node.y = data.y;
    })
    socket.on("clearMedia", function() {
      console.log("clearing all media in client");
      for (var media in that.serverMedia) {
        var name = that.serverMedia[media].id;
        that.mediaContainer.getChildByName(name).destroy();
        delete that.serverMedia[name];
      }
    });
    */
  }
}


//ADDING LIGHT
var light = new THREE.PointLight( 0xff0000, 1, 400 );
light.position.set( 50, 50, 50 );
scene.add( light );


//BUILDING THE GAME
var mainCamera = new MainCamera();
var networkManager = new NetworkManager();
//var audio = new Audio('assets/soundfiles/she_took_flight.wav', 0, 0);
//var image = new Image('assets/imgs/ingame_logo.png', 1, -1);

var draggableObject = [image, audio.sprite]
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
//document.body.addEventListener('mousemove', mmm);


var river = new Sprite('assets/imgs/river.png', 0, 0);
river.sprite.scale.x = 4;
river.sprite.scale.y = 4
console.log(river.sprite.position);
scene.add(river.sprite);

function mmm(event){
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(draggableObject);
    intersects.forEach(function(element){
        console.log("Intersection: " + element.object.id);
    });
}


//RENDER LOOP
function animate() {
	requestAnimationFrame( animate );
  for(var i=0; i<allNodes.length; i++){
    allNodes[i].update();
  }
	renderer.render(scene, camera);
}
animate();


function collisionsDetection(rect1, rect2){
  var collision = false;
  if (rect1.position.x < rect2.position.x + rect2.scale.x &&
    rect1.position.x + rect1.scale.x > rect2.position.x &&
    rect1.position.y < rect2.position.y + rect2.scale.y &&
    rect1.position.y + rect1.scale.y > rect2.position.y) {
      collision = true;
  }
  return collision;
}
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

function lerp (start, end, amt){
  return (1-amt)*start+amt*end
}
function map(x, in_min, in_max, out_min, out_max)
{
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
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
