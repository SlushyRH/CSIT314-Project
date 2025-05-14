// page will get data from regestrations table in database
// should search by customer_id to get events

async function getUserEvents() {
    //var user_id = localStorage("user_id");
    const userSearchId = {
        "user_id":2
    };
    console.log(userSearchId);
    const userResponse = await sqlRequest("POST", "GET_BOOKED_EVENTS", userSearchId);

    let allEvents = userResponse.data; // this being a json object
    console.log(allEvents);
    console.log("Test text");
    allEvents = JSON.parse(allEvents);
    console.log(allEvents.events);

    GetEvents(allEvents.events);
}

function GetEvents(Events){
    let pastEvents = GetPastEvents(Events);
    console.log("Past:");
    console.log(pastEvents);
    let upcomingEvents = GetUpcomingEvents(Events);
    console.log("Future:");
    console.log(upcomingEvents);
    console.log(upcomingEvents[0]);
    upcomingEvents = orderEventsAscending(upcomingEvents);
    console.log(upcomingEvents);
}

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
    const [date, time] = input.split(" ");
    const [hours, minutes] = time.split(":");
    return `${date}T${hours}:${minutes}`;
}

function getNow(){
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const hh = String(today.getHours()).padStart(2, '0');
    const mins = String(today.getMinutes()).padStart(2, '0');

    const now = `${yyyy}-${mm}-${dd}T${hh}:${mins}`;
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

