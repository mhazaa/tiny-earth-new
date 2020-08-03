# Tiny Earth

https://tinyearth.io

Tiny Earth is a spatial content aggregation website where you can also chat with other users in real-time through text or voice. It's a way to present content in a way that doesn't follow the linear top-to-bottom standard of the web.

You start in Tiny Earth by choosing a name and customizing a character. You can then explore and move around anywhere. You can double click on any spot to add content either locally or from a url. Images, audio files, and voice messages can all be posted on Tiny Earth and stored in our servers. All content can be moved, or deleted afterwards as well. You can chat with other users using text or voice, or you can record your own voice and leave an audio message.

You can also add portals that send you to other areas of the world, and you can create separate rooms and populate them with their own content.

Tiny Earth is mostly built with JavaScript. For the front-end I used Three.js to render all the graphical elements and camera controls. The HUD elements are separated in an overlayed DOM element where I used Vue to dynamically update the state.

For the back-end, I ran a node server with web sockets and hosted it all in a DigitalOcean droplet with a secure HTTPS domain.  And I used a webRTC library to add the voice chat features.