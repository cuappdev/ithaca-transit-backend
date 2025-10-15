import requests
from bs4 import BeautifulSoup
from difflib import get_close_matches # For data scraping
from difflib import SequenceMatcher
import re # For using regex
import unicodedata # Handles text encoding at Unicode level

# URL of the CU Print directory page
# URL = "https://www.cornell.edu/about/maps/directory/?layer=CUPrint&caption=%20CU%20Print%20Printers"  # Replace with the actual URL

URL = 'https://www.cornell.edu/about/maps/directory/text-data.cfm?layer=CUPrint&caption=%20CU%20Print%20Printers'

# HTTP headers to mimic a real browser request
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    "Referer": 'https://www.cornell.edu/about/maps/directory/',
    "X-Requested-With": 'XMLHttpRequest',
    "Accept": 'application/json, text/javascript, */*',
}

# Canonical list of Cornell buildings
# NOTE: This list is not exhaustive. Add more buildings as needed...
CANONICAL_BUILDINGS = [
    "Akwe:kon",
    "Alice Cook House",
    "Baker Lab",
    "Barton Hall",
    "Becker House",
    "Breazzano Center",
    "Catherwood Library",
    "Clark Hall",
    "College of Veterinary Medicine",
    "Court-Kay-Bauer Hall",
    "Dickson",
    "Ecology House",
    "Flora Rose House",
    "Ganedago",
    "Hans Bethe House",
    "Hollister Hall",
    "Ives Hall",
    "John Henrik Clarke Africana Library",
    "Keeton House",
    "Kroch Library",
    "Latino Living Center",
    "Law Library",
    "Lincoln Hall",
    "Mann Library",
    "Martha Van Rensselaer Hall",
    "Mary Donlon Hall",
    "Math Library",
    "Mews Hall",
    "Milstein Hall",
    "Morrison Hall",
    "Myron Taylor",
    "Olin Library",
    "Phillips Hall",
    "Plant Science",
    "RPCC",
    "Rand Hall",
    "Rhodes Hall",
    "Risley Hall",
    "Rockefeller Lab",
    "Ruth Bader Ginsburg Hall",
    "Sage Hall",
    "Schwartz Center",
    "Sibley Hall",
    "Statler Hall",
    "Stimson",
    "Tjaden Hall",
    "Toni Morrison",
    "Ujamaa",
    "Upson Hall",
    "Uris Library",
    "Vet Library",
    "Warren Hall",
    "White Hall",
    "Willard Student Center"
]

# Regex helpers
HTML_TAG_RE = re.compile(r"<[^>]+>")
BRACKET_CONTENT_RE = re.compile(r"[\(\[\{].*?[\)\]\}]")
MULTI_SPACE_RE = re.compile(r"\s+")
TRAILING_CAPS_RE = re.compile(r"\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\s*$")

# Used for stripping common label phrases from building names
LABEL_PHRASES_RE = re.compile(
    r"""
    \bresidents?\s*only\b |
    \bstudents?\s*only\b  |
    \baa\s*&\s*p\b        |
    \baap\b
    """, re.IGNORECASE | re.VERBOSE
)

# Used to identify common variants of labels
LABEL_PATTERNS = {
    # --- Access restrictions ---
    # Residents Only (singular/plural + optional hyphen + any case)
    "Residents Only": re.compile(r"\bresident[s]?[-\s]*only\b", re.IGNORECASE),

    # AA&P Students Only (accept AA&P or AAP; allow any junk in-between; optional hyphen)
    "AA&P Students Only": re.compile(
        r"\b(?:aa\s*&\s*p|aap)\b.*\bstudent[s]?[-\s]*only\b",
        re.IGNORECASE
    ),

    # Landscape Architecture Students Only (allow arbitrary whitespace; optional hyphen)
    "Landscape Architecture Students Only": re.compile(
        r"\blandscape\s+architecture\b.*\bstudent[s]?[-\s]*only\b",
        re.IGNORECASE
    ),

    # --- Printer capabilities ---
    "Color": re.compile(r"\bcolor\b", re.IGNORECASE),
    "Black & White": re.compile(
        r"\b(?:black\s*(?:and|&)\s*white|b\s*&\s*w)\b", re.IGNORECASE
    ),
    "Color, Scan, & Copy": re.compile(
        r"\bcolor[,/ &]*(scan|copy|print|copying)+\b", re.IGNORECASE
    ),
}

# Used for stripping residual trailing labels from descriptions
RESIDUAL_TRAILING_LABEL_RE = re.compile(
    r"\b(?:resident|residents|student|students|staff|public)\b\s*$",
    re.IGNORECASE
)

