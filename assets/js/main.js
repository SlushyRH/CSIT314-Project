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

function sqlRequest(method, action, data = null)
{
    return new Promise((resolve, reject) =>
    {
        const xhr = new XMLHttpRequest();
        xhr.open(method, `/api/database.php?action=${action}`, true);
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = function()
        {
            if (xhr.status >= 200 && xhr.status < 300)
            {
                try
                {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                }
                catch (error)
                {
                    reject(new Error("Failed to parse response JSON"));
                }
            }
            else
            {
                reject(new Error(`Request failed with status ${xhr.status}`));
            }
        };

        xhr.onerror = function()
        {
            reject(new Error("Network error"));
        };

        if (data !== null)
        {
            xhr.send(JSON.stringify(data));
        }
        else
        {
            xhr.send();
        }
    });
}