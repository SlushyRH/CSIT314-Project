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
    
        if (!cached)
        {
            const response = await sqlRequest("GET", "ALL_EVENTS");

            if (response.status == "success")
            {
                events = response.data;

                // cache if success
                localStorage.setItem("cached_events", JSON.stringify(events));
                localStorage.setItem("cached_events_timestamp", Date.now().toString());

                container.innerHTML = '';
                renderEvents(container, events, template);
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
    events.forEach(event =>
    {
        console.log(event);
        let html = template
            .replace('{{title}}', event.title)
            .replace('{{date}}', event.event_date)
            .replace('{{category}}', event.category_id)
            .replace('{{description}}', event.description)
            .replace('{{onclick}}', `window.location.href='event.html?id=${event.event_id}'`); 

        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        container.appendChild(wrapper.firstElementChild);
    });
}