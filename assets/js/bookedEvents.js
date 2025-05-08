// page will get data from regestrations table in database
// should search by customer_id to get events

function getUserEvents() {
    var user_id = localStorage("user_id");
    const userSearchId = {
        "user_id":user_id
    };

    const userResponse = await sqlRequest("POST", "GET_BOOKED_EVENTS", userData);
    const allEvents = userResponse.data; // this being a json object

    
}

function GetEvents(Events){
    const pastEvents = GetPastEvents(Events);
    const upcomingEvents = GetUpcomingEvents(Events);



}

function orderEventsAscending(events){
    let len = events.length;
    let swapped;

    do {
        swapped = false;
        for (let i = 0; i < len - 1; i++) {
            if (events[i] > eventsi + 1]) {
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
            if (events[i] < eventsi + 1]) {
                // Swap elements
                [events[i], events[i + 1]] = [events[i + 1], events[i]];
                swapped = true;
            }
        }
    len--; // Optimization: reduce the loop range
    } while (swapped);
    return events;
}


function GetPastEvents(allEvents){
    const Today=getToday();
    const resultArray = [];
    for (let i = 0; i < allEvents.length; i++) {
        event = allEvents[i];
        if (event.event_date < Today) {
            resultArray.push(event);
        };
    };
    return resultArray;
}

function GetUpcomingEvents(allEvents){
    const Today=getToday();
    const resultArray = [];
    for (let i = 0; i < allEvents.length; i++) {
        event = allEvents[i];
        if (event.event_date > Today) {
            resultArray.push(event);
        };
    };
    return resultArray;
}

function getToday(){
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate() + 7).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;
    return today;
}