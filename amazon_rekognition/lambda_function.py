import boto3
import io
import json
import base64
from PIL import Image

# Setup
REGION = "us-west-2"
BUCKET = "amithbuckettest"

s3 = boto3.client("s3")
rekognition = boto3.client("rekognition", region_name=REGION)

# === Generate a public HTTP URL for an S3 object ===
def get_public_url(s3_key):
    """
    Generate a public HTTP URL for an S3 object
    """
    return f"https://{BUCKET}.s3.{REGION}.amazonaws.com/{s3_key}"

# === Upload a base64 image to S3 ===
def upload_base64_to_s3(image_data, s3_key):
    # Decode base64 image
    image_content = base64.b64decode(image_data)
    
    # Upload to S3
    s3.put_object(
        Bucket=BUCKET,
        Key=s3_key,
        Body=image_content,
        ContentType="image/jpeg",
        ACL="public-read"
    )
    
    return get_public_url(s3_key)

# === Detect persons in image using Rekognition ===
def detect_persons(s3_key):
    response = rekognition.detect_labels(
        Image={"S3Object": {"Bucket": BUCKET, "Name": s3_key}},
        MaxLabels=10,
        MinConfidence=85,
    )

    bboxes = []
    for label in response["Labels"]:
        if label["Name"] == "Person":
            for inst in label.get("Instances", []):
                if "BoundingBox" in inst:
                    bboxes.append(inst["BoundingBox"])
    return bboxes

# === Crop persons and reupload ===
def crop_and_upload_persons(image_data, bboxes, frame_id):
    # Convert base64 to PIL Image
    image_bytes = base64.b64decode(image_data)
    img = Image.open(io.BytesIO(image_bytes))
    width, height = img.size

    cropped_keys = []
    person_data = []
    
    for idx, box in enumerate(bboxes):
        # Expand person bounding box by 10% in each direction
        box_width = box["Width"]
        box_height = box["Height"]
        
        # Calculate expanded box with bounds checking
        left = max(0, int((box["Left"] - box_width * 0.05) * width))
        top = max(0, int((box["Top"] - box_height * 0.05) * height))
        right = min(width, int((box["Left"] + box["Width"] + box_width * 0.05) * width))
        bottom = min(height, int((box["Top"] + box["Height"] + box_height * 0.05) * height))

        cropped_img = img.crop((left, top, right, bottom))
        buffer = io.BytesIO()
        cropped_img.save(buffer, format="JPEG")
        buffer.seek(0)

        cropped_key = f"detected_people/frame_{frame_id}/person_{idx}.jpg"
        s3.upload_fileobj(
            buffer, 
            BUCKET, 
            cropped_key,
            ExtraArgs={
                'ACL': 'public-read',
                'ContentType': 'image/jpeg'
            }
        )
        
        public_url = get_public_url(cropped_key)
        cropped_keys.append(cropped_key)
        
        # Store person data for clothing detection
        person_data.append({
            "key": cropped_key,
            "url": public_url,
            "image": cropped_img,
            "index": idx,
            "frame_id": frame_id
        })

    return cropped_keys, person_data

# === Detect clothing items from person image ===
def detect_clothing_items(person_data):
    clothing_items = ["Shirt", "T-Shirt", "Pants", "Jeans", "Jacket", "Coat", "Dress", 
                      "Suit", "Shoes", "Footwear", "Hat", "Tie", "Skirt", "Shorts", "Sweater"]
    
    person_clothing = []
    
    for person in person_data:
        # Save person image to temporary buffer for Rekognition
        buffer = io.BytesIO()
        person["image"].save(buffer, format="JPEG")
        buffer.seek(0)
        
        # Detect labels in the person image
        response = rekognition.detect_labels(
            Image={"Bytes": buffer.getvalue()},
            MaxLabels=20,
            MinConfidence=60,
        )
        
        # Extract clothing items with bounding boxes
        items = []
        for label in response["Labels"]:
            if label["Name"] in clothing_items and "Instances" in label:
                for instance in label["Instances"]:
                    if "BoundingBox" in instance:
                        items.append({
                            "name": label["Name"],
                            "confidence": label["Confidence"],
                            "bbox": instance["BoundingBox"]
                        })
        
        # Crop and save each clothing item
        width, height = person["image"].size
        item_keys = []
        
        for i, item in enumerate(items):
            box = item["bbox"]
            
            # Expand bounding box for accessories like ties and shoes
            if item["name"] in ["Tie", "Shoes", "Footwear", "Hat"]:
                # Expand by 30% in each direction
                box_width = box["Width"]
                box_height = box["Height"]
                
                # Calculate expanded box (with bounds checking)
                left = max(0, int((box["Left"] - box_width * 0.15) * width))
                top = max(0, int((box["Top"] - box_height * 0.15) * height))
                right = min(width, int((box["Left"] + box["Width"] + box_width * 0.15) * width))
                bottom = min(height, int((box["Top"] + box["Height"] + box_height * 0.15) * height))
            else:
                # Regular cropping for other items
                left = int(box["Left"] * width)
                top = int(box["Top"] * height)
                right = int(left + box["Width"] * width)
                bottom = int(top + box["Height"] * height)
            
            # Crop the clothing item
            item_img = person["image"].crop((left, top, right, bottom))
            buffer = io.BytesIO()
            item_img.save(buffer, format="JPEG")
            buffer.seek(0)
            
            # Upload to S3
            item_key = f"clothing_items/frame_{person['frame_id']}/person_{person['index']}/{item['name'].lower()}_{i}.jpg"
            s3.upload_fileobj(
                buffer, 
                BUCKET, 
                item_key,
                ExtraArgs={
                    'ACL': 'public-read',
                    'ContentType': 'image/jpeg'
                }
            )
            
            public_url = get_public_url(item_key)
            
            item_keys.append({
                "key": item_key,
                "url": public_url,
                "name": item["name"],
                "confidence": item["confidence"]
            })
        
        person_clothing.append({
            "person_index": person["index"],
            "person_key": person["key"],
            "person_url": person["url"],
            "clothing_items": item_keys
        })
    
    return person_clothing

# === Process a single frame ===
def process_frame(image_data, frame_id):
    # Upload frame to S3
    s3_key = f"raw_frames/frame_{frame_id}.jpg"
    frame_url = upload_base64_to_s3(image_data, s3_key)
    
    # Detect persons
    boxes = detect_persons(s3_key)
    
    if not boxes:
        return {
            "result": []
        }
    
    # Crop and upload each person
    cropped_keys, person_data = crop_and_upload_persons(image_data, boxes, frame_id)
    
    # Create result with person URLs
    result = []
    for person in person_data:
        result.append({
            "link": person["url"]
        })
    
    return {
        "result": result
    }

def lambda_handler(event, context):
    try:
        # Check if the request is from API Gateway
        if 'body' in event:
            # Parse the request body
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
        
        # Get the image data and frame ID
        image_data = body.get('image')
        frame_id = body.get('frame_id', 'api_frame')
        
        if not image_data:
            return {
                'statusCode': 400,
                'body': json.dumps({'result': []})
            }
        
        # Process the frame
        result = process_frame(image_data, frame_id)
        
        # Return the result
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'  # Enable CORS
            },
            'body': json.dumps(result)
        }
    
    except Exception as e:
        # Return empty result on error
        return {
            'statusCode': 500,
            'body': json.dumps({'result': []})
        }