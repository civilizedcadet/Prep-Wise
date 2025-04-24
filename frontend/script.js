// frontend/script.js

// --- DOM Element References ---
// Get references to the HTML elements we need to interact with
const resumeUpload = document.getElementById('resumeUpload');
const submitResumeBtn = document.getElementById('submitResume');
const uploadStatus = document.getElementById('uploadStatus');
const startCameraBtn = document.getElementById('startCamera');
const webcamFeed = document.getElementById('webcamFeed');
const cameraError = document.getElementById('cameraError');
const cameraLoading = document.getElementById('cameraLoading');
const interviewArea = document.getElementById('interviewArea');
const loadingSpinner = document.getElementById('loadingSpinner');
const questionDisplay = document.getElementById('questionDisplay');
const currentQuestion = document.getElementById('currentQuestion');
const interviewStatus = document.getElementById('interviewStatus');
const nextQuestionBtn = document.getElementById('nextQuestionBtn');
const emotionStatus = document.getElementById('emotionStatus');
const detectedEmotion = document.getElementById('detectedEmotion');


// --- State Variables ---
// Variables to keep track of the application's state
let questions = []; // Array to hold questions received from the backend
let currentQuestionIndex = -1; // Index of the currently displayed question
let stream = null; // To hold the camera media stream object
let emotionAnalysisInterval = null; // To hold the interval ID for periodic analysis
const BACKEND_URL = 'http://127.0.0.1:5000'; // URL of the Flask backend server

// --- Event Listeners ---
// Attach functions to button clicks
startCameraBtn.addEventListener('click', setupCamera);
submitResumeBtn.addEventListener('click', handleResumeUpload);
nextQuestionBtn.addEventListener('click', displayNextQuestion);

// --- Functions ---

/**
 * @function setupCamera
 * Asynchronously requests access to the user's webcam.
 */
async function setupCamera() {
    // Clear previous errors and update status
    cameraError.textContent = '';
    cameraLoading.textContent = 'Starting Camera...';
    cameraLoading.style.display = 'block'; // Show loading indicator
    webcamFeed.style.display = 'none'; // Hide video element while loading
    startCameraBtn.disabled = true; // Disable button during setup

    try {
        // Stop any existing stream before starting a new one
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        // Request video stream from the browser
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        // Assign the stream to the video element
        webcamFeed.srcObject = stream;
        webcamFeed.style.display = 'block'; // Show video element
        cameraLoading.style.display = 'none'; // Hide loading text
        cameraError.textContent = ''; // Clear any previous errors
        startCameraBtn.textContent = 'Camera Active'; // Update button text
        startCameraBtn.classList.remove('bg-accent-teal'); // Change button color
        startCameraBtn.classList.add('bg-green-600');

        // Start emotion analysis loop ONLY if the interview has already started
        if (currentQuestionIndex >= 0) {
            startEmotionAnalysis();
        }

    } catch (err) {
        // Handle errors (e.g., user denies permission)
        console.error("Error accessing camera:", err);
        cameraError.textContent = `Error: ${err.name}. Please ensure camera access is allowed in your browser settings.`;
        cameraLoading.textContent = 'Camera Error';
        cameraLoading.style.display = 'block';
        webcamFeed.style.display = 'none';
        startCameraBtn.disabled = false; // Re-enable button
        startCameraBtn.textContent = 'Retry Camera'; // Update button text
    }
}

/**
 * @function handleResumeUpload
 * Handles the resume file selection, sends it to the backend,
 * and processes the response (questions).
 */
