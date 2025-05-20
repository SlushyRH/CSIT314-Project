let eventContainer;
let eventTemplate;
let eventModalWindowTemplate;
let currentSearchValue;

function initSearchBar() {
    const searchBarText = document.getElementById('searchBarText');

    searchBarText.addEventListener('input', handleSearchBarInput);
}

function handleSearchBarInput(e) {
    const searchValue = e.target.value;
    const cachedEvents = getCachedEvents();

    // render all if search bar is empty
    if (!searchValue) {
        renderEvents(cachedEvents);
        return;
    }

    currentSearchValue = searchValue.toLowerCase();

    // filter events through title and search bar
    let filteredEvents = cachedEvents.filter(event => {
        return event.title.toLowerCase().includes(searchValue.toLowerCase());
    });

    renderEvents(filteredEvents);
}

async function initEvents() {
    eventContainer = document.getElementById('eventList');
    eventTemplate = document.getElementById('eventTemplate');
    eventModalWindowTemplate = document.getElementById('eventModalTemplate');

    try {
        // get cached events
        const cached = getCachedEvents();

        if (cached) {
            renderEvents(cached);
        }
        else {
            // if no cached events, then fetch from API
            const response = await sqlRequest("GET", "ALL_EVENTS");

            if (response.status == "success") {
                const events = JSON.parse(response.data);

                // cache if success
                localStorage.setItem("cached_events", JSON.stringify(events));

                eventContainer.innerHTML = '';
                renderEvents(events);
            }
            else {
                console.error("Failed to fetch events from API:", response.message);
                return null;
            }
        }
    }
    catch (error) {
        console.error("Failed to initialize events:", error);
    }
}

async function getCachedFilterData() {
    // get the cached data from the local storage
    const cached = localStorage.getItem("cached_filter_data");

    // check if the cache data is valid
    if (cached)
        return JSON.parse(cached);

    // request data from server
    const response = await sqlRequest("GET", "GET_FILTER_DATA");

    if (response.status === "success") {
        // parse and set json daata
        const filterData = JSON.parse(response.data);
        localStorage.setItem("cached_filter_data", JSON.stringify(filterData));

        return filterData;
    }

    return null;
}

function applyFilterOnEvents(reset = false) {
    try {
        // json data from cached events
        const cachedEvents = getCachedEvents();

        if (reset) {
            document.getElementById('searchBarText').value = '';
            renderEvents(cachedEvents);
            return;
        }

        getUrlFilterQuery();

        // get values for filter data
        const startDateInput = document.getElementById("filterStartDate").value;
        const endDateInput = document.getElementById("filterEndDate").value;
        const categoryInput = document.getElementById("filterCategory").value;
        const locationInput = document.getElementById("filterLocation").value;
        const minPriceInput = parseFloat(document.getElementById("filterMinPrice").value);
        const maxPriceInput = parseFloat(document.getElementById("filterMaxPrice").value);

        let filteredEvents = cachedEvents.filter(event => {
            // format date to match date input form format
            const [time, date] = event.event_date.split(" ");
            const [day, month, year] = date.split("/");
            const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

            // get date range match
            const eventDate = new Date(formattedDate);
            const startDateMatch = !startDateInput || eventDate >= new Date(startDateInput);
            const endDateMatch = !endDateInput || eventDate <= new Date(endDateInput);
            const dateMatch = startDateMatch && endDateMatch;

            // check for category and location match
            const categoryMatch = !categoryInput || event.category_name.includes(categoryInput);
            const locationMatch = !locationInput || event.location.includes(locationInput);

            // ensure the min/maax price of at least 1 ticket is within the price range
            const priceMatch =
                (isNaN(minPriceInput) && isNaN(maxPriceInput)) ||
                (isNaN(minPriceInput) && event.min_price <= maxPriceInput) ||
                (isNaN(maxPriceInput) && event.max_price >= minPriceInput) ||
                (event.max_price >= minPriceInput && event.min_price <= maxPriceInput);

            return dateMatch && categoryMatch && locationMatch && priceMatch &&
                (!currentSearchValue || event.title.toLowerCase().includes(currentSearchValue.toLowerCase()));
        });

        renderEvents(filteredEvents);
    }
    catch (error) {
        console.error("Failed to apply filter on events:", error);
    }
}

