// auth.js
// User accounts (1.4.1): login, registration and sign out.
// NOTE: this is only a demo. The accounts live in the page and disappear on reload.
// A real system must check passwords on a server and store them hashed in a database.

const users = [
  { name: "Admin",       email: "admin@catc.edu",   password: "admin123",   role: "Administrator" },
  { name: "Prof. Reyes", email: "faculty@catc.edu", password: "faculty123", role: "Faculty" },
  { name: "Student",     email: "student@catc.edu", password: "student123", role: "Student" }
];

let registering = false;   // false = "Sign in" form, true = "Create account" form

// Shows a red error message under the login form
function showLoginError(text) {
  const messageBox = qs("#lm");
  messageBox.className = "msg show err";
  messageBox.textContent = text;
}

// "Create an account" / "I already have an account" link: switches between the two forms
qs("#lt").onclick = () => {
  registering = !registering;

  qs("#rn").hidden = !registering;   // full name field
  qs("#rr").hidden = !registering;   // role field
  qs("#ls").textContent = registering ? "Create account" : "Sign in";
  qs("#lt").textContent = registering ? "I already have an account" : "Create an account";
  qs("#lm").className = "msg";       // hide any old message
};

// Login / registration form
qs("#lf").onsubmit = event => {
  event.preventDefault();

  const email = qs("#le").value.trim().toLowerCase();
  const password = qs("#lp").value;
  let user;

  if (!email || !password) {
    return showLoginError("Enter your email and password.");
  }

  if (registering) {
    // ----- Create a new account -----
    const name = qs("#ln").value.trim();
    if (!name) {
      return showLoginError("Enter your full name.");
    }
    if (password.length < 8) {
      return showLoginError("Use a password with at least 8 characters.");
    }
    if (users.some(u => u.email === email)) {
      return showLoginError("That email already has an account. Sign in instead.");
    }
    user = { name: name, email: email, password: password, role: qs("#lr").value };
    users.push(user);
    qs("#lt").click();   // switch the form back to "Sign in" mode
  } else {
    // ----- Sign in to an existing account -----
    user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return showLoginError("Email or password is incorrect. Check them and try again.");
    }
  }

  // Signed in: remember the role and show the app
  state.role = user.role;
  state.tab = "Schedule";
  state.pickedSlot = null;
  qs("#uname").textContent = user.name + " (" + user.role + ")";

  qs("#lf").reset();
  qs("#lm").className = "msg";
  document.body.classList.remove("out");   // hides the login page, shows the app
  showCurrentTab();
};

// Sign out button: go back to the login page
qs("#out").onclick = () => {
  document.body.classList.add("out");
  qs("#le").focus();
};
