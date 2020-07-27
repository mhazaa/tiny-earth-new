var dom = {
  clickableCanvasArea: document.getElementById('clickableCanvasArea'),
  clock: document.getElementById('clock'),
  activeUsers: document.getElementById('activeUsers').getElementsByTagName('span')[0],
  coordinates: document.getElementById('coordinates'),
  iframesContainer: document.getElementById('iframesContainer')
}

class CenterTextControls {
  constructor(){
    this.dom = {
      centerText: document.getElementById("centerText").getElementsByTagName('p')
    }
  }
  tempMessage(index, message, duration){
    this.dom.centerText[index].innerHTML = message;
    var that = this;
    setTimeout(function(){
      that.clear(index);
    }, duration);
  }
  message(index, message){
    this.dom.centerText[index].innerHTML = message;
  }
  clear(index){
    if(typeof index != 'undefined'){
      this.dom.centerText[index].innerHTML = '';
    } else {
      for(var i=0; i<this.dom.centerText.length; i++){
        this.dom.centerText[i].innerHTML = '';
      }
    }
  }
}
var centerTextControls = new CenterTextControls();

class ColorSelector {
  constructor(){
    this.dom = {
      colorSelector: document.querySelector('#colorSelector'),
      button: document.querySelector('#colorSelector').querySelector('.button'),
      bar: document.querySelector('#colorSelector').querySelector('.bar')
    }
    this.held = false;
    this.block = 0;
    this.colors = globalData.colors;
    this.color = null;
    this.slider();
    this.input();
  }
  slider(){
    var gradient = 'linear-gradient(90deg, ';
    for(var i=0; i<this.colors.length; i++){
      if(i==0){
        gradient += this.colors[i];
      } else {
        gradient += ', ' + this.colors[i];
      }
    }
    gradient += ')';
    this.dom.bar.style.background = gradient;
  }
  changeColorBlock(block){
    if(block!=this.block){
      this.block = block;
      this.color = this.colors[this.block];
      lobbyInterface.changeColor(this.color);
    }
  }
  input(){
    var that = this;

    this.dom.button.addEventListener("touchstart", dragStart);
    this.dom.button.addEventListener("mousedown", dragStart);
    window.addEventListener("mousemove", drag);
    window.addEventListener("touchmove", drag);
    window.addEventListener("touchend", dragEnd);
    window.addEventListener("mouseup", dragEnd);

    function dragStart(){
      that.held = true;
    }
    function drag(e){
      if(!that.held) return;
      var clientX = 0;
      if (e.type === "touchmove"){
        clientX = e.touches[0].clientX;
      } else {
        e.preventDefault();
        clientX = e.clientX;
      }
      //position dom slider
      var left = clientX-(that.dom.colorSelector.getBoundingClientRect().left);
      left = map(left, 0, that.dom.colorSelector.offsetWidth, 0, 100);
      if(left<0){
        left=0;
      } else if(left>100){
        left=100;
      }
      that.dom.button.style.left = left + '%';
      var block = Math.round(left/6.25);
      that.changeColorBlock(block);
    }

    function dragEnd(e){
      if(!that.held) return;
      that.held = false;
    }
  }
}

class HudControls {
  constructor(){
    this.dom = {
      mainText: document.querySelector('#mainText'),
      ingameInterface: document.querySelector('#ingameInterface')
    }
  }
  changeLevel(level){
    if(level==0){
      this.dom.ingameInterface.style.opacity = 0;
      this.dom.mainText.style.opacity = 1;
    } else if(level==1){
      this.dom.ingameInterface.style.opacity = 1;
      this.dom.mainText.style.opacity = 0;
    }
  }
}
var hudControls = new HudControls();

