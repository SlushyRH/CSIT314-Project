// set so that min date in date input is 7 days in the future at min
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate() + 7).padStart(2, '0');
    const minDate = `${yyyy}-${mm}-${dd}`;

    document.getElementById("eventDate").setAttribute("min", minDate);
});

let ticketCounter = 0;

// Function to create ticket type input fields
function createTicketInput() {
    const ticketDiv = document.createElement('div');
    ticketDiv.className = 'p-4 border border-(--form-outline) rounded-md';
    ticketDiv.innerHTML = `
        <div class="space-y-2">
        <div class="flex items-center space-x-2">
            <input type="text" placeholder="Ticket Name" class="ticket-name border border-(--form-outline) bg-(--bg) px-2 py-1 rounded flex-1">
            <input type="number" placeholder="Price" class="ticket-price border border-(--form-outline) bg-(--bg) px-2 py-1 rounded w-24">
            <input type="number" placeholder="Quantity" class="ticket-quantity border border-(--form-outline) bg-(--bg) px-2 py-1 rounded w-24">
            <button type="button" class="remove-ticket bg-red-500 text-white px-2 py-1 rounded">×</button>
        </div>
        <textarea placeholder="Ticket Benefits/Description" class="ticket-benefits border border-(--form-outline) bg-(--bg) px-2 py-1 rounded w-full"></textarea>
        <p class="ticket-error text-red-500 text-xs italic"></p>
        </div>
    `;

    const ticketContainer = document.getElementById('ticketContainer');
    ticketContainer.appendChild(ticketDiv);

    const removeBtn = ticketDiv.querySelector('.remove-ticket');
    removeBtn.addEventListener('click', () => ticketDiv.remove());

    ticketCounter++;
}

// Function to get event data from cache if updating
function loadEventData() {
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');

    if (eventId) {
        const events = getCachedEvents();
        const event = events.find(e => e.event_id === parseInt(eventId));

        if (event) {
            document.getElementById('titleText').textContent = 'Update Event';
            document.getElementById('submitBtn').textContent = 'Update Event';
            document.getElementById('eventTitle').value = event.title;
            document.getElementById('description').value = event.description;
            document.getElementById('category').value = event.category_id;
            document.getElementById('location').value = event.location;

            // Convert date format from "HH:mm DD/MM/YYYY" to "YYYY-MM-DDTHH:mm"
            const [time, date] = event.event_date.split(' ');
            const [day, month, year] = date.split('/');
            document.getElementById('eventDate').value = `${year}-${month}-${day}T${time}`;

            // Load tickets
            if (event.ticket_types) {
                console.log(event.ticket_types);
                event.ticket_types.forEach(ticket => {
                    createTicketInput();
                    const lastTicket = document.getElementById('ticketContainer').lastElementChild;
                    lastTicket.querySelector('.ticket-name').value = ticket.name;
                    lastTicket.querySelector('.ticket-price').value = ticket.price;
                    lastTicket.querySelector('.ticket-quantity').value = ticket.quantity_available;
                    lastTicket.querySelector('.ticket-benefits').value = ticket.benefits;
                });
            }
        }
    }
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    // Reset error messages
    document.querySelectorAll('.text-red-500').forEach(el => el.textContent = '');

    let isValid = validateForm();
    if (!isValid) return;

    const data = collectFormData();

    try {
        const response = await sqlRequest('POST', 'CREATE_EVENT', data);

        if (response.status === 'success') {
            addEventToCache(JSON.parse(response.data));
            window.location.href = 'organisedEvents.html';
        } else {
            alert('Error: ' + response.message);
        }
    } catch (error) {
        alert('Error creating/updating event: ' + error.message);
    }
}

function validateForm() {
    let isValid = true;

    if (!document.getElementById('eventTitle').value.trim()) {
        document.getElementById('titleError').textContent = 'Title is required';
        isValid = false;
    }

    if (!document.getElementById('description').value.trim()) {
        document.getElementById('descError').textContent = 'Description is required';
        isValid = false;
    }

    if (!document.getElementById('location').value.trim()) {
        document.getElementById('locationError').textContent = 'Location is required';
        isValid = false;
    }

    const eventDate = document.getElementById('eventDate');
    if (!eventDate.value) {
        document.getElementById('dateError').textContent = 'Date is required';
        isValid = false;
    } else {
        const selectedDate = new Date(eventDate.value);
        const now = new Date();
        if (selectedDate < now) {
            document.getElementById('dateError').textContent = 'Date must be in the future';
            isValid = false;
        }
    }

    // Validate tickets
    const ticketContainer = document.getElementById('ticketContainer');
    const ticketDivs = ticketContainer.children;
    if (ticketDivs.length === 0) {
        isValid = false;
        alert('At least one ticket type is required');
    }

    for (let ticketDiv of ticketDivs) {
        const name = ticketDiv.querySelector('.ticket-name').value;
        const price = ticketDiv.querySelector('.ticket-price').value;
        const quantity = ticketDiv.querySelector('.ticket-quantity').value;
        const benefits = ticketDiv.querySelector('.ticket-benefits').value;
        const errorElement = ticketDiv.querySelector('.ticket-error');

        if (!name || !price || !quantity || !benefits) {
            errorElement.textContent = 'All ticket fields are required';
            isValid = false;
        } else if (price <= 0) {
            errorElement.textContent = 'Price must be greater than 0';
            isValid = false;
        } else if (quantity <= 0) {
            errorElement.textContent = 'Quantity must be greater than 0';
            isValid = false;
        }
    }

    return isValid;
}

