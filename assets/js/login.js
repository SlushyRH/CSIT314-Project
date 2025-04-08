window.addEventListener("DOMContentLoaded", () =>
{
    if (location.search === "?signUp")
        toggleLogInType();
});

let hasAccount = true;

async function logIn(event)
{
    event.preventDefault(); // stop button from refreshing page

    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    if (!hasAccount)
    {
        var name = document.getElementById("name").value;
        var dob = document.getElementById("dob").value;
        var phoneNumber = document.getElementById("pnumber").value;

        var data = {
            name: name,
            dob: dob,
            phoneNumber: phoneNumber,
            email: email,
            password: password
        };
    
        try 
        {
            var response = await sqlRequest("POST", "USER_SIGN_UP", data);
            alert(response.message);
        }
        catch (error)
        {
            console.error("Signup Failed:", error);
            alert("An unexpected error occured!");
        }
    }
    else
    {
        var data = {
            email: email,
            password: password
        };

        try 
        {
            var response = await sqlRequest("POST", "USER_LOG_IN", data);
            alert(response.message);
        }
        catch (error)
        {
            console.error("Signup Failed:", error);
            alert("An unexpected error occured!");
        }
    }
}

function toggleLogInType()
{
    hasAccount = !hasAccount;

    const titleText = document.getElementById("titleText");
    const logInBtn = document.getElementById("logInBtn");
    const toggleText = document.getElementById("showSignUpBtn");

    const name = document.getElementById("name");
    const dob = document.getElementById("dob");
    const pnumber = document.getElementById("pnumber");

    if (hasAccount)
    {
        titleText.textContent = "Log In";
        logInBtn.textContent = "Log In";
        toggleText.textContent = "Sign Up";
        toggleText.previousSibling.textContent = "Don't have an account? ";

        name.classList.add("hidden");
        dob.classList.add("hidden");
        pnumber.classList.add("hidden");

        history.replaceState(null, "", location.pathname);
    }
    else
    {
        titleText.textContent = "Sign Up";
        logInBtn.textContent = "Sign Up";
        toggleText.textContent = "Sign In";
        toggleText.previousSibling.textContent = "Already have an account? ";

        name.classList.remove("hidden");
        dob.classList.remove("hidden");
        pnumber.classList.remove("hidden");
        
        history.replaceState(null, "", location.pathname + "?signUp");
    }
}
