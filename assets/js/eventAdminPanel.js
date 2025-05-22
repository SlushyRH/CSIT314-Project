document.addEventListener("DOMContentLoaded", function() {
    RetrieveFromLocalStorage();
});

// 

function RetrieveFromLocalStorage(){
    const event = localStorage.getItem("Selected_event");

    const title = event.title;
    const description = event.description;
    let catagory = event.catagory_id;
    const location = event.location;
    const eventDay = event.event_date;

    catagory = CatagoryInterpreter(catagory);

}

function CatagoryInterpreter(catagoryID){
    
}


