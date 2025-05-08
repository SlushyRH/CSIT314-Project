// set so that min date in date input is 7 days in the future at min
document.addEventListener("DOMContentLoaded", () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate() + 7).padStart(2, '0');
  const minDate = `${yyyy}-${mm}-${dd}`;

  document.getElementById("eventDate").setAttribute("min", minDate);
});


function create(){
    // get data from user inputs
   const title = document.getElementById("eventTitle").value;
   const description = document.getElementById("description").value;
   const category_id = document.getElementById("category").value;
   const location = document.getElementById("location").value;
   const event_date = document.getElementById("eventDate").value;
    // Check data that is a requirement
   const validationResult = validateCategoryID(category_id);
   const dateValidation = checkDate(event_date);
   // personal checking thing
   console.log(dateValidation);
   const outputText = title + ", " + description + ", " + category_id + ", " + location + ", " + event_date + ", " + validationResult + ", " + dateValidation;
   console.log(outputText);
   // Make sure result is valid
   const issues = Datavalidation(title, description, validationResult, location, event_date)
   // check to see if issues occured
   if (issues == false){
       // retrieve user id from local storage
       var user_id = localStorage.getItem("user_id");
       // converts data to correct format to be added to database
       const formatedData = {
            "user_id":user_id,
            "title":title,
            "description":description,
            "category_id":validationResult,
            "location":location,
            "event_date":event_date
       };
       console.log(formatedData);
       // call function to send data to database
       sendData(formatedData);
   }
}
// function to make sure that the catagory field has a catagory and converts string value to integer
function validateCategoryID(category_id) {
    // group of if functions for conversion
    if (category_id == "1"){
        return 1;
    } else if (category_id == "2"){
        return 2;
    } else if (category_id == "3"){
        return 3;
    } else {
        return "invalid";
    }
}
// Function to check if there are any issues and rase messages telling user what the issue is
function Datavalidation(title, description, validationResult, location, dateValidation){
    // will turn true if any issues are found
    issues = false
    // check for title
    if (title == ""){
        // get title field
        const response = document.getElementById("titleMissing");
        // alter the relevent response field
        response.innerHTML = "Please enter tile of event";
        // Change issues to true
        issues = true;
    }
    if (description == ""){
        // get description field
        const response = document.getElementById("descMissing");
        // alter the relevent response field
        response.innerHTML = "Please enter description of event";
        // Change issues to true
        issues = true;
    }
    if (location == ""){
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
    if (dateValidation == "invalid"){
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
   if (event_date == ""){
        // return a string saying invalid
        return "invalid";
   }
}

// adds event data to database
async function sendData(formatedData){
    var sendToDatabase = await sqlRequest("POST", "CREATE_EVENT", formatedData);
}