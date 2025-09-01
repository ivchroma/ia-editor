function parseJwt(token) {
    const base64Url = token.split('.')[1]; // The payload is the 2nd part
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
    return JSON.parse(jsonPayload);
}

function handleCredentialResponse(response) {
    const userObject = parseJwt(response.credential);
    document.getElementById("buttonDiv").style.display = "none";
    document.getElementById("status").innerText = `Hello, ${userObject.name}!`;
}

// Initialize Google Sign-In
google.accounts.id.initialize({
    client_id: "115396371783-js9tgd23t1iftkomup331nksmlvu26ht.apps.googleusercontent.com",
    callback: handleCredentialResponse
});

// Render the sign-in button
google.accounts.id.renderButton(
    document.getElementById("buttonDiv"),
    { theme: "outline", size: "large" }
);
google.accounts.id.prompt();
