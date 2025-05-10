let eventContainer;
let eventTemplate;

async function initFilterData()
{
    try
    {
        const response = await sqlRequest("GET", "GET_FILTER_DATA");

        if (response.status == "success")
        {
            const filterData = JSON.parse(response.data);
            
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

            // Populate categories
            categories.forEach(category =>
            {
                categorySelect.appendChild(new Option(category, category));
            });
        }
        else
        {
            console.error("Failed to fetch events from API:", response.message);
        }
    }
    catch (error)
    {
        console.error("Failed to initialize filter daata:", error);
    }
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

        // get values for filter data
        const dateInput = document.getElementById("filterDate").value;
        const categoryInput = document.getElementById("filterCategory").value;
        const locationInput = document.getElementById("filterLocation").value;
        const minPriceInput = parseFloat(document.getElementById("filterMinPrice").value);
        const maxPriceInput = parseFloat(document.getElementById("filterMaxPrice").value);

        let filteredEvents = cachedEvents.filter(event => {
            // format date to match date input form format
            const [time, date] = event.event_date.split(" ");
            const [day, month, year] = date.split("/");
            const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

            // check for data matches
            const dateMatch = !dateInput || dateInput === formattedDate;
            const categoryMatch = !categoryInput || event.category_name === categoryInput;
            const locationMatch = !locationInput || event.location === locationInput;

            // ensure the price of at least 1 ticket to be within the price range
            const eventPrice = 1;
            const minPriceMatch = isNaN(minPriceInput) || eventPrice >= minPriceInput;
            const maxPriceMatch = isNaN(maxPriceInput) || eventPrice <= maxPriceInput;

            return dateMatch && categoryMatch && locationMatch && minPriceMatch && maxPriceMatch;
        });

        renderEvents(filteredEvents);
    }
    catch (error)
    {
        console.error("Failed to apply filter on events:", error);
    }
}

async function initEvents()
{
    let events = [];
    eventTemplate = await fetch('./assets/components/event.html').then(res => res.text());
    eventContainer = document.getElementById('eventList');
        
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

                container.innerHTML = '';
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