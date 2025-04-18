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

document.addEventListener('DOMContentLoaded', function() {
  fetch('/api/reports')
      .then(response => response.json())
      .then(data => {
          renderFarmersChart(data.farmers);
          renderDailyChart(data.daily);
          renderWeeklyChart(data.weekly);
      })
      .catch(error => console.error('Error loading report data:', error));
});

// 🌟 Chart 1: Total Milk Delivered by Each Farmer (Bar Chart)
function renderFarmersChart(farmersData) {
  const ctx = document.getElementById('farmersChart').getContext('2d');
  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: farmersData.map(f => f.farmer),
          datasets: [{
              label: 'Total Milk Delivered (Liters)',
              data: farmersData.map(f => f.total_milk),
              backgroundColor: 'rgba(75, 192, 192, 0.7)', // Teal bars
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 2,
              borderRadius: 8, // Rounded corners
              hoverBackgroundColor: 'rgba(75, 192, 192, 0.9)'
          }]
      },
      options: {
          responsive: true,
          plugins: {
              legend: { display: true },
              tooltip: { enabled: true }
          },
          scales: {
              y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(200, 200, 200, 0.3)' }
              },
              x: {
                  grid: { display: false }
              }
          }
      }
  });
}

// 🌟 Chart 2: Daily Milk Deliveries (Smooth Line Chart with Gradient)
function renderDailyChart(dailyData) {
  const ctx = document.getElementById('dailyChart').getContext('2d');

  // Create gradient background
  let gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(255, 99, 132, 0.5)'); // Red top
  gradient.addColorStop(1, 'rgba(255, 99, 132, 0.1)'); // Transparent bottom

  new Chart(ctx, {
      type: 'line',
      data: {
          labels: dailyData.map(d => d.date),
          datasets: [{
              label: 'Milk Delivered (Liters)',
              data: dailyData.map(d => d.total_milk),
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: gradient,
              fill: true, // Gradient fill
              borderWidth: 3,
              pointRadius: 5,
              pointBackgroundColor: 'rgba(255, 99, 132, 1)',
              tension: 0.3 // Smooth curve
          }]
      },
      options: {
          responsive: true,
          plugins: {
              legend: { display: true },
              tooltip: { enabled: true }
          },
          scales: {
              y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(200, 200, 200, 0.3)' }
              },
              x: {
                  grid: { display: false }
              }
          }
      }
  });
}

// 🌟 Chart 3: Weekly Milk Deliveries (Colorful Bar Chart)
function renderWeeklyChart(weeklyData) {
  const ctx = document.getElementById('weeklyChart').getContext('2d');

  // Generate a different color for each bar
  const barColors = weeklyData.map(() => `rgba(${Math.random()*255}, ${Math.random()*255}, ${Math.random()*255}, 0.7)`);

  new Chart(ctx, {
      type: 'bar',
      data: {
          labels: weeklyData.map(w => `Week ${w.week}, ${w.year}`),
          datasets: [{
              label: 'Milk Delivered (Liters)',
              data: weeklyData.map(w => w.total_milk),
              backgroundColor: barColors,
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 2,
              borderRadius: 8,
              hoverBackgroundColor: 'rgba(54, 162, 235, 0.9)'
          }]
      },
      options: {
          responsive: true,
          plugins: {
              legend: { display: true },
              tooltip: { enabled: true }
          },
          scales: {
              y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(200, 200, 200, 0.3)' }
              },
              x: {
                  grid: { display: false }
              }
          }
      }
  });
}

document.addEventListener("DOMContentLoaded", function () {
    fetchDataAndRenderCharts();
});

async function fetchDataAndRenderCharts() {
    const response = await fetch('/api/reports'); // Adjust API endpoint accordingly
    const data = await response.json();

    renderChart("farmersChart", "Total Milk by Farmers", data.farmers, "rgb(54, 162, 235)");
    renderChart("dailyChart", "Daily Milk Deliveries", data.daily, "rgb(255, 99, 132)");
    renderChart("weeklyChart", "Weekly Milk Deliveries", data.weekly, "rgb(75, 192, 192)");
}

function renderChart(canvasId, label, chartData, color) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: chartData.labels,
            datasets: [{
                label: label,
                data: chartData.values,
                backgroundColor: color,
                borderColor: color.replace("rgb", "rgba").replace(")", ", 0.8)"),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: true }
            }
        }
    });
}

// Function to download data as CSV
function downloadCSV() {
    fetch('/api/reports') // Adjust API endpoint
        .then(response => response.json())
        .then(data => {
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Category,Value\n";

            ["farmers", "daily", "weekly"].forEach(category => {
                data[category].labels.forEach((label, i) => {
                    csvContent += `${label},${data[category].values[i]}\n`;
                });
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "milk_reports.csv");
            document.body.appendChild(link);
            link.click();
        });
}

// Function to download reports as a PDF
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Milk Delivery Reports", 10, 10);

    fetch('/api/reports')
        .then(response => response.json())
        .then(data => {
            let y = 20;
            ["farmers", "daily", "weekly"].forEach(category => {
                doc.setFontSize(14);
                doc.text(category.toUpperCase(), 10, y);
                y += 6;

                data[category].labels.forEach((label, i) => {
                    doc.setFontSize(10);
                    doc.text(`${label}: ${data[category].values[i]}`, 10, y);
                    y += 5;
                });

                y += 6;
            });

            doc.save("milk_reports.pdf");
        });
}

