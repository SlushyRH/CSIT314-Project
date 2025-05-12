window.addEventListener("DOMContentLoaded", () =>
{
    const urlParams = new URLSearchParams(window.location.search);
    let eventId = urlParams.get("id");

    eventObj = getEvent(eventId);

    if (!eventObj)
    {
        console.log("No event data that matched!");
        return;
    }

    loadEventData();
});

let eventObj;

function loadEventData()
{
    document.getElementById("eventIdTemp").innerHTML = eventObj.title;
}