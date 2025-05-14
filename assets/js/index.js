let eventContainer;
let eventTemplate;
let eventModalWindowTemplate;

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
                localStorage.setItem("cached_events_timestamp", Date.now().toString());

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

    initFilterData();
}

async function initFilterData() {
    try {
        const filterData = await getCachedFilterData();

        const locations = filterData.locations;
        const categories = filterData.categories;

        const locationSelect = document.getElementById("filterLocation");
        const categorySelect = document.getElementById("filterCategory");

        const resetBtn = document.getElementById("filterClearBtn");
        const applyBtn = document.getElementById("filterSubmitBtn");

        resetBtn.onclick = function () {
            applyFilterOnEvents(true);
        };

        applyBtn.onclick = function () {
            applyFilterOnEvents();
        };

        locationSelect.innerHTML = "";
        categorySelect.innerHTML = "";

        locationSelect.appendChild(new Option("Select Location", ""));
        categorySelect.appendChild(new Option("Select Category", ""));

        locations.forEach(location => {
            locationSelect.appendChild(new Option(location, location));
        });

        // populate categories
        categories.forEach(category => {
            categorySelect.appendChild(new Option(category, category));
        });
        console.log("Loaded the values in category");

        applyFilterOnEvents();
    }
    catch (error) {
        console.error("Failed to initialize filter daata:", error);
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
            const categoryMatch = !categoryInput || event.category_name === categoryInput;
            const locationMatch = !locationInput || event.location === locationInput;

            // ensure the min/maax price of at least 1 ticket is within the price range
            const minPriceMatch = isNaN(minPriceInput) || event.min_price >= minPriceInput;
            const maxPriceMatch = isNaN(maxPriceInput) || event.max_price <= maxPriceInput;

            return dateMatch && categoryMatch && locationMatch && minPriceMatch && maxPriceMatch;
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
}

function renderEvents(events) {
    // clear all events that have been crated
    eventContainer.innerHTML = '';

    // go through each event and render it
    events.forEach(event => {
        // create template and replace the placeholders with the event data
        const eventClone = eventTemplate.content.cloneNode(true);
        const eventElement = eventClone.firstElementChild;

        // replace data wiht the actual event date
        eventElement.querySelector('[data-title]').textContent = event.title;
        eventElement.querySelector('[data-date]').textContent = event.event_date;
        eventElement.querySelector('[data-category]').textContent = event.category_name;
        eventElement.querySelector('[data-description]').textContent = event.description;

        // open modal window on click
        eventElement.onclick = function() {
            openEventModal(event.event_id);
        };
        
        eventContainer.appendChild(eventElement);
    });
}

function openEventModal(eventId) {
    const event = getEvent(eventId);

    const eventClone = eventModalWindowTemplate.content.cloneNode(true);
    const eventElement = eventClone.firstElementChild;

    // replace ddata with actual event date
    eventElement.querySelector('[data-title]').textContent = event.title;
    eventElement.querySelector('[data-date]').textContent = event.event_date;
    eventElement.querySelector('[data-description]').textContent = event.description;
    eventElement.querySelector('[data-location]').textContent = event.location;

    // reset ticket options
    const ticketSelect = eventElement.querySelector('#ticketSelect');
    ticketSelect.innerHTML = '';

    // append all ticket options
    event.ticket_types.forEach(ticket => {
        ticketSelect.appendChild(new Option(ticket.name, ticket.ticket_type_id));
    });

    // make internal function so clicking background or clicking escape closes window
    const hideModalOnEscape = function(e) {
        if (e.key === 'Escape' || e.target.id === 'modalOverlay') {
            // remove event listeners
            document.removeEventListener('keydown', hideModalOnEscape);
            document.removeEventListener('click', hideModalOnEscape);

            eventElement.remove();
            console.log("Hidden Modal Window");
        }
    }

    // add hide function to the events
    document.addEventListener('keydown', hideModalOnEscape);
    eventElement.addEventListener('click', hideModalOnEscape);

    document.body.appendChild(eventElement);
}