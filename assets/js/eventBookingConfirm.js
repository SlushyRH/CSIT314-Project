async function getRegistration() {
    const urlParams = new URLSearchParams(window.location.search);
    const registrationId = urlParams.get("registration");

    if (!registrationId) {
        return;
    }

    document.getElementById("registrationIdDisplay").textContent = registrationId;

    try {
        const response = await sqlRequest("POST", "GET_REGISTRATION", registrationId);
        const data = response.data;

        if (!data) {
            alert("No registration data found.");
            return;
        }

        document.getElementById("eventName").textContent = data.eventName || "Unnamed Event";
        document.getElementById("eventDescription").textContent = data.eventDescription || "No description available.";
        document.getElementById("eventDate").textContent = `Date: ${data.eventDate || "Unknown"}`;
        document.getElementById("eventLocation").textContent = `Location: ${data.eventLocation || "Unknown"}`;
        document.getElementById("holderName").textContent = data.holderName || "Anonymous";
        document.getElementById("ticketType").textContent = data.ticketName || "General Admission";
        document.getElementById("ticketQuantity").textContent = data.quantity || "1";
        document.getElementById("ticketPrice").textContent = `$${(data.totalPrice || 0).toFixed(2)}`;
    }
    catch (err)
    {
        console.error("Failed to fetch registration data:", err);
        alert("An error occurred while loading your ticket.");
    }
}