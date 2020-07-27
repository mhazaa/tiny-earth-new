function collisionsDetection(rect1, rect2){
  var collision = false;
  var playerRadius = 20;
  if (rect1.position.x-playerRadius < rect2.position.x+rect2.scale.x/2 &&
    rect1.position.x+playerRadius > rect2.position.x-rect2.scale.x/2 &&
    rect1.position.y-playerRadius < rect2.position.y+rect2.scale.y/2 &&
    rect1.position.y+playerRadius > rect2.position.y-rect2.scale.y/2){
      collision = true;
  }
  return collision;
}
function lerp(start, end, amt){
  return (1-amt)*start+amt*end
}
function map(value, in_min, in_max, out_min, out_max){
  return (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
function isObjectEmpty(obj){
  if(Object.entries(obj).length === 0 && obj.constructor === Object){
    return true;
  } else {
    return false;
  }
}
function removeFromArray(arr, obj){
  var index = arr.indexOf(obj);
  if (index > -1) arr.splice(index, 1);
}
function sendAjax(method, action, data){
  var xhr = new XMLHttpRequest();
  xhr.open(method, action);
  xhr.onreadystatechange = function(){
    if(xhr.readyState>3 && xhr.status==200){
      //console.log(xhr.responseText);
    }
  }
  xhr.send(data);
}
