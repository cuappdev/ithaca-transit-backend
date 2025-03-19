import requests
import pprint

# URL of the Ithaca restaurant directory API
URL = "https://www.visitithaca.com/includes/rest_v2/plugins_listings_listings/find/?json=%7B%22filter%22%3A%7B%22%24and%22%3A%5B%7B%22filter_tags%22%3A%7B%22%24in%22%3A%5B%22site_primary_subcatid_307%22%2C%22site_primary_subcatid_308%22%2C%22site_primary_subcatid_309%22%2C%22site_primary_subcatid_311%22%2C%22site_primary_subcatid_312%22%2C%22site_primary_subcatid_504%22%2C%22site_primary_subcatid_505%22%2C%22site_primary_subcatid_506%22%2C%22site_primary_subcatid_508%22%2C%22site_primary_subcatid_509%22%2C%22site_primary_subcatid_510%22%2C%22site_primary_subcatid_511%22%2C%22site_primary_subcatid_512%22%2C%22site_primary_subcatid_513%22%2C%22site_primary_subcatid_514%22%2C%22site_primary_subcatid_516%22%2C%22site_primary_subcatid_520%22%2C%22site_primary_subcatid_532%22%2C%22site_primary_subcatid_536%22%5D%7D%7D%2C%7B%22regionid%22%3A%7B%22%24in%22%3A%5B8%5D%7D%7D%5D%7D%2C%22options%22%3A%7B%22limit%22%3A100%2C%22skip%22%3A0%2C%22count%22%3Atrue%2C%22castDocs%22%3Afalse%2C%22fields%22%3A%7B%22recid%22%3A1%2C%22title%22%3A1%2C%22primary_category%22%3A1%2C%22address1%22%3A1%2C%22city%22%3A1%2C%22url%22%3A1%2C%22isDTN%22%3A1%2C%22latitude%22%3A1%2C%22longitude%22%3A1%2C%22primary_image_url%22%3A1%2C%22qualityScore%22%3A1%2C%22rankOrder%22%3A1%2C%22weburl%22%3A1%2C%22dtn.rank%22%3A1%2C%22yelp.rating%22%3A1%2C%22yelp.url%22%3A1%2C%22yelp.review_count%22%3A1%2C%22yelp.price%22%3A1%2C%22booking_price_avg%22%3A1%2C%22booking_price_total%22%3A1%2C%22booking_full%22%3A1%7D%2C%22hooks%22%3A%5B%5D%2C%22sort%22%3A%7B%22rankorder%22%3A1%2C%22sortcompany%22%3A1%7D%7D%7D&token=6520d36b63a2aa0c7d91ebb18aa5d2c6"

def scrape_restaurants():
    # Send a GET request to fetch the API data
    response = requests.get(URL)
    print(response.status_code)
    print(response.text)
    restaurants_data = response.json().get("docs").get("docs")
    pprint.pprint(restaurants_data, compact=True)

    # Extract data
    data = []
    for item in restaurants_data:
        name = item.get("title")
        category = item.get("primary_category").get("subcatname")
        address = item.get("address1")
        coordinates = []
        coordinates.append(item.get("latitude"))
        coordinates.append(item.get("longitude"))
        image_url = item.get("primary_image_url")
        web_url = item.get("weburl")

        data.append({
            "Name": name,
            "Category": category,
            "Address": address,
            "Coordinates": coordinates,
            "Image URL": image_url,
            "Web URL": web_url,
        })
    
    print(data)
    return data

if __name__ == "__main__":
    scrape_restaurants()