class LobbyInterface {
  constructor(){
    var urlParams = new URLSearchParams(window.location.search);
    this.dom = {
      lobbyInterface: document.getElementById('lobbyInterface'),

      intro: document.getElementById('intro'),
      exploreWorld: document.getElementById('exploreWorld'),

      login: document.getElementById('login'),
      done: document.getElementById('done'),
      selectionBarButtons: document.getElementById('selectionBar').getElementsByTagName('a'),
      tabs: document.getElementById('selectionBox').getElementsByClassName('tab'),
      selectedButton: null,
      selectedTab: null,

      shoes: document.getElementById('shoes').getElementsByTagName('div'),
      selectedShoes: null,
      shoeOptions: document.getElementById('shoeOptions').getElementsByTagName('img'),
      selectedShoeOption: null,

      hair: document.querySelector('#hair').querySelectorAll('svg'),
      selectedHair: null,
      hairOptions: document.getElementById('hairOptions').getElementsByTagName('img'),
      selectedHairOption: null
    }

    this.colorSelector = new ColorSelector();
    this.activeTab = 0;
    this.switchTab();

    this.username = '';

    this.avatarOpts = {
      face: {
        color: null
      },
      hair: {
        type: null,
        color: null
      },
      shoes: {
        type: null,
        color: null
      }
    }

    this.spawn();

    this.input();
  }
  input(){
    var that = this;

    this.dom.exploreWorld.addEventListener('click', function(){
      that.dom.intro.style.display = 'none';
      that.dom.login.style.display = 'block';
    });

    for(var i=0; i<this.dom.selectionBarButtons.length; i++){
      (function(i){
        that.dom.selectionBarButtons[i].addEventListener('click', function(){
          if(that.activeTab == i) return;
          that.activeTab = i;
          that.switchTab();
        });
      })(i);
    }

    for(var i=0; i<this.dom.shoeOptions.length; i++){
      (function(i){
        that.dom.shoeOptions[i].addEventListener('click', function(){
          that.selectShoes(i);
        });
      })(i);
    }

    for(var i=0; i<this.dom.hairOptions.length; i++){
      (function(i){
        that.dom.hairOptions[i].addEventListener('click', function(){
          that.selectHair(i);
        });
      })(i);
    }

    this.dom.done.addEventListener('click', function(){
      that.spawn();
    });
  }
  selectHair(i){
    if(this.dom.selectedHair) this.dom.selectedHair.style.display = 'none';
    this.dom.selectedHair = this.dom.hair[i];
    this.dom.selectedHair.style.display = 'block';

    this.avatarOpts.hair.type = Object.keys(globalData.avatarImgs.hair)[i]
    if(this.selectedHairOption) this.selectedHairOption.classList.remove('selectedOption');
    this.selectedHairOption = this.dom.hairOptions[i];
    this.selectedHairOption.classList.add('selectedOption');
  }
  selectShoes(i){
    if(this.dom.selectedShoes) this.dom.selectedShoes.style.display = 'none';
    this.dom.selectedShoes = this.dom.shoes[i];
    this.dom.selectedShoes.style.display = 'block';

    this.avatarOpts.shoes.type = Object.keys(globalData.avatarImgs.shoes)[i]
    if(this.selectedShoeOption) this.selectedShoeOption.classList.remove('selectedOption');
    this.selectedShoeOption = this.dom.shoeOptions[i];
    this.selectedShoeOption.classList.add('selectedOption');
  }
  changeColor(color){
    if(this.activeTab==0){
      //if hair tab is open
      this.dom.selectedHair.querySelector('.color').style.fill = color;
      this.avatarOpts.hair.color = color;
    } else if(this.activeTab==1) {
      //if shoes tab is open
      this.dom.selectedShoes.querySelectorAll('svg')[0].querySelector('.color').style.fill = color;
      this.dom.selectedShoes.querySelectorAll('svg')[1].querySelector('.color').style.fill = color;
      this.avatarOpts.shoes.color = color;
    }
  }
  switchTab(){
    if(this.dom.selectedBarButton && this.dom.selectedTab){
      this.dom.selectedBarButton.classList.remove('selected');
      this.dom.selectedTab.style.display = 'none';
    }

    this.dom.selectedBarButton = this.dom.selectionBarButtons[this.activeTab];
    this.dom.selectedBarButton.classList.add('selected');

    this.dom.selectedTab = this.dom.tabs[this.activeTab];
    this.dom.selectedTab.style.display = 'block';

    //hide color bar if in the name tab
    var colorbar = this.colorSelector.dom.colorSelector;
    if(this.activeTab==2){
      colorbar.style.visibility = 'hidden';
    } else if (colorbar.style.visibility == 'hidden'){
      colorbar.style.visibility = 'visible';
    }
  }
  spawn(){
    var obj = {
      username: this.username,
      x: 0,
      y: 0,
      avatarOpts: this.avatarOpts
    }
    socket.emit('spawn', obj);
    this.dom.lobbyInterface.style.display = 'none';
    hudControls.changeLevel(0);
  }
}
var lobbyInterface = new LobbyInterface();
lobbyInterface.selectHair(0);
lobbyInterface.selectShoes(0);
lobbyInterface.colorSelector.changeColorBlock(6);

