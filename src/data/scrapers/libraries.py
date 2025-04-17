from playwright.sync_api import sync_playwright
from bs4 import BeautifulSoup

URL = "https://www.cornell.edu/about/maps/directory/?layer=Library&sublayer="

def scrape_libraries():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(URL, wait_until="networkidle")

        # Get the rendered HTML after JS loads
        content = page.content()
        browser.close()

    soup = BeautifulSoup(content, 'html.parser')
    table = soup.find("table", {"id": "directoryTable"})
    if not table:
        print("Could not find the table.")
        return []

    rows = table.find("tbody").find_all("tr")
    data = []
    for row in rows:
        cols = row.find_all("td")
        if len(cols) < 3:
            continue

        location_name = cols[0].text.strip()
        address = cols[1].text.strip()
        coordinates_string = cols[2].text.strip()
        coordinates = [float(x) for x in coordinates_string.split(', ')]

        data.append({
            "Location": location_name,
            "Address": address,
            "Coordinates": coordinates
        })

    return data

if __name__ == "__main__":
    scrape_libraries()