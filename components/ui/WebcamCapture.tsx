// components/WebcamCapture.tsx
"use client";

import React, { useRef, useState } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const WebcamCapture = () => {
  const webcamRef = useRef<Webcam>(null);
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImage(imageSrc);
      removeBackground(imageSrc); // Call the background removal function
    }
  };

  const removeBackground = async (imageSrc: string) => {
    setLoading(true);
    try {
      const response = await axios.post(
        'https://api.remove.bg/v1.0/removebg',
        {
          image_file_b64: imageSrc.split(',')[1], // Extract the base64 part
          size: 'auto',
        },
        {
          headers: {
            'X-Api-Key': 'YOUR_API_KEY', // Replace with your API key
            'Content-Type': 'application/json',
          },
          responseType: 'arraybuffer', // Get the response as an array buffer
        }
      );

      const blob = new Blob([response.data], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      setProcessedImage(url); // Set the processed image URL
    } catch (error) {
      console.error('Error removing background:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    setProcessedImage(null);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        className="w-full max-w-md border-2 border-gray-300"
      />
      <div className="flex space-x-4 mt-4">
        <button
          onClick={capture}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Capture
        </button>
        <button
          onClick={clearImage}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Clear
        </button>
      </div>
      {loading && <p>Processing...</p>}
      {image && !loading && (
        <div className="mt-4">
          <h2 className="mb-2">Captured Image:</h2>
          <img
            src={image}
            alt="Captured"
            className="border-2 border-gray-300"
            style={{ width: '3cm', height: '3.5cm' }} // Set image dimensions
          />
        </div>
      )}
      {processedImage && (
        <div className="mt-4">
          <h2 className="mb-2">Processed Image:</h2>
          <div className="relative" style={{ width: '3cm', height: '3.5cm', background: 'white', overflow: 'hidden' }}>
            <img
              src={processedImage}
              alt="Processed"
              className="border-2 border-gray-300"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxWidth: 'none', // Disable scaling
                width: 'auto', // Adjust to fit
                height: 'auto', // Adjust to fit
                maxHeight: '100%', // Ensure it fits within the container
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WebcamCapture;