class ChatControls {
  constructor(){
    this.dom = {
      chatForm: document.getElementById("chatForm"),
      chatInput: document.getElementById("chatInput")
    }
    this.input();
  }
  sendText(){
    var text = this.dom.chatInput.value.toUpperCase();
    this.dom.chatInput.value = '';
    socket.emit('sendText', {text: text});
  }
  input(){
    var that = this;
    this.dom.chatForm.addEventListener('submit', function(e){
      e.preventDefault();
      that.sendText();
    });
  }
}
new ChatControls();

/* item controls */
class ItemUI {
  constructor(domElement, form, itemType){
    this.domElement = domElement;
    this.form = form;
    this.itemType = itemType;
    this.input();
  }
  input(){
    var that = this;

    this.domElement.addEventListener('click', onClick);
    function onClick(){
      that.form.style.display = 'block';
      itemManager.dom.itemGrid.style.display = 'none';
      optionsMenu.deactivate();
    }

    this.form.addEventListener('submit', onSubmit);
    function onSubmit(e){
      e.preventDefault();

      var data = {};

      var inputFields = this.getElementsByClassName('inputField');
      for(var i=0; i<inputFields.length; i++){
        if(inputFields[i].type=='number'){
          data[inputFields[i].name] = parseInt(inputFields[i].value);
        } else if(inputFields[i].files) {
          data[inputFields[i].name] = inputFields[i].files[0];
        } else {
          data[inputFields[i].name] = inputFields[i].value;
        }
      }
      data.x = itemManager.drop.x;
      data.y = itemManager.drop.y;
      data.itemType = that.itemType;
      data.scene = currentScene.name;

      if(data.localFile){
        //if uploading a local file send via ajax instead of web socket
        var form = new FormData();
        for(var key in data){
          form.append(key, data[key]);
        }
        sendAjax('POST', 'sendItem', form);
      } else {
        //upload via web sockets if there is no local file
        socket.emit('sendItem', data);
      }
      this.reset();
      that.remove();
    }

    if(this.form.querySelector('.button')){
      this.form.querySelector('.button').addEventListener('click', function(){
        var data = {};
        data.x = itemManager.drop.x;
        data.y = itemManager.drop.y;
        data.itemType = that.itemType;
        data.scene = currentScene.name;
        voiceMessage.show(data);
      });
    }

    /* closing form with x button */
    this.form.getElementsByClassName('exitForm')[0].addEventListener('click', function(){
      that.remove();
    });
    /* closing form when clicking anywhere outsisde it */
    window.addEventListener('mousedown', closeForm);
    window.addEventListener('touchstart', closeForm);
    function closeForm(e){
      if(that.form.style.display=='none') return;
      if (that.form.contains(e.target)){
        //nothing happens
      } else{
        that.remove();
      }
    }
  }
  remove(){
    this.form.style.display = 'none';
    itemManager.deactivate();
  }
}

class ItemManager {
  constructor(){
    this.dom = {
      itemGrid: document.getElementById("itemGrid"),
      items: document.getElementsByClassName("item")
    }
    this.marker = null;
    this.drop = {x:0, y:0};
    this.items = [];

    var i=0;
    for(var item in globalData.items){
      this.items.push(
        new ItemUI(
          this.dom.items[i],
          document.getElementById(globalData.items[item].form.id),
          globalData.items[item].itemType
        )
      )
      i++;
    }

    this.input();
  }
  input(){
    var that = this;

    dom.clickableCanvasArea.addEventListener('click', onClick);
    function onClick(e){
      if (drawingMode.active) return;

      if(doubleClick){
        that.activate(e.clientX, e.clientY);
      } else {
        that.deactivate();
      }
    }
  }
  activate(clientX, clientY){
    this.dom.itemGrid.style.display = 'inline-block';
    optionsMenu.deactivate();

    this.drop = canvasToWorldLoc(clientX, clientY);
    this.drop.x = Math.round(this.drop.x*100)/100;
    this.drop.y = Math.round(this.drop.y*100)/100;
    this.marker = new Marker(this.drop.x, this.drop.y, 15, currentScene.name);
  }
  deactivate(){
    this.dom.itemGrid.style.display = 'none';

    if(this.marker){
      this.marker.destroy();
      this.marker = null;
    }
  }
}
var itemManager = new ItemManager();

