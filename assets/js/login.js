window.addEventListener("DOMContentLoaded", () =>
{
    // toggle sign up based on url
    if (location.search === "?signUp")
        toggleLogInType();
    else if (location.search === "?resetPassword")
        toggleResetPassword();
});

let hasAccount = true;

// declare constant elements
let titleText;
let logInBtn;
let toggleText;
let forgotPasswordText;

// declare sign in/up form elements
let email;
let password;
let fullName;
let dob;
let phoneNumber;

function getElements()
{
    // get constant elements
     titleText = document.getElementById("titleText");
     logInBtn = document.getElementById("logInBtn");
     toggleText = document.getElementById("showSignUpBtn");
     forgotPasswordText = document.getElementById("forgotPassword");
    
    // get sign in/up form elements
     email = document.getElementById("email").value;
     password = document.getElementById("password").value;
     fullName = document.getElementById("name-wrapper");
     dob = document.getElementById("dob-wrapper");
     phoneNumber = document.getElementById("pnumber-wrapper");
}

async function logIn(event)
{
    getElements();
    event.preventDefault(); // stop button from refreshing page

    if (!hasAccount)
    {
        // create sign up data
        var data = {
            name: fullName,
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

    getElements();

    // if hasAccount is true, only show sign in elements, otherwise show sign up elements
    if (hasAccount)
    {
        // change page contents
        titleText.textContent = "Log In";
        logInBtn.textContent = "Log In";
        toggleText.textContent = "Sign Up";
        toggleText.previousSibling.textContent = "Don't have an account? ";

        // make sign up form elements hidden
        fullName.classList.add("hidden");
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
        fullName.classList.remove("hidden");
        dob.classList.remove("hidden");
        pnumber.classList.remove("hidden");
        
        // add ?signUp to url
        history.replaceState(null, "", location.pathname + "?signUp");
    }
}
