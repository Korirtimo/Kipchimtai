from io import BytesIO
import random
from flask import Flask, Response, request, jsonify, session, render_template, redirect, url_for
import mysql.connector
import bcrypt
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = 'your_secret_key'  # Replace with a strong secret key

def get_db_connection():
    connection = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'tim'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'kipchimtai')
    )
    return connection

# Serve the login page
@app.route('/')
def index():
    return render_template('index.html')

# Example login API endpoint
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = "SELECT * FROM users WHERE username = %s"
    cursor.execute(query, (username,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password'].encode('utf-8')):
        session['user_id'] = user['id']
        return jsonify({"message": "Login successful"})
    else:
        return jsonify({"error": "Invalid username or password"}), 401

# Endpoint to register a new farmer
@app.route('/api/register_farmer', methods=['POST'])
def register_farmer():
    data = request.get_json()
    # Optionally generate the farmer ID on the backend if not provided
    farmer_id = data.get('id')
    if not farmer_id:
        farmer_id = "F" + str(random.randint(100000, 999999))
    
    name = data.get('name')
    phone = data.get('phone')
    bank_account = data.get('bankAccount')
    
    # Debug: Print the received data
    print(f"Registering Farmer: {farmer_id}, {name}, {phone}, {bank_account}")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "INSERT INTO farmers (id, name, phone, bank_account) VALUES (%s, %s, %s, %s)"
    try:
        cursor.execute(query, (farmer_id, name, phone, bank_account))
        conn.commit()
        result = {"message": "Farmer registered successfully", "id": farmer_id}
    except mysql.connector.Error as err:
        print("MySQL Error:", err)
        result = {"error": str(err)}
    finally:
        cursor.close()
        conn.close()
    
    return jsonify(result)

# Endpoint to submit a milk record
@app.route('/api/submit_record', methods=['POST'])
def submit_record():
    data = request.get_json()
    farmer_id = data.get('farmerId')
    record_date = data.get('date')
    quantity = data.get('quantity')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "INSERT INTO milk_records (farmer_id, record_date, quantity) VALUES (%s, %s, %s)"
    try:
        cursor.execute(query, (farmer_id, record_date, quantity))
        conn.commit()
        result = {"message": "Record saved successfully"}
    except mysql.connector.Error as err:
        result = {"error": str(err)}
    cursor.close()
    conn.close()
    return jsonify(result)

# Endpoint to get payment details
@app.route('/api/payments', methods=['GET'])
def get_payments():
    # Expect month in 'YYYY-MM' format, e.g., '2025-03'
    month = request.args.get('month')
    if not month:
         return jsonify({"error": "Month parameter is required, e.g., '2025-03'"}), 400
         
    # Define the rate per liter
    rate = 50  # KES per liter
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # Using LEFT JOIN so that farmers with no milk records still appear
    query = r"""
    SELECT
     f.id AS farmer_id,
    f.name,
    IFNULL(SUM(r.quantity), 0) AS total_liters,
    %s AS rate,
    IFNULL(SUM(r.quantity), 0) * %s AS amount,
    CASE
        WHEN IFNULL(SUM(r.quantity), 0) * %s > 0 THEN 'Pending'
        ELSE 'Paid'
    END AS status
 FROM farmers f
 LEFT JOIN milk_records r 
    ON f.id = r.farmer_id 
    AND DATE_FORMAT(r.record_date, '%Y-%m') = %s
 GROUP BY f.id, f.name
 """

    cursor.execute(query, (rate, rate, rate, month))
    payments = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(payments)



# Endpoint to retrieve milk records (for the records page)
@app.route('/api/records', methods=['GET'])
def records():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = "SELECT * FROM milk_records"
    cursor.execute(query)
    records = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(records)

# Endpoint to retrieve farmer details (for the farmer registration page)
@app.route('/api/farmers', methods=['GET'])
def get_farmers():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = "SELECT * FROM farmers"
    cursor.execute(query)
    farmers = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(farmers)

@app.route('/api/reports', methods=['GET'])
def get_reports():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Get milk delivered per farmer
    query_farmers = """
    SELECT f.name AS farmer, SUM(m.quantity) AS total_milk 
    FROM farmers f
    LEFT JOIN milk_records m ON f.id = m.farmer_id
    GROUP BY f.name
    ORDER BY total_milk DESC
    """
    cursor.execute(query_farmers)
    farmers_data = cursor.fetchall()

    # Get daily milk delivered
    query_daily = """
    SELECT DATE(record_date) AS date, SUM(quantity) AS total_milk
    FROM milk_records
    GROUP BY DATE(record_date)
    ORDER BY date
    """
    cursor.execute(query_daily)
    daily_data = cursor.fetchall()

    # Get weekly milk delivered
    query_weekly = """
    SELECT YEAR(record_date) AS year, WEEK(record_date) AS week, SUM(quantity) AS total_milk
    FROM milk_records
    GROUP BY year, week
    ORDER BY year DESC, week DESC
    """
    cursor.execute(query_weekly)
    weekly_data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify({
        "farmers": farmers_data,
        "daily": daily_data,
        "weekly": weekly_data
    })

@app.route('/api/reports')
def get_report_data():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT f.name, SUM(r.quantity) AS total FROM milk_records r JOIN farmers f ON r.farmer_id = f.id GROUP BY f.name")
    farmers_data = cursor.fetchall()

    cursor.execute("SELECT DATE(record_date) AS date, SUM(quantity) AS total FROM milk_records GROUP BY DATE(record_date)")
    daily_data = cursor.fetchall()

    cursor.execute("SELECT YEAR(record_date) AS year, WEEK(record_date) AS week, SUM(quantity) AS total FROM milk_records GROUP BY year, week")
    weekly_data = [{"week": f"{row['year']}-W{row['week']}", "total": row['total']} for row in cursor.fetchall()]

    cursor.close()
    conn.close()

    return jsonify({
        "farmers": farmers_data,
        "daily": daily_data,
        "weekly": weekly_data
    })


@app.route('/download/csv')
def download_csv():
    # Generate CSV file
    from io import StringIO
    import csv

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT f.name, r.record_date, r.quantity, (r.quantity * 50) AS payment FROM milk_records r JOIN farmers f ON r.farmer_id = f.id")
    records = cursor.fetchall()

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(['Farmer Name', 'Date', 'Milk Quantity (Liters)'])
    writer.writerows(records)

    output.seek(0)
    return Response(output, mimetype='text/csv', headers={"Content-Disposition": "attachment; filename=milk_report.csv"})


@app.route('/download/pdf')
def download_pdf():
    from fpdf import FPDF

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT f.name, r.record_date, r.quantity FROM milk_records r JOIN farmers f ON r.farmer_id = f.id")
    records = cursor.fetchall()

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    pdf.cell(200, 10, "Milk Delivery Report", ln=True, align="C")

    pdf.set_font("Arial", size=10)
    for name, date, qty in records:
        pdf.cell(200, 8, f"{name} - {date} - {qty} Liters", ln=True)

    pdf_output = BytesIO()
    pdf.output(pdf_output)
    pdf_output.seek(0)

    return Response(pdf_output, mimetype='application/pdf', headers={"Content-Disposition": "attachment; filename=milk_report.pdf"})



### Serve Static HTML Pages Using Flask's render_template (Optional)


@app.route('/dashboard.html')
def dashboard():
    # You can check for a valid session here before rendering
    return render_template('dashboard.html')

@app.route('/Farmer.html')
def farmer_registration():
    return render_template('Farmer.html')

@app.route('/Record.html')
def milk_record():
    return render_template('Record.html')

@app.route('/Payments.html')
def payments_page():
    return render_template('Payments.html')

@app.route('/Reports.html')
def reports_page():
    return render_template('Reports.html')

# Optionally, use additional endpoints for serving dynamic dashboard or report data

if __name__ == '__main__':
    app.run(debug=True)
