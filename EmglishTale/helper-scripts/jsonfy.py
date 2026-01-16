from googletrans import Translator
import os
import json
import glob
import time

def translate_english_to_slovenian(text):
    try:
        translator = Translator()
        translation = translator.translate(text, src='en', dest='sl')
        return translation.text
    except Exception as e:
        print(f"Translation error for '{text}': {e}")
        return ""

def create_translated_image_json(folder_path, output_file="image_data.json", delay=0.1):
    jpg_files = glob.glob(os.path.join(folder_path, "*.jpg"))
    jpg_files.extend(glob.glob(os.path.join(folder_path, "*.JPG")))
    jpg_files.extend(glob.glob(os.path.join(folder_path, "*.jpeg")))
    jpg_files.extend(glob.glob(os.path.join(folder_path, "*.JPEG")))
    
    jpg_files = sorted(list(set(jpg_files)))
    image_data = []
    
    print("Translating words...")
    
    for i, file_path in enumerate(jpg_files):
        filename = os.path.basename(file_path)
        word = os.path.splitext(filename)[0]
        
        slo_translation = translate_english_to_slovenian(word)
        
        entry = {
            "image": filename,
            "eng_word": word,
            "slo_word": slo_translation
        }
        
        image_data.append(entry)
        
        print(f"Progress: {i+1}/{len(jpg_files)} - '{word}' -> '{slo_translation}'")
        
        time.sleep(delay)
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(image_data, f, indent=2, ensure_ascii=False)
    
    print(f"JSON file created: {output_file}")
    print(f"Processed {len(image_data)} images")

if __name__ == "__main__":
    folder_path = "/home/risalor/Desktop/imgScp/langeek_images"
    
    if not folder_path:
        folder_path = "."
    
    if not os.path.exists(folder_path):
        print(f"Error: Folder '{folder_path}' does not exist!")
    else:
        create_translated_image_json(folder_path)