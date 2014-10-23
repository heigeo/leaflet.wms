/*!
 * leaflet.wms.js
 * A collection of Leaflet utilities for working with Web Mapping services.
 * (c) 2014, Houston Engineering, Inc.
 * MIT License
 */

(function (factory) {
    // Module systems magic dance, Leaflet edition
    if (typeof define === 'function' && define.amd) {
        // AMD
        define(['leaflet'], factory);
    } else if (typeof module !== 'undefined') {
        // Node/CommonJS
        module.exports = factory(require('leaflet'));
    } else {
        // Browser globals
        if (typeof this.L === 'undefined')
            throw 'Leaflet must be loaded first!';
        factory(this.L);
    }
}(function (L) {

// Namespace
L.WMS = L.wms = {};

/*
 * L.WMS.Source
 * The Source object manages a single WMS connection.  Multiple "layers" can be
 * created with the getLayer function, but a single request will be sent for
 * each image update.  Can be used in non-tiled "overlay" mode (default), or
 * tiled mode, via an internal L.WMS.Overlay or L.WMS.TileLayer, respectively.
 */
L.WMS.Source = L.Layer.extend({
    'options': {
        'tiled': false,
        'identify': true
    },

    'initialize': function(url, options) {
        this._url = url;
        this._subLayers = {};
        options = L.setOptions(this, options);
        this._overlay = this.createOverlay(url, options);
    },

    'createOverlay': function(url, options) {
        if (options.tiled) {
            return L.WMS.tileLayer(url, options);
        } else {
            return L.WMS.overlay(url, options);
        }
    },

    'onAdd': function() {
        this.refreshOverlay();
    },

    'getEvents': function() {
        if (this.options.identify) {
            return {'click': this.identify};
        } else {
            return {};
        }
    },

    'getLayer': function(name) {
        return L.WMS.layer(this, name);
    },

    'addSubLayer': function(name) {
        this._subLayers[name] = true;
        this.refreshOverlay();
    },

    'removeSubLayer': function(name) {
        delete this._subLayers[name];
        this.refreshOverlay();
    },

    'refreshOverlay': function() {
        var subLayers = Object.keys(this._subLayers).join(",");
        if (!this._map) {
            return;
        }
        if (!subLayers) {
            this._overlay.remove();
        } else {
            this._overlay.setParams({'layers': subLayers});
            this._overlay.addTo(this._map);
        }
    },

    'identify': function(evt) {
        // Identify map features in response to map clicks. To customize this
        // behavior, create a class extending L.WMS.Source and override one or
        // more of the following hook functions.

        var layers = this.getIdentifyLayers();
        if (!layers.length) {
            return;
        }
        this.getFeatureInfo(
            evt.containerPoint, evt.latlng, layers,
            this.showFeatureInfo
        );
    },

    'getFeatureInfo': function(point, latlng, layers, callback) {
        // Request WMS GetFeatureInfo and call callback with results
        // (split from identify() to faciliate use outside of map events)
        var params = this.getFeatureInfoParams(point, layers),
            url = this._url + L.Util.getParamString(params, this._url);

        this.showWaiting();
        ajax.call(this, url, done);

        function done(result) {
            this.hideWaiting();
            var text = this.parseFeatureInfo(result, url);
            callback.call(this, latlng, text);
        }
    },

    'getIdentifyLayers': function() {
        // Hook to determine which layers to identify
        if (this.options.identifyLayers)
            return this.options.identifyLayers;
        return Object.keys(this._subLayers);
     },

    'getFeatureInfoParams': function(point, layers) {
        // Hook to generate parameters for WMS service GetFeatureInfo request
        var wmsParams, overlay;
        if (this.options.tiled) {
            // Create overlay instance to leverage updateWmsParams
            overlay = L.WMS.overlay(this._url, this.options);
            overlay.updateWmsParams(this._map);
            wmsParams = overlay.wmsParams;
            wmsParams.layers = layers.join(',');
        } else {
            // Use existing overlay
            wmsParams = this._overlay.wmsParams;
        }
        var infoParams = {
            'request': 'GetFeatureInfo',
            'query_layers': layers.join(','),
            'X': point.x,
            'Y': point.y
        };
        return L.extend({}, wmsParams, infoParams);
    },

    'parseFeatureInfo': function(result, url) {
        // Hook to handle parsing AJAX response
        if (result == "error") {
            // AJAX failed, possibly due to CORS issues.
            // Try loading content in <iframe>.
            result = "<iframe src='" + url + "' style='border:none'>";
        }
        return result;
    },

    'showFeatureInfo': function(latlng, info) {
        // Hook to handle displaying parsed AJAX response to the user
        if (!this._map) {
            return;
        }
        this._map.openPopup(info, latlng);
    },

    'showWaiting': function() {
        // Hook to customize AJAX wait animation
        if (!this._map)
            return;
        this._map._container.style.cursor = "progress";
    },

    'hideWaiting': function() {
        // Hook to remove AJAX wait animation
        if (!this._map)
            return;
        this._map._container.style.cursor = "default";
    }
});

L.WMS.source = function(url, options) {
    return new L.WMS.Source(url, options);
};

/*
 * L.WMS.Layer
 * Leaflet "layer" with all actual rendering handled via an underlying Source
 * object.  Can be called directly with a URL to automatically create or reuse
 * an existing Source.  Note that the auto-source feature doesn't work well in
 * multi-map environments; so for best results, create a Source first and use
 * getLayer() to retrieve L.WMS.Layer instances.
 */

L.WMS.Layer = L.Layer.extend({
    'initialize': function(source, layerName, options) {
        if (!source.addSubLayer) {
            // Assume source is a URL
            source = L.WMS.getSourceForUrl(source, options);
        }
        this._source = source;
        this._name = layerName;
    },
    'onAdd': function() {
        if (!this._source._map)
            this._source.addTo(this._map);
        this._source.addSubLayer(this._name);
    },
    'onRemove': function() {
        this._source.removeSubLayer(this._name);
    }
});

L.WMS.layer = function(source, options) {
    return new L.WMS.Layer(source, options);
};

// Cache of sources for use with L.WMS.Layer auto-source option
var sources = {};
L.WMS.getSourceForUrl = function(url, options) {
    if (!sources[url]) {
        sources[url] = L.WMS.source(url, options);
    }
    return sources[url];
};


// Copy tiled WMS layer from leaflet core, in case we need to subclass it later
L.WMS.TileLayer = L.TileLayer.WMS;
L.WMS.tileLayer = L.tileLayer.wms;

/*
 * L.WMS.Overlay:
 * "Single Tile" WMS image overlay that updates with map changes.
 * Portions of L.WMS.Overlay are directly extracted from L.TileLayer.WMS.
 * See Leaflet license.
 */
L.WMS.Overlay = L.Layer.extend({
    'defaultWmsParams': {
        'service': 'WMS',
        'request': 'GetMap',
        'version': '1.1.1',
        'layers': '',
        'styles': '',
        'format': 'image/jpeg',
        'transparent': false
    },

    'initialize': function(url, options) {
        this._url = url;

        // Move WMS parameters to params object
        var optNames = {
            'crs': true,
            'uppercase': true,
            'tiled': true,
            'identify': true,
            'attribution': true
        };
        var params = {};
        for (var opt in options) {
             if (options.hasOwnProperty(opt) && !optNames[opt]) {
                 params[opt] = options[opt];
                 delete options[opt];
             }
        }
        L.setOptions(this, options);
        this.wmsParams = L.extend({}, this.defaultWmsParams, params);
    },

    'setParams': function(params) {
        L.extend(this.wmsParams, params);
        this.update();
    },

    'getAttribution': function() {
        return this.options.attribution;
    },

    'onAdd': function() {
        this.update();
    },

    'onRemove': function(map) {
        if (this._currentOverlay) {
            map.removeLayer(this._currentOverlay);
            delete this._currentOverlay;
        }
        if (this._currentUrl) {
            delete this._currentUrl;
        }
    },

    'getEvents': function() {
        return {
            'moveend': this.update
        };
    },

    'update': function() {
        if (!this._map) {
            return;
        }
        // Determine image URL and whether it has changed since last update
        this.updateWmsParams();
        var url = this.getImageUrl();
        if (this._currentUrl == url) {
            return;
        }
        this._currentUrl = url;

        // Keep current image overlay in place until new one loads
        // (inspired by esri.leaflet)
        var bounds = this._map.getBounds();
        var overlay = L.imageOverlay(url, bounds, {'opacity': 0});
        overlay.addTo(this._map);
        overlay.once('load', _swap, this);
        function _swap() {
            if (!this._map) {
                return;
            }
            if (overlay._url != this._currentUrl) {
                this._map.removeLayer(overlay);
                return;
            } else if (this._currentOverlay) {
                this._map.removeLayer(this._currentOverlay);
            }
            this._currentOverlay = overlay;
            overlay.setOpacity(this.wmsParams.opacity ? this.wmsParams.opacity : 1);
        }
    },

    // See L.TileLayer.WMS: onAdd() & getTileUrl()
    'updateWmsParams': function(map) {
        if (!map) {
            map = this._map;
        }
        // Compute WMS options
        var bounds = map.getBounds();
        var size = map.getSize();
        var wmsVersion = parseFloat(this.wmsParams.version);
        var crs = this.options.crs || map.options.crs;
        var projectionKey = wmsVersion >= 1.3 ? 'crs' : 'srs';
        var nw = crs.project(bounds.getNorthWest());
        var se = crs.project(bounds.getSouthEast());

        // Assemble WMS parameter string
        var params = {
            'width': size.x,
            'height': size.y
        };
        params[projectionKey] = crs.code;
        params.bbox = (
            wmsVersion >= 1.3 && crs === L.CRS.EPSG4326 ?
            [se.y, nw.x, nw.y, se.x] :
            [nw.x, se.y, se.x, nw.y]
        ).join(',');

        L.extend(this.wmsParams, params);
    },

    'getImageUrl': function() {
        var uppercase = this.options.uppercase || false;
        var pstr = L.Util.getParamString(this.wmsParams, this._url, uppercase);
        return this._url + pstr;
    }
});

L.WMS.overlay = function(url, options) {
    return new L.WMS.Overlay(url, options);
};

// Simple AJAX helper (since we can't assume jQuery etc. are present)
function ajax(url, callback) {
    var context = this,
        request = new XMLHttpRequest();
    request.onreadystatechange = change;
    request.open('GET', url);
    request.send();

    function change() {
        if (request.readyState === 4) {
            if (request.status === 200) {
                callback.call(context, request.responseText);
            } else {
                callback.call(context, "error");
            }
        }
    }
}

return L.WMS;

}));
