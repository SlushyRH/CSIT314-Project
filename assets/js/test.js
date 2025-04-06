window.addEventListener("DOMContentLoaded", function()
{
    var signUpBtn = this.document.querySelector("#sign-up-btn");

    if (signUpBtn)
        signUpBtn.addEventListener("click", signUpUser);
});

async function signUpUser()
{
    var email = document.querySelector('input[name="user-email"]').value;
    var fname = document.querySelector('input[name="fname"]').value;
    var lname = document.querySelector('input[name="lname"]').value;
    var password = document.querySelector('input[name="pass"]').value;

    var data = {
        email: email,
        fname: fname,
        lname: lname,
        password: password
    };
    console.log(data);

    try
    {
        var response = await sqlRequest("POST", "USER_SIGN_UP_TEST", data);

        if (response.status === "success")
            alert("User Sign Up was successful!");
        else
            alert("Error: " + response.message);
    }
    catch (error)
    {
        console.error("Signup Failed:", error);
        alert("An unexpected error occured!");
    }

    console.log(response);
}