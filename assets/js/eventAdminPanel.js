document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('notificationModal');
    const sendButton = document.getElementById('openNotificationWindow');
    const cancelBtn = document.getElementById('cancelBtn');
    const sendBtn = document.getElementById('sendBtn');

    sendButton.addEventListener('click', function() {
        document.getElementById('notificationMessage').value = '';
        modal.classList.remove('hidden');
    });

    cancelBtn.addEventListener('click', function() {
        modal.classList.add('hidden');
    });

    sendBtn.addEventListener('click', function() {
        const message = document.getElementById('notificationMessage').value;
        modal.classList.add('hidden');

        console.log('Sending Notification:', message);
    });
});

function getEventInfo() {
    const params  = new URLSearchParams(window.location.search);
    const eventId = params.get("eventId");

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
    const response = await sqlRequest("POST", "GET_ADMIN_DETAILS", {'eventId': eventId});
    
    if (response.status !== 'success')
        return;

    const data = JSON.parse(response.data);
    console.log(data);

    fillAdminData(eventId, data)
}

function fillAdminData(eventId, data) {
    const totalMoneyMade = data.total_revenue.toLocaleString('en-AU', {
        style: 'currency',
        currency: 'AUD'
    });

    document.querySelector('[data-total-tickets]').textContent = data.total_tickets_sold;
    document.querySelector('[data-total-money]').textContent = totalMoneyMade.toLocaleString();
    document.querySelector('[data-total-attendees]').textContent = data.attendance_count;

    const tbody = document.querySelector('table tbody');
    const template = document.getElementById('attendeeRow');

    console.log(template);
    
    data.registered_users.forEach(user => {
        if (user.status === "rejected")
            return;

        const clone = template.content.cloneNode(true);

        clone.querySelector('[data-attendee-name]').textContent = user.name;
        clone.querySelector('[data-attendee-email]').textContent = user.email;
        clone.querySelector('[data-attendee-status]').textContent = user.status;

        const statusData = clone.querySelector('[data-attendee-status]');
        const approveBtn = clone.querySelector('[data-approve-btn]');
        const rejectBtn = clone.querySelector('[data-reject-btn]');

        approveBtn.onclick = (e) => {
            changeUserStatus(eventId, user.user_id, 'approved', statusData);
        };

        rejectBtn.onclick = (e) => {
            changeUserStatus(eventId, user.user_id, 'rejected', statusData);
        };

        tbody.appendChild(clone);
    });
}

async function changeUserStatus(eventId, userId, newStatus, statusHtml) {
    statusHtml.textContent = newStatus;

    const data = {
        'eventId': eventId,
        'userId': userId,
        'newStatus': newStatus
    };

    const response = await sqlRequest('POST', 'UPDATE_USER_STATUS', data);
    console.log(response);
}