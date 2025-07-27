'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

import BrandInput from '@/components/BrandInput';

import BikeNameInput from '@/components/BikeNameInput';

// A simple Modal component for user feedback (instead of alert/confirm)
const Modal = ({ message, onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
        <p className="text-lg font-semibold text-gray-800 mb-4">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Page() {
  // Replace Next.js useRouter with direct window.location for navigation
  const navigateTo = (path) => {
    window.location.href = path;
  };



  const { id } = useParams(); 
  const [isChecking, setIsChecking] = useState(true);
  const [loading, setLoading] = useState(true); // Loading state for initial data fetch
  const [updating, setUpdating] = useState(false); // Loading state for form submission
  const [error, setError] = useState(null);
  const [bikeData, setBikeData] = useState({
    brand: '',
    bike_name: '',
    year_of_purchase: '',
    cc: '',
    kms_driven: '',
    owner: '',
    servicing: 'regular',
    engine_condition: 'open',
    physical_condition: 'fresh',
    tyre_condition: 'good',
    price: '',
  });
  // Store initial data to compare for changes
  const [initialBikeData, setInitialBikeData] = useState({});
  // For new file uploads
  const [newBikeImages, setNewBikeImages] = useState([]); // Array of File objects
  const [newBillBookImages, setNewBillBookImages] = useState([]); // Array of File objects
  // For existing image URLs fetched from the backend
  const [existingBikeImageUrls, setExistingBikeImageUrls] = useState([]);
  const [existingBillBookImageUrls, setExistingBillBookImageUrls] = useState([]);

  // State for modal
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');



  // Mock avatar data for header (replace with actual user context in a real app)
  const avatarSrc = null; // Replace with actual avatar URL if available
  const userInitials = 'p'; // Replace with actual user initials (e.g., from user's name)

  const showUserMessage = (message) => {
    setModalMessage(message);
    setShowModal(true);
  };

  const closeUserMessage = () => {
    setShowModal(false);
    setModalMessage('');
  };

  // Mock function to simulate image upload to Cloudinary or a similar service
  // In a real application, this would interact with your actual image upload API.
  const uploadImagesToCloudinary = async (files) => {
    if (!files || files.length === 0) return [];

    const uploadedUrls = [];
    // Simulate API call delay and return mock URLs
    for (const file of files) {
      // In a real app:
      // const formData = new FormData();
      // formData.append('file', file);
      // formData.append('upload_preset', 'your_upload_preset'); // Your Cloudinary upload preset
      // const response = await fetch('https://api.cloudinary.com/v1_1/your_cloud_name/image/upload', {
      //   method: 'POST',
      //   body: formData,
      // });
      // const data = await response.json();
      // uploadedUrls.push(data.secure_url);

      // Mocking the upload success:
      const mockUrl = `https://placehold.co/150x100/A0B2C3/FFFFFF?text=${file.name.substring(0, 10)}`;
      uploadedUrls.push(mockUrl);
    }
    return uploadedUrls;
  };

  // Fetch bike details
  const fetchBikeDetails = useCallback(async (id, accessToken) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/bike/resale-bikes/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bike details: ${response.statusText}`);
      }

      const data = await response.json();
      setBikeData(data.bike);
      setInitialBikeData(data.bike); // Store original data for comparison
      setExistingBikeImageUrls(data.bike.bikeImage || []);
      setExistingBillBookImageUrls(data.bike.billBookImage || []);
    } catch (err) {
      setError(err.message);
      showUserMessage(`Error fetching bike details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Authentication check and initial data fetch
  useEffect(() => {
    const timeout = setTimeout(() => {
      const token = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        navigateTo('/auth'); // Use navigateTo for redirection
      } else {
        setIsChecking(false); // Allow page to render
        if (id) {
          fetchBikeDetails(id, token);
        } else {
          setError('Bike ID not found in URL.');
          showUserMessage('Error: Bike ID not found in URL.');
          setLoading(false);
        }
      }
    }, 500); // Wait for a short period before checking auth

    return () => clearTimeout(timeout); // Cleanup timeout
  }, [id, fetchBikeDetails]); // Dependencies for useEffect

  // Handle input changes for text/number fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBikeData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle file input changes for images
  const handleFileChange = (e, imageType) => {
    const files = Array.from(e.target.files);
    if (imageType === 'bikeImage') {
      if (files.length + existingBikeImageUrls.length + newBikeImages.length > 2) {
        showUserMessage('You can upload a maximum of 2 bike images (including existing ones).');
        e.target.value = null; // Clear the input
        return;
      }
      setNewBikeImages((prev) => [...prev, ...files]);
    } else if (imageType === 'billBookImage') {
      if (files.length + existingBillBookImageUrls.length + newBillBookImages.length > 2) {
        showUserMessage('You can upload a maximum of 2 bill book images (including existing ones).');
        e.target.value = null; // Clear the input
        return;
      }
      setNewBillBookImages((prev) => [...prev, ...files]);
    }
  };

  // Handle removing an existing image URL
  const handleRemoveExistingImage = (urlToRemove, imageType) => {
    if (imageType === 'bikeImage') {
      setExistingBikeImageUrls((prev) => prev.filter((url) => url !== urlToRemove));
    } else if (imageType === 'billBookImage') {
      setExistingBillBookImageUrls((prev) => prev.filter((url) => url !== urlToRemove));
    }
  };

  // Handle removing a newly selected file (before upload)
  const handleRemoveNewFile = (fileToRemove, imageType) => {
    if (imageType === 'bikeImage') {
      setNewBikeImages((prev) => prev.filter((file) => file !== fileToRemove));
    } else if (imageType === 'billBookImage') {
      setNewBillBookImages((prev) => prev.filter((file) => file !== fileToRemove));
    }
  };


   // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      showUserMessage('Authentication token not found. Please log in again.');
      navigateTo('/auth'); // Using navigateTo for redirection
      setUpdating(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('bikeId', id); // Append bikeId to formData

      // Append changed text/number fields
      // Convert to string for comparison to handle number vs string type differences from input
      for (const key in bikeData) {
        if (String(bikeData[key]) !== String(initialBikeData[key]) && bikeData[key] !== null) {
          formData.append(key, bikeData[key]);
        }
      }

      // Append new image files
      newBikeImages.forEach((file) => {
        formData.append('bikeImage', file); // Use the same field name for multiple files
      });
      newBillBookImages.forEach((file) => {
        formData.append('billBookImage', file); // Use the same field name for multiple files
      });

      // Append existing image URLs that are still active
      // These will be sent as a JSON string. The backend will need to parse this string
      // and reconcile it with any new files uploaded.
      if (existingBikeImageUrls.length > 0) {
        formData.append('existingBikeImageUrls', JSON.stringify(existingBikeImageUrls));
      }
      if (existingBillBookImageUrls.length > 0) {
        formData.append('existingBillBookImageUrls', JSON.stringify(existingBillBookImageUrls));
      }

      // Make the fetch request with FormData
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/bike/list-bike/edit`, {
        method: 'POST',
        // IMPORTANT: Do NOT set 'Content-Type': 'multipart/form-data' explicitly.
        // The browser sets it automatically with the correct boundary when FormData is used as body.
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          // 'Content-Type' is omitted here for FormData
        },
        body: formData, // Send FormData directly
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update bike listing');
      }

      showUserMessage('Bike listing updated successfully!');
      navigateTo('/my-listings'); // Redirect back to my listings page
    } catch (err) {
      setError(err.message);
      showUserMessage(`Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-4 text-gray-500 text-lg font-medium">
          Checking authentication...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-4 text-gray-500 text-lg font-medium">
          Loading bike data...
        </div>
      </div>
    );
  }

  if (error && !showModal) { // Show error temporarily if not already showing in modal
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-4 text-red-600 text-lg font-medium">
          Error: {error}
        </div>
        <Modal message={modalMessage} onClose={closeUserMessage} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-inter">
      <header className="bg-white shadow-md p-4 flex justify-between items-center px-6">
        {/* Logo */}
        <div className="flex items-center">
          <a href="/" className="text-sm md:text-2xl font-bold text-gray-800 tracking-tight ml-[-1rem]">
            smartBike-Resale
          </a>
        </div>

        {/* Right-hand side: My Listings and Profile */}
        <nav className="flex items-center space-x-2 md:space-x-6 w-[185px] md:w-[22rem] mr-[-1rem]">
          <a href="/price-prediction" className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200 w-full text-[10px] md:text-xl">
            Predict & List
          </a>


          <a href="/my-listings" className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200 text-sm w-full text-[10px] md:text-xl">
            My Listings
          </a>

          {/* Profile Circle Div */}
          <a href="/profile" className="block relative">
            <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-bold text-lg overflow-hidden border-2 border-purple-400 shadow-sm">
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarSrc}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://placehold.co/40x40/a78bfa/ffffff?text=${userInitials}`;
                  }}
                />
              ) : (
                <span className="text-purple-800">{userInitials}</span>
              )}
            </div>
          </a>
        </nav>
      </header>

      <main className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Edit Bike Listing</h1>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg max-w-3xl mx-auto space-y-6">
          {/* General Bike Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
      
            <BrandInput bikeData={bikeData} setBikeData={setBikeData} />

            
           
          </div>
            <div>
             
            <BikeNameInput bikeData={bikeData} setBikeData={setBikeData} />
            </div>
            <div>
              <label htmlFor="year_of_purchase" className="block text-sm font-medium text-gray-700 mb-1">Year of Purchase</label>
              <input
                type="number"
                id="year_of_purchase"
                name="year_of_purchase"
                value={bikeData.year_of_purchase}
                onChange={handleChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm text-gray-500"
                required
              />
            </div>
            <div>
              <label htmlFor="cc" className="block text-sm font-medium text-gray-700 mb-1">CC</label>
              <input
                type="number"
                id="cc"
                name="cc"
                value={bikeData.cc}
                onChange={handleChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm text-gray-500"
                required
              />
            </div>
            <div>
              <label htmlFor="kms_driven" className="block text-sm font-medium text-gray-700 mb-1">Kms Driven</label>
              <input
                type="number"
                id="kms_driven"
                name="kms_driven"
                value={bikeData.kms_driven}
                onChange={handleChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm text-gray-500"
                required
              />
            </div>
            <div>
              <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select
                id="owner"
                name="owner"
                value={bikeData.owner}
                onChange={handleChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm text-gray-500"
                required
              >
                <option value="">Select owner type</option>
                <option value="First Owner">First Owner</option>
                <option value="Second Owner">Second Owner</option>
                <option value="Third Owner">Third Owner</option>
                <option value="Third Owner Or More">Third Owner Or More</option>
              </select>
            </div>
          </div>

          {/* Condition Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="servicing" className="block text-sm font-medium text-gray-700 mb-1">Servicing</label>
              <select
                id="servicing"
                name="servicing"
                value={bikeData.servicing}
                onChange={handleChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm text-gray-500"
                required
              >
                <option value="regular">regular</option>
                <option value="irregular">irregular</option>
              </select>
            </div>
            <div>
              <label htmlFor="engine_condition" className="block text-sm font-medium text-gray-700 mb-1">Engine Condition</label>
              <select
                id="engine_condition"
                name="engine_condition"
                value={bikeData.engine_condition}
                onChange={handleChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm text-gray-500"
                required
              >
                <option value="open">open</option>
                <option value="seal">seal</option>
              </select>
            </div>
            <div>
              <label htmlFor="physical_condition" className="block text-sm font-medium text-gray-700 mb-1">Physical Condition</label>
              <select
                id="physical_condition"
                name="physical_condition"
                value={bikeData.physical_condition}
                onChange={handleChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm text-gray-500"
                required
              >
                <option value="fresh">fresh</option>
                <option value="like new">like new</option>
                <option value="old">old</option>
                <option value="very old">very old</option>
              </select>
            </div>
            <div>
              <label htmlFor="tyre_condition" className="block text-sm font-medium text-gray-700 mb-1">Tyre Condition</label>
              <select
                id="tyre_condition"
                name="tyre_condition"
                value={bikeData.tyre_condition}
                onChange={handleChange}
                className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm text-gray-500"
                required
              >
                <option value="good">good</option>
                <option value="new">new</option>
                <option value="worn">worn</option>
              </select>
            </div>
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              value={bikeData.price}
              onChange={handleChange}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm text-gray-500"
              required
            />
          </div>

                    {/* description */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="string"
              id="description"
              name="description"
              value={bikeData.description}
              onChange={handleChange}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out sm:text-sm text-gray-500"
              required
            />
          </div>

          {/* Image Uploads */}
          <div className="space-y-4">
            {/* Bike Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bike Images (Max 2)</label>
              <input
                type="file"
                id="bikeImage"
                name="bikeImage"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, 'bikeImage')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50  file:text-blue-700 hover:file:bg-blue-100 transition duration-150 ease-in-out"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                {existingBikeImageUrls.map((url, index) => (
                  <div key={`existing-bike-${index}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                    <img src={url} alt={`Bike ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(url, 'bikeImage')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                      aria-label="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {newBikeImages.map((file, index) => (
                  <div key={`new-bike-${index}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-blue-300 shadow-sm">
                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewFile(file, 'bikeImage')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                      aria-label="Remove new image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Bill Book Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bill Book Images (Max 2)</label>
              <input
                type="file"
                id="billBookImage"
                name="billBookImage"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, 'billBookImage')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition duration-150 ease-in-out"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                {existingBillBookImageUrls.map((url, index) => (
                  <div key={`existing-billbook-${index}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                    <img src={url} alt={`Bill Book ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(url, 'billBookImage')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                      aria-label="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                {newBillBookImages.map((file, index) => (
                  <div key={`new-billbook-${index}`} className="relative w-24 h-24 rounded-lg overflow-hidden border border-blue-300 shadow-sm">
                    <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewFile(file, 'billBookImage')}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 text-xs hover:bg-red-600"
                      aria-label="Remove new image"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className={`w-full md:w-auto px-8 py-3 rounded-md font-semibold text-white transition-colors duration-200 ${
                updating ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
              }`}
              disabled={updating}
            >
              {updating ? 'Updating...' : 'Update Listing'}
            </button>
          </div>
        </form>
      </main>

      {/* Modal for messages */}
      <Modal message={modalMessage} onClose={closeUserMessage} />
    </div>
  );
}