function getUrlFilterQuery() {
    // get url query
    const query = window.location.search.substring(1);

    if (!query)
        return;

    if (query === "Upcoming") {
        // get the date today
        const today = new Date();
        const formattedDateStart = today.toISOString().split("T")[0];
        document.getElementById("filterStartDate").value = formattedDateStart;

        // get the date one month from now
        const nextMonthDate = new Date();
        nextMonthDate.setMonth(today.getMonth() + 1);
        const formattedDateEnd = nextMonthDate.toISOString().split("T")[0];
        document.getElementById("filterEndDate").value = formattedDateEnd;
    }
    else if (query != null) {
        document.getElementById("filterCategory").value = query;
        console.log("Set the value in category");
    }

    history.replaceState(null, "", window.location.pathname);
}

function renderEvents(events) {
    // clear all events that have been crated
    eventContainer.innerHTML = '';

    // go through each event and render it
    events.forEach(event => {
        // format current date to check if event is in past or not
        if (formatEventDate(event) < Date.now())
            return;

        // create event visual from event template
        const eventClone = eventTemplate.content.cloneNode(true);
        const eventElement = eventClone.firstElementChild;

        const maxLength = 80;
        let description = event.description;

        // limit description length
        if (description.length > maxLength) {
            description = description.slice(0, maxLength) + '...';
        }

        // set data wiht the actual event date
        eventElement.querySelector('[data-title]').textContent = event.title;
        eventElement.querySelector('[data-date]').textContent = event.event_date;
        eventElement.querySelector('[data-category]').textContent = event.category_name;
        eventElement.querySelector('[data-description]').textContent = description;

        // open modal window on click
        eventElement.onclick = function () {
            openEventModal(event.event_id);
        };

        eventContainer.appendChild(eventElement);
    });
}

function openEventModal(eventId) {
    const event = getEvent(eventId);
    let currentTicketCart = {};

    const eventClone = eventModalWindowTemplate.content.cloneNode(true);
    const eventElement = eventClone.firstElementChild;
    const purchaseBtn = eventElement.querySelector('#purchaseBtn');

    // set data in modal window
    eventElement.querySelector('[data-title]').textContent = event.title;
    eventElement.querySelector('[data-date]').textContent = event.event_date;
    eventElement.querySelector('[data-description]').textContent = event.description;
    eventElement.querySelector('[data-location]').textContent = event.location;

    const tableBody = eventElement.querySelector('#ticketTableBody');
    const rowTemplate = eventElement.querySelector('#ticketRowTemplate');

    tableBody.innerHTML = '';

    event.ticket_types.forEach(ticket => {
        const rowClone = rowTemplate.content.cloneNode(true);
        const row = rowClone.querySelector('tr');

        // set data in ticket row
        row.querySelector('[data-name]').textContent = ticket.name;
        row.querySelector('[data-description]').textContent = ticket.benefits;
        row.querySelector('[data-price]').textContent = ticket.price;

        const amountInput = row.querySelector('.ticket-amount-input');
        amountInput.value = 0;
        amountInput.setAttribute('data-ticket-id', ticket.ticket_type_id);

        amountInput.oninput = () => {
            const ticketId = amountInput.getAttribute('data-ticket-id');
            const value = parseInt(amountInput.value) || 0;

            if (value > 0) {
                currentTicketCart[ticketId] = value;
            } else {
                delete currentTicketCart[ticketId];
            }
        };

        tableBody.appendChild(row);
    });

    purchaseBtn.addEventListener('click', (e) => {
        openPurchaseConfirmPage(eventId, currentTicketCart);
    });

    // handle closing modal window
    const hideModalOnEscape = function (e) {
        if (e.key === 'Escape' || e.target.id === 'modalOverlay') {
            document.removeEventListener('keydown', hideModalOnEscape);
            document.removeEventListener('click', hideModalOnEscape);
            eventElement.remove();
        }
    };

    // maake modal window hide on escape or click off
    document.addEventListener('keydown', hideModalOnEscape);
    eventElement.addEventListener('click', hideModalOnEscape);

    document.body.appendChild(eventElement);
}

function openPurchaseConfirmPage(eventId, tickets) {
    // ensure there is at least one ticket type
    if (Object.entries(tickets).length <= 0) {
        alert("Please add at least one ticket before continuing");
        return;
    }
    
    // construct params and parse eventId
    const params = new URLSearchParams();
    params.append('eventId', eventId);
    console.log(tickets);

    // add each ticket type and value
    for (const [type, count] of Object.entries(tickets)) {
        params.append(`ticket[${type}]`, count);
    }

    // nav to page with params attached
    navToPage('eventPurchase.html?' + params.toString());
}