function collectFormData() {
    const eventDate = document.getElementById('eventDate');
    const dateObj = new Date(eventDate.value);
    const formattedDate = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')} ${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;

    const tickets = [];
    const ticketDivs = document.getElementById('ticketContainer').children;
    for (let ticketDiv of ticketDivs) {
        const quantity = ticketDiv.querySelector('.ticket-quantity').value;
        tickets.push({
            id: -1, // New ticket
            name: ticketDiv.querySelector('.ticket-name').value,
            price: ticketDiv.querySelector('.ticket-price').value,
            benefits: ticketDiv.querySelector('.ticket-benefits').value,
            quantity_available: quantity,
            tickets_left: quantity
        });
    }

    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('eventId');

    return {
        userId: 12, // Should be replaced with actual logged in user ID
        eventId: eventId ? parseInt(eventId) : -1,
        title: document.getElementById('eventTitle').value.trim(),
        description: document.getElementById('description').value.trim(),
        location: document.getElementById('location').value.trim(),
        category: parseInt(document.getElementById('category').value),
        date: formattedDate,
        tickets: tickets
    };
}

// Initialize event handlers when document is ready
document.addEventListener('DOMContentLoaded', function () {
    const addTicketBtn = document.getElementById('addTicketBtn');
    const eventForm = document.getElementById('eventForm');
    const cancelBtn = document.getElementById('cancelBtn');

    addTicketBtn.addEventListener('click', createTicketInput);
    eventForm.addEventListener('submit', handleSubmit);
    cancelBtn.addEventListener('click', () => window.location.href = 'organisedEvents.html');

    loadEventData();
});

function create() {
    // get data from user inputs
    const title = document.getElementById("eventTitle").value;
    const description = document.getElementById("description").value;
    const category_id = document.getElementById("category").value;
    const location = document.getElementById("location").value;
    const event_date = document.getElementById("eventDate").value;
    // Check data that is a requirement
    console.log("event Date: " + event_date);
    const validationResult = validateCategoryID(category_id);
    const dateValidation = checkDate(event_date);
    // personal checking thing
    console.log(dateValidation);
    const outputText = title + ", " + description + ", " + category_id + ", " + location + ", " + event_date + ", " + validationResult + ", " + dateValidation;
    console.log(outputText);
    // Make sure result is valid
    const issues = Datavalidation(title, description, validationResult, location, event_date)
    // check to see if issues occured
    if (issues == false) {
        // retrieve user id from local storage
        var user_id = localStorage.getItem("user_id");
        // converts data to correct format to be added to database
        const formatedData = {
            "user_id": user_id,
            "title": title,
            "description": description,
            "category_id": validationResult,
            "location": location,
            "event_date": event_date
        };
        console.log(formatedData);
        // call function to send data to database
        sendData(formatedData);
    }
}
// function to make sure that the catagory field has a catagory and converts string value to integer
function validateCategoryID(category_id) {
    // group of if functions for conversion
    if (category_id == "1") {
        return 1;
    } else if (category_id == "2") {
        return 2;
    } else if (category_id == "3") {
        return 3;
    } else if (category_id == "4") {

    } else if (category_id == "5") {

    } else if (category_id == "6") {

    } else if (category_id == "7") {

    } else {
        return "invalid";
    }
}
// Function to check if there are any issues and rase messages telling user what the issue is
function Datavalidation(title, description, validationResult, location, dateValidation) {
    // will turn true if any issues are found
    issues = false
    // check for title
    if (title == "") {
        // get title field
        const response = document.getElementById("titleMissing");
        // alter the relevent response field
        response.innerHTML = "Please enter tile of event";
        // Change issues to true
        issues = true;
    }
    if (description == "") {
        // get description field
        const response = document.getElementById("descMissing");
        // alter the relevent response field
        response.innerHTML = "Please enter description of event";
        // Change issues to true
        issues = true;
    }
    if (location == "") {
        // get location field
        const response = document.getElementById("locMissing");
        // alter the relevent response field
        response.innerHTML = "Please enter location of event";
        // Change issues to true
        issues = true;
    }
    if (validationResult == "invalid") {
        // get catagory field
        const response = document.getElementById("catInvalRes");
        // alter the relevent response field
        response.innerHTML = "Please select the type of event";
        // Change issues to true
        issues = true;
    }
    if (dateValidation == "invalid") {
        // get date field
        const response = document.getElementById("eventInvalRes");
        // alter the relevent response field
        response.innerHTML = "Please select the start date of the event";
        // Change issues to true
        issues = true;
    }
    // return issues
    return issues;
}
// function to check event date
function checkDate(event_date) {
    // check if event_date is empty
    if (event_date == "") {
        // return a string saying invalid
        return "invalid";
    }
    return "valid"
}

// adds event data to database
async function sendData(formatedData) {
    var sendToDatabase = await sqlRequest("POST", "CREATE_EVENT", formatedData);
}