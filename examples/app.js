requirejs.config({
    'baseUrl': '../lib',
    'paths': {
        'leaflet.wms': '../leaflet.wms' //.js'
    }
});

define(['leaflet', 'leaflet.wms'],
function(L) {

var overlayMap = createMap('overlay-map', false);
var tiledMap = createMap('tiled-map', true);

function createMap(div, tiled) {
    // Map configuration
    var map = L.map(div);
    map.setView([45, -93.2], 6);

    var basemaps = {
        'Basemap': basemap(),
        'Blank': blank().addTo(map)
    };

    // Add WMS source/layers
    var source = L.WMS.source(
        "http://webservices.nationalatlas.gov/wms",
        {
            "format": "image/png",
            "transparent": "true",
            "attribution": "<a href='http://nationalatlas.gov'>NationalAtlas.gov</a>",
            "tiled": tiled
        }
    );

    var layers = {
        'Airports': source.getLayer("airports"),
        'Lakes & Rivers': source.getLayer("lakesrivers"),
        'Time Zones': source.getLayer("timezones"),
        'State Capitals': source.getLayer("statecap")
    };

    // Create layer control
    L.control.layers(basemaps, layers).addTo(map);

    return map;
}

function basemap() {
    // Attribution (https://gist.github.com/mourner/1804938)
    var mqcdn = "http://otile{s}.mqcdn.com/tiles/1.0.0/{type}/{z}/{x}/{y}.png";
    var osmAttr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';
    var mqTilesAttr = 'Tiles &copy; <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png" />';
    return L.tileLayer(mqcdn, {
        'subdomains': '1234',
        'type': 'map',
        'attribution': osmAttr + ', ' + mqTilesAttr
    });
}

function blank() {
    var layer = new L.Layer();
    layer.onAdd = layer.onRemove = function() {};
    return layer;
}

// Export maps for console experimentation
return {
    'maps': {
        'overlay': overlayMap,
        'tiled': tiledMap
    }
};

});