document.addEventListener("DOMContentLoaded", function () {
  fetchDataAndRenderCharts();
});

async function fetchDataAndRenderCharts() {
  const response = await fetch('/api/reports'); // Adjust API endpoint accordingly
  const data = await response.json();

  renderChart("farmersChart", "Total Milk by Farmers", data.farmers, "rgb(54, 162, 235)");
  renderChart("dailyChart", "Daily Milk Deliveries", data.daily, "rgb(255, 99, 132)");
  renderChart("weeklyChart", "Weekly Milk Deliveries", data.weekly, "rgb(75, 192, 192)");
}

function renderChart(canvasId, label, chartData, color) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  new Chart(ctx, {
      type: "bar",
      data: {
          labels: chartData.labels,
          datasets: [{
              label: label,
              data: chartData.values,
              backgroundColor: color,
              borderColor: color.replace("rgb", "rgba").replace(")", ", 0.8)"),
              borderWidth: 1
          }]
      },
      options: {
          responsive: true,
          plugins: {
              legend: { display: false },
              tooltip: { enabled: true }
          }
      }
  });
}

// Attach functions to the global window object
window.downloadCSV = generateCSV;
window.downloadPDF = generatePDF;

// Function to download data as CSV
function downloadCSV() {
  fetch('/api/reports') // Adjust API endpoint
      .then(response => response.json())
      .then(data => {
          let csvContent = "data:text/csv;charset=utf-8,";
          csvContent += "Category,Value\n";

          ["farmers", "daily", "weekly"].forEach(category => {
              data[category].labels.forEach((label, i) => {
                  csvContent += `${label},${data[category].values[i]}\n`;
              });
          });

          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", "milk_reports.csv");
          document.body.appendChild(link);
          link.click();
      });
}

// Function to download reports as a PDF
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Milk Delivery Reports", 10, 10);

  fetch('/api/reports')
      .then(response => response.json())
      .then(data => {
          let y = 20;
          ["farmers", "daily", "weekly"].forEach(category => {
              doc.setFontSize(14);
              doc.text(category.toUpperCase(), 10, y);
              y += 6;

              data[category].labels.forEach((label, i) => {
                  doc.setFontSize(10);
                  doc.text(`${label}: ${data[category].values[i]}`, 10, y);
                  y += 5;
              });

              y += 6;
          });

          doc.save("milk_reports.pdf");
      });

      function generateCSV(data) {
        console.log("Generating CSV...");
    
        let csvContent = "data:text/csv;charset=utf-8,";
    
        // Farmers Data
        csvContent += "Farmer,Total Milk Delivered (Liters)\n";
        csvContent += data.farmers.map(f => `${f.farmer},${f.total_milk}`).join("\n") + "\n\n";
    
        // Daily Milk Data
        csvContent += "Date,Total Milk Delivered (Liters)\n";
        csvContent += data.daily.map(d => `${d.record_date},${d.total_milk}`).join("\n") + "\n\n";
    
        // Weekly Milk Data
        csvContent += "Week,Total Milk Delivered (Liters)\n";
        csvContent += data.weekly.map(w => `${w.week},${w.total_milk}`).join("\n");
    
        console.log("CSV Content:", csvContent); // Debugging step
    
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "milk_reports.csv");
    
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    function generatePDF(data) {
      console.log("Generating PDF...");
  
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Kipchimtai Milk Reports", 20, 20);
  
      let y = 30;
  
      function addSection(title, dataset) {
          doc.setFontSize(14);
          doc.text(title, 20, y);
          y += 10;
          doc.setFontSize(12);
          dataset.forEach(row => {
              doc.text(row, 20, y);
              y += 8;
          });
          y += 10;
      }
  
      addSection("Total Milk Delivered by Each Farmer", data.farmers.map(f => `${f.farmer}: ${f.total_milk} Liters`));
      addSection("Daily Milk Deliveries", data.daily.map(d => `${d.record_date}: ${d.total_milk} Liters`));
      addSection("Weekly Milk Deliveries", data.weekly.map(w => `Week ${w.week}: ${w.total_milk} Liters`));
  
      console.log("Saving PDF...");
      doc.save("milk_reports.pdf");
  }
      
}

function downloadCSV() {
  window.location.href = '/download/csv';
}

function downloadPDF() {
  window.location.href = '/download/pdf';
}

function renderPaymentsChart(data) {
  const labels = data.map(entry => entry.farmer);
  const payments = data.map(entry => entry.payment);

  new Chart(document.getElementById('paymentsChart'), {
      type: 'bar',
      data: {
          labels: labels,
          datasets: [{
              label: 'Monthly Payment (KES)',
              data: payments,
              backgroundColor: '#008080'
          }]
      },
      options: {
          responsive: true,
          plugins: {
              title: {
                  display: true,
                  text: 'Payments to Farmers'
              }
          }
      }
  });
}



// Set up event listeners for navigation links
homeLink.addEventListener('click', showHomePage);
recordsLink.addEventListener('click', showRecordsPage);
loginLink.addEventListener('click', showLoginPage);

// Show the home page initially
showHomePage();