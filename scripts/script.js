"use-strict";
console.log("connected")

function hideToolbar() {
    document.getElementsByClassName("panel")[0].classList.toggle("hidden");
    document.getElementById("button").classList.toggle("hidden_btn");
    document.getElementsByClassName("main")[0].classList.toggle("hidden_panel");
    MAP.invalidateSize({ animate: true });
    console.log(document.getElementsByClassName("panel")[0].classList);
}

window.addEventListener("load", function (e) {
    document.getElementById("intro").onclick = function () { switchIntro() };
    document.getElementById("nodesBrno").onclick = function () { switchNodesBrno() };
    document.getElementById("nodesRegion").onclick = function () { switchNodesRegion() };
})

function switchIntro() {
    let menu_window_new = document.getElementById("menu-window")
    let introText = "<p>Vítejte na stránkách pro vyhledávání zastávek v&nbsp;" +
        "IDS JMK. Nyní se bude řešit optimalizace vykreslování zastávek (WebGL/shlukování) a&nbsp;" +
        "stahování informací pro zobrazení odjezdů spojů</p>"
    menu_window_new.innerHTML = introText
}


function switchNodesRegion() {
    let menu_window_new = document.getElementById("menu-window")
    let innerHTMLText = "<table class='nodesTable'>"
    fetch("https://gist.githubusercontent.com/zastavky/f0f1165cc6af94483fcd9b4dda199539/raw/c33d45aa38115d54ae54f6834ae6a63e3568eed6/nodes.json")
        .then(response => response.json())
        .then(nodes => {
            for (node in nodes) {
                innerHTMLText += "<tr><td id=" + node + ">"
                innerHTMLText += nodes[node].toUpperCase() + "</td></tr>"
            }
            innerHTMLText += "</table>"
            menu_window_new.innerHTML = innerHTMLText

            let newBounds
            let newPoint
            let lng
            let lat
            menu_window_new.addEventListener("click", function (e) {
                if (e.target.tagName == "TD") {
                    fetch("https://raw.githubusercontent.com/zastavky/zastavky.github.io/master/geojson/stops.geojson")
                        .then(response => response.json())
                        .then(stops_json => {
                            newBounds = []
                            for (let i = 0; i < stops_json.features.length; i++) {
                                if (stops_json.features[i].properties.stop_name.toUpperCase().includes(e.srcElement.innerHTML.toUpperCase() + ",")) {
                                    newPoint = []
                                    lat = stops_json.features[i].geometry.coordinates[1]
                                    newPoint.push(lat)
                                    lng = stops_json.features[i].geometry.coordinates[0]
                                    newPoint.push(lng)
                                    newBounds.push(newPoint)
                                }
                            }
                            if (newBounds.length > 0)
                                {MAP.fitBounds(newBounds)}
                        }
                        ).catch(e => {
                            console.log(e);
                        });
                }
            })
        })
}


function switchNodesBrno() {
    let menu_window_new = document.getElementById("menu-window")
    menu_window_new.removeEventListener("click", function() {})
    let innerHTMLText = "<table class='nodesTable'>"
    fetch("https://gist.githubusercontent.com/zastavky/2c0471269e67e21c0777f257f159ca59/raw/506dfb1041d3bd1f75de2b7a11d28ec7fb4a284d/nodesBrno.json")
        .then(response => response.json())
        .then(nodes => {
            for (node in nodes) {
                innerHTMLText += "<tr><td id=" + node + ">"
                innerHTMLText += nodes[node].toUpperCase() + "</td></tr>"
            }
            innerHTMLText += "</table>"
            menu_window_new.innerHTML = innerHTMLText

            let newBounds
            let newPoint
            let lng
            let lat
            menu_window_new.addEventListener("click", function (e) {
                if (e.target.tagName == "TD") {
                    fetch("https://raw.githubusercontent.com/zastavky/zastavky.github.io/master/geojson/stops.geojson")
                        .then(response => response.json())
                        .then(stops_json => {
                            newBounds = []
                            let stops
                            stops = e.srcElement.innerHTML.toUpperCase().split(" + ")
                            for (let i = 0; i < stops_json.features.length; i++) {
                                for (let j = 0; j < stops.length; j++) {
                                    if (stops_json.features[i].properties.stop_name.toUpperCase() == stops[j]) {
                                        newPoint = []
                                        lat = stops_json.features[i].geometry.coordinates[1]
                                        newPoint.push(lat)
                                        lng = stops_json.features[i].geometry.coordinates[0]
                                        newPoint.push(lng)
                                        newBounds.push(newPoint)
                                    }
                                }
                            }
                            if (newBounds.length > 0)
                                {MAP.fitBounds(newBounds)}
                        }
                        ).catch(e => {
                            console.log(e);
                        });
                }
            })
        })
}