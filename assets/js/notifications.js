async function loadNotifications() {
    // get user id and reqeust all notifications
    const userId = localStorage.getItem('user');
    const response = await sqlRequest('POST', 'GET_NOTIFICATIONS', { 'userId': userId });

    if (response.status !== 'success') {
        return;
    }

    // get notifications and elements
    const notifications = JSON.parse(response.data);
    const tableBody = document.getElementById('notificationsTableBody');
    const template = document.getElementById('notificationRow');

    // loop through each notification and create html
    notifications.forEach(noti => {
        const row = template.content.cloneNode(true);
        const tr = row.querySelector('tr');

        // show notification on click
        tr.addEventListener('click', () => {
            showNotification(noti);
        });

        const maxLength = 75;
        let message = noti.message;

        // limit description length
        if (message.length > maxLength) {
            message = message.slice(0, maxLength) + '...';
        }

        row.querySelector('[data-message]').textContent = message;
        row.querySelector('[data-date]').textContent = noti.sent_at;

        tableBody.appendChild(row);
    });
}

function showNotification(notification) {
    // get notification window and set the message
    const notificationModal = document.getElementById('notificationModal');
    document.getElementById('notificationMessage').innerHTML = notification.message;

    // apply hide function
    const hideModalOnEscape = function (e) {
        if (e.key === 'Escape' || e.target.id === 'notificationModal') {
            document.removeEventListener('keydown', hideModalOnEscape);
            document.removeEventListener('click', hideModalOnEscape);
            notificationModal.classList.add('hidden');
        }
    };

    document.addEventListener('keydown', hideModalOnEscape);
    document.addEventListener('click', hideModalOnEscape);

    // hide window
    notificationModal.classList.remove('hidden');
}