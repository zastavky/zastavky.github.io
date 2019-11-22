"use strict";
console.log("connected");

const MAP_ID = document.getElementById("m");
const MAP = L.map(MAP_ID);

const URL_MAPY_CZ = "https://mapserver.mapy.cz/base-m/{z}-{x}-{y}?s=0.2&dm=Luminosity";
const MAPY_CZ = L.tileLayer(URL_MAPY_CZ, {
    attribution: "<a href='https://mapy.cz/zakladni?'>Seznam.cz</a>"
})

MAP.addLayer(MAPY_CZ)
MAP.setView([49.1946378, 16.6070083], 16)

fetch("https://gist.github.com/zastavky/9e66108623c06425726164dfa5687751")
.then(response => response.json())
.then(data => {
    let stop_icon = L.icon({
        iconUrl: "icons/zastavka_kordis_100_100.svg",
        iconSize: [15, 15],
    });
    const STOPS_DETAIL = L.geoJSON(data, {
        pointToLayer: function (geoJsonPoint, latlng) {
            return L.marker(latlng, { icon: stop_icon});
        },
        filter: function (feature) {
            if (feature.properties.location_type === 1) {
                return true;
            }
        }
    }
    ).bindPopup(function (layer) {
        return layer.feature.properties.stop_name;
    });
    STOPS_DETAIL.addTo(MAP)

});



/*
let stops_detail = L.geoJSON(stops_jmk, {
    pointToLayer: function (geoJsonPoint, latlng) {
        return L.marker(latlng, { icon: stop_icon});
    },
    filter: function (feature) {
        if (feature.properties.location_type === 0) {
            return true;
        }
    }
}
).bindPopup(function (layer) {
    return layer.feature.properties.stop_name;
})

let stops = L.geoJSON(stops_jmk, {
    pointToLayer: function (geoJsonPoint, latlng) {
        return L.marker(latlng, { icon: stop_icon});
    },
    filter: function (feature) {
        if (feature.properties.location_type === 1) {
            return true;
        }
    }
}
).bindPopup(function (layer) {
    return layer.feature.properties.stop_name;
})

stops_detail.addTo(MAP)

MAP.on("zoom", function() {
    if (MAP.getZoom() >= 16) {
        stops_detail.addTo(MAP);
        stops.remove();
    }
    else if (MAP.getZoom() >= 10 && MAP.getZoom() < 16 ) {
        stops_detail.remove();
        stops.addTo(MAP);
    }
    else if (MAP.getZoom() < 10) {
        stops.remove();
    }
})
*/