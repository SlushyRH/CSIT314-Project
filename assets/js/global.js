const URL = "https://mediumslateblue-toad-454408.hostingersite.com/"; // https://mediumslateblue-toad-454408.hostingersite.com/

function initFooter() { initComponent('footer', 'footer'); }
function initHeader(hideNav = false, hideSearch = false) { initComponent('header', 'header', () => attachHeaderScripts(hideNav, hideSearch)); }

function initComponent(component, id, callback)
{
    // get doc element
    var element = document.getElementById(id);

    if (element != null)
    {
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

function attachHeaderScripts(hideNav, hideSearch) {
    const profileButton = document.getElementById('profileButton');
    const profileDropdown = document.getElementById('profileDropdown');
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');

    const searchIcon = document.getElementById('searchIcon');
    const searchBar = document.getElementById('searchBar');
    const searchInput = searchBar?.querySelector('input');
    
    searchIcon?.addEventListener('click', (e) =>
    {
        e.stopPropagation();
        searchBar?.classList.toggle('hidden');
    
        if (!searchBar?.classList.contains('hidden'))
        {
            searchInput?.focus();
        }
    });
    
    searchBar?.addEventListener('click', (e) =>
    {
        e.stopPropagation();
    });
    
    window.addEventListener('click', () =>
    {
        if (!searchBar?.classList.contains('hidden'))
        {
            searchBar.classList.add('hidden');
            if (searchInput)
            {
                searchInput.value = '';
            }
        }
    });

    const headerOrgEventsBtn = document.getElementById('headerOrgEventsBtn');
    const headerUserEventsBtn = document.getElementById('headerUserEventsBtn');
    const headerSettingsBtn = document.getElementById('headerSettingsBtn');
    const logoutBtn = document.getElementById('headerLogoutBtn');

    if (hideNav)
    {
        document.getElementById('navLinks').classList.add('hidden');
        document.getElementById('mobileNavLinks').classList.add('hidden');
    }

    if (hideSearch)
        searchIcon.classList.add('hidden');

    const userId = localStorage.getItem('user');

    headerOrgEventsBtn.onclick = function() {
        navToPage('organisedEvents.html');
    };

    headerUserEventsBtn.onclick = function() {
        navToPage('bookedEvents.html');
    };

    headerSettingsBtn.onclick = function() {
        navToPage('settings.html');
    };

    logoutBtn.onclick = function() {
        localStorage.removeItem('user');
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

function navToPage(page, redirectURL = null)
{
    let url = page;

    if (redirectURL)
    {
        const encodedRedirect = encodeURIComponent(redirectURL);
        url += `?redirect=${encodedRedirect}`;
    }

    window.location.href = url;
}

function getEvent(eventId)
{
    // check for cached events and load if needed
    const cachedEvents = getCachedEvents();

    if (!cachedEvents)
        return null;

    // find the evvent in the cached events
    for (const event of cachedEvents)
    {
        if (event.event_id == eventId)
            return event;
    }

    return null;
}

function getCachedEvents()
{
    // check for cached events and load if needed
    const cached = localStorage.getItem("cached_events");
    
    if (cached)
        return JSON.parse(cached);
}

let lastSqlResponse = null;

function getLastResponse()
{
    return lastSqlResponse;
}

async function sqlRequest(method, action, data = null)
{
    // sets url and options
    const url = `${URL}api/database.php?action=${action}`;
    const options = {
        method: method,
        headers: {
            "Content-Type": "application/json"
        },
        body: data ? JSON.stringify(data) : null
    };

    try
    {
        // send request to url
        document.body.style.cursor = 'wait';
        const response = await fetch(url, options);
        lastSqlResponse = response;

        // check if response was sent successully
        if (!response.ok)
            throw new Error(`Request failed with status ${response.status}`);

        // return response as json
        document.body.style.cursor = 'default';
        return await response.json();
    }
    catch (error)
    {
        // throw error
        document.body.style.cursor = 'default';
        throw new Error(error.message || "Network error");
    }
}