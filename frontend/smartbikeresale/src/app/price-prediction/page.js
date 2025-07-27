"use client"; // This directive marks the component for client-side rendering in Next.js

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BrandInput from '@/components/BrandInput';
import BikeNameInput from '@/components/BikeNameInput';

// This is the main React component for the bike price prediction page.
const PricePrediction = () => {
  // Initialize Next.js router for navigation
  const router = useRouter();

  // State to store form input values for bike details
  const [formData, setFormData] = useState({
        brand:'',
        bike_name:'',
        year_of_purchase:'',
        cc:'',
        kms_driven:'',
        owner:'',
        servicing:'regular',
        engine_condition:'open',
        physical_condition:'fresh',
        tyre_condition:'good',
        description: '', 
  });

  // State to store the randomly predicted price, now editable by user
  const [predictedPrice, setPredictedPrice] = useState(null);
  // State to control the visibility of action buttons after price prediction
  const [showPredictionActions, setShowPredictionActions] = useState(false);
  // State to control the visibility of image upload fields
  const [showImageUploads, setShowImageUploads] = useState(false);
  // State to manage loading/processing feedback for API calls
  const [loading, setLoading] = useState(false);


  // States to store File objects for bill book and bike images (can be up to 2 each)
  // Each array will store File objects or null/undefined if a slot is empty/removed.
  const [billBookImages, setBillBookImages] = useState([]);
  const [bikeImages, setBikeImages] = useState([]);
  // State for displaying user feedback messages
  const [message, setMessage] = useState('');

  // useEffect hook to run once on component mount, checking localStorage for saved bike details.
  useEffect(() => {
    // Ensure window object is available (client-side rendering)
    if (typeof window !== 'undefined') {
      const storedBikeDetails = localStorage.getItem('bikeDetails');
      if (storedBikeDetails) {
        try {
          const parsedDetails = JSON.parse(storedBikeDetails);
          // Pre-fill the form with stored data
          setFormData(prev => ({
            ...prev,
            ...parsedDetails,
            // Ensure numeric fields are correctly set as strings for input value
            year_of_purchase: parsedDetails.year_of_purchase ? String(parsedDetails.year_of_purchase) : '',
            cc: parsedDetails.cc ? String(parsedDetails.cc) : '',
            kms_driven: parsedDetails.kms_driven ? String(parsedDetails.kms_driven) : '',
          }));
          // If a price was stored, display it and actions
          if (parsedDetails.price) {
            setPredictedPrice(parsedDetails.price); // Set the editable predicted price
            setShowPredictionActions(true);
          }
          // Note: File objects cannot be stored in localStorage.
          // If the user previously saved image URLs, we can pre-fill those,
          // but for type="file" inputs, the user will need to re-select files.
          // For now, we will clear previously stored URLs if any, as we're switching to file uploads.
          setBillBookImages([]);
          setBikeImages([]);

          // If the bike was on hold, show a message
          if (parsedDetails.hold) {
            setMessage("Your bike details are currently on hold. Please re-select images if you wish to list.");
          }
        } catch (e) {
          console.error("Failed to parse bikeDetails from localStorage", e);
          localStorage.removeItem('bikeDetails'); // Clear corrupted data to prevent issues
        }
      }
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Handles changes to form input fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handles changes to the editable predicted price input
  const handlePredictedPriceChange = (e) => {
    const value = e.target.value;
    const newPrice = value === '' ? null : Number(value);
    setPredictedPrice(newPrice);

    // Update local storage with the new predicted price
    if (typeof window !== 'undefined') {
      const storedBikeDetails = JSON.parse(localStorage.getItem('bikeDetails') || '{}');
      localStorage.setItem('bikeDetails', JSON.stringify({ ...storedBikeDetails, price: newPrice }));
    }
  };

  // Generic handler for adding a new file input slot (up to 2)
  const handleAddFileInput = (setter, currentImages) => {
    if (currentImages.length < 2) {
      setter(prev => [...prev, null]); // Add a null placeholder for a new file input slot
    }
  };

  // Generic handler for removing a file input slot
  const handleRemoveFileInput = (setter, index) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  // Generic handler for file input changes
  const handleFileChange = (setter, index, e) => {
    const files = e.target.files;
    setter(prev => {
      const newFiles = [...prev];
      if (files.length > 0) {
        newFiles[index] = files[0]; // Store the File object
      } else {
        newFiles[index] = null; // Clear the slot if selection is cancelled
      }
      return newFiles;
    });
  };

  // Handles the "Predict Price" button click
  const handlePredictPrice = () => {
  if(!predictedPrice){
    console.log("inside");
    const year = parseInt(formData.year_of_purchase);
  const cc = parseInt(formData.cc);
  const kms = parseInt(formData.kms_driven);

  if (isNaN(year) || isNaN(cc) || isNaN(kms)) {
    console.error("Please fill out all numeric fields correctly.");
    return;
  }

  const bikeData = {
    brand: formData.brand,
    bike_name: formData.bike_name,
    year_of_purchase: year,
    cc: cc,
    kms_driven: kms,
    owner: formData.owner,
    servicing: formData.servicing,
    engine_condition: formData.engine_condition,
    physical_condition: formData.physical_condition,
    tyre_condition: formData.tyre_condition
  };

  fetch('https://smartbike-resale-fastapi.onrender.com/predict', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bikeData)
  })
    .then(response => response.json())
    .then(data => {
      if (data.predicted_price) {
        const bikeDetailsToStore = {
          ...formData,
          price: data.predicted_price
        };

        if (typeof window !== 'undefined') {


          localStorage.setItem('bikeDetails', JSON.stringify(bikeDetailsToStore));
          setPredictedPrice(parseInt(data.predicted_price));
          setShowPredictionActions(true);
          

        }

        console.log("Price predicted and stored:", data.predicted_price);
      } else {
        console.error("Prediction Error:", data);
      }
    })
    .catch(error => {
      console.error("Fetch Error:", error);
    });
  }
};

  // Handles the "List the bike in marketplace" action
  const handleListBike = async () => {
    // Ensure this function only runs on the client-side
    if (typeof window === 'undefined') return;

    // Retrieve accessToken and userId from localStorage
    const accessToken = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    // Create a FormData object to send the data
    const formDataToSend = new FormData();

    // Append all form data fields, converting numeric ones
    for (const key in formData) {
      if (['year_of_purchase', 'cc', 'kms_driven'].includes(key)) {
        // Convert to Number. If it's an empty string or invalid, it will become NaN.
        // We'll append 0 if it's NaN, assuming 0 is an acceptable default for required numeric fields.
        const numValue = Number(formData[key]);
        formDataToSend.append(key, isNaN(numValue) ? 0 : numValue);
      } else {
        formDataToSend.append(key, formData[key]);
      }
    }

    // Append predicted price from the editable state
    if (predictedPrice !== null && !isNaN(predictedPrice)) {
      formDataToSend.append('price', predictedPrice);
    } else {
      // Handle case where predictedPrice is null or NaN (e.g., if user clears it)
      // You might want to add a validation error here or send a default.
      setMessage('Please enter a valid predicted price before listing.');
      return;
    }

    // Append bill book images (only actual File objects, filter out nulls)
    billBookImages.filter(Boolean).forEach((file) => {
      formDataToSend.append(`billBookImage`, file); // Backend should handle multiple files for same field name
    });

    // Append bike images (only actual File objects, filter out nulls)
    bikeImages.filter(Boolean).forEach((file) => {
      formDataToSend.append(`bikeImage`, file); // Backend should handle multiple files for same field name
    });

    // If access token or user ID is missing, redirect to login page
    if (!accessToken || !userId) {
      // Store all current details (excluding files) before redirecting
      // Files cannot be directly stored, so the user will need to re-select them after login.
      const bikeDataForStorage = {
        ...formData,
        price: predictedPrice,
      };
      localStorage.setItem('bikeDetails', JSON.stringify(bikeDataForStorage));
      return;
    }

    // If image upload fields are already visible, proceed with the API call
    if (showImageUploads) {
      // Check if at least one image is uploaded for listing
      if (billBookImages.filter(Boolean).length === 0 && bikeImages.filter(Boolean).length === 0) {
          setMessage('Please upload at least one image (bill book or bike) to list your bike.');
          return;
      }

      setLoading(true); // Set loading to true when starting the API call
      setMessage('Processing... Listing your bike.'); // Show processing message
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/bike/list-bike`, {
          method: 'POST',
          // When sending FormData, DO NOT set 'Content-Type' header.
          // The browser will automatically set it to 'multipart/form-data'
          // and include the correct boundary.
          headers: {
            'Authorization': `Bearer ${accessToken}`, // Include access token for authorization
          },
          body: formDataToSend, // Send FormData object directly
        });

        if (response.ok) {
          setMessage('Bike listed successfully!');
          localStorage.removeItem('bikeDetails'); // Clear bike details from localStorage after successful listing
          // Reset UI states and form fields
          setPredictedPrice(null);
          setShowPredictionActions(false);
          setShowImageUploads(false);
          setFormData({
            brand: '', bike_name: '', year_of_purchase: '', cc: '', kms_driven: '',
            owner: 'First', servicing: 'up to date', engine_condition: 'Excellent',
            physical_condition: 'Good', tyre_condition: 'Fair', description: '',
          });
          setBillBookImages([]); // Clear image files
          setBikeImages([]); // Clear image files
        } else {
          const errorData = await response.json(); // Assuming error responses are still JSON
          setMessage(`Failed to list bike: ${errorData.message || response.statusText}`);
          console.error('Failed to list bike:', errorData);
        }
      } catch (error) {
        setMessage('An error occurred while listing the bike. Please check your network.');
        console.error('Error listing bike:', error);
      } finally {
        setLoading(false); // Always set loading to false after the API call
      }
    } else {
      // First click on "List the bike": show image upload fields
      setShowImageUploads(true);
      setMessage('Please upload bill book and bike images to proceed with listing.');
    }
  };

  // Handles the "Don't want to list" action
  const handleDontList = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('bikeDetails'); // Remove bike details from localStorage
    }
    setMessage('Bike details cleared. You chose not to list.');
    // Reset UI states and form fields
    setPredictedPrice(null);
    setShowPredictionActions(false);
    setShowImageUploads(false);
    setFormData({
      brand: '', bike_name: '', year_of_purchase: '', cc: '', kms_driven: '',
      owner: 'First', servicing: 'up to date', engine_condition: 'Excellent',
      physical_condition: 'Good', tyre_condition: 'Fair', description: '',
    });
    setBillBookImages([]);
    setBikeImages([]);
  };

  // Handles the "Hold it" action
  const handleHold = () => {
    if (typeof window !== 'undefined') {
      const currentBikeDetails = JSON.parse(localStorage.getItem('bikeDetails') || '{}');
      // Add a 'hold: true' flag to the stored bike details.
      // Note: File objects cannot be stored in localStorage.
      // If the user selects 'Hold', they will need to re-select images when they return.
      localStorage.setItem('bikeDetails', JSON.stringify({
        ...currentBikeDetails,
        ...formData, // Ensure latest form data is saved
        price: predictedPrice, // Ensure latest predicted price is saved
        hold: true
      }));
    }
    setMessage('Bike details are now on hold. You can come back later to list it. Please note: image files are not saved with "hold" action and will need to be re-selected.');
    // Hide prediction actions and image uploads
    setShowPredictionActions(false);
    setShowImageUploads(false);
    // Clear selected files from state to avoid confusion when on hold
    setBillBookImages([]);
    setBikeImages([]);
  };

  // Handles the "Go Back" button click
  const handleGoBack = () => {
    router.push('/'); // Redirect to the home page
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-inter relative"> {/* Added relative positioning for the back button */}
      {/* Go Back Button */}
      <button
        onClick={handleGoBack}
        className="absolute top-4 left-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition duration-150 ease-in-out flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        Go Back
      </button>

      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl border border-gray-200">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">SmartBike-Resale: Predict Bike Price</h1>

        {/* Message display area */}
        {message && (
          <div className={`p-3 mb-4 rounded-md text-sm ${
            message.includes('success') ? 'bg-green-100 text-green-700' :
            message.includes('hold') ? 'bg-yellow-100 text-yellow-700' :
            message.includes('Failed') || message.includes('Error') || message.includes('valid predicted price') ? 'bg-red-100 text-red-700' :
            'bg-blue-100 text-blue-700'
          } border ${
            message.includes('success') ? 'border-green-200' :
            message.includes('hold') ? 'border-yellow-200' :
            message.includes('Failed') || message.includes('Error') || message.includes('valid predicted price') ? 'border-red-200' :
            'border-blue-200'
          }`}>
            {message}
          </div>
        )}

        {/* Bike Details Input Form */}
        <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Brand */}
          <div>
                                      <BrandInput bikeData={formData} setBikeData={setFormData} />
            
          </div>

          {/* Bike Name */}
          <div>
                                 <BikeNameInput bikeData={formData} setBikeData={setFormData} />
        
          </div>

          {/* Year of Purchase */}
          <div>
            <label htmlFor="year_of_purchase" className="block text-sm font-medium text-gray-700">Year of Purchase</label>
            <input
              type="number"
              id="year_of_purchase"
              name="year_of_purchase"
              value={formData.year_of_purchase}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out placeholder:text-gray-200 text-gray-500"
              placeholder="e.g., 2020"
            />
          </div>

          {/* CC */}
          <div>
            <label htmlFor="cc" className="block text-sm font-medium text-gray-700">CC</label>
            <input
              type="number"
              id="cc"
              name="cc"
              value={formData.cc}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out placeholder:text-gray-200 text-gray-500"
              placeholder="e.g., 250"
            />
          </div>

          {/* KMs Driven */}
          <div>
            <label htmlFor="kms_driven" className="block text-sm font-medium text-gray-700">KMs Driven</label>
            <input
              type="number"
              id="kms_driven"
              name="kms_driven"
              value={formData.kms_driven}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out placeholder:text-gray-200 text-gray-500"
              placeholder="e.g., 18000"
            />
          </div>

          {/* Owner */}
          <div>
            <label htmlFor="owner" className="block text-sm font-medium text-gray-700">Owner</label>
            <select
              id="owner"
              name="owner"
              value={formData.owner}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out text-gray-500 "
            >
              <option value="">Select Owner Type</option>
             
              <option value="First Owner">First Owner</option>
              <option value="Second Owner">Second Owner</option>
              <option value="Third Owner">Third Owner</option>
              <option value="Fourth Owner Or More">Fourth Owner Or More</option>
            </select>
          </div>

          {/* Servicing */}
          <div>
            <label htmlFor="servicing" className="block text-sm font-medium text-gray-700">Servicing</label>
            <select
              id="servicing"
              name="servicing"
              value={formData.servicing}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out text-gray-500"
            >
              <option value="">select</option>

              <option value="regular">regular</option>
              <option value="irregular">irregular</option>
            </select>
          </div>

          {/* Engine Condition */}
          <div>
            <label htmlFor="engine_condition" className="block text-sm font-medium text-gray-700">Engine Condition</label>
            <select
              id="engine_condition"
              name="engine_condition"
              value={formData.engine_condition}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out text-gray-500"
            >
              <option value="">select</option>
              <option value="open">opened</option>
              <option value="seal">seal</option>
            </select>
          </div>

          {/* Physical Condition */}
<div>
  <label htmlFor="physical_condition" className="block text-sm font-medium text-gray-700">
    Physical Condition
    <span className="block text-xs font-normal text-gray-500">
      Choose based on body scratches, appearance, and overall condition.
    </span>
  </label>
  <select
    id="physical_condition"
    name="physical_condition"
    value={formData.physical_condition}
    onChange={handleChange}
    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out text-gray-500"
  >
    <option value="">Select Condition</option>
    <option value="fresh">Fresh – Looks almost unused, no visible damage</option>
    <option value="like new">Like New – Minimal use, very minor signs of wear</option>
    <option value="old">Old – Noticeable wear, minor scratches or faded paint</option>
    <option value="very old">Very Old – Heavy usage signs, visible damage or rust</option>
  </select>
</div>

{/* Tyre Condition */}
<div>
  <label htmlFor="tyre_condition" className="block text-sm font-medium text-gray-700">
    Tyre Condition
    <span className="block text-xs font-normal text-gray-500">
      Choose based on tread depth and usage.
    </span>
  </label>
  <select
    id="tyre_condition"
    name="tyre_condition"
    value={formData.tyre_condition}
    onChange={handleChange}
    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out text-gray-500"
  >
    <option value="">Select Condition</option>
    <option value="new">New – Recently replaced, full tread, no signs of wear</option>
    <option value="good">Good – Moderate usage, safe tread depth remaining</option>
    <option value="worn">Worn – Low tread, cracks or signs of replacement needed</option>
  </select>
</div>


          {/* Description */}
          <div className="md:col-span-2"> {/* Span across two columns */}
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out placeholder:text-gray-500 text-gray-500"
              placeholder="e.g., Well-maintained bike with regular servicing. Minor scratches on the side."
            ></textarea>
          </div>
        </form>

        {/* Predict Price Button */}
        <button
          onClick={handlePredictPrice}
          className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
        >
          Predict Price
        </button>

        {/* Display Predicted Price and Actions */}
        {predictedPrice !== null && (
          <div className="mt-8 text-center bg-indigo-50 p-6 rounded-lg border border-indigo-200 animate-fade-in">
            <h2 className="text-xl font-semibold text-gray-800">Predicted Resale Price:</h2>
            <div className="mt-2 flex justify-center items-center">
              <span className="text-4xl font-extrabold text-indigo-600 mr-2">NPR</span>
              <input
                type="Number"
                value={predictedPrice}
                onChange={handlePredictedPriceChange}
                disabled={loading} // Disable editing while loading
                className="w-48 text-4xl font-extrabold text-indigo-600 bg-transparent border-b-2 border-indigo-400 focus:border-indigo-600 focus:outline-none text-center transition duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
              />
            </div>

            {showPredictionActions && (
              <div className="mt-6">
                <p className="text-md text-gray-700 mb-4">What would you like to do next?</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={handleListBike}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
                  >
                    List the bike in marketplace
                  </button>
                  <button
                    onClick={handleDontList}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                  >
                    Don't want to list
                  </button>
                  <button
                    onClick={handleHold}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-150 ease-in-out"
                  >
                    Hold it
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Upload Section (conditionally rendered) */}
        {showImageUploads && (
          <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-200 animate-fade-in">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload Images for Listing</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please select your image files. Note that file selections are not persisted if you choose to "Hold it" or navigate away.
            </p>
            
            {/* Bill Book Images Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bill Book Images (Max 2 Files)</label>
              {billBookImages.map((file, index) => (
                <div key={`billbook-${index}`} className="flex items-center gap-2 mb-2">
                  <input
                    type="file"
                    accept="image/*" // Restrict to image files
                    onChange={(e) => handleFileChange(setBillBookImages, index, e)}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition duration-150 ease-in-out"
                  />
                  {file && <span className="text-sm text-gray-700 truncate">{file.name}</span>}
                  <button
                    type="button"
                    onClick={() => handleRemoveFileInput(setBillBookImages, index)}
                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                    title="Remove Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm2 4a1 1 0 10-2 0v3a1 1 0 102 0v-3zm4-1a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              {billBookImages.length < 2 && (
                <button
                  type="button"
                  onClick={() => handleAddFileInput(setBillBookImages, billBookImages)}
                  className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                >
                  Add Bill Book Image
                </button>
              )}
            </div>

            {/* Bike Images Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Bike Images (Max 2 Files)</label>
              {bikeImages.map((file, index) => (
                <div key={`bike-${index}`} className="flex items-center gap-2 mb-2">
                  <input
                    type="file"
                    accept="image/*" // Restrict to image files
                    onChange={(e) => handleFileChange(setBikeImages, index, e)}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition duration-150 ease-in-out"
                  />
                  {file && <span className="text-sm text-gray-700 truncate">{file.name}</span>}
                  <button
                    type="button"
                    onClick={() => handleRemoveFileInput(setBikeImages, index)}
                    className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-150 ease-in-out"
                    title="Remove Image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm2 4a1 1 0 10-2 0v3a1 1 0 102 0v-3zm4-1a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
              {bikeImages.length < 2 && (
                <button
                  type="button"
                  onClick={() => handleAddFileInput(setBikeImages, bikeImages)}
                  className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                >
                  Add Bike Image
                </button>
              )}
            </div>

            {/* Confirm Listing Button (triggers API call) */}
            <button
              onClick={handleListBike}
              disabled={loading} // Disable button while loading
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Confirm Listing'} {/* Show loading text */}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricePrediction;

