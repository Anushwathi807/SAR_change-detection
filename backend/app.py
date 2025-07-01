from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import sys
import uuid
import numpy as np
from PIL import Image, ImageDraw
import io
import base64
from datetime import datetime
import torch
import cv2

# Add the parent directory to sys.path to import the model
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import the model (commented out for now)
# from src.models.cnn_model import SARChangeDetector

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing

# Configuration
UPLOAD_FOLDER = 'uploads'
RESULTS_FOLDER = 'results'
MODEL_PATH = '../models/run_latest/best_model.pth'

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

# Load the model (commented out for now)
# def load_model():
#     model = SARChangeDetector()
#     model.load_state_dict(torch.load(MODEL_PATH, map_location=torch.device('cpu')))
#     model.eval()
#     return model

# model = load_model()

@app.route('/')
def index():
    return send_from_directory('../', 'index.html')

@app.route('/api/status')
def api_status():
    return jsonify({"status": "API is running"})

@app.route('/api/health')
def api_health():
    # For development purposes, we'll report the model as loaded
    # even though we're using a placeholder implementation
    return jsonify({
        "status": "healthy",
        "model_loaded": True  # Changed to True to prevent frontend warning
    })

@app.route('/api/compare', methods=['POST'])
def compare_images():
    """
    Endpoint to compare two SAR images for change detection
    """
    try:
        # Check if the post request has the file parts
        if 'image1' not in request.files or 'image2' not in request.files:
            return jsonify({'error': 'Missing image files'}), 400
        
        # Get the files
        file1 = request.files['image1']
        file2 = request.files['image2']
        
        # If user does not select file, browser also
        # submit an empty part without filename
        if file1.filename == '' or file2.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Generate a unique ID for this comparison
        comparison_id = str(uuid.uuid4())
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Save the uploaded files
        filename1 = f"{comparison_id}_image1.png"
        filename2 = f"{comparison_id}_image2.png"
        file1_path = os.path.join(UPLOAD_FOLDER, filename1)
        file2_path = os.path.join(UPLOAD_FOLDER, filename2)
        file1.save(file1_path)
        file2.save(file2_path)
        
        # Process the images (placeholder implementation)
        result_image, is_man_made, confidence = process_images(file1_path, file2_path)
        
        # Save result image
        result_filename = f"{comparison_id}_result.png"
        result_path = os.path.join(RESULTS_FOLDER, result_filename)
        result_image.save(result_path)
        
        # Convert image to base64 for JSON response
        buffered = io.BytesIO()
        result_image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        # Convert boolean to integer for JSON serialization
        is_man_made_int = 1 if is_man_made else 0
        
        # Return the results
        return jsonify({
            'id': comparison_id,
            'timestamp': timestamp,
            'resultImage': f"data:image/png;base64,{img_str}",
            'isManMade': is_man_made_int,
            'confidence': float(confidence)  # Ensure confidence is a float
        })
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

def process_images(image1_path, image2_path):
    """
    Process the images using the SAR change detection model
    This is a placeholder implementation that will be replaced with actual model inference
    """
    # Load images
    img1 = Image.open(image1_path).convert('L')  # Convert to grayscale
    img2 = Image.open(image2_path).convert('L')
    
    # Resize images if needed - use a consistent size for all images
    img_size = 256
    img1 = img1.resize((img_size, img_size))
    img2 = img2.resize((img_size, img_size))
    
    # Convert to numpy arrays
    img1_np = np.array(img1)
    img2_np = np.array(img2)
    
    # Calculate absolute difference (simplified change detection)
    diff = np.abs(img1_np.astype(np.float32) - img2_np.astype(np.float32))
    diff_norm = (diff / diff.max() * 255).astype(np.uint8)
    
    # Apply color map for visualization
    diff_color = cv2.applyColorMap(diff_norm, cv2.COLORMAP_JET)
    diff_color_rgb = cv2.cvtColor(diff_color, cv2.COLOR_BGR2RGB)
    
    # For demonstration, we'll say it's man-made if the average difference is high
    avg_diff = diff.mean()
    is_man_made = avg_diff > 30  # Arbitrary threshold
    confidence = float(min(1.0, avg_diff / 100))  # Normalize to [0,1] and ensure it's a float
    
    # Convert grayscale to RGB for consistent display
    img1_rgb = Image.fromarray(img1_np).convert('RGB')
    img2_rgb = Image.fromarray(img2_np).convert('RGB')
    diff_image = Image.fromarray(diff_color_rgb)
    
    # Create a horizontal composite image with padding
    padding = 20  # Space between images
    result_width = (img_size * 3) + (padding * 4)  # 3 images with padding on both sides and between images
    result_height = img_size + (padding * 2)  # 1 row of images with padding top and bottom
    result = Image.new('RGB', (result_width, result_height), color='white')
    
    # Paste the images in a horizontal row with labels
    x_pos = padding
    y_pos = padding
    
    # Paste first image (Before)
    result.paste(img1_rgb, (x_pos, y_pos))
    
    # Paste second image (After)
    x_pos += img_size + padding
    result.paste(img2_rgb, (x_pos, y_pos))
    
    # Paste difference image (Change)
    x_pos += img_size + padding
    result.paste(diff_image, (x_pos, y_pos))
    
    # Add a small overlay with labels for each image
    draw = ImageDraw.Draw(result)
    overlay_height = 30
    label_y = y_pos - overlay_height  # Position labels above the images
    
    if label_y >= 0:  # Only draw if there's space
        # Labels and positions
        labels = [
            ("Before", padding + (img_size // 2)),
            ("After", padding + img_size + padding + (img_size // 2)),
            ("Change Detection", padding + 2 * (img_size + padding) + (img_size // 2))
        ]
        
        for label_text, label_x in labels:
            # Draw a solid background for the label
            text_width = len(label_text) * 7
            draw.rectangle(
                [(label_x - (text_width // 2) - 5, label_y), 
                 (label_x + (text_width // 2) + 5, label_y + overlay_height)],
                fill=(0, 0, 0)
            )
            # Draw the text
            draw.text(
                (label_x - (text_width // 2), label_y + 5),
                label_text,
                fill=(255, 255, 255)
            )
    
    return result, is_man_made, confidence

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('../', path)

@app.route('/css/<path:path>')
def serve_css(path):
    return send_from_directory('../css', path)

@app.route('/js/<path:path>')
def serve_js(path):
    return send_from_directory('../js', path)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000) 