const URL = ""; // https://mediumslateblue-toad-454408.hostingersite.com

async function sqlRequest(method, action, data = null)
{
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
        const response = await fetch(url, options);

        if (!response.ok)
        {
            throw new Error(`Request failed with status ${response.status}`);
        }

        return await response.json();
    }
    catch (error)
    {
        throw new Error(error.message || "Network error");
    }
}

async function openModalWindow(title, description, ...buttons)
{
    return new Promise((resolve) =>
    {
        // create background overlay
        let overlay = document.createElement("div");
        overlay.className = `
            fixed inset-0 bg-opacity-50 backdrop-blur-md
            flex items-center justify-center z-50
        `;
        overlay.tabIndex = -1;

        // create modal container
        let modal = document.createElement("div");
        modal.className = `
            bg-white text-black dark:bg-gray-800 dark:text-white
            rounded-2xl shadow-2xl max-w-lg w-full p-6
            flex flex-col space-y-4 text-center
        `;

        // create title
        let titleContainer = document.createElement("h2");
        titleContainer.className = "text-xl font-bold text-center";
        titleContainer.textContent = title;
        modal.appendChild(titleContainer);

        // create description
        let descContainer = document.createElement("p");
        descContainer.className = "text-base text-center";
        descContainer.textContent = description;
        modal.appendChild(descContainer);

        // button container
        let buttonContainer = document.createElement("div");
        buttonContainer.className = "flex justify-center space-x-4 pt-4";

        // return button id on click
        buttons.forEach((btnLabel, idx) =>
        {
            // create btn
            let btn = document.createElement("button");
            btn.textContent = btnLabel;
            btn.className = `
                px-4 py-2 rounded-xl transition
                bg-blue-600 text-white hover:bg-blue-700
                dark:bg-blue-500 dark:hover:bg-blue-600
            `;
            
            // assign btn onClick
            btn.onclick = () =>
            {
                document.body.removeChild(overlay);
                resolve(idx);
            };
            buttonContainer.appendChild(btn);
        });

        // append to body
        modal.appendChild(buttonContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // trap focus inside modal
        setTimeout(() => modal.focus(), 0);
    });
}
