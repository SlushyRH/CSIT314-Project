// page will get data from regestrations table in database
// should search by customer_id to get events
document.addEventListener("DOMContentLoaded", function() {
    getUserEvents();
});
// function to het user events and converts them from string to dictionary
async function getUserEvents() {
    //var user_id = localStorage("user_id");
    // Test user stuff
    const userSearchId = 1;
    console.log(userSearchId);
    // Gets events booked by the user
    await forceEventCacheReset();
    const userResponse = getCachedEvents();
    // Converts the response from request into the json dictionary contain all events
    let allEvents = userResponse; // this being a json object
    console.log(allEvents);
    let organisedEvents = FilterEvents(userSearchId,allEvents);
    console.log(organisedEvents);
    // Sends events to be sorted
    GetEvents(organisedEvents);
}
// Sorts events based on if they are in the future or the past
function GetEvents(Events){
    // gets all events a user has booked that are in the past
    let pastEvents = GetPastEvents(Events);
    console.log("Past:");
    console.log(pastEvents);
    // gets all events a user has booked that are in the future
    let upcomingEvents = GetUpcomingEvents(Events);
    console.log("Future:");
    console.log(upcomingEvents);
    // sorts the upcoming events by their dates in ascending order
    upcomingEvents = orderEventsAscending(upcomingEvents);
    console.log(upcomingEvents);
    // sorts the upcoming events by their dates in descending order
    pastEvents = orderEventsDescending(pastEvents);
    // displays the upcoming events on webpage
    displayEvents("upcoming",upcomingEvents);
    // displays the past events on webpage
    displayEvents("PastEvents",pastEvents);

}
// checks events date to determine if they are in the past and are added to past events
function GetPastEvents(allEvents){
    const Now=getNow();
    const resultArray = [];
    for (let i = 0; i < allEvents.length; i++) {
        event = allEvents[i];
        let convertedDate = convertToDatetimeLocalFormat(event.event_date);
        console.log(Date(convertedDate));
        if (new Date(convertedDate) < new Date(Now)) {
            resultArray.push(event);
        };
    };
    return resultArray;
}

function GetUpcomingEvents(allEvents){
    const Now=getNow();
    const resultArray = [];
    for (let i = 0; i < allEvents.length; i++) {
        event = allEvents[i];
        convertedDate = convertToDatetimeLocalFormat(event.event_date);
        console.log(convertedDate);
        if (new Date(convertedDate) > new Date(Now)) {
            resultArray.push(event);
        };
    };
    return resultArray;
}

function convertToDatetimeLocalFormat(input) {
    if (!input || typeof input !== 'string') {
        console.warn("Invalid input to convertToDatetimeLocalFormat:", input);
        return null;
    }
    let [time, date] = input.split(" ");
    let [DD, MM, YY] = date.split("/");
    const [hours, minutes] = time.split(":");
    return `${YY}-${MM}-${DD}T${hours}:${minutes}`;
}

function getNow(){
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const hh = String(today.getHours()).padStart(2, '0');
    const mins = String(today.getMinutes()).padStart(2, '0');

    const now = `${yyyy}-${mm}-${dd}T${hh}:${mins}`;
    console.log(now);
    return now;
}

function orderEventsAscending(events){
    let len = events.length;
    let date1;
    let date2;
    let swapped;
    console.log(events)
    do {
        swapped = false;
        for (let i = 0; i < len - 1; i++) {
            date1 = convertToDatetimeLocalFormat(events[i].event_date);
            date2 = convertToDatetimeLocalFormat(events[i+1].event_date);
            if (date1 > date2) {
                // Swap elements
                [events[i], events[i + 1]] = [events[i + 1], events[i]];
                swapped = true;
            }
        }
    len--; // Optimization: reduce the loop range
    } while (swapped);
    return events;
}

function orderEventsDescending(events){
    let len = events.length;
    let swapped;

    do {
        swapped = false;
        for (let i = 0; i < len - 1; i++) {
            if (events[i] < events[i + 1]) {
                // Swap elements
                [events[i], events[i + 1]] = [events[i + 1], events[i]];
                swapped = true;
            }
        }
    len--; // Optimization: reduce the loop range
    } while (swapped);
    return events;
}

function displayEvents(containerID, events){
    const container = document.getElementById(containerID);

    if (!container) {
        console.warn(`Container with id "${containerID}" not found.`);
        return;
    }

    // Clear previous content
    container.innerHTML = "";

    if (events.length === 0) {
        container.innerHTML = "<p class='text-white'>No events found.</p>";
        return;
    }

    events.forEach((event, index) => {
        const card = document.createElement("div");

        card.className = `
            bg-[#121e33] text-white p-6 rounded-xl shadow-lg
            hover:bg-[#1a2a48] transition-all duration-200
            h-50
        `;

        card.innerHTML = `
            <h3 class="text-xl font-bold mb-2">${event.title}</h3>
            <div class="text-sm text-gray-300 flex justify-between mb-2">
                <span>${event.event_date}</span>
                <span class="font-semibold">${event.category_name}</span>
            </div>
            <p class="text-gray-200">${event.description}</p>
        `;

        // Make clickable
        card.setAttribute("data-index", index);
        card.style.cursor = "pointer";

        card.addEventListener("click", () => {
            const params = new URLSearchParams();
            params.set("eventId", event.event_id);

            window.location.href = 'eventBookingConfirm.html?' + params.toString();
        });

        container.appendChild(card);
    });
}

function FilterEvents(OrgID, Events){
    let Organised_events = [];
    for (let i = 0; i < Events.length; i++){
        if (Events[i].organiser_id == OrgID){
            Organised_events.push(Events[i]);
        }
    }
    return Organised_events;
}