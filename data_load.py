import csv
from app import app, db, CoworkingSpace
from datetime import datetime

def load_csv_to_db():
    with app.app_context():
        # Drop all existing tables before creating them
        db.drop_all()  # Drops all the tables if they already exist
        db.create_all()  # Creates the tables based on the current model schema

        with open('coworking_spaces.csv', newline='', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Convert food_availability to Boolean
                food_availability = True if row['Food Availability'].strip().lower() == 'yes' else False
                opening_time = datetime.strptime(row['Opening Time'], '%H:%M:%S').time()
                closing_time = datetime.strptime(row['Closing Time'], '%H:%M:%S').time()
                latitude = float(row['Latitude'].strip())
                longitude = float(row['Longitude'].strip())
                
                coworking_space = CoworkingSpace(
                    name=row['Name'],
                    opening_time=opening_time,  # Keep as time object
                    closing_time=closing_time,  # Keep as time object
                    price=float(row['Price']),
                    food_availability=food_availability,  # Use the Boolean value here
                    latitude=latitude,
                    longitude=longitude,
                    address=row['Address']
                )
                db.session.add(coworking_space)
            db.session.commit()
        print('Data loaded successfully!')

if __name__ == '__main__':
    load_csv_to_db()
