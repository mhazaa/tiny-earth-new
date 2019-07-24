var socket = io.connect();

var dom = {
  canvas: document.getElementById('canvas'),
  lobbyInterface: document.getElementById("lobbyInterface"),
  ingameInterface: document.getElementById("ingameInterface"),
  loginForm: document.getElementById("loginForm"),
  loginInput: document.getElementById("loginInput"),
  icons: document.getElementsByClassName("icon"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput"),
  imageForm: document.getElementById("imageForm"),
  audioForm: document.getElementById("audioForm"),
  hyperlinkForm: document.getElementById("hyperlinkForm"),
  uploadForms: document.getElementsByClassName('uploadForm'),
  clear: document.getElementById("clear"),
  clock: document.getElementById('clock'),
  activeUsers: document.getElementById('activeUsers').getElementsByTagName('span')[0]
}

dom.loginForm.addEventListener('submit', function(e){
  e.preventDefault();
  var username = dom.loginInput.value;
  if (username.length == 0) return;
  dom.lobbyInterface.style.display = 'none';
  dom.ingameInterface.style.display = 'block';
  socket.emit('spawn', {username: username});
});

dom.chatForm.addEventListener('submit', function(e){
  e.preventDefault();
  var message = dom.chatInput.value;
  dom.chatInput.value = '';
  console.log(message);
  socket.emit('sendMessage', {message: message});
});

function sendAjax(method, request, data){
  var xhr = new XMLHttpRequest();
  xhr.open(method, request, true);
  xhr.send(data);
}

dom.clear.addEventListener('click', function(){
  sendAjax('POST', '/clearMedia', null);
});

class UIIcon {
  constructor(domElement, form, ajaxURL){
    this.domElement = domElement;
    this.form = form;
    this.ajaxURL = ajaxURL;
    this.dropPositionX = 0;
    this.dropPositionY = 0;
    this.initialX = 0;
    this.initialY = 0;
    this.held;
    this.draggable();
    this.submittingForm(this.ajaxURL);
  }
  submittingForm(){
    var that = this;
    if(this.ajaxURL == '/sendHyperlink'){
      this.form.addEventListener('submit', submitHyperlinks);
    } else {
      this.form.addEventListener('submit', submitMedia);
    }

    function submitMedia(e){
      e.preventDefault();
      var remoteFile = this.getElementsByClassName('input')[0];
      var localFile = this.getElementsByClassName('input')[1].files[0];
      var formdata = new FormData();
      formdata.append('x', that.dropPositionX);
      formdata.append('y', that.dropPositionY);
      formdata.append('remoteFileURL', remoteFile.value);
      if(localFile) formdata.append("localFile", localFile);
      sendAjax('POST', that.ajaxURL, formdata);
      this.reset();
      this.style.display = 'none';
    }
    function submitHyperlinks(e){
      e.preventDefault();
      var title = this.getElementsByClassName('input')[0].value;
      var url = this.getElementsByClassName('input')[1].value;
      var formdata = new FormData();
      formdata.append('x', that.dropPositionX);
      formdata.append('y', that.dropPositionY);
      formdata.append('title', title);
      formdata.append('url', url);
      sendAjax('POST', that.ajaxURL, formdata);
      this.reset();
      this.style.display = 'none';
    }
  }
  setTranslate(xPos, yPos){
    this.domElement.style.transform = "translate3d(" + xPos + "px, " + yPos + "px, 0)"
  }
  draggable(){
    var that = this;
    this.domElement.addEventListener("touchstart", dragStart);
    this.domElement.addEventListener("mousedown", dragStart);
    document.body.addEventListener("mousemove", drag);
    document.body.addEventListener("touchmove", drag);
    document.body.addEventListener("touchend", dragEnd);
    document.body.addEventListener("mouseup", dragEnd);

    function dragStart(e){
      that.held = true;
      if (e.type === "touchstart") {
        that.initialX = e.touches[0].clientX;
        that.initialY = e.touches[0].clientY;
      } else {
        that.initialX = e.clientX;
        that.initialY = e.clientY;
      }
    }

    function drag(e) {
      e.preventDefault();
      if(!that.held) return;
      var currentX, currentY;
      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - that.initialX;
        currentY = e.touches[0].clientY - that.initialY;
      } else {
        currentX = e.clientX - that.initialX;
        currentY = e.clientY - that.initialY;
      }
      that.setTranslate(currentX, currentY);
    }

    function dragEnd(e) {
      if(!that.held) return;
      that.held = false;
      that.initialX = 0;
      that.initialY = 0;
      that.setTranslate(0, 0);
      for(var i=0; i<dom.uploadForms.length; i++){
        dom.uploadForms[i].style.display = 'none';
      }
      that.form.style.display = 'block';

      var drop = canvasToWorldLoc(e.clientX, e.clientY);
      that.dropPositionX = Math.round(drop.x*100)/100;
      that.dropPositionY = Math.round(drop.y*100)/100;

      //new Image('assets/imgs/image.png', that.dropPositionX, that.dropPositionY);

      console.log('dropPositionX: ' + that.dropPositionX + ' dropPositionY: ' + that.dropPositionY);
    }
  }
}

var image = new UIIcon(dom.icons[0], dom.imageForm, '/sendImage');
var audio = new UIIcon(dom.icons[1], dom.audioForm, '/sendAudio');
var hyperlink = new UIIcon(dom.icons[2], dom.hyperlinkForm, '/sendHyperlink');
