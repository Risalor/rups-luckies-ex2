import requests
from bs4 import BeautifulSoup
import os
from urllib.parse import urljoin, urlparse, unquote
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import re
import time

def setup_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
    
    driver = webdriver.Chrome(options=chrome_options)
    return driver

def get_image_name_from_url(img_url):
    try:
        parsed = urlparse(img_url)
        
        path_parts = parsed.path.split('/')
        
        for i, part in enumerate(path_parts):
            if part in ['thumb', 'original'] and i + 1 < len(path_parts):
                word = path_parts[i + 1]
                # URL decode in case there are any encoded characters
                word = unquote(word)
                return word
        
        meaningful_parts = [part for part in path_parts if part and 
                          not part.isdigit() and 
                          part not in ['photo', 'thumb', 'original', '']]
        
        if meaningful_parts:
            return unquote(meaningful_parts[-1])
            
        return None
        
    except Exception as e:
        print(f"Error extracting name from URL: {e}")
        return None

def download_image(img_url, folder_path, filename=None):
    try:
        if filename is None:
            image_name = get_image_name_from_url(img_url)
            if image_name:
                parsed = urlparse(img_url)
                ext = os.path.splitext(parsed.path)[1]
                if not ext or '?' in ext:
                    ext = '.jpg'
                else:
                    ext = ext.split('?')[0]
                filename = f"{image_name}{ext}"
            else:
                filename = f"image_{hash(img_url)}{ext}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://langeek.co/'
        }
        
        response = requests.get(img_url, headers=headers, stream=True, timeout=30)
        response.raise_for_status()
        
        file_path = os.path.join(folder_path, filename)
        
        with open(file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        file_size = os.path.getsize(file_path)
        print(f"Downloaded: {filename} ({file_size} bytes)")
        return True
        
    except Exception as e:
        print(f"Error downloading {img_url}: {e}")
        return False

def is_valid_image_url(url):
    """Check if URL is a valid image URL we want to download"""
    if not url or len(url) < 10:
        return False
    
    skip_keywords = ['logo', 'icon', 'spacer', 'placeholder', 'avatar', 'loading', 'preloader']
    if any(keyword in url.lower() for keyword in skip_keywords):
        return False
    
    if 'cdn.langeek.co' not in url:
        return False
    
    return True

def make_full_url(url):
    """Convert relative or protocol-relative URL to full URL"""
    if not url:
        return None
    
    if url.startswith('//'):
        return 'https:' + url
    elif url.startswith('/'):
        return urljoin('https://langeek.co', url)
    elif url.startswith(('http://', 'https://')):
        return url
    else:
        return urljoin('https://langeek.co', url)


def scrape_images(url):
    
    folder_name = "langeek_images"
    if not os.path.exists(folder_name):
        os.makedirs(folder_name)
    
    driver = setup_driver()
    
    try:
        print(f"Loading page: {url}")
        driver.get(url)
        
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, "img"))
        )
        
        print("Initial page loaded. Starting enhanced scrolling...")
        
        scroll_attempts = 0
        max_scroll_attempts = 10
        last_image_count = 0
        stable_count = 0
        
        while scroll_attempts < max_scroll_attempts:
            scroll_attempts += 1
            print(f"\nScroll attempt {scroll_attempts}/{max_scroll_attempts}")
            
            for i in range(3):
                scroll_height = driver.execute_script("return document.body.scrollHeight")
                current_scroll = driver.execute_script("return window.pageYOffset")
                scroll_to = current_scroll + (scroll_height // 3)
                driver.execute_script(f"window.scrollTo(0, {scroll_to});")
                time.sleep(1.5)
            
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            
            current_images = driver.find_elements(By.TAG_NAME, "img")
            current_count = len(current_images)
            print(f"Current images found: {current_count}")
            
            if current_count > last_image_count:
                last_image_count = current_count
                stable_count = 0
                print(f"New images detected! Total: {current_count}")
            else:
                stable_count += 1
                print(f"No new images (stable count: {stable_count}/3)")
            
            if stable_count >= 3:
                print("No new images detected after multiple scrolls. Moving to download...")
                break
            
            try:
                load_more_buttons = driver.find_elements(By.XPATH, "//button[contains(., 'Load') or contains(., 'More') or contains(., 'Show')]")
                for button in load_more_buttons:
                    if button.is_displayed():
                        driver.execute_script("arguments[0].click();", button)
                        print("Clicked 'Load More' button")
                        time.sleep(3)
            except:
                pass
        
        driver.execute_script("window.scrollTo(0, 0);")
        time.sleep(1)
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        
        print("\nSearching for images with multiple strategies...")
        
        images = driver.find_elements(By.TAG_NAME, "img")
        print(f"Found {len(images)} img tags")
        
        elements_with_bg = driver.find_elements(By.XPATH, "//*[contains(@style, 'background-image')]")
        print(f"Found {len(elements_with_bg)} elements with background images")
        
        data_image_elements = driver.find_elements(By.XPATH, "//*[@data-src or @data-original or @data-image]")
        print(f"Found {len(data_image_elements)} elements with data image attributes")
        
        all_image_sources = set()
        
        print("Processing regular image tags...")
        for img in images:
            src = img.get_attribute('src')
            data_src = img.get_attribute('data-src')
            data_original = img.get_attribute('data-original')
            
            for img_src in [src, data_src, data_original]:
                if img_src and is_valid_image_url(img_src):
                    full_url = make_full_url(img_src)
                    if full_url:
                        all_image_sources.add(full_url)
                        print(f"  Found: {full_url}")
        
        print("Processing background images...")
        for element in elements_with_bg:
            style = element.get_attribute('style')
            if 'url(' in style:
                urls = re.findall(r'url\(["\']?([^"\'\)]+)["\']?\)', style)
                for url in urls:
                    if is_valid_image_url(url):
                        full_url = make_full_url(url)
                        if full_url:
                            all_image_sources.add(full_url)
                            print(f"  Found background: {full_url}")
        
        print("Processing data attributes...")
        for element in data_image_elements:
            for attr in ['data-src', 'data-original', 'data-image']:
                data_url = element.get_attribute(attr)
                if data_url and is_valid_image_url(data_url):
                    full_url = make_full_url(data_url)
                    if full_url:
                        all_image_sources.add(full_url)
                        print(f"  Found data image: {full_url}")
        
        print(f"\nTotal unique image URLs found: {len(all_image_sources)}")
        
        downloaded_count = 0
        for i, img_url in enumerate(all_image_sources):
            print(f"\n[{i+1}/{len(all_image_sources)}] Processing: {img_url}")
            
            parsed = urlparse(img_url)
            ext = os.path.splitext(parsed.path)[1]
            if not ext or '?' in ext:
                ext = '.jpg'
            else:
                ext = ext.split('?')[0]
            
            filename = f"langeek_image_{get_image_name_from_url(img_url)}{ext}"
            
            if download_image(img_url, folder_name):
                downloaded_count += 1
            
            time.sleep(0.3)
        
        print(f"\n🎉 Download completed! {downloaded_count}/{len(all_image_sources)} images saved in '{folder_name}' folder.")
        
        if downloaded_count < len(all_image_sources):
            print(f"⚠️  {len(all_image_sources) - downloaded_count} images failed to download")
        
    except Exception as e:
        print(f"Error during scraping: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        driver.quit()

for i in range(66, 74):
    scrape_images(f"https://langeek.co/en/vocab/subcategory/53{i}/word-list")