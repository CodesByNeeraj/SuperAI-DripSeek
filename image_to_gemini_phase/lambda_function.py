import json
import base64
import requests



# GEMINI_API_KEY = "your_secret_api_key"  # You can replace this or pass it securely via environment variables
SERPAPI_API_KEY = "your_secret_api_key_here"  # Replace with your actual SerpAPI key
SAMBANOVA_API_KEY = "your_secret_api_key_here"  # Replace with your actual SambaNova key



def get_llama_search_phrase(image_path: str, api_key: str) -> str:
    """
    Sends an image and a system prompt to SambaNova's chat API to generate a product search phrase.
    
    Args:
        api_key (str): Your SambaNova API key.
        image_path (str): Local or remote image path.
    
    Returns:
        str: Generated search phrase.
    """
    if image_path.startswith("http://") or image_path.startswith("https://"):
        image_data = requests.get(image_path).content
    else:
        with open(image_path, "rb") as f:
            image_data = f.read()

    image_base64 = base64.b64encode(image_data).decode("utf-8")

    url = "https://api.sambanova.ai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    system_prompt = (
        "You are a visual product tagger for an e-commerce fashion platform in Singapore. "
        "Analyze the provided clothing product image and generate a natural language search phrase that someone in Singapore might use to find this item online. "
        "Focus only on visible attributes and avoid brand names or non-visual traits. "
        "Include in your description: "
        "- Clothing type (e.g., shirt, dress, jacket); "
        "- Style (e.g., casual, formal, streetwear); "
        "- Fabric or material (e.g., cotton, denim, leather); "
        "- Color; "
        "- Pattern (e.g., striped, floral, solid); "
        "- Notable features (e.g., buttons, zippers, hood, pockets); "
        "- Apparent target gender based on visual style and cut (e.g., men's, women's, unisex). "
        "Output the result as a short, realistic product search phrase such as: "
        "\"men's casual cotton striped shirt with buttons\" or "
        "\"women's floral dress with puff sleeves\". "
        "Avoid commas. Use natural phrasing suitable for search engines and local shopping behavior in Singapore."
    )

    payload = {
        "model": "Llama-4-Maverick-17B-128E-Instruct",
        "messages": [
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What do you see in this image"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        }
                    }
                ]
            }
        ]
    }

    response = requests.post(url, headers=headers, json=payload)

    try:
        response_json = response.json()
        # print("DEBUG RESPONSE JSON:", json.dumps(response_json, indent=2))
    except Exception:
        raise Exception(f"Failed to parse JSON: {response.text}")

    if "choices" in response_json:
        return response_json["choices"][0]["message"]["content"]
    else:
        raise Exception(f"Unexpected response format: {response_json}")











def universal_amazon_image_resizer(image_url: str, size: int = 500) -> str:
    if not image_url:
        return image_url

    parts = image_url.rsplit('.', 2)
    if len(parts) != 3:
        return image_url
    if "images" not in parts[0]:
        return image_url

    return f"{parts[0]}._SL{size}_.{parts[2]}"



def search_amazon_shopping_products(product: str, api_key: str):
    """
    Search for Amazon shopping products using SerpAPI with Python requests.
    
    Args:
        product (str): Product name to search for.
        
    Returns:
        dict: Dictionary with product details from the first search result.
    """    
    params = {
        "engine": "amazon",
        "k": product,
        "amazon_domain": "amazon.com",
        "api_key": api_key
    }
    
    try:
        response = requests.get("https://serpapi.com/search", params=params)
        response.raise_for_status()
        data = response.json()
        
        if "organic_results" in data and data["organic_results"]:
            first_result = data["organic_results"][0]
            image_link = universal_amazon_image_resizer(first_result.get("thumbnail", ""))
            return {
                "link": first_result.get("link_clean", ""),
                "title": first_result.get("title", ""),
                "original_title": product,
                "image_link": image_link,
                "price": first_result.get("price", ""),
                "old_price": first_result.get("old_price", ""),
                "rating": first_result.get("rating", "")
            }
        else:
            return {"error": "No organic results found"}

    except requests.exceptions.RequestException as e:
        return {"error": "HTTP request failed", "details": str(e)}
    except ValueError:
        return {"error": "Failed to decode JSON response"}

def finding_clothes(image):
    # image taken as ecoded with base 64
    # Prepare request
    
    url = "https://soacrbo6g4.execute-api.us-west-2.amazonaws.com/default/RekogCropPerson"
    payload = {
        "image": image,
        "frame_id": "test_frame"
    }
    
    # Send request
    response = requests.post(url, json=payload)
    
    # Return results
    return response.json()



def lambda_handler(event, context):
    try:
        # ✅ Handle CORS Preflight request
        if event["httpMethod"] == "OPTIONS":
            return {
                "statusCode": 200,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
                },
                "body": json.dumps({"message": "CORS preflight passed"})
            }

        # ✅ Main logic for POST
        body = json.loads(event["body"])
        image_data = body.get("base64image")
        print(f"✅ Received image data: {image_data[:30]}...")

        clothes_result = finding_clothes(image_data)

        response_body = {'result': []}
        for picture in clothes_result['result']:
            image_url = picture['link']
            print(f"➡️ Processing image URL: {image_url}")
            search_phrase = get_llama_search_phrase(image_url, SAMBANOVA_API_KEY)
            final_result = search_amazon_shopping_products(search_phrase, SERPAPI_API_KEY)
            response_body['result'].append({
                "imageUrl": image_url,
                "crawling_result": final_result
            })

        if len(response_body['result']) == 0:
            response_body['result'].append({
                "imageUrl": "",
                "crawling_result": "No results found"
            })

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            "body": json.dumps(response_body)
        }

    except Exception as e:
        print(f"❌ Lambda error: {e}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"error": str(e)})
        }