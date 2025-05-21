import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from geopy.distance import geodesic
from datetime import datetime
import csv

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
app.config["GOOGLE_MAPS_API_KEY"] = os.environ.get("GOOGLE_MAPS_API_KEY")

# Set up PostgreSQL database URI
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
    'DATABASE_URI', 
    'postgresql://postgres:postgres@localhost:5432/coworking_db?connect_timeout=10&sslmode=prefer'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define the model for coworking spaces
class CoworkingSpace(db.Model):
    __tablename__ = 'coworking_spaces' 
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    opening_time = db.Column(db.Time, nullable=False)
    closing_time = db.Column(db.Time, nullable=False)
    price = db.Column(db.Float, nullable=False)
    food_availability = db.Column(db.Boolean, nullable=False)  # Updated to Boolean type
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    address = db.Column(db.String(200), nullable=False)

    def __repr__(self):
        return f'<CoworkingSpace {self.name}>'

@app.route('/')
def index():
    return render_template('index.html', google_key=app.config["GOOGLE_MAPS_API_KEY"])

@app.route('/coworking_space/<int:space_id>')
def coworking_space_detail(space_id):
    space = CoworkingSpace.query.get_or_404(space_id)
    return render_template('coworking_space.html', space=space, google_key=app.config["GOOGLE_MAPS_API_KEY"])

@app.route('/api/coworking_spaces', methods=['GET'])
def get_coworking_spaces():
    print("Fetching coworking spaces from the database...")
    spaces = CoworkingSpace.query.all()
    print(f"Number of spaces retrieved: {len(spaces)}")
    coworking_spaces = []
    for space in spaces:
        print(f"Processing space: {space.name}")
        coworking_spaces.append({
            'id': space.id,
            'name': space.name,
            'price': space.price,
            'opening_time': space.opening_time.strftime('%H:%M:%S'),
            'closing_time': space.closing_time.strftime('%H:%M:%S'),
            'food_availability': space.food_availability,
            'latitude': float(space.latitude),
            'longitude': float(space.longitude),
            'address': space.address
        })
    print("Returning JSON response...")
    return jsonify(coworking_spaces)

@app.route('/api/search', methods=['GET'])
def search_coworking_spaces():
    query = request.args.get('query')
    results = CoworkingSpace.query.filter(CoworkingSpace.name.ilike(f'%{query}%')).all()
    coworking_spaces = []
    for space in results:
        coworking_spaces.append({
            'id': space.id,
            'name': space.name,
            'price': space.price,
            'opening_time': space.opening_time.strftime('%H:%M:%S'),
            'closing_time': space.closing_time.strftime('%H:%M:%S'),
            'food_availability': space.food_availability,
            'latitude': float(space.latitude),
            'longitude': float(space.longitude),
            'address': space.address
        })
    return jsonify(coworking_spaces)


@app.route('/api/nearest_spaces', methods=['GET'])
def nearest_coworking_spaces():
    user_lat = float(request.args.get('latitude'))
    user_lon = float(request.args.get('longitude'))
    spaces = CoworkingSpace.query.all()
    nearest_spaces = []
    for space in spaces:
        space_location = (space.latitude, space.longitude)
        user_location = (user_lat, user_lon)
        distance = geodesic(user_location, space_location).kilometers
        nearest_spaces.append({
            'id': space.id,
            'name': space.name,
            'price': space.price,
            'opening_time': space.opening_time.strftime('%H:%M:%S'),
            'closing_time': space.closing_time.strftime('%H:%M:%S'),
            'food_availability': space.food_availability,
            'latitude': float(space.latitude),
            'longitude': float(space.longitude),
            'address': space.address,
            'distance': distance
        })
    nearest_spaces.sort(key=lambda x: x['distance'])
    return jsonify(nearest_spaces)


if __name__ == '__main__':
    # Create the database tables if they do not exist
    with app.app_context():
        db.create_all()

    app.run(debug=True)
