// load header and footer into each page
document.addEventListener("DOMContentLoaded", function()
{
    // load header
    fetch("./assets/subpages/header.html")
        .then(response => response.text())
        .then(data => document.getElementById("header").innerHTML = data);

    // load footer
    fetch("./assets/subpages/footer.html")
        .then(response => response.text())
        .then(data => document.getElementById("footer").innerHTML = data);
});