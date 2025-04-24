let eventId;

window.addEventListener("DOMContentLoaded", () =>
{
    const urlParams = new URLSearchParams(window.location.search);
    eventId = urlParams.get("id");

    document.getElementById("eventIdTemp").innerHTML = eventId;
});
