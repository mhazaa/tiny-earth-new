var pageData = {
  backgrounds: ['#D82E76', '#21914D', '#011B12', '#FFCB38'],
  colors: ['#ff2424', '#ff911a', '#ffde1d', '#3ace5d', '#3abec1', '#9d4fc6'],
  items: {}
}
pageData.items.image = {
  icon: 'assets/imgs/image.png',
  itemType: 'image',
  form: {
    id: 'imageForm',
    hasFile: true,
    fields: [
      {
        type: 'text',
        name: 'remoteFile',
        placeholder: 'put URL here'
      },
      {
        type: 'file',
        isFile: true,
        name: 'localFile',
        placeholder: 'or upload your own file'
      }
    ]
  }
}
pageData.items.audio = {
  icon: 'assets/imgs/audio.png',
  itemType: 'audio',
  form: {
    id: 'audioForm',
    hasFile: true,
    fields: [
      {
        type: 'text',
        name: 'remoteFile',
        placeholder: 'put URL here'
      },
      {
        type: 'file',
        isFile: true,
        name: 'localFile',
        placeholder: 'or upload your own file'
      }
    ]
  }
}
pageData.items.room = {
  icon: 'assets/imgs/room.png',
  itemType: 'room',
  form: {
    id: 'roomForm',
    fields: [
      {
        type: 'text',
        name: 'roomName',
        placeholder: 'Enter room name'
      }
    ]
  }
}
pageData.items.portal = {
  icon: 'assets/imgs/portal.png',
  itemType: 'portal',
  form: {
    id: 'portalForm',
    fields: [
      {
        type: 'number',
        name: 'portalX',
        placeholder: 'portal x coordinates',
        required: true
      },
      {
        type: 'number',
        name: 'portalY',
        placeholder: 'portal y coordinates',
        requird: true
      }
    ]
  }
}
pageData.items.text = {
  icon: 'assets/imgs/text.png',
  itemType: 'text',
  form: {
    id: 'textForm',
    fields: [
      {
        type: 'text',
        name: 'text',
        placeholder: 'text',
        required: true
      },
      {
        type: 'number',
        name: 'size',
        placeholder: 'text size',
        defaultValue: 60,
        required: true
      }
    ]
  }
}
pageData.items.iframe = {
  icon: 'assets/imgs/iframe.png',
  itemType: 'iframe',
  form: {
    id: 'iframeForm',
    fields: [
      {
        type: 'text',
        name: 'url',
        placeholder: 'iframe url'
      }
    ]
  }
}

var vueApp = new Vue({
  el: '#root',
  data: pageData
});
