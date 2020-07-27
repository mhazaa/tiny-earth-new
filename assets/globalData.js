var globalData = {
  colors: ['#cfcfcf', '#818181', '#606060', '#369516', '#63ce3e', '#ffd230', '#ff9e30', '#ff5430', '#e50101', '#e5016a', '#e301e5', '#8401e5', '#4404d7', '#1e46f6', '#4dbfff', '#3ae7ef'],
  hairTypes: ['classic', 'funk', 'pony'],
  shoeTypes: ['chuck', 'clark', 'jordan', 'prince'],
  avatarImgs: {
    face: 'imgs/character_selection/face.png',
    hair: {
      'classic': 'imgs/character_selection/hair/classic.png',
      'funk': 'imgs/character_selection/hair/funk.png',
      'pony': 'imgs/character_selection/hair/pony.png'
    },
    shoes: {
      'chuck': 'imgs/character_selection/shoes/chuck.png',
      'clark': 'imgs/character_selection/shoes/clark.png',
      'jordan': 'imgs/character_selection/shoes/jordan.png',
      'prince': 'imgs/character_selection/shoes/prince.png'
    }
  },
  items: {}
}
globalData.items.image = {
  icon: 'imgs/ui/image.png',
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
globalData.items.audio = {
  icon: 'imgs/ui/audio.png',
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
globalData.items.room = {
  icon: 'imgs/ui/room.png',
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
globalData.items.portal = {
  icon: 'imgs/ui/portal.png',
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
globalData.items.text = {
  icon: 'imgs/ui/text.png',
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
globalData.items.iframe = {
  icon: 'imgs/ui/iframe.png',
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
  el: '#hud',
  data: globalData
});
