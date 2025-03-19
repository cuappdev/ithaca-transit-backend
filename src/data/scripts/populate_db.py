import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from data.scrapers.libraries import scrape_libraries
from data.scrapers.printers import scrape_printers
from data.scrapers.restaurants import scrape_restaurants
from data.db.database import insert_library, insert_printer, insert_restaurant
from data.db.models import create_tables

def populate_db():
    """Runs scrapers and stores results in SQLite."""
    create_tables()

    # Insert libraries
    libraries = scrape_libraries()
    for lib in libraries:
        insert_library(lib['Location'], lib['Address'], lib['Coordinates'][0], lib['Coordinates'][1])

    # Insert printers
    printers = scrape_printers()
    for printer in printers:
        insert_printer(printer['Location'], printer['Description'], printer['Coordinates'][0], printer['Coordinates'][1])
    
    # Insert restaurants
    restaurants = scrape_restaurants()
    for restaurant in restaurants:
        insert_restaurant(restaurant['Name'], restaurant['Category'], restaurant['Address'], restaurant['Coordinates'][0], printer['Coordinates'][1], restaurant['Image URL'], restaurant['Web URL'])

if __name__ == "__main__":
    populate_db()