/* options mneu */
class OptionsMenu {
  constructor(){
    this.dom = {
      optionsMenu: document.getElementById("optionsMenu"),
      optionsTitle: document.getElementById("optionsTitle"),
      optionsMenuChoices: document.getElementById("optionsMenu").getElementsByTagName("a")
    }
    this.onOption = [];
    this.input();
  }
  input(){
    var that = this;
    for(var i=0; i<this.dom.optionsMenuChoices.length; i++){
      (function(i){
        that.dom.optionsMenuChoices[i].addEventListener('click', function(){
          if(typeof that.onOption[i] == 'function') that.onOption[i]();
          that.deactivate();
        });
      })(i);
    }
    /*closing menu*/
    window.addEventListener('mousedown', closeForm);
    window.addEventListener('touchstart', closeForm);
    function closeForm(e){
      if(that.dom.optionsMenu.style.display=='none') return;
      if (that.dom.optionsMenu.contains(e.target)){
        //nothing happens
      } else{
        that.deactivate();
      }
    }
  }
  activate(title, options){
    var that = this;
    this.dom.optionsTitle.innerHTML = title;
    for(var i=0; i<options.length; i++){
      this.dom.optionsMenuChoices[i].innerHTML = options[i].text;
      this.dom.optionsMenuChoices[i].style.display = 'block';
      this.onOption[i] = options[i].function;
    }
    this.dom.optionsMenu.style.display = 'block';
  }
  deactivate(){
    this.dom.optionsMenu.style.display = 'none';
    for(var i=0; i<this.dom.optionsMenuChoices.length; i++){
      this.dom.optionsMenuChoices[i].style.display = 'none';
      this.dom.optionsMenuChoices[i].style.innerHTML = '';
    }
    for(var i=0; i<this.onOption.length; i++){
      this.onOption[i] = function(){};
    }
  }
}
var optionsMenu = new OptionsMenu();

/* ingame form controls */
class IngameForm {
  constructor(){
    this.dom = {
      ingameForm: document.getElementById('ingameForm'),
      inputs: document.getElementById('ingameForm').getElementsByTagName('input')
    }
    this.input();
  }
  onSubmit(){}
  input(){
    var that = this;
    this.dom.ingameForm.addEventListener('submit', function(e){
      e.preventDefault();
      that.onSubmit();
      that.deactivate();
    });
  }
  activate(onSubmit){
    this.dom.ingameForm.style.display = 'block';
    this.onSubmit = onSubmit;
  }
  deactivate(){
    this.dom.ingameForm.style.display = 'none';
    this.onSubmit = function(){};
  }
}
var ingameForm = new IngameForm();

/*audio controls*/
class AudioControls {
  constructor(){
    this.dom = {
      audioControls: document.getElementById("audioControls")
    }
    this.input();
  }
  input(){
    this.dom.audioControls.style.opacity = 0.5;
    this.dom.audioControls.addEventListener('click', function(){
      if(this.style.opacity == 1){
        this.style.opacity = 0.5;
        bgmusic.pause();
      } else {
        this.style.opacity = 1;
        bgmusic.play();
      }
    });
  }
}
new AudioControls();

/*share loc*/
class ShareLocControls {
  constructor(){
    this.dom = {
      shareLocButton: document.getElementById('shareLocButton')
    }
    this.input();
  }
  copyToClipboard(text){
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
  }
  shareLoc(x, y){
    var url = window.location.host + '/?x=' + x + '&y=' + y;
    this.copyToClipboard(url);
  }
  input(){
    var that = this;
    this.dom.shareLocButton.addEventListener('click', function(){
      that.shareLoc(
        ingameCoors(clientPlayer.position.x),
        ingameCoors(clientPlayer.position.y)
      );
    });
  }
}
var shareLocControls = new ShareLocControls();

