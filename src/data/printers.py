import requests
from bs4 import BeautifulSoup

# URL of the CU Print directory page
URL = "https://www.cornell.edu/about/maps/directory/?layer=CUPrint&caption=%20CU%20Print%20Printers"  # Replace with the actual URL

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
    if len(cols) < 3:  # Ensure row has enough columns
        continue
    
    location = cols[0].text.strip()
    description = cols[1].text.strip()
    
    # Extract coordinates from the hyperlink <a> tag inside <td>
    coordinates_link = cols[2].find("a")
    coordinates_string = coordinates_link.text.strip() if coordinates_link else ""
    coordinates = [float(x) for x in coordinates_string.split(', ')]


    data.append({
        "Location": location,
        "Description": description,
        "Coordinates": coordinates
    })

# Print results
for item in data:
    print(item)