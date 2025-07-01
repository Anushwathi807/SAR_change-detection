# SAR Change Detector

A web application for detecting man-made changes in Synthetic Aperture Radar (SAR) satellite images using deep learning.

## Overview

This project consists of two main components:

1. **Frontend**: A simple, responsive web interface built with HTML, CSS, and JavaScript for uploading SAR images and viewing change detection results.
2. **Backend**: A Python Flask API that processes the images using a CNN model for SAR change detection.

## Features

- Easy upload of before and after SAR images via drag-and-drop or file selection![Screenshot from 2025-07-01 15-39-28](https://github.com/user-attachments/assets/96e0e4d4-2d59-402c-afab-c9ec5d2321ce)

- Detection and classification of changes as man-made or natural
- Visualization of change detection results
- Display of confidence scores for predictions

## Project Structure

```
sar-change-detector-web/
├── index.html              # Main HTML file
├── css/                    # CSS stylesheets
│   └── styles.css          # Main stylesheet
├── js/                     # JavaScript files
│   └── main.js             # Main JavaScript code
├── img/                    # Static images (if any)
├── backend/                # Flask backend
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   ├── uploads/            # Directory for uploaded images
│   └── results/            # Directory for processed results
└── README.md               # Documentation
```

## Setup Instructions

### Frontend Setup

The frontend is built with plain HTML, CSS, and JavaScript without any build tools or frameworks needed. Simply:

1. **Open the index.html file in your browser**:
   - For testing, you can use any modern web browser to open the file directly
   - For development, you might want to use a local server:
     ```bash
     # Using Python's built-in HTTP server
     python -m http.server
     ```
     Then open http://localhost:8000 in your browser

### Backend Setup

1. **Create a virtual environment** (optional but recommended)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Python dependencies**

```bash
pip install -r requirements.txt
```

3. **Run the Flask server**

```bash
python app.py
```

This will start the Flask API server at http://localhost:5000.

## Usage

1. Open the web application in your browser
2. Upload a "before" SAR image in the first panel
3. Upload an "after" SAR image in the second panel
4. Click the "Compare Images" button
5. View the results showing the change detection visualization and classification

## Connecting to the Trained Model

The backend is prepared to use a trained CNN model for SAR change detection. To use your trained model:

1. Make sure your model is saved in the appropriate path (update the `MODEL_PATH` in `backend/app.py` if needed)
2. Uncomment the model loading code in `backend/app.py`
3. Update the `process_images` function to use the model for inference

## Integration with Python Project

This web application is designed to work with the SAR Change Detection Python project:

1. Place this web application in the same directory as your Python project
2. Update the imports in `backend/app.py` to correctly import your model
3. The backend will use your trained model to process images uploaded through the web interface

## License

This project is open source and available under the MIT License. 
![Screenshot from 2025-07-01 15-39-28](https://github.com/user-attachments/assets/27e32276-3289-4dbf-aec6-316c981605d4)
