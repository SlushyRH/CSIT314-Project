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
    titleText = document.getElementById("titleText");
    logInBtn = document.getElementById("logInBtn");
    toggleText = document.getElementById("showSignUpBtn");
    forgotPasswordText = document.getElementById("forgotPassword");

    email = document.getElementById("email");
    password = document.getElementById("password");

    // wrapper elements
    fullName = document.getElementById("name-wrapper");
    dob = document.getElementById("dob-wrapper");
    phoneNumber = document.getElementById("pnumber-wrapper");

    // input elements inside wrappers
    fullName.input = fullName.querySelector("input");
    dob.input = dob.querySelector("input");
    phoneNumber.input = phoneNumber.querySelector("input");
}

async function logIn(event)
{
    getElements();
    event.preventDefault(); // stop button from refreshing page

    if (!hasAccount)
    {
        // create sign up data
        var data = {
            name: fullName.input.value,
            dob: dob.input.value,
            phoneNumber: phoneNumber.input.value,
            email: email.value,
            password: password.value
        };
    
        try 
        {
            console.log(data);

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
            email: email.value,
            password: password.value
        };

        try 
        {
            // send request to server
            var response = await sqlRequest("POST", "USER_LOG_IN", data);

            // alert status for debugging
            if (response.status != "success")
                alert("User could not sign in! " + response.message);

            var userId = response.data.user_id;
            localStorage.setItem('user', userId);
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
        phoneNumber.classList.add("hidden");

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
        phoneNumber.classList.remove("hidden");
        
        // add '?signUp' to url
        history.replaceState(null, "", location.pathname + "?signUp");
    }
}

function toggleResetPassword()
{
    getElements();

    hasAccount = true;

    // Hide name, dob, phone fields
    fullName.classList.add("hidden");
    dob.classList.add("hidden");
    phoneNumber.classList.add("hidden");

    // Update title and button text
    titleText.textContent = "Reset Password";
    logInBtn.textContent = "Reset";

    // Show email and password fields (if they were hidden)
    document.getElementById("email").parentElement.classList.remove("hidden");
    document.getElementById("password").parentElement.classList.remove("hidden");

    // Change password placeholder
    document.getElementById("password").placeholder = "New Password";

    // Remove 'Don't have an account? Sign Up' text
    toggleText.parentElement.classList.add("hidden");

    // Update 'Forgot Password' text
    forgotPasswordText.textContent = "Remember Your Password";
    forgotPasswordText.onclick = function()
    {
        toggleLogInType();
    };

    // Replace URL
    history.replaceState(null, "", location.pathname + "?resetPassword");

    // Change log in button action
    logInBtn.onclick = async function(event)
    {
        event.preventDefault();
        getElements();

        const data = {
            email: email.value,
            password: password.value
        };

        try
        {
            console.log(data);
            const response = await sqlRequest("POST", "RESET_PASSWORD", data);

            if (response.status === "success")
            {
                alert("Password has been reset!");
                location.href = location.pathname; // return to login page
            }
            else
            {
                alert("Could not reset password: " + response.message);
            }
        }
        catch (err)
        {
            console.error("Reset Failed:", err);
            alert("An unexpected error occurred!");
        }
    };
}