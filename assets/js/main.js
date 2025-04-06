const URL = "https://mediumslateblue-toad-454408.hostingersite.com";

// load header and footer into each page
document.addEventListener("DOMContentLoaded", function()
{
    fetch("/header.html")
        .then(response => response.text())
        .then(data => document.getElementById("header").innerHTML = data);

    fetch("/footer.html")
        .then(response => response.text())
        .then(data => document.getElementById("footer").innerHTML = data);
});

async function sqlRequest(method, action, data = null)
{
    const options = 
    {
        method: method,
        headers:
        {
            "Content-Type": "application/json"
        }
    };

    if (data !== null)
    {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${URL}/api/database.php?action=${action}`, options);
    const json = await response.json();

    return json;
}