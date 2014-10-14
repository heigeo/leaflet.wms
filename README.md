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

## [Demo](http://heigeo.github.io/leaflet.wms)

## Features 

 * "Single-tile" auto-updating WMS overlay
 * Use single server-composited image for layers coming from the same source
 * Layer identify (coming soon)
 * Pull requests welcome!

## Usage

```javascript

// Default usage (uses L.WMS.Overlay)
var source = L.WMS.source("http://example.com/mapserv", {
    'transparent': true
});
source.getLayer("layer1").addTo(map);
source.getLayer("layer2").addTo(map);

// Tile mode (Uses L.WMS.TileLayer)
var s = L.WMS.source("http://example.com/mapserv", {
    'transparent': true,
    'tiled': true
});
source.getLayer("layer1").addTo(map);
source.getLayer("layer2").addTo(map);

```

leaflet.wms can be loaded via AMD, CommonJS/Node, and browser global environments.

```javascript
// AMD example
define(['leaflet', 'leaflet.wms'],
function(L, wms) {

// L.WMS === wms;
var source = wms.source("http://example.com/mapserv");

});
```

## API

leaflet.wms provides four layer classes (and shortcut lowercase functions) that facilitate working with WMS layers.  To get the most out of leaflet.wms, it's generally best to just use the `L.WMS.Source` virtual layer.

### L.WMS.TileLayer

This class is (currently) identical to [L.TileLayer.WMS].  It provides a simple interface for loading tiles from a WMS service.

```javascript
var tiles = L.WMS.tileLayer("http://example.com/mapserv", {
    'tileSize': 512,
    'layers': 'layer1,layer2'
});
tiles.addTo(map);
```

### L.WMS.Overlay

This class provides a "single-tile"/untiled/non-tiled WMS layer.   Every time the map is panned or zoomed, a new WMS image will be requested for the entire display.  To make transitions smoother, the existing image will be kept visible until the new one is loaded.  An internal [L.ImageOverlay] instance is created for this purpose. (This technique was inspired by the [esri-leaflet] plugin.)

The API is nearly identical to `L.WMS.TileLayer`, except that the tile options do not apply.  

```javascript
var overlay = L.WMS.overlay("http://example.com/mapserv", {
    'layers': 'layer1,layer2'
});
overlay.addTo(map);
```

### L.WMS.Source

`L.WMS.Source` is a virtual Leaflet "layer" that manages multiple WMS layers coming from a single WMS source.  By using the same source for multiple layers, you can have the WMS service composite the image, and avoid overloading the client with multiple large images.  `L.WMS.Source` is a virtual layer, as it does not load the WMS image directly.  Instead, it creates an internal `L.WMS.Overlay` or `L.WMS.TileLayer` to handle the actual loading.

Like the other WMS layers, `L.WMS.Source` takes a URL and an options object as initialization parameters.  The options are passed on to the underlying `Overlay` or `TileLayer`.  An additional option, `tiled`, toggles whether to use a `TileLayer`.  The default is `false`, which uses the non-tiled `Overlay`.  Unless your WMS service is optimized for tiling, the default should provide the best performance.

`L.WMS.Source` provides two functions for toggling on and off individual WMS layers (`addSubLayer` and `removeSubLayer`, respectively).  That said, it is usually more convenient to use `L.WMS.Layer` instances (described next).

```javascript
var source = L.WMS.source("http://example.com/mapserv");
source.addSubLayer('layer1');
source.addTo(map);
```

### L.WMS.Layer
`L.WMS.Layer` is a virtual Leaflet "layer" that facilitates Leaflet-style operations on individual WMS layers.  For example, you can "add" a `L.WMS.Layer` to a map, and the corresponding `Source` will automatically be updated (instead of actually adding a new overlay to the map).  `L.WMS.Layer` is particularly useful in conjunction with Leaflet's built in layer control.  L.WMS.Layer takes three arguments: a `source`, a `layerName`, and the WMS `options` object.  The `source` can be a source object or a URL.  If a URL is given, a source object will be created from the URL if it doesn't exist already.

For convenience, `L.WMS.Source` provides a `getLayer` function that will generate a `L.WMS.Layer` already bound to the source object.  It's usually better to use this feature instead of creating `L.WMS.Layer` instances directly.

```javascript
// Okay
var layer1 = L.WMS.layer("http://example.com/mapserv", "layer1");
var layer2 = L.WMS.layer("http://example.com/mapserv", "layer2");
// layer1._source === layer2._source
var control = L.control.layers({}, {
    'Layer 1': layer1,
    'Layer 2': layer2
})
control.addTo(map);
```
```javascript
// Recommended
var source = L.WMS.source("http://example.com/mapserv");
var layer1 = source.getLayer('layer1');
var layer2 = source.getLayer('layer2');
var control = L.control.layers({}, {
    'Layer 1': layer1,
    'Layer 2': layer2
})
control.addTo(map);
```

[Leaflet]: http://leafletjs.com
[esri-leaflet]: https://github.com/Esri/esri-leaflet
[L.TileLayer.WMS]: http://leafletjs.com/reference.html#tilelayer-wms
[L.ImageOverlay]: http://leafletjs.com/reference.html#imageoverlay
