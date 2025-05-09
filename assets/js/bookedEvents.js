// page will get data from regestrations table in database
// should search by customer_id to get events

async function getUserEvents() {
    //var user_id = localStorage("user_id");
    const userSearchId = {
        "user_id":2
    };

    const userResponse = await sqlRequest("POST", "GET_BOOKED_EVENTS", userSearchId);
    const allEvents = userResponse.data; // this being a json object
    console.log(allEvents);

    GetEvents(allEvents);
}

function GetEvents(Events){
    const pastEvents = GetPastEvents(Events);
    const upcomingEvents = GetUpcomingEvents(Events);
    console.log(pastEvents);
    console.log(upcomingEvents);


}

function GetPastEvents(allEvents){
    const Now=getNow();
    const resultArray = [];
    for (let i = 0; i < allEvents.length; i++) {
        event = allEvents[i];
        console.log(event.event_date);
        if (event.event_date < Now) {
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
        if (event.event_date > Now) {
            resultArray.push(event);
        };
    };
    return resultArray;
}

function getNow(){
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate() + 7).padStart(2, '0');

    const hh = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');

    const now = `${yyyy}-${mm}-${dd}T${hh}:${mins}`;
    return now;
}


function orderEventsAscending(events){
    let len = events.length;
    let swapped;

    do {
        swapped = false;
        for (let i = 0; i < len - 1; i++) {
            if (events[i] > events[i + 1]) {
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


