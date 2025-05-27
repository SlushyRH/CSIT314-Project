async function getRegistration() {
    // get regId from params
    const params = new URLSearchParams(window.location.search);
    const registrationId = params.get("regId");

    let eventId = -1;
    let tickets = {};

    // get details from database if regId exists, otherwise get eventId
    if (registrationId) {
        [eventId, tickets] = await getDetailsFromRegId(registrationId);
    } else {
        eventId = params.get('eventId');

        // loop through all params to see if we have ticket information
        for (const [key, value] of params.entries()) {
            if (key.startsWith('ticket[')) {
                // get the number between the brackets through regex expression
                const match = key.match(/^ticket\[(\d+)\]$/)
            
                // get ticket id and amount of tickets to buy if match
                if (match) {
                    const ticketId = parseInt(match[1]);
                    tickets[ticketId] = parseInt(value);
                }
            }
        }
    }

    const event = getEvent(eventId);

    displayEventDetails(event);
    displayTicketSummary(event, tickets);
}

async function getDetailsFromRegId(regId) {
    const response = await sqlRequest("POST", "GET_REGISTRATION", { 'regId': regId });

    if (response.status !== 'success') {
        return;
    }

    // get raw data and tickets
    const data = response.data;
    const rawTickets = data['tickets'];

    // format each ticket
    const tickets = {};
    for (const ticket of rawTickets) {
        tickets[ticket.ticket_type_id] = ticket.quantity;
    }

    // return data with tickets
    return [data['event_id'], tickets];
}