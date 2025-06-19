import requests
import json


PIXELCUT_API_KEY = "sk_88a482e5b9fd4b3c96c43b0e3843d048"


def try_on_virtual_outfit(api_key: str, person_image_url: str, garment_image_url: str) -> str:
    """
    Sends a request to Pixelcut API to try on a garment on a person.

    Args:
        api_key (str): Your Pixelcut API key.
        person_image_url (str): URL to the person image.
        garment_image_url (str): URL to the garment image.

    Returns:
        str: Final image URL or base64, depending on API response.
    """
    url = "https://api.developer.pixelcut.ai/v1/try-on"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-API-KEY": api_key,
    }
    data = {
        "person_image_url": person_image_url,
        "garment_image_url": garment_image_url,
        "garment_mode": "auto",
        "preprocess_garment": "true",
        "remove_background": "false",
        "wait_for_result": "true"
    }

    response = requests.post(url, json=data, headers=headers)

    if response.status_code == 200:
        result = response.json()
        # You can return the image URL or the entire JSON
        return result.get("output_url") or result  # Adjust based on actual API response
    else:
        raise Exception(f"Error {response.status_code}: {response.text}")


def lambda_handler(event, context):
    """
    AWS Lambda handler function to process the event and return the try-on result.

    Args:
        event (dict): The event data passed to the Lambda function.
        context (object): The runtime information of the Lambda function.

    Returns:
        dict: The response containing the final image URL or error message.
    """
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
        body = json.loads(event.get("body", "{}"))
        person_image_url = body.get("person_image_url")
        garment_image_url = body.get("garment_image_url")
        
        if not person_image_url or not garment_image_url:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Missing image URLs"})
            }
            
        final_image_url = try_on_virtual_outfit(PIXELCUT_API_KEY, person_image_url, garment_image_url)
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
            },
            "body": json.dumps({"final_image_url": final_image_url})
        }

    except Exception as e:
        print(f"Error processing request: {e}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"error": str(e)})
        }