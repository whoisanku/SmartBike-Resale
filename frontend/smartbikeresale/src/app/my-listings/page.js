'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2'; // Import SweetAlert2 for beautiful pop-up dialogs

export default function Page() {
  const router = useRouter();
  // State to track if authentication check is still in progress
  const [isChecking, setIsChecking] = useState(true);
  // State to store the authenticated user's bike listings
  const [bikes, setBikes] = useState([]);
  // State to store user initials for the avatar in the header
  const [userInitials, setUserInitials] = useState('');
  // State to store the avatar image source URL
  const [avatarSrc, setAvatarSrc] = useState('');

  // Effect hook to check authentication and populate user data from localStorage for the header avatar
  useEffect(() => {
    const checkAuthAndSetUser = () => { // Renamed function
      const token = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId');

      // If token or userId is missing, redirect to the authentication page
      if (!token || !userId) {
        router.replace('/auth');
      } else {
        // If authenticated, get user data from localStorage
        const userDetailsString = localStorage.getItem('userDetails');
        if (userDetailsString) {
          try {
            const userDetails = JSON.parse(userDetailsString);
            const fullName = userDetails.fullName || 'User';
            setUserInitials(fullName.charAt(0).toUpperCase());
            setAvatarSrc(userDetails.avatar || ''); // Assuming userDetails contains an 'avatar' field
          } catch (error) {
            console.error('Error parsing userDetails from localStorage:', error);
            setUserInitials('U'); // Fallback if parsing fails
            Swal.fire('Error', 'Failed to load user profile from local storage. Displaying default.', 'error');
          }
        } else {
          // Fallback if userDetails is not in localStorage
          setUserInitials('U');
          Swal.fire('Warning', 'User details not found in local storage. Displaying default initials.', 'warning');
        }
        setIsChecking(false); // Authentication check is complete
      }
    };

    // Set a timeout before performing the authentication check
    const timeout = setTimeout(checkAuthAndSetUser, 500);

    // Cleanup function to clear the timeout
    return () => clearTimeout(timeout);
  }, [router]); // Rerun effect if router object changes

  // Effect hook to fetch bike listings after authentication is confirmed
  useEffect(() => {
    const fetchMyListings = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return; // If no token, do not proceed with fetching listings (auth check handles redirection)

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/bike/show-my-listings`, {
          headers: {
            'Authorization': `Bearer ${token}`, // Authorize with the access token
          },
        });

        if (response.ok) {
          const data = await response.json();
          setBikes(data.bikes); // Update the bikes state with fetched data
        } else {
          console.error('Failed to fetch listings:', response.statusText);
          Swal.fire('Error', 'Failed to fetch your bike listings. Please try again.', 'error');
        }
      } catch (error) {
        console.error('Error fetching listings:', error);
        Swal.fire('Error', 'An error occurred while fetching your bike listings.', 'error');
      }
    };

    // Only fetch listings once the authentication check is complete and successful
    if (!isChecking) {
      fetchMyListings();
    }
  }, [isChecking]); // Rerun effect when isChecking state changes

  // Handler for the "Edit" button click
  const handleEdit = (bikeId) => {
    Swal.fire({
      title: 'Confirm Edit',
      text: 'Are you sure you want to edit this listing?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, edit it!',
      cancelButtonText: 'No, cancel',
      customClass: {
        confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-lg',
        cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md shadow-lg ml-2'
      },
      buttonsStyling: false, // Disable default SweetAlert2 button styling
    }).then((result) => {
      if (result.isConfirmed) {
        // Navigate to the edit page for the specific bike
        router.push(`/my-listings/edit/${bikeId}`);
      }
    });
  };

  // Handler for the "Delete" button click
  const handleDelete = async (bikeId) => {
    Swal.fire({
      title: 'Confirm Delete',
      text: 'Are you sure you want to delete this listing? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', // Red color for delete confirmation
      cancelButtonColor: '#3085d6', // Blue color for cancel button
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel',
      customClass: {
        confirmButton: 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md shadow-lg',
        cancelButton: 'bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-md shadow-lg ml-2'
      },
      buttonsStyling: false, // Disable default SweetAlert2 button styling
    }).then(async (result) => {
      if (result.isConfirmed) {
        const token = localStorage.getItem('accessToken');
        try {
          // Send a DELETE request to the backend API
          const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/bike/bike-delete`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json', // Specify content type as JSON
              'Authorization': `Bearer ${token}`, // Authorize with the access token
            },
            body: JSON.stringify({ bikeId }), // Send the bikeId in the request body
          });

          if (response.ok) {
            Swal.fire('Deleted!', 'Your listing has been deleted successfully.', 'success');
            // Refresh the page to reflect the updated listings by re-rendering the component
            router.replace(router.asPath); // This forces a reload of the current page
          } else {
            const errorData = await response.json();
            console.error('Failed to delete listing:', errorData.message);
            Swal.fire('Error', `Failed to delete listing: ${errorData.message || 'Unknown error'}`, 'error');
          }
        } catch (error) {
          console.error('Error deleting listing:', error);
          Swal.fire('Error', 'An error occurred while deleting the listing.', 'error');
        }
      }
    });
  };

  // Display a loading message while authentication is being checked
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700 font-medium animate-pulse">
          Checking authentication...
        </p>
      </div>
    );
  }

  // Render the main page content once authentication is confirmed
  return (
    <div className="min-h-screen bg-gray-100 font-sans antialiased">
      {/* Header section */}
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

      {/* Main content section for bike listings */}
      <main className="container mx-auto mt-8 px-4 py-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          My Bike Listings
        </h1>

        {/* Conditional rendering based on whether there are bikes */}
        {bikes.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md text-gray-600">
            <p className="text-lg mb-4">You currently have no bike listings.</p>
            <p className="text-md">
              Start selling your bikes today!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {bikes.map((bike) => (
              <div
                key={bike._id}
                className="bg-white rounded-xl shadow-lg overflow-hidden
                           transform transition-transform duration-300 hover:scale-105
                           flex flex-col"
              >
                {/* Bike Image */}
                {bike.bikeImage && bike.bikeImage.length > 0 ? ( // Changed from bike.images to bike.bikeImage
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={bike.bikeImage[0]} // Display the first image from bikeImage array
                    alt={bike.bike_name} // Changed alt text to bike_name
                    className="w-full h-48 object-cover rounded-t-xl"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-500 rounded-t-xl">
                    <span className="text-lg">No Image Available</span>
                  </div>
                )}
                {/* Bike Details */}
                <div className="p-5 flex flex-col flex-grow">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2 truncate">
                    {bike.bike_name} {/* Changed from bike.title to bike.bike_name */}
                  </h2>
                  <p className="text-gray-800 text-xl font-semibold mb-2">
                    <span className="font-medium text-gray-600">Price:</span> Nrs. {bike.price?.toLocaleString() || 'N/A'}
                  </p>
                  <p className="text-gray-700 text-sm mb-2">
                    <span className="font-medium text-gray-600">Brand:</span> {bike.brand || 'N/A'}
                  </p>
                  {/* Constructed description from multiple fields */}
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3 flex-grow">
                    <span className="font-medium text-gray-600">Details:</span>
                    {` Year: ${bike.year_of_purchase || 'N/A'}, CC: ${bike.cc || 'N/A'}, Kms: ${bike.kms_driven?.toLocaleString() || 'N/A'}, Owner: ${bike.owner || 'N/A'}, Servicing: ${bike.servicing || 'N/A'}, Engine: ${bike.engine_condition || 'N/A'}, Physical: ${bike.physical_condition || 'N/A'}, Tyre: ${bike.tyre_condition || 'N/A'}`}
                  </p>
                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 mt-auto pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(bike._id)}
                      className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg
                                 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                                 focus:ring-opacity-50 transition-all duration-300 shadow-md"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(bike._id)}
                      className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg
                                 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500
                                 focus:ring-opacity-50 transition-all duration-300 shadow-md"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
