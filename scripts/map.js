"use strict"

console.log("connected");

async function getUserAsync(urlString) {
    let response = await fetch(urlString);
    let data = await response.json();
    return data;
}

function geoJSONFilter(stops, locationTypeValue, map) {
    let stopIcon = L.icon({
        iconUrl: "icons/zastavka_kordis_100_100.svg",
        iconSize: [15, 15],
    });
    let stopsFiltered = L.geoJSON(stops, {
        pointToLayer: function (geoJsonPoint, latlng) {
            let currentMarker = L.marker(latlng, { icon: stopIcon });
            return currentMarker;
        },
        filter: function (feature) {
            let coords = {};
            coords.lng = feature.geometry.coordinates[0];
            coords.lat = feature.geometry.coordinates[1];
            if (feature.properties.location_type === locationTypeValue && map.getBounds().contains(coords)) {
                return true;
            }
        }
    })
    return stopsFiltered
}

function findDirection(stops_dir, stop_id, postlist_num_postID) {
    let regex = RegExp(/U(\d*)/);
    let stop = stop_id.match(regex)[0];

    let post_id = postlist_num_postID;
    let this_stop_id = stop + "Z" + post_id;
    for (let i = 0; i < stops_dir.features.length; i++) {
        if (stops_dir.features[i].properties.stop_id_gtfs == this_stop_id) {
            return stops_dir.features[i].properties.direction;
        }
    }
}

function createQueryForDeparturesAPI(stop_id, locationTypeValue) {
    let url_of_query;

    let regex_0 = RegExp(/U(\d*)/);
    let stop_id_of_query = stop_id.match(regex_0)[1];

    if (locationTypeValue == 0) {
        let regex_1 = RegExp(/Z(\d*)/);
        let post_id_of_query = stop_id.match(regex_1)[1];
        url_of_query = "https://cors-anywhere.herokuapp.com/https://mapa.idsjmk.cz/api/Departures?stopid=" + stop_id_of_query + "&postid=" + post_id_of_query;


    } else if (locationTypeValue == 1) {
        url_of_query = "https://cors-anywhere.herokuapp.com/https://mapa.idsjmk.cz/api/Departures?stopid=" + stop_id_of_query;


    } else {
        console.log("You don't have valid locationTypeValue!");
    }
    return url_of_query;
}

function downloadDepartures(data, stops_direction, stop_id) {
    let postList = data.PostList;
    let postDirection;
    let connectionInfo = "";

    if (postList.length == 0) {
        connectionInfo = "<p class='downloadDeparturesFailed'>K tomuto označníku nemáme bohužel aktuální informace.</p>"
    }

    for (let post_num in postList) {
        postDirection = "<tr class='stopInfoDirection'><td colspan='4'>" + findDirection(stops_direction, stop_id, postList[post_num].PostID).slice(1, -1) + "</td></tr>";

        if (postList[post_num].Departures.length == 0) {
            connectionInfo = postDirection + "<tr><td class='connectionInfoNoDeparture' colspan='4'>Odtud nic neodjíždí...</td></tr>";
        } else {
            let connectionRow = "";
            let departures = postList[post_num].Departures;
            for (let k = 0; k < departures.length; k++) {
                connectionRow += lineColorAssignment(departures[k].LineName) + "<td class='connectionInfoFinalStop'>" + departures[k].FinalStop +
                    "</td><td class='connectionInfoTimeMark'>" + departures[k].TimeMark + "</td><td class='connectionInfoTimeMark'>" + lowFloorAssignment(departures[k].IsLowFloor) + "</td></tr>";
            } connectionInfo += postDirection + connectionRow;
        }
    }
    document.getElementById("table").innerHTML = "<table id='table-content'>" + connectionInfo + "</table>"
}

function lowFloorAssignment(lowFloor) {
    if (lowFloor) {
        return "<img src='icons/isLowFloor.svg' alt='True'><img>"
    } else {
        return "<img src='icons/isNotLowFloor.svg' alt='False'><img>"
    }
}

function lineColorAssignment(lineName) {
    let className = "connectionInfoLineName"

    if (Number.isInteger(parseInt(lineName))) {
        if (lineName < 20) {
            className += "-tram"
        } else if (lineName >= 20 && lineName < 40) {
            className += "-trolleybus"
        } else if (lineName >= 40 && lineName < 90) {
            className += "-bus"
        } else if (lineName >= 90 && lineName < 100) {
            className += "-nightbus"
        } else if (lineName >= 100) {
            className += "-regionbus"
        }
    } else if (lineName.slice(0, 1) == "P") {
        if (lineName < 20) {
            className += "-tram"
        } else if (lineName >= 20 && lineName < 40) {
            className += "-trolleybus"
        } else if (lineName >= 40 && lineName < 90) {
            className += "-bus"
        }
    } else if (lineName.slice(0, 1) == "S") {
        className += "-train"
    } else if (lineName.slice(0, 1) == "H") {
        className += "-historical"
    } else {
        className += "unknown"
    }
    return "<td class='" + className + "'>" + lineName + "</td>"
}

const MAP_ID = document.getElementById("m");
const MAP = L.map(MAP_ID);

const URL_MAPY_CZ = "https://mapserver.mapy.cz/base-m/{z}-{x}-{y}?s=0.2&dm=Luminosity";
const MAPY_CZ = L.tileLayer(URL_MAPY_CZ, {
    attribution: "<a href='https://mapy.cz/zakladni?'>Seznam.cz</a>"
})

