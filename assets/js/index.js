async function initFilterData()
{
    try
    {
        const response = await sqlRequest("GET", "GET_FILTER_DATA");

        if (response.status == "success")
        {
            const filterData = JSON.parse(response.data);
            console.log(filterData);
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

async function initEvents()
{
    const container = document.getElementById('eventList');
    let events = [];

    try
    {
        // render all chached events no matter what
        const template = await fetch('./assets/components/event.html')
            .then(res => res.text());

        const cached = getCachedEvents();

        if (cached)
        {
            events = cached;
            renderEvents(container, events, template);
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
                renderEvents(container, events, template);
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

function renderEvents(container, events, template)
{
    // go through each event and render it
    events.forEach(event =>
    {
        console.log(event);

        // create template and replace the placeholders with the event data
        let html = template
            .replace('{{title}}', event.title)
            .replace('{{date}}', event.event_date)
            .replace('{{category}}', event.category_name)
            .replace('{{description}}', event.description)
            .replace('{{onclick}}', `window.location.href='event.html?id=${event.event_id}'`); 

        // create a wrrapper div to append the html event
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;

        // append the wrapper to the event list container
        container.appendChild(wrapper.firstElementChild);
    });
}