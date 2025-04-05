const URL = "https://mediumslateblue-toad-454408.hostingersite.com";

// load header and footer into each page
document.addEventListener("DOMContentLoaded", function() {
    fetch("/header.html")
        .then(response => response.text())
        .then(data => document.getElementById("header").innerHTML = data);

    fetch("/footer.html")
        .then(response => response.text())
        .then(data => document.getElementById("footer").innerHTML = data);
});

async function databaseRequest(method, data = {}, expectJson = true)
{
    try
    {
        let url = `${URL}/api/database.php`;
        let options = 
        {
            method: method,
            headers: {}
        };

        // Prepare the GET or POST request
        if (method.toUpperCase() === "GET")
        {
            const queryString = new URLSearchParams(data).toString();
            url += "?" + queryString;
        }
        else
        {
            options.headers["Content-Type"] = "application/x-www-form-urlencoded";
            options.body = new URLSearchParams(data).toString();
        }

        const response = await fetch(url, options);

        if (!response.ok)
        {
            throw new Error(`Server error: ${response.status}`);
        }

        let responseData;
        if (expectJson)
        {
            responseData = await response.json();
        }
        else
        {
            responseData = await response.text();
        }

        // Check if the response contains an error message from PHP
        if (responseData.status === "error")
        {
            alert(`PHP Error: ${responseData.message}`);  // Show the error in an alert
            return null;
        }

        return responseData;
    }
    catch (error)
    {
        // Handle network or JavaScript errors
        console.error("Request failed:", error);
        alert(`Request failed: ${error.message}`);  // Show the error in an alert
        return null;
    }
}