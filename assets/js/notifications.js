async function loadNotifications() {
    const userId = localStorage.getItem('user');
    const response = await sqlRequest('POST', 'GET_NOTIFICATIONS', {'userId': userId});

    if (response.status !== 'success') {
        console.log(response.message);
        return;
    }

    const notifications = JSON.parse(response.data);
    console.log(notifications);

    const params = new URLSearchParams(window.location.search);

    if (params.has('id')) {
        
    } else {

    }

    const tableBody = document.getElementById('notificationsTableBody');
    const template = document.getElementById('notificationRow');

    notifications.forEach(n => {
        const row = template.content.cloneNode(true);
        const tr = row.querySelector('tr');

        tr.addEventListener('click', () => {
            showNotification(n);
        });

        const maxLength = 75;
        let message = n.message;

        // limit description length
        if (message.length > maxLength) {
            message = message.slice(0, maxLength) + '...';
        }

        row.querySelector('[data-message]').textContent = message;
        row.querySelector('[data-date]').textContent = n.sent_at;

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

    // show window
    notificationModal.classList.remove('hidden');
}