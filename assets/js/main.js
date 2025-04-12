async function initEvents()
{
    const container = document.getElementById('event-list');
    let events = [];

    try
    {
        // check for cached events
        const cached = localStorage.getItem("cached_events");

        // check cache timestamp, and if older than X minutes, refresh from datbase no matter what

        if (cached)
        {
            events = JSON.parse(cached);
        }
        else
        {
            const response = await sqlRequest("GET", "ALL_EVENTS");
            events = response;

            if (response.status == "success")
            {
                // cache if success
                localStorage.setItem("cached_events", JSON.stringify(response));
                localStorage.setItem("cached_events_timestamp", Date.now().toString());
            }
        }

        // fetch event component template
        const template = await fetch('./assets/components/event.html')
            .then(res => res.text());

        // need to render onto main page
    }
    catch (error)
    {
        console.error("Failed to initialize events:", error);
    }
}
