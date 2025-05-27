document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('notificationModal');
    const sendButton = document.getElementById('openNotificationWindow');
    const cancelBtn = document.getElementById('cancelBtn');
    const sendBtn = document.getElementById('sendBtn');

    // close notification window on button click
    function hideNotificationWindow(e) {
        e.preventDefault();

        document.getElementById('notificationMessage').value = '';
        modal.classList.remove('hidden');
    }

    sendButton.addEventListener('click', hideNotificationWindow());
    cancelBtn.addEventListener('click', hideNotificationWindow()); 
    sendBtn.addEventListener('click', sendNotification);
});

let registeredUsers = [];

async function sendNotification() {
    // get notification text
    const message = document.getElementById('notificationMessage').value;
    console.log('Sending Notification:', message);

    // package notification
    const data = {
        msg: message,
        users: registeredUsers
    };

    // hide notification window
    const modal = document.getElementById('notificationModal');
    if (modal) {
        modal.classList.add('hidden');
    }

    // send request
    const response = await sqlRequest('POST', 'SEND_NOTIFICATIONS', data);
}

function getEventInfo() {
    // get eventid from params
    const params  = new URLSearchParams(window.location.search);
    const eventId = params.get("eventId");

    // open create page on edit click
    document.getElementById('editEventBtn').onclick = function() {
        const params = new URLSearchParams();
        params.set("eventId", eventId);

        // open with eventid page
        navToPage('createEvent.html?' + params.toString());
    };

    const event = getEvent(eventId);

    fillEventData(event);
    getAdminData(eventId);
}

function fillEventData(event) {
    document.querySelector('[data-event-title]').textContent = event.title;
    document.querySelector('[data-event-date]').textContent = event.event_date;
    document.querySelector('[data-event-category]').textContent = event.category_name;
    document.querySelector('[data-event-location]').textContent = event.location;
}

async function getAdminData(eventId) {
    // get all required admin details to show
    const response = await sqlRequest("POST", "GET_ADMIN_DETAILS", {'eventId': eventId});
    
    if (response.status !== 'success')
        return;

    const data = JSON.parse(response.data);

    // assign each registered users
    data.registered_users.forEach(user => {
        registeredUsers.push(parseInt(user.user_id));
    });

    fillAdminData(eventId, data)
}

function fillAdminData(eventId, data) {
    // format currenncy
    const totalMoneyMade = data.total_revenue.toLocaleString('en-AU', {
        style: 'currency',
        currency: 'AUD'
    });

    // assign data
    document.querySelector('[data-total-tickets]').textContent = data.total_tickets_sold;
    document.querySelector('[data-total-money]').textContent = totalMoneyMade.toLocaleString();
    document.querySelector('[data-total-attendees]').textContent = data.attendance_count;

    const tbody = document.querySelector('table tbody');
    const template = document.getElementById('attendeeRow');

    // fill out table for each user if not rejected    
    data.registered_users.forEach(user => {
        if (user.status === "rejected")
            return;

        const clone = template.content.cloneNode(true);

        // fill out user data
        clone.querySelector('[data-attendee-name]').textContent = user.name;
        clone.querySelector('[data-attendee-email]').textContent = user.email;
        clone.querySelector('[data-attendee-status]').textContent = user.status;

        const statusData = clone.querySelector('[data-attendee-status]');
        const approveBtn = clone.querySelector('[data-approve-btn]');
        const rejectBtn = clone.querySelector('[data-reject-btn]');

        function statusClick(newStatus) {
            changeUserStatus(eventId, user.user_id, newStatus, statusData);
            approveBtn.classList.add('hidden');
            rejectBtn.classList.add('hidden');
        }

        // show action buttons if status is pending, otherwise hide them
        if (user.status === 'pending') {
            approveBtn.onclick = statusClick('approved');
            rejectBtn.onclick = statusClick('rejected');
        } else {
            approveBtn.classList.add('hidden');
            rejectBtn.classList.add('hidden');
        }

        tbody.appendChild(clone);
    });
}

// this function will change the status of the user to the new sstatus and update html
async function changeUserStatus(eventId, userId, newStatus, statusHtml) {
    statusHtml.textContent = newStatus;

    const data = {
        'eventId': eventId,
        'userId': userId,
        'newStatus': newStatus
    };

    sqlRequest('POST', 'UPDATE_USER_STATUS', data);

    const event = getCachedEvent(eventId);
    const message = 'You have been rejected from attending ' + event.title + '. Your payment has been refunded, pleae allow 10 - 14 business days for payment to be processed.';

    const notiData = {
        msg: message,
        users: [userId],
    };

    sqlRequest('POST', 'SEND_NOTIFICATIONS', notiData);
}