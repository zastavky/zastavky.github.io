"use strict";

console.log("connected");

async function getUserAsync(urlString) {
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
            let currentMarker = L.marker(latlng, { icon: stop_icon });
            return currentMarker;
        },
        filter: function (feature) {
            let coords = {}
            coords.lng = feature.geometry.coordinates[0]
            coords.lat = feature.geometry.coordinates[1]
            if (feature.properties.location_type === locationTypeValue && MAP.getBounds().contains(coords)) {
                return true;
            }
        }
    }).bindPopup(function (layer) {
        if (locationTypeValue == 0) {
            let popup = "<div id='stopInfo'><h1 class='stopName'>" + layer.feature.properties.stop_name.toUpperCase() + "</h1><table id='table-content'></table></div>"
            return popup;
        }
    }, { autoPan: false }).on("click", function (e) {
        let tr = document.createElement("TR")
        tr.setAttribute("class", 'waiting')
        tr.innerHTML = "<td>čekejte prosím...</td>"
        document.getElementById('table-content').appendChild(tr)

        getUserAsync("https://gist.githubusercontent.com/zastavky/54be5f0604b7ca05840f0103dc72c6f9/raw/8e959c1c052daa511cdebd7bc5dc5501b7103a5d/stops_kordis_direction.geojson")
            .then(stops_direction => {

                let stop_id = e.layer.feature.properties.stop_id
                let url_of_query

                let regex_0 = RegExp(/U(\d*)/)
                let stop_id_of_query = stop_id.match(regex_0)[1]

                if (locationTypeValue == 0) {
                    let regex_1 = RegExp(/Z(\d*)/);
                    let post_id_of_query = stop_id.match(regex_1)[1];
                    url_of_query = "https://cors-anywhere.herokuapp.com/https://mapa.idsjmk.cz/api/Departures?stopid=" + stop_id_of_query + "&postid=" + post_id_of_query;
                    console.log(url_of_query);

                } else if (locationTypeValue == 1) {
                    url_of_query = "https://cors-anywhere.herokuapp.com/https://mapa.idsjmk.cz/api/Departures?stopid=" + stop_id_of_query;
                    console.log(url_of_query);

                } else {
                    console.log("You don't have valid locationTypeValue!")
                }

                getUserAsync(url_of_query)
                    .then(data => {
                        let postList = data.PostList
                        let postDirection
                        let connectionInfo = ""

                        for (let post_num in postList) {
                            postDirection = "<tr class='stopInfoDirection'><td colspan='4'>" + findDirection(stops_direction, stop_id, postList[post_num].PostID) + "</td></tr>"

                            if (postList[post_num].Departures.length == 0) {
                                connectionInfo = postDirection + "<tr><td class='connectionInfoNoDeparture' colspan='4'>Odsud nic neodjíždí...</td></tr>"
                            } else {
                                let connectionRow = ""
                                let departures = postList[post_num].Departures
                                for (let k = 0; k < departures.length; k++) {
                                    connectionRow += "<tr><td class='connectionInfoLineName'>" + departures[k].LineName + "</td><td class='connectionInfoFinalStop'>" + departures[k].FinalStop +
                                        "</td><td class='connectionInfoTimeMark'>" + departures[k].TimeMark + "</td><td class='connectionInfoTimeMark'>" + departures[k].IsLowFloor + "</td></tr>"
                                } connectionInfo += postDirection + connectionRow
                            }
                        }
                        document.getElementById('table-content').innerHTML = connectionInfo
                    })
            })
    })
    return stopsFiltered
}

function findDirection(stops_dir, stop_id, postlist_num_postID) {
    let regex = RegExp(/U(\d*)/);
    console.log(stop_id)
    let stop = stop_id.match(regex)[0];

    let post_id = postlist_num_postID;
    let this_stop_id = stop + "Z" + post_id
    for (let i = 0; i < stops_dir.features.length; i++) {
        if (stops_dir.features[i].properties.stop_id_gtfs == this_stop_id) {
            return stops_dir.features[i].properties.direction
        }
    }
}


const MAP_ID = document.getElementById("m");
const MAP = L.map(MAP_ID);

const URL_MAPY_CZ = "https://mapserver.mapy.cz/base-m/{z}-{x}-{y}?s=0.2&dm=Luminosity";
const MAPY_CZ = L.tileLayer(URL_MAPY_CZ, {
    attribution: "<a href='https://mapy.cz/zakladni?'>Seznam.cz</a>"
})

MAP.addLayer(MAPY_CZ)
MAP.setView([49.1946378, 16.6070083], 16)

let graphicScale = L.control.graphicScale({ position: "bottomleft", fill: "fill", maxUnitsWidth: 30, className: "scale" }).addTo(MAP);

getUserAsync("https://raw.githubusercontent.com/zastavky/zastavky.github.io/master/geojson/stops.geojson")
    .then(stops_json => {
        let stopsDetail = geoJSONFilter(stops_json, 0).addTo(MAP)
        for (stop in stopsDetail._layers) {
            /*console.log(stopsDetail._layers[stop].feature.properties.stop_id)*/
        }

        let stopsParents = geoJSONFilter(stops_json, 1)

        let stopsCluster = L.markerClusterGroup({
            maxClusterRadius: 45,
            iconCreateFunction: function (cluster) {
                /*let markersCount = cluster.getAllChildMarkers();
                let html = "<b class='clusterText'>"+ markersCount.length + "</b>";*/
                return L.divIcon({ iconSize: [30, 30], className: "clusterIcon" });
            }
        }).bindPopup(function (layer) {
            let popup = "<div id='stopInfo'><h1 class='stopName'>" + layer.feature.properties.stop_name.toUpperCase() + "</h1><table id='table-content'></table></div>"
            return popup;
        }, { autoPan: false })

        MAP.addLayer(stopsCluster);

        MAP.on("zoom", function () {
            if (MAP.getZoom() >= 16) {
                stopsDetail.remove();
                stopsDetail = geoJSONFilter(stops_json, 0).addTo(MAP);
                stopsCluster.clearLayers();

            }
            else if (MAP.getZoom() >= 10 && MAP.getZoom() < 16) {
                stopsDetail.remove();
                stopsParents = geoJSONFilter(stops_json, 1);
                stopsCluster.clearLayers();
                stopsCluster.addLayer(stopsParents);

            }
            else if (MAP.getZoom() < 10) {
                stopsCluster.clearLayers();
                stopsParents = geoJSONFilter(stops_json, 1);
                stopsCluster.addLayer(stopsParents);
            }
        })
        MAP.on("moveend", function () {
            if (MAP.getZoom() >= 16) {
                stopsDetail.remove();
                stopsDetail = geoJSONFilter(stops_json, 0).addTo(MAP);
                stopsCluster.clearLayers();

            }
            else if (MAP.getZoom() >= 10 && MAP.getZoom() < 16) {
                stopsDetail.remove();
                stopsParents = geoJSONFilter(stops_json, 1);
                stopsCluster.clearLayers();
                stopsCluster.addLayer(stopsParents);

            }
            else if (MAP.getZoom() < 10) {
                stopsCluster.clearLayers();
                stopsParents = geoJSONFilter(stops_json, 1);
                stopsCluster.addLayer(stopsParents);
            }
        })
    });
