"use-strict";
console.log("connected")

function hideToolbar() {
    document.getElementsByClassName("panel")[0].classList.toggle("hidden");
    document.getElementById("button").classList.toggle("hidden_btn");
    document.getElementsByClassName("main")[0].classList.toggle("hidden_panel");
    MAP.invalidateSize({animate: true});
    console.log(document.getElementsByClassName("panel")[0].classList);
}