class DragNdrop {
  constructor(){
    this.input();
  }
  input(){
    document.body.addEventListener('dragover', function(e) {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    document.body.addEventListener('drop', function(e) {
      e.stopPropagation();
      e.preventDefault();
      var url = e.dataTransfer.getData('Text');
      var files = e.dataTransfer.files;

      if(files.length==0){ //remote files
        var obj = {};
        var drop = canvasToWorldLoc(e.clientX, e.clientY);
        drop.x = Math.round(drop.x*100)/100;
        drop.y = Math.round(drop.y*100)/100;
        obj.x = drop.x;
        obj.y = drop.y;
        obj.itemType = 'image';
        obj.scene = currentScene.name;
        obj.remoteFile = url;
        socket.emit('sendItem', obj);
      } else { //local files
        for (var i=0, file; file=files[i]; i++){
          if (file.type.match(/image.*/)) {
            var reader = new FileReader();

            reader.onload = function(e2){
              // finished reading file data.
              var img = document.createElement('img');
              img.src= e2.target.result;
              document.body.appendChild(img);
            }

            reader.readAsDataURL(file); // start reading the file data.
          }
        }
      }
    });
  }
}
new DragNdrop();

class DrawingMode {
  constructor(){
  //  this.input();
    this.active = false;
    this.startPoint = null;
    this.points = [];
    this.markers = [];
  }
  activate(){
    this.active = true;
    document.getElementById('canvas').style.opacity = 0.5;
  }
  deactivate(){
    if(this.points.length>=2){
      new BongoShape(this.startPoint.x, this.startPoint.y, this.points, currentScene.name);
    }
    this.active = false;
    this.startPoint = null;
    this.points = [];

    /*delete markers*/
    for(var i=0; i<this.markers.length; i++){
      this.markers[i].destroy();
    }
    this.markers = [];

    document.getElementById('canvas').style.opacity = 1;
  }
  input(){
    var that = this;
    document.addEventListener('keyup', function(e){
      var keyCode = e.keyCode;
      if(keyCode==16){
        if(that.active){
          that.deactivate();
        } else {
          that.activate();
        }
      }
    });

    document.body.addEventListener('click', click);
    function click(e){
      if(!that.active) return;

      var loc = canvasToWorldLoc(e.clientX, e.clientY);
      if(!that.startPoint){
        that.startPoint = loc;
      } else {
        var point = {x:0,y:0};
        point.x = loc.x - that.startPoint.x;
        point.y = loc.y - that.startPoint.y;
        that.points.push({
          x: point.x,
          y: point.y
        });
      }
      that.markers.push(
        new Marker(loc.x, loc.y, 15, currentScene.name)
      )
    }
  }
}
var drawingMode = new DrawingMode();

window.AudioContext = window.AudioContext || window.webkitAudioContext;
class VoiceChat {
  constructor(){
    this.dom = {
      micButton: document.getElementById('micButton'),
      micButtonStates: document.getElementById('micButton').getElementsByTagName('img')
    }
    this.active = false;
    this.micStream = null;
    this.calls = {};
    this.calling = [];
    this.activate();
    this.startRecording();
    this.peerEvents();
    this.input();
  }
  input(){
    var that = this;
    this.dom.micButton.addEventListener('click', function(){
      if(that.active){
        that.deactivate();
      } else {
        that.activate();
      }
    });
  }
  activate(){
    this.active = true;
    this.dom.micButtonStates[0].style.display = 'none';
    this.dom.micButtonStates[1].style.display = 'block';
    //this.callAllWithinDist();
    //this.startRecording();
  }
  deactivate(){
    this.active = false;
    this.dom.micButtonStates[1].style.display = 'none';
    this.dom.micButtonStates[0].style.display = 'block';
    //this.endAllCalls();
    //this.stopRecording();
  }
  startRecording(){
    console.log('recording mic');
    var that = this;
    navigator.mediaDevices.getUserMedia({audio: true, video: false})
    .then(function(stream){
      that.micStream = stream;
    })
    .catch(function(err){
      console.log(err);
    });
  }
  stopRecording(){
    if(!this.micStream) return;
    this.micStream.getTracks().forEach(function(track){
      track.stop()
    });
  }
  call(otherPeerId, otherPlayerId){
    var that = this;
    console.log('calling ' + otherPeerId);
    //start peer call
    this.calls[otherPeerId] = {};
    this.calls[otherPeerId].call = peer.call(otherPeerId, this.micStream);
    //start peer data connection
    this.calls[otherPeerId].dataConnection = peer.connect(otherPeerId);
    this.calls[otherPeerId].dataConnection.on('open', function(){
      console.log('peer connection opened, sending hi')
    });
    //listen to audio stream
    this.calls[otherPeerId].call.on('stream', function(stream){
      console.log('listening to stream');
      that.calls[otherPeerId].stream = new Audio();
      that.calls[otherPeerId].stream.srcObject = stream;
      that.calls[otherPeerId].stream.volume = 0;
      that.calls[otherPeerId].stream.play();

      that.calling.push({
        playerId: otherPlayerId,
        peerId: otherPeerId
      });
    });
  }
  callAllWithinDist(){
    for(var i=0; i<this.withinCallDist.length; i++){
      this.call(this.withinCallDist[i].peerId, this.withinCallDist[i].playerId);
    }
  }
  endCall(otherPeerId, otherPlayerId){
    console.log('ending call with ' + otherPeerId);

    this.calling = this.calling.filter(function(obj){
      return obj.playerId !== otherPlayerId;
    });

    this.calls[otherPeerId].call.close();
    delete this.calls[otherPeerId];
  }
  endAllCalls(){
    console.log('ending all calls');
    while(this.calling.length>0){
      this.endCall(this.calling[0].peerId, this.calling[0].playerId);
    }
  }
  peerEvents(){
    var that = this;
    peer.on('call', function(call){
      console.log('answering a call');
      call.answer(that.micStream);
    });
  }
}
var voiceChat = new VoiceChat();

class VoiceMessage {
  constructor(){
    this.mediaRecorder = null;
    this.active = false;
    this.obj = null;
    this.dom = {
      voiceMessageContainer: document.querySelector('#voiceMessageContainer'),
      voiceMessageButton: document.querySelector('#voiceMessageButton'),
      formButton: document.querySelector('#audioForm').querySelector('.button')
    }
    this.input();
  }
  input(){
    var that = this;

    this.dom.voiceMessageButton.addEventListener('click', function(){
      if(!that.active){
        that.start();
      } else {
        that.stop();
      }
    });

    window.addEventListener('mousedown', onclick);
    window.addEventListener('touchstart', onclick);
    function onclick(e){
      if(that.dom.voiceMessageContainer.style.display == 'none') return;
      if (that.dom.voiceMessageButton.contains(e.target)){
        //nothing happens
      } else {
        that.hide();
      }
    }
  }
  show(obj){
    console.log('showing voice message');
    this.obj = obj;
    this.dom.voiceMessageContainer.style.display = 'block';

    for(var i=0; i<itemManager.items.length; i++){
      itemManager.items[i].remove();
    }
  }
  hide(){
    this.dom.voiceMessageContainer.style.display = 'none';
    if(this.active) this.stop();
  }
  start(){
    console.log('started recording');
    this.active = true;
    var that = this;
    var chunks = [];;
    this.dom.voiceMessageButton.classList.add('recording');

    navigator.mediaDevices.getUserMedia({audio: true, video: false})
    .then(function(stream){
      that.mediaRecorder = new MediaRecorder(stream);

      that.mediaRecorder.start();

      that.mediaRecorder.onstop = function(){
        console.log('stopped recording');
        var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
        chunks = [];
        var audioURL = URL.createObjectURL(blob);

        var form = new FormData();
        form.append('localFile', blob);
        for(var key in that.obj){
          form.append(key, that.obj[key]);
        }
        sendAjax('POST', 'sendItem', form);

        that.obj = null;
        that.hide();
      }

      that.mediaRecorder.ondataavailable = function(e){
        chunks.push(e.data);
      }
    })
    .catch(function(err){
      console.log(err);
    });
  }
  stop(){
    console.log('stopping recording');
    this.active = false;
    this.mediaRecorder.stop();
    this.dom.voiceMessageButton.classList.remove('recording');
  }
}
var voiceMessage = new VoiceMessage();

/*mapboxgl.accessToken = 'pk.eyJ1IjoianJmcml0eiIsImEiOiJjaXQzaDRlMXkwMDAyMnl0ZGJ4cHY4eXh5In0._S2x2aMfJaUsHeHyw_VtgA';
var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/jrfritz/ck1eh3kwr16yj1crvwiri2hk7'
});*/
