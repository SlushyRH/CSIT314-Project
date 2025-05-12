let eventContainer;
let eventTemplate;

async function initFilterData()
{
    try
    {
        const filterData = await getCachedFilterData();

        const locations = filterData.locations;
        const categories = filterData.categories;

        const locationSelect = document.getElementById("filterLocation");
        const categorySelect = document.getElementById("filterCategory");

        const resetBtn = document.getElementById("filterClearBtn");
        const applyBtn = document.getElementById("filterSubmitBtn");

        resetBtn.onclick = function() {
            applyFilterOnEvents(true);
        };

        applyBtn.onclick = function() {
            applyFilterOnEvents();
        };

        locationSelect.innerHTML = "";
        categorySelect.innerHTML = "";

        locationSelect.appendChild(new Option("Select Location", ""));
        categorySelect.appendChild(new Option("Select Category", ""));

        locations.forEach(location =>
        {
            locationSelect.appendChild(new Option(location, location));
        });

        // populate categories
        categories.forEach(category =>
        {
            categorySelect.appendChild(new Option(category, category));
        });
        console.log("Loaded the values in category");

        applyFilterOnEvents();
    }
    catch (error)
    {
        console.error("Failed to initialize filter daata:", error);
    }
}

async function getCachedFilterData()
{
    // get the cached data from the local storage
    const cached = localStorage.getItem("cached_filter_data");
    const cachedTimestamp = localStorage.getItem("cached_filter_data_timestamp");

    // get timestamp
    const now = Date.now();
    const tenMins = 10 * 60 * 1000;

    // check if the cache data is valid
    if (cached && cachedTimestamp && (now - parseInt(cachedTimestamp) <= tenMins))
        return JSON.parse(cached);

    // request data from server
    const response = await sqlRequest("GET", "GET_FILTER_DATA");

    if (response.status === "success")
    {
        // parse json daata
        const filterData = JSON.parse(response.data);

        // set cached data
        localStorage.setItem("cached_filter_data", JSON.stringify(filterData));
        localStorage.setItem("cached_filter_data_timestamp", Date.now().toString());

        return filterData;
    }

    return null;
}

function applyFilterOnEvents(reset = false)
{
    try
    {
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
    catch (error)
    {
        console.error("Failed to apply filter on events:", error);
    }
}

function getUrlFilterQuery()
{
    // get url query
    const query = window.location.search.substring(1);

    if (query === "Upcoming")
    {
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
    else if (query != null)
    {
        document.getElementById("filterCategory").value = query;
        console.log("Set the value in category");
    }
}

async function initEvents()
{
    let events = [];
    eventContainer = document.getElementById('eventList');
    eventTemplate = await fetch('./assets/components/event.html').then(res => res.text());
        
    try
    {
        // render all chached events no matter what
        if (!eventTemplate) {
            eventTemplate = await fetch('./assets/components/event.html')
            .then(res => res.text());
        }

        const cached = getCachedEvents();

        if (cached)
        {
            events = cached;
            renderEvents(events);
        }
        else
        {
            // if no cached events, then fetch from API
            const response = await sqlRequest("GET", "ALL_EVENTS");

            if (response.status == "success")
            {
                const events = JSON.parse(response.data);

                // cache if success
                localStorage.setItem("cached_events", JSON.stringify(events));
                localStorage.setItem("cached_events_timestamp", Date.now().toString());

                eventContainer.innerHTML = '';
                renderEvents(events);
            }
            else
            {
                console.error("Failed to fetch events from API:", response.message);
                return null;
            }
        }
    }
    catch (error)
    {
        console.error("Failed to initialize events:", error);
    }
    
    initFilterData();
}

function renderEvents(events)
{
    // clear all events that have been crated
    eventContainer.innerHTML = '';

    // go through each event and render it
    events.forEach(event =>
    {
        // create template and replace the placeholders with the event data
        let html = eventTemplate
            .replace('{{title}}', event.title)
            .replace('{{date}}', event.event_date)
            .replace('{{category}}', event.category_name)
            .replace('{{description}}', event.description)
            .replace('{{onclick}}', `window.location.href='event.html?id=${event.event_id}'`); 

        // create a wrrapper div to append the html event
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;

        // append the wrapper to the event list container
        eventContainer.appendChild(wrapper.firstElementChild);
    });
}