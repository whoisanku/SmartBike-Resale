'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function Page() {
  // Simulate useRouter for navigation
  const router = {
    replace: (path) => { window.location.assign(path); },
    push: (path) => { window.location.assign(path); } // Using assign for full page reload for simplicity
  };

  const {id} = useParams();

  const [isChecking, setIsChecking] = useState(true);
  const [bikeDetails, setBikeDetails] = useState(null);
  const [loadingBike, setLoadingBike] = useState(true);
  const [errorBike, setErrorBike] = useState(null);
  const [message, setMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // 'success', 'error', null

  const [userInitials, setUserInitials] = useState('');
  // avatarSrc will now be set from localStorage if available
  const [avatarSrc, setAvatarSrc] = useState('');
  const [userDetails, setUserDetails] = useState({ _id: '', fullName: '', email: '' }); // Added _id to userDetails

  // Effect for authentication check and setting user details for avatar
  useEffect(() => {
    const timeout = setTimeout(() => {
      const token = localStorage.getItem('accessToken');
      // Retrieve the userDetails object from localStorage
      const storedUserDetailsString = localStorage.getItem('userDetails');
      let storedUserDetails = {};

      if (storedUserDetailsString) {
        try {
          storedUserDetails = JSON.parse(storedUserDetailsString);
        } catch (e) {
          console.error("Failed to parse userDetails from localStorage", e);
          // Handle corrupted data, e.g., clear it or set defaults
          localStorage.removeItem('userDetails');
        }
      }

      // Extract specific fields from the parsed userDetails object
      const userId = storedUserDetails._id; // Use _id from userDetails
      const storedFullName = storedUserDetails.fullName;
      const storedEmail = storedUserDetails.email;
      const storedAddress = storedUserDetails.address;

      const storedAvatar = storedUserDetails.avatar; // Get avatar from the userDetails object

      if (!token || !userId) {
        // Redirect to auth if not authenticated (or if essential user details are missing)
        router.replace('/auth');
      } else {
        setIsChecking(false); // Allow page to render
        // Set user details for display and email sending
        if (storedFullName) {
          const initials = storedFullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase();
          setUserInitials(initials);
        }
        if (storedAvatar) { // Set avatarSrc if avatar is found in the userDetails object
          setAvatarSrc(storedAvatar);
        }
        setUserDetails({
          _id: userId || '', // Set _id from userDetails
          fullName: storedFullName || 'Unknown User',
          email: storedEmail || 'unknown@example.com',
          address:storedAddress,
        });
      }
    }, 500); // Wait for 0.5 seconds for localStorage check

    return () => clearTimeout(timeout); // Cleanup timeout
  }, []); // router is now a local constant, so no need to include it in dependencies

  // Effect to fetch bike details once authentication is checked and id is available
  useEffect(() => {
    const fetchBikeDetails = async () => {
      if (!id || isChecking) return; // Don't fetch if id is not available or still checking auth

      setLoadingBike(true);
      setErrorBike(null);
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setErrorBike('Access token not found. Please log in.');
        setLoadingBike(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/bike/resale-bikes/${id}`, {
          headers: {
            
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch bike details.');
        }

        const data = await response.json();
        setBikeDetails(data.bike);
      } catch (err) {
        setErrorBike(err.message || 'An unexpected error occurred.');
      } finally {
        setLoadingBike(false);
      }
    };

    fetchBikeDetails();
  }, [id, isChecking]); // Dependencies for fetching bike details

  // Handle email submission
  const handleSendEmail = async (e) => {
    e.preventDefault(); // Prevent default form submission

    if (!message.trim()) {
      setEmailStatus('Please enter a message.');
      return;
    }
    if (!bikeDetails) {
      setEmailStatus('Bike details not loaded. Cannot send message.');
      return;
    }

    setSendingEmail(true);
    setEmailStatus(null);
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
      setEmailStatus('Authentication token missing. Please log in.');
      setSendingEmail(false);
      return;
    }
    // console.log(userDetails);
    try {
      const payload = {
        bike_name: bikeDetails.bike_name,
        bikeImage: bikeDetails.bikeImage && bikeDetails.bikeImage.length > 0 ? bikeDetails.bikeImage[0] : 'No image provided',
        listedBy: bikeDetails.listedBy,
        userDetails: userDetails, // Your full name, email, and _id from localStorage
        message: message.trim(),
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message.');
      }

      setEmailStatus('success');
      setMessage(''); // Clear message on success
    } catch (err) {
      setEmailStatus(`Error: ${err.message || 'An unexpected error occurred.'}`);
    } finally {
      setSendingEmail(false);
      setTimeout(() => setEmailStatus(null), 5000); // Clear status message after 5 seconds
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-lg flex items-center space-x-3">
          <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-700">Checking authentication...</span>
        </div>
      </div>
    );
  }

  if (loadingBike) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-lg flex items-center space-x-3">
          <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-blue-700">Loading bike details...</span>
        </div>
      </div>
    );
  }

  if (errorBike) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-100 rounded-lg mx-auto max-w-lg mt-10 shadow">
        <p className="font-semibold mb-2">Error loading bike details:</p>
        <p>{errorBike}</p>
        <button
          onClick={() => window.location.href = '/'} // Use direct href for simplicity
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Go to Home
        </button>
      </div>
    );
  }

  if (!bikeDetails) {
    return (
      <div className="p-8 text-center text-gray-600 bg-gray-100 rounded-lg mx-auto max-w-lg mt-10 shadow">
        <p>No bike details found for this ID.</p>
        <button
          onClick={() => window.location.href = '/'} // Use direct href for simplicity
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
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

      <main className="container mx-auto p-4 md:p-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden md:flex md:items-start md:space-x-8 p-6">
          {/* Bike Images Section */}
          <div className="md:w-1/2 flex flex-col items-center space-y-4">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 self-start md:hidden">
              {bikeDetails.brand} {bikeDetails.bike_name}
            </h2>
            {bikeDetails.bikeImage && bikeDetails.bikeImage.length > 0 ? (
              <img
                src={bikeDetails.bikeImage[0]}
                alt={`${bikeDetails.brand} ${bikeDetails.bike_name}`}
                className="w-full h-96 object-contain rounded-lg shadow-md border border-gray-200"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';
                }}
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 shadow-md">
                No Bike Image Available
              </div>
            )}
            {bikeDetails.billBookImage && bikeDetails.billBookImage.length > 0 && (
              <div className="w-full">
                <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Bill Book Image</h3>
                <img
                  src={bikeDetails.billBookImage[0]}
                  alt="Bill Book"
                  className="w-full h-auto max-h-64 object-contain rounded-lg shadow-md border border-gray-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/400x200/e2e8f0/64748b?text=No+Bill+Book+Image';
                  }}
                />
              </div>
            )}
          </div>

          {/* Bike Details Section */}
          <div className="md:w-1/2 mt-6 md:mt-0">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 hidden md:block">
              {bikeDetails.brand} {bikeDetails.bike_name}
            </h2>
            <p className="text-4xl font-bold text-green-700 mb-6">
              Rs. {bikeDetails.price.toLocaleString()}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-lg text-gray-700">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">Brand:</span>
                <span>{bikeDetails.brand}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">Model:</span>
                <span>{bikeDetails.bike_name}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">Year of Purchase:</span>
                <span>{bikeDetails.year_of_purchase}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">CC:</span>
                <span>{bikeDetails.cc}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">KMs Driven:</span>
                <span>{bikeDetails.kms_driven.toLocaleString()} KM</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">Owner Type:</span>
                <span>{bikeDetails.owner}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">Servicing:</span>
                <span>{bikeDetails.servicing}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">Engine Condition:</span>
                <span>{bikeDetails.engine_condition}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">Physical Condition:</span>
                <span>{bikeDetails.physical_condition}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">Tyre Condition:</span>
                <span>{bikeDetails.tyre_condition}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">Description:</span>
                <span>{bikeDetails.description}</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-xl font-semibold text-blue-800 mb-3">Listed By</h3>
              <p className="text-lg text-blue-700">
                <span className="font-medium">Name:</span> {bikeDetails.listedBy.fullName}
              </p>
              <p className="text-lg text-blue-700">
                <span className="font-medium">Email:</span> {bikeDetails.listedBy.email}
              </p>
              <p className="text-lg text-blue-700">
                <span className="font-medium">Address:</span> {bikeDetails.listedBy.address}
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="mt-10 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Contact Seller</h3>
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-lg font-medium text-gray-700 mb-2">
                Your Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="5"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400"
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              disabled={sendingEmail}
            >
              {sendingEmail && (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{sendingEmail ? 'Sending...' : 'Send Message'}</span>
            </button>
            {emailStatus && (
              <p className={`mt-3 text-center text-sm font-medium ${emailStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {emailStatus === 'success' ? 'Message sent successfully!' : emailStatus}
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
