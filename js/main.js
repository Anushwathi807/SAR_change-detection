// Global variables to store the selected images
let beforeImage = null;
let afterImage = null;

// Backend API URL
const API_URL = 'http://localhost:5000/api';

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Dropzone elements
    const dropzone1 = document.getElementById('dropzone1');
    const dropzone2 = document.getElementById('dropzone2');
    const fileInput1 = document.getElementById('file1');
    const fileInput2 = document.getElementById('file2');
    
    // Preview elements
    const preview1 = document.getElementById('preview1');
    const preview2 = document.getElementById('preview2');
    const imageDisplay1 = document.getElementById('imageDisplay1');
    const imageDisplay2 = document.getElementById('imageDisplay2');
    const imageName1 = document.getElementById('imageName1');
    const imageName2 = document.getElementById('imageName2');
    const imageSize1 = document.getElementById('imageSize1');
    const imageSize2 = document.getElementById('imageSize2');
    
    // Button elements
    const removeImage1 = document.getElementById('removeImage1');
    const removeImage2 = document.getElementById('removeImage2');
    const compareBtn = document.getElementById('compareBtn');
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    const downloadResultBtn = document.getElementById('downloadResultBtn');
    
    // Result elements
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultsSection = document.getElementById('results-section');
    const resultImage = document.getElementById('resultImage');
    const predictionBadge = document.getElementById('predictionBadge');
    const confidenceValue = document.getElementById('confidenceValue');
    const explanationText = document.getElementById('explanationText');
    
    // Alert elements
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    const closeAlert = document.getElementById('closeAlert');
    
    // Background animation
    createBackgroundAnimation();
    
    // Initialize the application
    initializeApp();
    
    // Initialize tooltips
    initTooltips();
    
    function initializeApp() {
        // Hide preview elements initially
        preview1.style.display = 'none';
        preview2.style.display = 'none';
        resultsSection.style.display = 'none';
        loadingSpinner.style.display = 'none';
        errorAlert.style.display = 'none';
        
        // Setup dropzone event listeners
        setupDropzone(dropzone1, fileInput1, 1);
        setupDropzone(dropzone2, fileInput2, 2);
        
        // Setup file input change listeners
        fileInput1.addEventListener('change', (e) => handleFileSelect(e, 1));
        fileInput2.addEventListener('change', (e) => handleFileSelect(e, 2));
        
        // Setup remove button listeners
        removeImage1.addEventListener('click', () => removeImage(1));
        removeImage2.addEventListener('click', () => removeImage(2));
        
        // Setup compare button listener
        compareBtn.addEventListener('click', compareImages);
        
        // Setup new analysis button listener
        newAnalysisBtn.addEventListener('click', startNewAnalysis);
        
        // Setup download result button listener
        downloadResultBtn.addEventListener('click', downloadResult);
        
        // Setup alert close button listener
        closeAlert.addEventListener('click', hideAlert);

        // Check if the API is healthy
        checkApiHealth();
    }
    
    function setupDropzone(dropzone, fileInput, index) {
        // Click on dropzone to select file
        dropzone.addEventListener('click', function(e) {
            if (e.target.closest('.remove-image-btn') === null) {
                fileInput.click();
            }
        });
        
        // Prevent default behaviors for drag events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, preventDefaults, false);
        });
        
        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // Handle dropzone highlight
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, function() {
                dropzone.classList.add('dropzone-highlight');
            }, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, function() {
                dropzone.classList.remove('dropzone-highlight');
            }, false);
        });
        
        // Handle file drop
        dropzone.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const file = dt.files[0];
            if (file) {
                handleFile(file, index);
            }
        });
    }
    
    function handleFileSelect(e, index) {
        const file = e.target.files[0];
        if (file) {
            handleFile(file, index);
        }
    }
    
    function handleFile(file, index) {
        // Check if file is an image
        if (!file.type.match('image.*')) {
            showAlert('Please select a valid image file (JPEG, PNG, or TIFF).');
            return;
        }
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showAlert('File size exceeds 10MB limit. Please select a smaller file.');
            return;
        }
        
        const reader = new FileReader();
        const imageDisplay = index === 1 ? imageDisplay1 : imageDisplay2;
        const imageName = index === 1 ? imageName1 : imageName2;
        const imageSize = index === 1 ? imageSize1 : imageSize2;
        const preview = index === 1 ? preview1 : preview2;
        const dropzoneContent = document.querySelector(`#dropzone${index} .dropzone-content`);
        
        reader.onload = function(e) {
            imageDisplay.src = e.target.result;
            imageName.textContent = file.name;
            imageSize.textContent = formatFileSize(file.size);
            
            dropzoneContent.style.display = 'none';
            preview.style.display = 'block';
            
            // Store the file in our global variables
            if (index === 1) {
                beforeImage = file;
            } else {
                afterImage = file;
            }
            
            validateCompareButton();
        };
        
        reader.readAsDataURL(file);
    }
    
    function removeImage(index) {
        const preview = index === 1 ? preview1 : preview2;
        const dropzoneContent = document.querySelector(`#dropzone${index} .dropzone-content`);
        const fileInput = index === 1 ? fileInput1 : fileInput2;
        
        preview.style.display = 'none';
        dropzoneContent.style.display = 'flex';
        fileInput.value = '';
        
        // Clear the stored image
        if (index === 1) {
            beforeImage = null;
        } else {
            afterImage = null;
        }
        
        validateCompareButton();
    }
    
    function validateCompareButton() {
        const hasImage1 = preview1.style.display === 'block';
        const hasImage2 = preview2.style.display === 'block';
        
        compareBtn.disabled = !(hasImage1 && hasImage2);
    }
    
    function compareImages() {
        // Check if we have both images
        if (!beforeImage || !afterImage) {
            showAlert('Please select both images before comparing.');
            return;
        }
        
        // Show loading spinner
        loadingSpinner.style.display = 'flex';
        
        // Create form data to send to the backend
        const formData = new FormData();
        formData.append('image1', beforeImage);
        formData.append('image2', afterImage);
        
        // Send images to backend for processing
        fetch(`${API_URL}/compare`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to process images');
                });
            }
            return response.json();
        })
        .then(data => {
            // Hide loading spinner
            loadingSpinner.style.display = 'none';
            
            // Display the results
            displayResults(data);
        })
        .catch(error => {
            // Hide loading spinner
            loadingSpinner.style.display = 'none';
            
            // Show error
            showAlert(`Error: ${error.message}`);
            console.error('Error:', error);
        });
    }
    
    function displayResults(data) {
        // Set result image
        resultImage.src = data.resultImage;
        
        // Update prediction badge
        if (data.isManMade) {
            predictionBadge.className = 'prediction-badge man-made';
            predictionBadge.innerHTML = '<i class="fas fa-building"></i> Man-made Change';
            explanationText.textContent = 'The model has identified significant man-made changes between the two SAR images. The highlighted areas indicate new structures or modifications to existing ones, which are characteristic of human activity rather than natural changes.';
        } else {
            predictionBadge.className = 'prediction-badge natural';
            predictionBadge.innerHTML = '<i class="fas fa-leaf"></i> Natural Change';
            explanationText.textContent = 'The model has identified natural changes between the two SAR images. The highlighted areas indicate changes that are likely due to natural processes such as vegetation growth, seasonal variation, or natural environmental shifts.';
        }
        
        // Update confidence value
        confidenceValue.textContent = `${data.confidence.toFixed(1)}%`;
        
        // Show results section
        resultsSection.style.display = 'block';
        
        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    function startNewAnalysis() {
        // Clear images
        removeImage(1);
        removeImage(2);
        
        // Hide results section
        resultsSection.style.display = 'none';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function downloadResult() {
        if (!resultImage.src) {
            showAlert('No result image to download.');
            return;
        }
        
        // Create a temporary link and trigger download
        const a = document.createElement('a');
        a.href = resultImage.src;
        a.download = `sar_change_detection_result_${new Date().getTime()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    function showAlert(message) {
        errorMessage.textContent = message;
        errorAlert.style.display = 'flex';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            hideAlert();
        }, 5000);
    }
    
    function hideAlert() {
        errorAlert.style.display = 'none';
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function checkApiHealth() {
        fetch(`${API_URL}/health`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('API is not responding');
                }
                return response.json();
            })
            .then(data => {
                console.log('API Health Status:', data);
                if (!data.model_loaded) {
                    showAlert('Warning: Model not loaded properly. Results may not be accurate.');
                }
            })
            .catch(error => {
                console.error('API Health Check Failed:', error);
                showAlert('Warning: Backend API is not available. The application will not work properly.');
            });
    }
});

function createBackgroundAnimation() {
    const backgroundAnimation = document.getElementById('backgroundAnimation');
    
    // Create radar waves
    for (let i = 0; i < 5; i++) {
        const wave = document.createElement('div');
        wave.className = 'radar-wave';
        wave.style.animationDelay = `${i * 0.5}s`;
        backgroundAnimation.appendChild(wave);
    }
    
    // Create satellites
    for (let i = 0; i < 3; i++) {
        const satellite = document.createElement('div');
        satellite.className = 'satellite';
        satellite.style.top = `${10 + Math.random() * 30}%`;
        satellite.style.left = `${10 + Math.random() * 80}%`;
        satellite.style.animationDelay = `${Math.random() * 2}s`;
        satellite.style.animationDuration = `${15 + Math.random() * 10}s`;
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-satellite';
        satellite.appendChild(icon);
        
        backgroundAnimation.appendChild(satellite);
    }
    
    // Create stars
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.top = `${Math.random() * 100}%`;
        star.style.left = `${Math.random() * 100}%`;
        star.style.animationDelay = `${Math.random() * 5}s`;
        star.style.width = `${1 + Math.random() * 2}px`;
        star.style.height = star.style.width;
        backgroundAnimation.appendChild(star);
    }
}

function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
    
    function showTooltip(e) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = this.getAttribute('data-tooltip');
        
        document.body.appendChild(tooltip);
        
        const rect = this.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        tooltip.style.top = `${rect.top + window.scrollY - tooltipRect.height - 10}px`;
        tooltip.style.left = `${rect.left + window.scrollX + (rect.width / 2) - (tooltipRect.width / 2)}px`;
        tooltip.style.opacity = '1';
        
        this._tooltip = tooltip;
    }
    
    function hideTooltip() {
        if (this._tooltip) {
            document.body.removeChild(this._tooltip);
            this._tooltip = null;
        }
    }
}