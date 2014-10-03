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

L.WMS = {};

L.WMS.Source = L.LayerGroup.extend({
    'options': {
    },

    'initialize': function(url, options) {
        this._url = url;
        this._subLayers = {};
        options = L.setOptions(this, options);
        this._overlay = L.tileLayer.wms(url, options);
    },

    'onAdd': function(map) {
        /* jshint unused: false */
        this.refreshOverlay();
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
    }
});

L.WMS.source = function(url, options) {
    return new L.WMS.Source(url, options);
};

var sources = {};
L.WMS.getSourceForUrl = function(url, options) {
    if (!sources[url]) {
        sources[url] = L.WMS.source(url, options);
    }
    return sources[url];
};

L.WMS.Layer = L.Layer.extend({
    'initialize': function(source, layerName, options) {
        if (!source.addSubLayer) {
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

return L.WMS;

}));
