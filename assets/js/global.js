const URL = "https://mediumslateblue-toad-454408.hostingersite.com/"; // https://mediumslateblue-toad-454408.hostingersite.com/

// create footer and header
function initFooter() { initComponent('footer', 'footer'); }
function initHeader(hideNav = false, hideSearch = false, onLoaded = null) {
	initComponent('header', 'header', () => {
		attachHeaderScripts(hideNav, hideSearch);
        
		if (onLoaded)
			onLoaded();
	});
}

function initComponent(component, id, callback) {
    // get doc element
    var element = document.getElementById(id);

    if (element != null) {
        // load component
        fetch(`./assets/components/${component}.html`)
            .then(response => response.text())
            .then(data => {
                element.innerHTML = data;

                if (callback)
                    callback();
            });
    }
}

// ensures the user is logged in
function isValid() {
    const userId = localStorage.getItem('user');

    // if not logged in, redirect to login page with a redirect page to current page
    if (!userId) {
        navToPage('login.html', window.location);
    }
}

function formatEventDate(event) {
    // get data from event date string in event
    const [time, date] = event.event_date.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    const [day, month, year] = date.split('/').map(Number);

    // construct into date object
    return new Date(year, month - 1, day, hours, minutes);
}

function attachHeaderScripts(hideNav, showSearch) {
    // get neccassary elements
    const profileButton = document.getElementById('profileButton');
    const profileDropdown = document.getElementById('profileDropdown');
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');

    const searchIcon = document.getElementById('searchIcon');
    const searchBar = document.getElementById('searchBar');
    const searchInput = searchBar?.querySelector('input');
    
    //  show search bar on search icon click
    searchIcon?.addEventListener('click', (e) => {
        e.stopPropagation();
        searchBar?.classList.toggle('hidden');
    
        if (!searchBar?.classList.contains('hidden')) {
            searchInput?.focus();
        }
    });
    
    searchBar?.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    window.addEventListener('click', () => {
        if (!searchBar?.classList.contains('hidden')) {
            searchBar.classList.add('hidden');
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !searchBar?.classList.contains('hidden')) {
            searchBar.classList.add('hidden');

            if (searchInput) {
                searchInput.value = '';
            }
        }
    });
    
    const headerOrgEventsBtn = document.getElementById('headerOrgEventsBtn');
    const headerUserEventsBtn = document.getElementById('headerUserEventsBtn');
    const headerCreateEventBtn = document.getElementById('createEventBtn');
    const headerNotificationsBtn = document.getElementById('headerNotificationsBtn');
    const logoutBtn = document.getElementById('headerLogoutBtn');

    if (hideNav) {
        document.getElementById('navLinks').classList.add('hidden');
        document.getElementById('mobileNavLinks').classList.add('hidden');
    }

    if (showSearch)
        searchIcon.classList.remove('hidden');

    // get user information
    const user = JSON.parse(localStorage.getItem('user_details'));
    const userId = localStorage.getItem('user');

    if (user) {
        document.getElementById('profileName').innerText = user.name;
    }

    // ensure each profile dropdown button works
    headerOrgEventsBtn.onclick = function() {
        navToPage('organisedEvents.html');
    };

    headerUserEventsBtn.onclick = function() {
        navToPage('bookedEvents.html');
    };

    headerCreateEventBtn.onclick = function() {
        navToPage('createEvent.html');
    };

    headerNotificationsBtn.onclick = function() {
        navToPage('notifications.html');
    };

    logoutBtn.onclick = function() {
        // delete uuser data from local storage
        localStorage.removeItem('user');
        localStorage.removeItem('user_details');

        // redirect to login page
        navToPage('login.html');
    };
    
    // handle profile icon btn
    if (profileButton) {
        if (userId) {
            // if logged in, toggle dropdown
            profileButton.addEventListener('click', (e) => {
                e.stopPropagation();
                profileDropdown?.classList.toggle('hidden');
            });

            // close dropdown when clicking outside
            window.addEventListener('click', () => {
                profileDropdown?.classList.add('hidden');
            });

            profileDropdown?.addEventListener('click', (e) => e.stopPropagation());
        } else {
            // if not logged in then redirect to login
            profileButton.addEventListener('click', () => {
                navToPage('login.html', window.location.href);
            });
        }
    }

    // hamburger menu click behaviour
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenu.classList.toggle('hidden');
        });

        window.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });

        mobileMenu.addEventListener('click', (e) => e.stopPropagation());
    }
}

// navigates to page and allows redirect if page handles it
function navToPage(page, redirectURL = null) {
    let url = page;

    if (redirectURL) {
        const encodedRedirect = encodeURIComponent(redirectURL);
        url += `?redirect=${encodedRedirect}`;
    }

    window.location.href = url;
}

function getEvent(eventId) {
    // check for cached events and load if needed
    const cachedEvents = getCachedEvents();

    if (!cachedEvents)
        return null;

    // find the evvent in the cached events
    for (const event of cachedEvents) {
        if (event.event_id == eventId)
            return event;
    }

    return null;
}

function addEventToCache(event) {
    // get cached events and index
    const cachedEvents = getCachedEvents() || [];
    const eventIndex = cachedEvents.findIndex(e => e.event_id === event.event_id);

    // overwrite event if exists, otherwise add it to cache
    if (eventIndex !== -1)
        cachedEvents[eventIndex] = event;
    else
        cachedEvents.push(event);

    // set cached events in storage
    localStorage.setItem("cached_events", JSON.stringify(cachedEvents));
    console.log("Successful cache!");
}

function getCachedEvents() {
    // check for cached events and load if needed
    const cached = localStorage.getItem("cached_events");
    
    if (cached)
        return JSON.parse(cached);
}

async function forceEventCacheReset() {
    // get all events again
    sqlRequest("GET", "ALL_EVENTS").then(() => {
        const response = getLastResponse();

        // cache events
        if (response.status == "success") {
            const events = JSON.parse(response.data);
            localStorage.setItem("cached_events", JSON.stringify(events));
        }
        else {
            console.error("Failed to fetch events from API:", response.message);
        }
    });
}

let lastSqlResponse = null;

function getLastResponse() {
    return lastSqlResponse;
}

async function sqlRequest(method, action, data = null) {
    try {
        // sets url and options
        const url = `${URL}api/database.php?action=${action}`;
        const options = {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: data ? JSON.stringify(data) : null
        };

        // send request to url and show wait cursor
        document.body.style.cursor = 'wait';
        const response = await fetch(url, options);

        // check if response was sent successully
        if (!response.ok)
            throw new Error(`Request failed with status ${response.status}`);

        // revert cursor
        document.body.style.cursor = 'default';

        // return response as json
        lastSqlResponse = await response.json();
        return lastSqlResponse;
    }
    catch (error) {
        // throw error
        document.body.style.cursor = 'default';

        console.error(error.message || "Network error");
        throw new Error(error.message || "Network error");
    }
}