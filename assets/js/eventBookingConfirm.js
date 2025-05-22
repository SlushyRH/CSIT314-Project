async function getRegistration() {
    const params = new URLSearchParams(window.location.search);
    const registrationId = params.get("regId");

    let eventId = -1;
    let tickets = {};

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

    const data = response.data;
    const rawTickets = data['tickets'];

    const tickets = {};
    for (const ticket of rawTickets) {
        tickets[ticket.ticket_type_id] = ticket.quantity;
    }

    console.log(tickets);
    return [data['event_id'], tickets];
}