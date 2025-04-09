window.addEventListener("DOMContentLoaded", () =>
{
    // toggle sign up based on url
    if (location.search === "?signUp")
        toggleLogInType();
});

let hasAccount = true;

async function logIn(event)
{
    event.preventDefault(); // stop button from refreshing page

    // get email and passworrd
    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    if (!hasAccount)
    {
        // get sign up elements
        var name = document.getElementById("name").value;
        var dob = document.getElementById("dob").value;
        var phoneNumber = document.getElementById("pnumber").value;

        // create sign up data
        var data = {
            name: name,
            dob: dob,
            phoneNumber: phoneNumber,
            email: email,
            password: password
        };
    
        try 
        {
            // send request to server
            var response = await sqlRequest("POST", "USER_SIGN_UP", data);

            // alert status for debugging
            if (response.status == "success")
                alert("User has signed up!");
            else
                alert("User could not sign up! " + response.message);
        }
        catch (error)
        {
            // log any errors
            console.error("Signup Failed:", error);
            alert("An unexpected error occured!");
        }
    }
    else
    {
        // create log in data
        var data = {
            email: email,
            password: password
        };

        try 
        {
            // send request to server
            var response = await sqlRequest("POST", "USER_LOG_IN", data);

            // alert status for debugging
            if (response.status == "success")
                alert("User has signed in!");
            else
                alert("User could not sign in! " + response.message);
        }
        catch (error)
        {
            // log any errors
            console.error("Signup Failed:", error);
            alert("An unexpected error occured!");
        }
    }
}

function toggleLogInType()
{
    // toggle has account
    hasAccount = !hasAccount;

    // get constant elements
    const titleText = document.getElementById("titleText");
    const logInBtn = document.getElementById("logInBtn");
    const toggleText = document.getElementById("showSignUpBtn");

    // get sign up form elements
    const name = document.getElementById("name-wrapper");
    const dob = document.getElementById("dob-wrapper");
    const pnumber = document.getElementById("pnumber-wrapper");

    // if hasAccount is true, only show sign in elements, otherwise show sign up elements
    if (hasAccount)
    {
        // change page contents
        titleText.textContent = "Log In";
        logInBtn.textContent = "Log In";
        toggleText.textContent = "Sign Up";
        toggleText.previousSibling.textContent = "Don't have an account? ";

        // make sign up form elements hidden
        name.classList.add("hidden");
        dob.classList.add("hidden");
        pnumber.classList.add("hidden");

        // replace url with default url
        history.replaceState(null, "", location.pathname);
    }
    else
    {
        // change page contents
        titleText.textContent = "Sign Up";
        logInBtn.textContent = "Sign Up";
        toggleText.textContent = "Sign In";
        toggleText.previousSibling.textContent = "Already have an account? ";

        // make sign up form elements visible
        name.classList.remove("hidden");
        dob.classList.remove("hidden");
        pnumber.classList.remove("hidden");
        
        // add ?signUp to url
        history.replaceState(null, "", location.pathname + "?signUp");
    }
}
