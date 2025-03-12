import requests
from bs4 import BeautifulSoup

# URL of the CU Print directory page
URL = "https://www.cornell.edu/about/maps/directory/?notes=Library&caption=%20Libraries" 

def scrape_libraries():
    # Send a GET request to fetch the HTML content
    response = requests.get(URL)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Locate the table
    table = soup.find("table", {"id": "directoryTable"})
    rows = table.find("tbody").find_all("tr")

    # Extract data
    data = []
    for row in rows:
        cols = row.find_all("td")
        if len(cols) < 3:
            continue
        
        location_name = cols[0].text.strip().split('\n\n\n')[0]
        address = cols[1].text.strip()
        coordinates_string = cols[2].text.strip()
        coordinates = [float(x) for x in coordinates_string.split(', ')]

        data.append({
            "Location": location_name,
            "Address": address,
            "Coordinates": coordinates
        })
        
    return data 