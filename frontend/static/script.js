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
document.addEventListener('DOMContentLoaded', function() {
  const farmerForm = document.getElementById('farmerForm');

  farmerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Gather form data into an object
    const farmerData = {
      id: document.getElementById('farmerId').value, // Could be auto-generated (or blank for backend generation)
      name: document.getElementById('farmerName').value,
      phone: document.getElementById('phoneNumber').value,
      bankAccount: document.getElementById('bankAccount').value
    };

    // Send a POST request to your Flask endpoint
    fetch('/api/register_farmer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(farmerData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert('Error: ' + data.error);
        console.error('Error registering farmer:', data.error);
      } else {
        alert('Farmer registered successfully with ID: ' + data.id);
        // Optionally, clear the form or redirect the user
        farmerForm.reset();
      }
    })
    .catch(error => {
      console.error('Fetch error:', error);
      alert('An error occurred while registering the farmer.');
    });
  });
});

document.addEventListener('DOMContentLoaded', function() {
  // Populate the farmer dropdown on page load
  fetch('/api/farmers')
    .then(response => response.json())
    .then(farmers => {
      const farmerSelect = document.getElementById('farmerSelect');
      farmers.forEach(farmer => {
        // Create an option with the farmer's ID as value and name as text
        const option = document.createElement('option');
        option.value = farmer.id;
        option.textContent = `${farmer.name} (${farmer.id})`;
        farmerSelect.appendChild(option);
      });
    })
    .catch(error => console.error('Error retrieving farmers:', error));

  // Handle milk record submission
  const milkRecordForm = document.getElementById('milkRecordForm');
  milkRecordForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get selected farmer ID from dropdown
    const farmerSelect = document.getElementById('farmerSelect');
    const selectedFarmerId = farmerSelect.value;
    if (!selectedFarmerId) {
      alert('Please select a farmer before submitting the record.');
      return;
    }
    
    // Gather record data from the form
    const recordData = {
      farmerId: selectedFarmerId,
      date: document.getElementById('recordDate').value,
      quantity: document.getElementById('quantity').value
    };
    
    // Send a POST request to submit the milk record
    fetch('/api/submit_record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordData)
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert('Error: ' + data.error);
        console.error('Error submitting record:', data.error);
      } else {
        alert('Milk record saved successfully!');
        milkRecordForm.reset();
      }
    })
    .catch(error => {
      console.error('Error submitting milk record:', error);
      alert('An error occurred while saving the record.');
    });
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const paymentsContainer = document.getElementById('paymentsContainer');
  const monthSelector = document.getElementById('monthSelector');

  // Function to load payments for a given month
  function loadPayments(month) {
    fetch(`/api/payments?month=${month}`)
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          paymentsContainer.innerHTML = `<p>Error: ${data.error}</p>`;
          return;
        }
        let tableHTML = `<table class="payment-table">
          <thead>
            <tr>
              <th>Farmer ID</th>
              <th>Name</th>
              <th>Total Liters</th>
              <th>Rate (KES/L)</th>
              <th>Amount (KES)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>`;
        data.forEach(payment => {
          tableHTML += `<tr>
                          <td>${payment.farmer_id}</td>
                          <td>${payment.name}</td>
                          <td>${payment.total_liters}</td>
                          <td>${payment.rate}</td>
                          <td>${payment.amount}</td>
                          <td>${payment.status}</td>
                        </tr>`;
        });
        tableHTML += `</tbody></table>`;
        paymentsContainer.innerHTML = tableHTML;
      })
      .catch(error => {
        console.error('Error fetching payment data:', error);
        paymentsContainer.innerHTML = `<p>Error loading payments.</p>`;
      });
  }

  // Load payments for the initially selected month
  loadPayments(monthSelector.value);

  // Optional: reload payments when a different month is selected
  monthSelector.addEventListener('change', function() {
    loadPayments(this.value);
  });
});

// Set up event listeners for navigation links
homeLink.addEventListener('click', showHomePage);
recordsLink.addEventListener('click', showRecordsPage);
loginLink.addEventListener('click', showLoginPage);

// Show the home page initially
showHomePage();