"use strict";
console.log("connected");

async function getUserAsync(urlString) 
{
  let response = await fetch(urlString);
  let data = await response.json()
  return data;
}

function geoJSONFilter(stops, locationTypeValue) {
    let stop_icon = L.icon({
        iconUrl: "icons/zastavka_kordis_100_100.svg",
        iconSize: [15, 15],
    });
    let stopsFiltered = L.geoJSON(stops, {
        pointToLayer: function (geoJsonPoint, latlng) {
            let currentMarker = L.marker(latlng, { icon: stop_icon});
            return currentMarker;
        },
        filter: function (feature) {
            let coords= {}
            coords.lng = feature.geometry.coordinates[0]
            coords.lat = feature.geometry.coordinates[1]
            if (feature.properties.location_type === locationTypeValue && MAP.getBounds().contains(coords)) {
                return true;
            } 
        }
    }).bindPopup(function (layer) {
        let popup = layer.feature.properties.stop_name + "<br/>" + layer.feature.properties.stop_id
        return popup;
    }).on("click", function(e) {
        console.log(e.layer.feature.properties.stop_id)
    });
    return stopsFiltered    
}

const MAP_ID = document.getElementById("m");
const MAP = L.map(MAP_ID);

const URL_MAPY_CZ = "https://mapserver.mapy.cz/base-m/{z}-{x}-{y}?s=0.2&dm=Luminosity";
const MAPY_CZ = L.tileLayer(URL_MAPY_CZ, {
    attribution: "<a href='https://mapy.cz/zakladni?'>Seznam.cz</a>"
})

MAP.addLayer(MAPY_CZ)
MAP.setView([49.1946378, 16.6070083], 16)

let graphicScale = L.control.graphicScale({position: "bottomleft", fill: "fill", maxUnitsWidth: 30, className: "scale"}).addTo(MAP);

getUserAsync("https://raw.githubusercontent.com/zastavky/zastavky.github.io/master/geojson/stops.geojson")
  .then(stops_json => {
    let stopsDetail = geoJSONFilter(stops_json, 0).addTo(MAP)
    for (stop in stopsDetail._layers) {
        /*console.log(stopsDetail._layers[stop].feature.properties.stop_id)*/
    }
    
    let stopsParents = geoJSONFilter(stops_json, 1)

    let stopsCluster = L.markerClusterGroup({maxClusterRadius: 45, 
        iconCreateFunction: function(cluster) {
            /*let markersCount = cluster.getAllChildMarkers();
            let html = "<b class='clusterText'>"+ markersCount.length + "</b>";*/
            return L.divIcon({iconSize: [30,30], className: "clusterIcon"});
        } });
    MAP.addLayer(stopsCluster); 

    MAP.on("zoom", function() {
        if (MAP.getZoom() >= 16) { 
            stopsDetail.remove();      
            stopsDetail = geoJSONFilter(stops_json, 0).addTo(MAP);
            stopsCluster.clearLayers();
            
        }
        else if (MAP.getZoom() >= 10 && MAP.getZoom() < 16 ) {
            stopsDetail.remove();
            stopsParents = geoJSONFilter(stops_json, 1);
            stopsCluster.clearLayers();            
            stopsCluster.addLayer(stopsParents);                 
           
        }
        else if (MAP.getZoom() < 10) {
            stopsCluster.clearLayers();
            stopsCluster.addLayer(stopsParents);
        }
    })
    MAP.on("moveend", function() {
        if (MAP.getZoom() >= 16) { 
            stopsDetail.remove();      
            stopsDetail = geoJSONFilter(stops_json, 0).addTo(MAP);
            stopsCluster.clearLayers();
            
        }
        else if (MAP.getZoom() >= 10 && MAP.getZoom() < 16 ) {
            stopsDetail.remove();
            stopsParents = geoJSONFilter(stops_json, 1);
            stopsCluster.clearLayers();            
            stopsCluster.addLayer(stopsParents);                 
           
        }
        else if (MAP.getZoom() < 10) {
            stopsCluster.clearLayers();
            stopsCluster.addLayer(stopsParents);
        }
    })

});

