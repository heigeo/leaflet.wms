leaflet.wms.js
==============

An all-in-one WMS plugin for Leaflet.
-------------------------------------

[Leaflet] is great for tiled maps, but has limited support for WMS.  This is by
design: after all, the core motivation for Leaflet is to make [the basic things
work perfectly](http://leafletjs.com/features.html) and not to support every
use case.

That said, there are still use cases where more robust WMS support is needed.
For example, small scale applications (e.g. for local governments) that
integrate multiple custom WMS layers from one source.  Loading these layers
individually via `L.TileLayer.WMS` is problematic:
 
 * The default tile size will result in many duplicate labels for vector-backed
   layers.
 * The browser can be overwhelmed when using a large tile size or displaying
   many layers at once.

Various workarounds have been proposed to address these issues.  The goal of
plugin is an attempt to bring all of these workarounds into a single WMS plugin
for leaflet.

Parts of this plugin were inspired by the [esri-leaflet] plugin.

## Features 

 * Single request for multiple layers coming from the same WMS source
 * Single-tile WMS (coming soon)
 * Layer identify (eventually)
 * Pull requests welcome!

## Usage:

```javascript
var s = L.WMS.source("http://example.com/mapserv");
s.getLayer("layer1").addTo("map");
s.getLayer("layer2").addTo("map");

```

L.WMS can be loaded via AMD, CommonJS/Node, and browser global environments.

[Leaflet]: http://leafletjs.com
[esri-leaflet]: https://github.com/Esri/esri-leaflet