async function handleResumeUpload() {
    const file = resumeUpload.files[0]; // Get the selected file
    // Check if a file was selected
    if (!file) {
        uploadStatus.textContent = 'Please select a resume file first.';
        uploadStatus.style.color = 'red';
        return;
    }

    // --- Update UI for loading state ---
    submitResumeBtn.disabled = true; // Disable upload button
    nextQuestionBtn.disabled = true; // Disable next question button
    uploadStatus.textContent = 'Uploading and processing resume...';
    uploadStatus.style.color = 'gray';
    interviewArea.classList.add('hidden'); // Hide interview section
    loadingSpinner.classList.remove('hidden'); // Show main loading spinner
    questionDisplay.classList.add('hidden'); // Hide question area while loading

    // Create FormData to send the file
    const formData = new FormData();
    formData.append('resume', file); // 'resume' must match the key expected by Flask

    try {
        // Send the file to the backend API endpoint
        const response = await fetch(`${BACKEND_URL}/api/upload-resume`, {
            method: 'POST',
            body: formData, // Send the form data containing the file
        });

        // Parse the JSON response from the backend
        const data = await response.json();

        // Check if the request was successful
        if (!response.ok) {
            // If not okay, throw an error with the message from the backend
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        // --- Process successful response ---
        console.log("Resume processed:", data);
        uploadStatus.textContent = `Resume processed! Preview: ${data.extracted_text_preview}`;
        uploadStatus.style.color = 'green';
        questions = data.questions || []; // Store the received questions
        currentQuestionIndex = -1; // Reset question index for the new interview

        if (questions.length > 0) {
            // If questions were generated, show the interview area
            interviewArea.classList.remove('hidden');
            loadingSpinner.classList.add('hidden'); // Hide spinner
            questionDisplay.classList.remove('hidden'); // Show question area
            displayNextQuestion(); // Display the first question
            submitResumeBtn.textContent = 'Interview Started'; // Update button text

            // Enable the 'Next Question' button if there's more than one question
            nextQuestionBtn.disabled = questions.length <= 1;

            // Start emotion analysis automatically if the camera is already active
            if (stream) {
                startEmotionAnalysis();
            } else {
                 interviewStatus.textContent = "Enable camera for emotion analysis.";
            }

        } else {
            // Handle case where no questions were generated
            interviewArea.classList.remove('hidden'); // Still show area for message
            loadingSpinner.classList.add('hidden');
            questionDisplay.classList.remove('hidden');
            currentQuestion.textContent = 'Could not generate questions from the resume.';
            interviewStatus.textContent = 'Please try uploading a different resume.';
            submitResumeBtn.disabled = false; // Re-enable upload button
            submitResumeBtn.textContent = 'Start Interview';
        }

    } catch (error) {
        // Handle errors during upload or processing
        console.error('Error uploading resume:', error);
        uploadStatus.textContent = `Error: ${error.message}`;
        uploadStatus.style.color = 'red';
        loadingSpinner.classList.add('hidden'); // Hide spinner
        submitResumeBtn.disabled = false; // Re-enable upload button
        submitResumeBtn.textContent = 'Start Interview';
    }
}

/**
 * @function displayNextQuestion
 * Displays the next question in the list or an end message.
 */
function displayNextQuestion() {
    currentQuestionIndex++; // Move to the next question index
    if (currentQuestionIndex < questions.length) {
        // If there are more questions, display the current one
        currentQuestion.textContent = questions[currentQuestionIndex];
        interviewStatus.textContent = `Question ${currentQuestionIndex + 1} of ${questions.length}`;
        // Disable the 'Next' button if this is the last question
        nextQuestionBtn.disabled = currentQuestionIndex >= questions.length - 1;
    } else {
        // If all questions are finished
        currentQuestion.textContent = "Interview finished!";
        interviewStatus.textContent = "You've completed all questions.";
        nextQuestionBtn.disabled = true; // Disable 'Next' button
        stopEmotionAnalysis(); // Stop analyzing emotions
    }
}

/**
 * @function startEmotionAnalysis
 * Starts periodically capturing frames from the webcam and sending them
 * to the backend for emotion analysis.
 */
function startEmotionAnalysis() {
    // Clear any existing interval to prevent duplicates
    if (emotionAnalysisInterval) {
        clearInterval(emotionAnalysisInterval);
    }
    // Check if the camera stream is active
    if (!stream) {
        console.log("Camera not active, cannot start emotion analysis.");
        detectedEmotion.textContent = 'Camera off';
        return;
    }

    console.log("Starting emotion analysis loop...");
    detectedEmotion.textContent = "Analyzing...";

    // Set an interval to run the analysis function repeatedly
    emotionAnalysisInterval = setInterval(async () => {
        // Double-check stream and if video has dimensions (is playing)
        if (!stream || !webcamFeed.videoWidth) return;

        // Create a temporary canvas to draw the current video frame
        const canvas = document.createElement('canvas');
        canvas.width = webcamFeed.videoWidth; // Match video dimensions
        canvas.height = webcamFeed.videoHeight;
        const ctx = canvas.getContext('2d');

        // Draw the current frame from the <video> element onto the canvas
        // Flip the image horizontally back to normal before sending (because the CSS mirrors it)
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(webcamFeed, 0, 0, canvas.width, canvas.height);

        // Get the image data from the canvas as a base64-encoded JPEG Data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg');

        try {
            // Send the image data to the backend's analysis endpoint
            const response = await fetch(`${BACKEND_URL}/api/analyze-face`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Indicate we're sending JSON
                },
                // Send the base64 image data within a JSON object
                body: JSON.stringify({ imageData: imageDataUrl }),
            });

            // Check if the backend responded successfully
            if (!response.ok) {
                 const errorData = await response.json(); // Try to get error details
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            // Parse the JSON response containing the emotion
            const data = await response.json();
            console.log("Emotion analysis result:", data);
            // Update the UI with the detected emotion
            detectedEmotion.textContent = data.emotion || 'N/A';

            // --- ADAPTIVE QUESTION LOGIC (Placeholder/Example) ---
            // The backend might send a suggestion for the next question based on emotion.
            // You could implement logic here to use that suggestion.
            if (data.next_question) {
                 console.log("Backend suggested next question based on emotion:", data.next_question);
                 // Example: Update an upcoming question (more complex state needed)
                 // if (currentQuestionIndex + 1 < questions.length) {
                 //     questions[currentQuestionIndex + 1] = data.next_question;
                 // }
                 // Or display feedback directly:
                 // interviewStatus.textContent += ` (System suggests: ${data.next_question})`;
            }
            // --- End Adaptive Logic ---

        } catch (error) {
            // Handle errors during the analysis request
            console.error('Error sending frame for analysis:', error);
            detectedEmotion.textContent = 'Error';
            // Optionally stop analysis after repeated errors to avoid flooding logs/network
            // stopEmotionAnalysis();
            // console.log("Stopping analysis due to repeated errors.");
        }

    }, 5000); // Set interval time: analyze every 5000ms (5 seconds)
}

/**
 * @function stopEmotionAnalysis
 * Clears the interval timer for emotion analysis.
 */
function stopEmotionAnalysis() {
    if (emotionAnalysisInterval) {
        clearInterval(emotionAnalysisInterval); // Stop the repeating timer
        emotionAnalysisInterval = null; // Reset the interval variable
        console.log("Stopped emotion analysis loop.");
        detectedEmotion.textContent = 'Inactive'; // Update UI status
    }
}

// --- Initial UI State ---
// Set the initial visibility of some elements when the page loads
webcamFeed.style.display = 'none'; // Hide video element initially
cameraLoading.style.display = 'block'; // Show the camera placeholder text
