// Get the content div
const contentDiv = document.getElementById('content');

// Get the navigation links
const homeLink = document.getElementById('home-link');
const recordsLink = document.getElementById('records-link');
const loginLink = document.getElementById('login-link');

// Home page function
function showHomePage() {
  contentDiv.innerHTML = `
    <h1>Kipchimtai</h1>
    <p>Welcome to the Kipchimtai Dairy Management System.</p>
  `;
}

// Records page function
function showRecordsPage() {
  // Fetch records from the backend and display them
  fetch('/api/records')
    .then(response => response.json())
    .then(data => {
      let recordsHTML = '<h2>Milk Delivery Records</h2><table><thead><tr><th>Farmer</th><th>Date</th><th>Milk Delivered (kg)</th></tr></thead><tbody>';
      data.forEach(record => {
        recordsHTML += `<tr><td>${record.farmer}</td><td>${record.date}</td><td>${record.milkDelivered}</td></tr>`;
      });
      recordsHTML += '</tbody></table>';
      contentDiv.innerHTML = recordsHTML;
    });
}

// Login page function
function showLoginPage() {
  contentDiv.innerHTML = `
    <h2>Login</h2>
    <form>
      <label for="username">Username:</label>
      <input type="text" id="username" name="username"><br><br>
      <label for="password">Password:</label>
      <input type="password" id="password" name="password"><br><br>
      <button type="submit">Log in</button>
    </form>
    <a href="#">Forgot password?</a>
  `;

  // Add event listener for form submission
  const loginForm = document.querySelector('form');
  loginForm.addEventListener('submit', handleLogin);
}

function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // Send login request to the backend
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  })
  .then(response => response.json())
  .then(data => {
    // Handle successful login
    console.log(data);
  })
  .catch(error => {
    // Handle login error
    console.error('Login failed:', error);
  });
}

// Set up event listeners for navigation links
homeLink.addEventListener('click', showHomePage);
recordsLink.addEventListener('click', showRecordsPage);
loginLink.addEventListener('click', showLoginPage);

// Show the home page initially
showHomePage();