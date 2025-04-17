from playwright.sync_api import sync_playwright

def scrape_printers():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://www.cornell.edu/about/maps/directory/?layer=CUPrint")

        # Wait for the dynamic table to load
        page.wait_for_selector("table#directoryTable")

        rows = page.query_selector_all("table#directoryTable > tbody > tr")
        data = []

        for row in rows:
            cols = row.query_selector_all("td")
            if len(cols) < 3:
                continue
            location = cols[0].inner_text().strip()
            description = cols[1].inner_text().strip()
            coordinates = [float(x.strip()) for x in cols[2].inner_text().split(",")]

            data.append({
                "Location": location,
                "Description": description,
                "Coordinates": coordinates
            })

        browser.close()
        return data

if __name__ == "__main__":
    scrape_printers()