def _norm(s):
    """
    Unicode/HTML/whitespace normalization.
    """
    if s is None:
        return ""
    s = unicodedata.normalize('NFKC', s) # Normalizes unicode text
    s = HTML_TAG_RE.sub(" ", s)
    s = s.replace("*", " ")
    s = BRACKET_CONTENT_RE.sub(" ", s)
    s = MULTI_SPACE_RE.sub(" ", s).strip()
    return s

def _strip_trailing_allcaps(s):
    """
    Remove trailing ALL-CAPS qualifiers (e.g., RESIDENTS ONLY).
    """
    return TRAILING_CAPS_RE.sub("", s).strip()

def _pre_clean_for_match(s: str) -> str:
    """
    Pre-clean a building name for matching against the canonical list.
    """
    s = _norm(s)
    s = LABEL_PHRASES_RE.sub(" ", s)   # <— removes "Resident(s) only", "AA&P", etc.
    s = _strip_trailing_allcaps(s)
    s = RESIDUAL_TRAILING_LABEL_RE.sub(" ", s) # <— removes "Resident", "Students", etc.
    
    s = re.sub(r"[^\w\s\-’']", " ", s) # punctuation noise
    s = re.sub(r"\s+", " ", s).strip()
    return s

def _token_sort(s):
    """
    Tokenize a string, sort the tokens, and re-join them.
    """
    tokens = s.lower().split()
    tokens.sort()
    return " ".join(tokens)

def map_building(name, threshold=87):
    """
    Map a building name to a canonical building name using fuzzy matching.
    """
    if not name:
        return None, 0
    
    query = _token_sort(_pre_clean_for_match(name))
    canon_token_list = [_token_sort(_pre_clean_for_match(c)) for c in CANONICAL_BUILDINGS]

    # Returns a list of the (top-1) closest match to the cleaned name
    best = get_close_matches(query, canon_token_list, n=1) 

    # If no matches (empty list), return the original name and 0
    if not best:
        return name, 0

    # Return the closest match and its similarity score
    match = best[0]

    # Calculate the similarity score of the match to the original name (for internal use, potential debugging purposes)
    index = canon_token_list.index(match)
    canon_raw = CANONICAL_BUILDINGS[index]
    score = int(SequenceMatcher(None, query, match).ratio() * 100)

    # If the score is below the threshold, return the original name instead of the canonical name
    return (canon_raw, score) if score >= threshold else (name, score)

def map_labels(text):
    """
    Extract label tokens from the description.
    """
    if not text:
        return text, []
    
    cleaned = _norm(text)
    found_labels = []

    for canon, pattern in LABEL_PATTERNS.items():
        # Search for the pattern in the cleaned text
        if pattern.search(cleaned):
            found_labels.append(canon)

            # Remove the found label from the text to avoid duplicates
            cleaned = pattern.sub("", cleaned).strip()
    
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned, sorted(set(found_labels))

def fetch_printers_json():
    """
    Fetch printer data in JSON format from the CU Print directory endpoint.
    """
    resp = requests.get(URL, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    return resp.json()

def scrape_printers():
    """
    Scrape CU Print printer locations from the Cornell directory page.
    """
    payload = fetch_printers_json()
    data = []

    # payload['rows'] is a list of lists, where each inner list represents a row of data
    for row in payload['rows']:
        if len(row) < 3:  # Ensure row has enough columns
            continue # Skipping row with insufficient columns

        # Each row is of the structure ["Building", "Equipment & Location", "Coordinates (Lat, Lng)"]
        [raw_building, raw_location, raw_coordinates] = row

        # Map raw building name to canonical building name
        building, _ = map_building(raw_building)

        # Map labels from description to canonical labels
        labels = []
        
        _, building_labels = map_labels(raw_building) # Get labels from the building name (e.g., "Residents Only")
        remainder, location_labels = map_labels(raw_location) # Get labels from the location description (e.g., "Landscape Architecture Student ONLY")
        
        # Deduplicate and sort labels
        labels += building_labels
        labels += location_labels
        labels = sorted(set(labels))
        
        cleaned = re.sub(r"^[\s\-–—:/|]+", "", remainder).strip() # Remove leftover delimiters at the start (like " - ", " / ", ": ", etc.)
        description = cleaned # Final cleaned description text (with labels removed) — essentially, remainder of the location description

        # Splits coordinates string into a list of floats
        coordinates = [float(x) for x in raw_coordinates.split(', ')]

        data.append({
            "Location": building,
            "Description": description,
            "Coordinates": coordinates,
            "Labels": labels
        })
    
    return data