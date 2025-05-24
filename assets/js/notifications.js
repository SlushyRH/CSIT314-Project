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

    notifications.forEach(n =>
    {
        const row = template.content.cloneNode(true);
        const tr = row.querySelector('tr');
        tr.dataset.id = n.id;
        tr.addEventListener('click', () =>
        {
            window.location.href = `notification.html?id=${n.notification_id}`;

        });

        row.querySelector('[data-message]').textContent = n.message;
        row.querySelector('[data-date]').textContent = n.sent_at;

        tableBody.appendChild(row);
    });
}

function showNotification(notification) {
    const notificationModal = document.getElementById('notificationModal');
    document.getElementById('notificationMessage').value = notification.message;
    notificationModal.classList.remove('hidden');

}