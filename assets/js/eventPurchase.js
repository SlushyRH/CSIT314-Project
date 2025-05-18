const websiteFeeCharge = 2.5;

function isValid() {
    const userId = localStorage.getItem('user');

    if (!userId) {
        navToPage('login.html', window.location);
    }
}

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

    // get event and display details along with ticket
    const event = getEvent(eventId);

    displayEventDetails(event);
    displayTicketSummary(event, tickets);
}

function displayEventDetails(event) {
    document.getElementById('eventTitle').innerText = event.title + ' - ' + event.event_date;
    document.getElementById('eventDescription').innerText = event.description;
    document.getElementById('eventLocation').innerText = event.location;
}

function displayTicketSummary(event, ticketsIds) {
    // get template for ticket row
    const ticketRowTemplate = document.getElementById('ticketRowTemplate');

    // get and clear ticket info table
    const ticketTableBody = document.getElementById('ticketTableBody');
    ticketTableBody.innerHTML = '';

    let subTotal = 0;

    for (const ticketTypeId in ticketsIds) {
        // get ticket and its amount
        const amount = ticketsIds[ticketTypeId];
        const ticket = event.ticket_types.find(t => t.ticket_type_id == ticketTypeId);

        if (ticket) {
            // create new row
            const rowClone = ticketRowTemplate.content.cloneNode(true);
            const row = rowClone.querySelector('tr');

            // calculate price for ticket type
            const price = (ticket.price * amount).toLocaleString('en-AU', {
                style: 'currency',
                currency: 'AUD'
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
}