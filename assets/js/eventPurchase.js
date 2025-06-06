const websiteFeeCharge = 2.5;

function getParamData() {
    const params = new URLSearchParams(window.location.search);

    // get event id and create tickets array
    const eventId = params.get('eventId');
    const tickets = {};

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

    // get event from id
    const event = getEvent(eventId);

    displayEventDetails(event);
    displayTicketSummary(event, tickets);
}

function displayEventDetails(event) {
    document.getElementById('eventTitle').innerText = event.title + ' - ' + event.event_date;
    document.getElementById('eventLocation').innerText = event.location;
    
    const description = document.getElementById('eventDescription');
    
    if (description)
        description.innerText = event.description;
}

function displayTicketSummary(event, ticketsIds) {
    // get template for ticket row, and get and clear ticket info table
    const ticketRowTemplate = document.getElementById('ticketRowTemplate');
    const ticketTableBody = document.getElementById('ticketTableBody');

    ticketTableBody.innerHTML = '';
    let subTotal = 0;
    const detailedTickets = [];

    for (const ticketTypeId in ticketsIds) {
        // get ticket and its amount
        const amount = ticketsIds[ticketTypeId];
        const ticket = event.ticket_types.find(t => t.ticket_type_id == ticketTypeId);

        if (ticket) {
            // create new row
            const rowClone = ticketRowTemplate.content.cloneNode(true);
            const row = rowClone.querySelector('tr');

            // calculate price for ticket type
            const totalPaid = ticket.price * amount;
            const price = totalPaid.toLocaleString('en-AU', {
                style: 'currency',
                currency: 'AUD'
            });

            detailedTickets.push({
                ticketTypeId: parseInt(ticketTypeId),
                amount
            });

            // fill out data
            row.querySelector('[data-amount]').textContent = amount;
            row.querySelector('[data-name]').textContent = ticket.name;
            row.querySelector('[data-description]').textContent = ticket.benefits;
            row.querySelector('[data-price]').textContent = price;

            // append new row onto table and calculate subtotal
            ticketTableBody.appendChild(row);
            subTotal += (ticket.price * amount);
        }
    }

    // set subtotal, fee and total amount
    const feeAmount = subTotal * (websiteFeeCharge / 100);
    const totalAmountWithFee = subTotal + feeAmount;

    // format prices to currency
    const subTotalAmount = subTotal.toLocaleString('en-AU', {
        style: 'currency',
        currency: 'AUD'
    });

    const totalFeeAmount = feeAmount.toLocaleString('en-AU', {
        style: 'currency',
        currency: 'AUD'
    });

    const totalAmount = totalAmountWithFee.toLocaleString('en-AU', {
        style: 'currency',
        currency: 'AUD'
    });

    // set fee label and amount
    const feeLabel = document.getElementById('feePercent');
    feeLabel.textContent = `Fee (${websiteFeeCharge}%)`;

    // set subtotal amount
    const subTotalLabel = document.getElementById('subtotalAmount');
    subTotalLabel.textContent = subTotalAmount;

    const feeTotalLabel = document.getElementById('feeAmount');
    feeTotalLabel.textContent = totalFeeAmount;

    // set total amount
    const totalLabel = document.getElementById('totalAmount');
    totalLabel.textContent = totalAmount;

    const confirmPurchaseBtn  = document.getElementById('confirmPurchaseBtn');
    
    if (confirmPurchaseBtn) {
        confirmPurchaseBtn.onclick = () => {
            const eventId = event.event_id;
            const userId = localStorage.getItem('user');

            onPurchaseConfirm(eventId, userId, totalAmountWithFee, detailedTickets, ticketsIds);
        };
    }
}

async function onPurchaseConfirm(eventId, userId, totalPaid, detailedTickets, tickets) {
    // package purhcase data
    const data = {
        'user_id': userId,
        'event_id': eventId,
        'total_payment': totalPaid,
        'tickets': detailedTickets
    };
    
    // send request to api to confirm registration and get registration id
    const response = await sqlRequest('POST', 'ADD_REGISTRATION', data);
    console.log(response);

    if (response.status !== 'success')
        return;

    // ger regId
    const regId = JSON.parse(response.data)['reg_id'];
    
    // create params
    const params = new URLSearchParams();
    params.append("eventId", eventId);

        // add each ticket type and value
    for (const [type, count] of Object.entries(tickets)) {
        params.append(`ticket[${type}]`, count);
    }

    // open confirm page with param
    navToPage('eventBookingConfirm.html?' + params.toString());
}