MAP.addLayer(MAPY_CZ);
MAP.setView([49.1946378, 16.6070083], 16);

let graphicScale = L.control.graphicScale({ position: "bottomleft", fill: "fill", maxUnitsWidth: 30, className: "scale" }).addTo(MAP);

getUserAsync("https://raw.githubusercontent.com/zastavky/zastavky.github.io/master/geojson/stops.geojson")
    .then(stops_json => {
        let stopsDetail = geoJSONFilter(stops_json, 0, MAP);
        let layerOfStopsDetail = L.featureGroup().bindPopup(function (layer) {
            let popup = "<div id='stopInfo'><h1 class='stopName'>" + layer.feature.properties.stop_name.toUpperCase() + "</h1><div id='table'><table id='table-content'></table></div></div>";
            return popup;
        }, { autoPan: false, minWidth: 300, maxWidth: 350 });

        layerOfStopsDetail.on("click", function (e) {

            e.target._popup.setLatLng(MAP.getCenter());

            let tr = document.createElement("TR");
            tr.setAttribute("class", 'waiting');
            tr.innerHTML = "<td>čekejte prosím...</td>";
            document.getElementById('table-content').appendChild(tr);

            getUserAsync("https://gist.githubusercontent.com/zastavky/54be5f0604b7ca05840f0103dc72c6f9/raw/8e959c1c052daa511cdebd7bc5dc5501b7103a5d/stops_kordis_direction.geojson")
                .then(stops_direction => {
                    let stop_id = e.layer.feature.properties.stop_id;
                    let url_of_query = createQueryForDeparturesAPI(stop_id, 0);
                    getUserAsync(url_of_query)
                        .then(data => {
                            downloadDepartures(data, stops_direction, stop_id);
                        }).catch(e => {
                            console.log(e);
                            document.getElementById("table").innerHTML = "<p class='downloadDeparturesFailed'>Při načítání online dat došlo k chybě. Uploading of data failed.</p>"
                        })
                })

        });
        layerOfStopsDetail.addLayer(stopsDetail).addTo(MAP);


        let stopsParents = geoJSONFilter(stops_json, 1, MAP);
        let stopsCluster = L.markerClusterGroup({
            maxClusterRadius: 45,
            iconCreateFunction: function (cluster) {
                return L.divIcon({ iconSize: [30, 30], className: "clusterIcon" });
            }
        }).bindPopup(function (layer) {
            let popup = "<div id='stopInfo'><h1 class='stopName'>" + layer.feature.properties.stop_name.toUpperCase() + "</h1><div id='table'><table id='table-content'></table></div></div>";
            return popup;
        }, { autoPan: false, minWidth: 300, maxWidth: 350 })

        stopsCluster.on("click", function (e) {

            e.target._popup.setLatLng(MAP.getCenter());

            let tr = document.createElement("TR");
            tr.setAttribute("class", 'waiting');
            tr.innerHTML = "<td>čekejte prosím...</td>";
            document.getElementById('table-content').appendChild(tr);

            getUserAsync("https://gist.githubusercontent.com/zastavky/54be5f0604b7ca05840f0103dc72c6f9/raw/8e959c1c052daa511cdebd7bc5dc5501b7103a5d/stops_kordis_direction.geojson")
                .then(stops_direction => {
                    let stop_id = e.layer.feature.properties.stop_id;
                    let url_of_query = createQueryForDeparturesAPI(stop_id, 1);
                    getUserAsync(url_of_query)
                        .then(data => {
                            downloadDepartures(data, stops_direction, stop_id);
                        }).catch(e => {
                            console.log(e);
                            document.getElementById("table").innerHTML = "<p class='downloadDeparturesFailed'>Při načítání online dat došlo k chybě. Uploading of data failed.</p>"
                        })
                })
        });

        MAP.addLayer(stopsCluster);

        MAP.on("zoom", function () {
            if (MAP.getZoom() >= 16) {
                layerOfStopsDetail.clearLayers();
                stopsDetail = geoJSONFilter(stops_json, 0, MAP);
                layerOfStopsDetail.addLayer(stopsDetail);
                stopsCluster.clearLayers();

            }
            else if (MAP.getZoom() >= 10 && MAP.getZoom() < 16) {
                layerOfStopsDetail.clearLayers();
                stopsParents = geoJSONFilter(stops_json, 1, MAP);
                stopsCluster.clearLayers();
                stopsCluster.addLayer(stopsParents);

            }
            else if (MAP.getZoom() < 10) {
                stopsCluster.clearLayers();
                stopsParents = geoJSONFilter(stops_json, 1, MAP);
                stopsCluster.addLayer(stopsParents);
            }
        })
        MAP.on("moveend", function () {
            if (MAP.getZoom() >= 16) {
                layerOfStopsDetail.clearLayers();
                stopsDetail = geoJSONFilter(stops_json, 0, MAP);
                layerOfStopsDetail.addLayer(stopsDetail);
                stopsCluster.clearLayers();

            }
            else if (MAP.getZoom() >= 10 && MAP.getZoom() < 16) {
                layerOfStopsDetail.clearLayers();
                stopsParents = geoJSONFilter(stops_json, 1, MAP);
                stopsCluster.clearLayers();
                stopsCluster.addLayer(stopsParents);

            }
            else if (MAP.getZoom() < 10) {
                stopsCluster.clearLayers();
                stopsParents = geoJSONFilter(stops_json, 1, MAP);
                stopsCluster.addLayer(stopsParents);
            }
        })
    });
