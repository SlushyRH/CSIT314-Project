window.addEventListener("DOMContentLoaded", () =>
{
    // get redirect params
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get("redirect");

    if (redirect)
    {
        redirectUrl = redirect;
        urlParams.remove("redirect");
    }

    // toggle sign up based on url
    if (location.search === "?signUp")
        toggleLogInType();
});

let hasAccount = true;
let redirectUrl;

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

async function submitBtn(event)
{
    getElements();
    event.preventDefault();

    if (!hasAccount)
    {
        await signup(
            fullName.input.value,
            dob.input.value,
            phoneNumber.input.value,
            email.value,
            password.value
        );
    }
    else
    {
        await login(
            email.value,
            password.value
        );
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

async function login(email, password)
{
    const data = {
        email: email,
        password: password
    };

    try
    {
        // send and get response from sql api
        const response = await sqlRequest("POST", "USER_LOG_IN", data);

        // check if success and alert if not
        if (response.status != "success")
        {
            alert("User could not sign in! " + response.message);
            return;
        }

        // log userID to local storage
        const userId = response.data.user_id;
        localStorage.setItem("user", userId);

        // naviaget to index unless there was aa url give to direcct to
        if (redirectUrl)
            navToPage(redirectUrl);
        else
            navToPage('index.html');
    }
    catch (error)
    {
        console.error("Login Failed:", error);
    }
}

async function signup(name, dob, phoneNumber, email, password)
{
    const data = {
        name: name,
        dob: dob,
        phoneNumber: phoneNumber,
        email: email,
        password: password
    };

    try
    {
        console.log(data);

        const response = await sqlRequest("POST", "USER_SIGN_UP", data);

        if (response.status !== "success")
            alert("User could not sign up! " + response.message);
    }
    catch (error)
    {
        console.error("Signup Failed:", error);
    }
}
