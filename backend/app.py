# backend/app.py
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import logging

# --- Configuration ---
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'} # Allow PDF, Word, and Text files

# --- App Initialization ---
app = Flask(__name__, static_folder='../frontend', static_url_path='/')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = 'your_very_secret_key' # Change this for production!

# --- CORS Setup ---
# Allow requests from your frontend (adjust origin if needed)
CORS(app, resources={r"/api/*": {"origins": "*"}}) # Be more specific in production

# --- Logging Setup ---
logging.basicConfig(level=logging.INFO)

# --- Helper Functions ---
def allowed_file(filename):
    """Checks if the uploaded file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_resume(filepath):
    """
    Placeholder function to extract text from the resume file.
    You'll need to implement the actual extraction logic here
    using libraries like PyPDF2 (for PDF), python-docx (for DOCX).
    """
    logging.info(f"Attempting to extract text from: {filepath}")
    # --- !! IMPLEMENT RESUME PARSING LOGIC HERE !! ---
    # Example (very basic - replace with actual parsing):
    try:
        if filepath.lower().endswith('.txt'):
            with open(filepath, 'r', encoding='utf-8') as f:
                return f.read()
        elif filepath.lower().endswith('.pdf'):
            # Add PyPDF2 or other PDF library logic here
            logging.warning("PDF parsing not implemented yet.")
            return "PDF content extraction placeholder."
        elif filepath.lower().endswith('.docx'):
            # Add python-docx logic here
            logging.warning("DOCX parsing not implemented yet.")
            return "DOCX content extraction placeholder."
        else:
            logging.warning(f"Unsupported file type for extraction: {filepath}")
            return None
    except Exception as e:
        logging.error(f"Error extracting text from {filepath}: {e}")
        return None
    # --- End of Placeholder ---

def generate_questions_from_text(text):
    """
    Placeholder function to generate interview questions based on resume text.
    You'll need to integrate an AI model (e.g., OpenAI GPT, Hugging Face) here.
    """
    logging.info("Generating questions based on extracted text...")
    # --- !! IMPLEMENT AI QUESTION GENERATION LOGIC HERE !! ---
    # Example (very basic - replace with actual AI call):
    if not text or len(text) < 50: # Basic check if text extraction worked
         return ["Could you please tell me about yourself?", "What are your strengths?"]

    # Dummy questions based on text length for now
    questions = [
        "Tell me about your experience relevant to this resume.",
        "Can you elaborate on [mention a specific point - requires text analysis]?",
        "What was a challenging project mentioned here?",
        "Why are you interested in this type of role?",
        f"Based on your resume (length: {len(text)} chars), what makes you a good fit?"
    ]
    logging.info(f"Generated {len(questions)} dummy questions.")
    return questions
    # --- End of Placeholder ---

def analyze_emotion(image_data):
    """
    Placeholder function for facial emotion analysis.
    This is complex and would likely involve:
    1. Receiving image data (e.g., base64 encoded) from the frontend.
    2. Decoding the image.
    3. Using a library like OpenCV and a pre-trained model (e.g., from deepface,
       or cloud services like AWS Rekognition, Azure Face API) to detect faces
       and predict emotions.
    """
    logging.info("Analyzing emotion (placeholder)...")
    # --- !! IMPLEMENT FACIAL EMOTION ANALYSIS LOGIC HERE !! ---
    # Example (returns a dummy emotion):
    detected_emotion = "neutral" # Replace with actual analysis result
    logging.info(f"Detected emotion (dummy): {detected_emotion}")
    return detected_emotion
    # --- End of Placeholder ---


# --- API Routes ---
@app.route('/')
def index():
    """Serves the main frontend HTML file."""
    # Looks for index.html in the 'static_folder' defined in Flask app initialization
    return app.send_static_file('index.html')

@app.route('/api/upload-resume', methods=['POST'])
def upload_resume():
    """Handles resume file upload, extracts text, and generates initial questions."""
    if 'resume' not in request.files:
        return jsonify({"error": "No resume file part"}), 400
    file = request.files['resume']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        # Ensure the upload folder exists
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])

        # Securely save the file
        # Consider using a more robust method for generating unique filenames
        filename = os.path.join(app.config['UPLOAD_FOLDER'], "uploaded_resume" + os.path.splitext(file.filename)[1])
        try:
            file.save(filename)
            logging.info(f"File saved successfully: {filename}")

            # --- Step 1: Extract Text ---
            extracted_text = extract_text_from_resume(filename)
            if not extracted_text:
                 logging.error(f"Could not extract text from {filename}")
                 # Clean up the uploaded file if extraction fails
                 # os.remove(filename) # Consider error handling strategy
                 return jsonify({"error": "Could not process resume file."}), 500

            # --- Step 2: Generate Initial Questions ---
            questions = generate_questions_from_text(extracted_text)

            # --- Clean up uploaded file after processing ---
            # You might want to keep it temporarily if needed for follow-up questions
            # Or implement a proper cleanup strategy
            # try:
            #     os.remove(filename)
            #     logging.info(f"Cleaned up file: {filename}")
            # except OSError as e:
            #     logging.error(f"Error removing file {filename}: {e}")


            return jsonify({
                "message": "Resume uploaded and processed.",
                "extracted_text_preview": extracted_text[:200] + "...", # Send a preview
                "questions": questions
                }), 200

        except Exception as e:
            logging.error(f"Error processing upload: {e}")
            # Clean up if saving failed mid-way (though less likely here)
            if os.path.exists(filename):
                 try:
                     os.remove(filename)
                 except OSError as remove_error:
                     logging.error(f"Error cleaning up file {filename} after error: {remove_error}")
            return jsonify({"error": "An internal error occurred during upload processing."}), 500
    else:
        return jsonify({"error": "File type not allowed"}), 400

@app.route('/api/analyze-face', methods=['POST'])
def analyze_face():
    """Receives image data from webcam and returns detected emotion."""
    try:
        data = request.get_json()
        if not data or 'imageData' not in data:
            return jsonify({"error": "No image data received"}), 400

        image_data_url = data['imageData']
        # The image data will likely be a base64 Data URL (e.g., "data:image/jpeg;base64,...")
        # You'll need to parse this and decode the base64 string
        # Example (basic parsing):
        # header, encoded = image_data_url.split(",", 1)
        # image_bytes = base64.b64decode(encoded)

        # --- !! Call Emotion Analysis Function !! ---
        emotion = analyze_emotion(image_data_url) # Pass the necessary data

        # --- !! Adapt Questions Based on Emotion (Placeholder) !! ---
        # This logic would likely involve maintaining interview state (e.g., current question)
        # and selecting the next question based on the detected emotion.
        next_question = "This is a follow-up question based on your (simulated) emotion: " + emotion
        if emotion == "nervous":
            next_question = "It's okay to take a moment. Can you tell me about a time you felt successful?"
        elif emotion == "confident":
             next_question = "Great! Let's dive deeper. Can you elaborate on your technical skills?"


        return jsonify({"emotion": emotion, "next_question": next_question}), 200

    except Exception as e:
        logging.error(f"Error analyzing face: {e}")
        return jsonify({"error": "Failed to analyze facial expression"}), 500


# --- Main Execution ---
if __name__ == '__main__':
    # Make sure the upload folder exists
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    # Run the app
    # Use host='0.0.0.0' to make it accessible on your network (use with caution)
    # Debug=True enables auto-reloading and detailed error pages (disable for production)
    app.run(debug=True, port=5000)
