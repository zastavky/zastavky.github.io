"use-strict";
console.log("connected")

function hideToolbar() {
    document.getElementsByClassName("panel")[0].classList.toggle("hidden");
    document.getElementById("button").classList.toggle("hidden_btn");
    document.getElementsByClassName("main")[0].classList.toggle("hidden_panel");
    MAP.invalidateSize({ animate: true });
    //console.log(document.getElementsByClassName("panel")[0].classList);
}

window.addEventListener("load", function (e) {
    document.getElementById("intro").onclick = function () { switchIntro() };
    document.getElementById("nodesBrno").onclick = function () { switchNodesBrno() };
    document.getElementById("nodesRegion").onclick = function () { switchNodesRegion() };
    document.getElementById("info").onclick = function () { switchInfo() };
})

function switchIntro() {
    let menu_window_new = document.getElementById("menu-window")
    let introText = "<p>Vítejte na stránkách pro vyhledávání zastávek v&nbsp;" +
        "IDS JMK. Na&nbspzáložkách Brno a&nbspRegion se můžete rychle navigovat na&nbspjednotlivé přestupní uzly v&nbspJihomoravském kraji. " + 
        "Po kliknutí na zastávku se zobrazí aktuální odjezdy (jsou-li k dispozici).</p>"
    menu_window_new.innerHTML = introText
}


function switchNodesRegion() {
    let menu_window_new = document.getElementById("menu-window")
    let innerHTMLText = "<table class='nodesTable'>"
    fetch("https://gist.githubusercontent.com/zastavky/2c0471269e67e21c0777f257f159ca59/raw/e03a4d45d865d63e241903e74f5424e5b85fb279/nodesBrno.json")
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
                            console.log(e)
                            newBounds = []
                            for (let i = 0; i < stops_json.features.length; i++) {
                                if (stops_json.features[i].properties.stop_name.toUpperCase().includes(e.target.innerHTML.toUpperCase() + ",")) {
                                    newPoint = []
                                    lat = stops_json.features[i].geometry.coordinates[1]
                                    newPoint.push(lat)
                                    lng = stops_json.features[i].geometry.coordinates[0]
                                    newPoint.push(lng)
                                    newBounds.push(newPoint)
                                }
                            }
                            if (newBounds.length > 0) { MAP.fitBounds(newBounds) }
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
    menu_window_new.removeEventListener("click", function () { })
    let innerHTMLText = "<table class='nodesTable'>"
    fetch("https://gist.githubusercontent.com/zastavky/2c0471269e67e21c0777f257f159ca59/raw/a45ffdd39873443aa29ae51ff7c9be057e19bf56/nodesBrno.json")
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
                            stops = e.target.innerHTML.toUpperCase().split(" + ")
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
                            if (newBounds.length > 0) { MAP.fitBounds(newBounds) }
                        }
                        ).catch(e => {
                            console.log(e);
                        });
                }
            })
        })
}

function switchInfo() {
    let menu_window_new = document.getElementById("menu-window")
    let infoText = "<p>Existují i další nápady, kam tu stránku rozvíjet - jaké další funkcionality by mohla mít. Ale už na to bohužel do odezvdání cvika nevyšel čas...</p>"
    menu_window_new.innerHTML = infoText
}

/*
var name = "";
$.get('https://cors-anywhere.herokuapp.com/https://pdf.dpmb.cz/StopList.aspx?lc=36&zn=Chaloupky&cu=1178&n=9' + name, function(response) {
    let a = response.match("<a class=\"pdf inline\" href=\"[\\D\\d]*\">Česká<\/a>");
console.log(a[0])});*/