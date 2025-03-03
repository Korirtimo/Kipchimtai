from flask import Flask, request, jsonify, session, render_template, redirect, url_for
import mysql.connector
import bcrypt
import os

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = 'your_secret_key'  # Replace with a strong secret key

def get_db_connection():
    connection = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'tim'),
        password=os.getenv('DB_PASSWORD', 'Tim@5150'),
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
    farmer_id = data.get('id')
    name = data.get('name')
    phone = data.get('phone')
    bank_account = data.get('bankAccount')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "INSERT INTO farmers (id, name, phone, bank_account) VALUES (%s, %s, %s, %s)"
    try:
        cursor.execute(query, (farmer_id, name, phone, bank_account))
        conn.commit()
        result = {"message": "Farmer registered successfully"}
    except mysql.connector.Error as err:
        result = {"error": str(err)}
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
def payments():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    query = "SELECT * FROM payments"
    cursor.execute(query)
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
