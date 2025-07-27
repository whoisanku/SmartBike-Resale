'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import Loader from '@/components/Loader';
import FilterForm from '@/components/FilterForm';




export default function Page() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [userDetails, setUserDetails] = useState(null); // State to store user details

  // Filter form states
  const [filters, setFilters] = useState({
    brand: '',
    bike_name: '',
    year_of_purchase_min: '',
    year_of_purchase_max: '',
    cc_min: '',
    cc_max: '',
    kms_driven_min: '',
    kms_driven_max: '',
    owner: '',
    servicing: '',
    engine_condition: '',
    physical_condition: '',
    tyre_condition: '',
    price_min: '',
    price_max: '',
  });
  const [filteredBikes, setFilteredBikes] = useState([]); // State to store filtered bikes to display
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [filterMessage, setFilterMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // Current page for pagination
  const [totalPages, setTotalPages] = useState(1); // Total pages from API response
  const [isFilteredMode, setIsFilteredMode] = useState(false); // True if filters are active, false for general listings
  const [showFiltersMobile, setShowFiltersMobile] = useState(false); // State for mobile filter visibility

  // Auth check and initial data load
  useEffect(() => {
    const timeout = setTimeout(() => {
      const token = localStorage.getItem('accessToken');
      const storedUserId = localStorage.getItem('userId');
      const storedUserDetails = localStorage.getItem('userDetails');

      if (storedUserDetails) {
        try {
          setUserDetails(JSON.parse(storedUserDetails));
        } catch (e) {
          console.error("Failed to parse user details from localStorage", e);
          localStorage.removeItem('userDetails');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('userId');
          window.location.href = '/auth';
          return;
        }
      }

      if (!token || !storedUserId) {
        window.location.href = '/auth';
      } else {
        setIsChecking(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, []);

  // Effect to fetch initial bikes or when isChecking becomes false
  useEffect(() => {
    if (!isChecking) {
      // Fetch initial set of bikes when component loads and authentication is checked
      fetchBikes(1, false);
    }
  }, [isChecking]); // Depends on isChecking to ensure auth check completes first

  // Effect to log changes in filteredBikes array
  useEffect(() => {
    if (filteredBikes.length > 0) {
      console.log('Filtered/Displayed Bikes Array Updated:', filteredBikes);
      // No need to set filterMessage here, it's set by fetchBikes
    }
    // else if (!isLoadingFilters && !filterMessage) { // Removed this condition to prevent overwriting messages
    //     setFilterMessage('No bikes found for your current criteria.');
    // }
  }, [filteredBikes]); // Only log when bikes array changes


  useEffect(() => {
    // This ensures code runs only on the client
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("bikeDetails");

      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData);

          // Check if `hold` is true
          if (!parsedData.hold) {
            router.push("/price-prediction");
          }

        } catch (error) {
          console.error("Invalid JSON in localStorage for bikeDetails", error);
        }
      }
    }
  }, [router]);




  // Reusable function to fetch bikes from the API
  const fetchBikes = async (page, useFilters = false, currentFilters = filters) => {
    setFilterMessage('');
    setIsLoadingFilters(true);
    setFilteredBikes([]); // Clear current bikes while loading

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setFilterMessage('Authentication token missing. Please log in again.');
      setIsLoadingFilters(false);
      window.location.href = '/auth';
      return;
    }

    let apiUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/bike/resale-bikes?page=${page}&limit=10`;
    let requestOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    };

    if (useFilters) {
      apiUrl =`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/bike/resale-bikes/filters?page=${page}&limit=10`;
      const payload = {
        brand: currentFilters.brand || undefined,
        bike_name: currentFilters.bike_name || undefined,
        year_of_purchase: (currentFilters.year_of_purchase_min || currentFilters.year_of_purchase_max) ? {
          min: currentFilters.year_of_purchase_min ? parseInt(currentFilters.year_of_purchase_min) : undefined,
          max: currentFilters.year_of_purchase_max ? parseInt(currentFilters.year_of_purchase_max) : undefined,
        } : undefined,
        cc: (currentFilters.cc_min || currentFilters.cc_max) ? {
          min: currentFilters.cc_min ? parseInt(currentFilters.cc_min) : undefined,
          max: currentFilters.cc_max ? parseInt(currentFilters.cc_max) : undefined,
        } : undefined,
        kms_driven: (currentFilters.kms_driven_min || currentFilters.kms_driven_max) ? {
          min: currentFilters.kms_driven_min ? parseInt(currentFilters.kms_driven_min) : undefined,
          max: currentFilters.kms_driven_max ? parseInt(currentFilters.kms_driven_max) : undefined,
        } : undefined,
        owner: currentFilters.owner || undefined,
        servicing: currentFilters.servicing || undefined,
        engine_condition: currentFilters.engine_condition || undefined,
        physical_condition: currentFilters.physical_condition || undefined,
        tyre_condition: currentFilters.tyre_condition || undefined,
        price: (currentFilters.price_min || currentFilters.price_max) ? {
          min: currentFilters.price_min ? parseInt(currentFilters.price_min) : undefined,
          max: currentFilters.price_max ? parseInt(currentFilters.price_max) : undefined,
        } : undefined,
      };

      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || (typeof payload[key] === 'object' && payload[key] && Object.values(payload[key]).every(v => v === undefined))) {
          delete payload[key];
        }
      });
      // console.log(payload);

      requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      };
    }

    try {
      const response = await fetch(apiUrl, requestOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch bikes');
      }

      const data = await response.json();
      setFilteredBikes(data.bikes || []);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.page || 1);

      if (data.bikes && data.bikes.length === 0) {
        setFilterMessage('No bikes found matching your criteria.');
      } else {
        setFilterMessage(`Found ${data.bikes.length} bikes.`);
      }

    } catch (error) {
      console.error('Error fetching bikes:', error);
      setFilterMessage(`Error: ${error.message}. Please try again.`);
      setFilteredBikes([]); // Ensure bikes are cleared on error
      setTotalPages(1);
    } finally {
      setIsLoadingFilters(false);
    }
  };


  // Handler for filter form input changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  // Handler for filter form submission
  const handleFilterSubmit = async (e) => {
    e.preventDefault();
    setIsFilteredMode(true); // Set filter mode to true
    setCurrentPage(1); // Reset to first page for new filter search
    await fetchBikes(1, true, filters);
  };

  // Handler to clear filters
  const handleClearFilters = async () => {
    setFilters({
      brand: '', bike_name: '', year_of_purchase_min: '', year_of_purchase_max: '',
      cc_min: '', cc_max: '', kms_driven_min: '', kms_driven_max: '',
      owner: '', servicing: '', engine_condition: '', physical_condition: '',
      tyre_condition: '', price_min: '', price_max: '',
    });
    setIsFilteredMode(false); // Back to general listings mode
    setCurrentPage(1); // Reset to first page
    await fetchBikes(1, false); // Fetch initial bikes
  };

  // Handler for pagination page change
  const handlePageChange = async (newPage) => {
    if (newPage < 1 || newPage > totalPages) return; // Prevent invalid page navigation
    setCurrentPage(newPage);
    if (isFilteredMode) {
      await fetchBikes(newPage, true, filters); // Re-fetch with current filters
    } else {
      await fetchBikes(newPage, false); // Re-fetch general listings
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        <Loader message="Checking authentication..." />
      </div>
    );
  }

  // Determine avatar source or fallback
  const avatarSrc = userDetails?.avatar || null;
  const userInitials = userDetails?.fullName ? userDetails.fullName.charAt(0).toUpperCase() : '?';

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      {/* Header Section */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center px-6">
        {/* Logo */}
        <div className="flex items-center">
          <a href="/" className="text-sm md:text-2xl font-bold text-gray-800 tracking-tight ml-[-1rem]">
            smartBike-Resale
          </a>
        </div>

        {/* Right-hand side: My Listings and Profile */}
        <nav className="flex items-center space-x-2 md:space-x-6 w-[185px] md:w-[20rem] mr-[-1rem]">
          <a href="/price-prediction" className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200 w-full text-[10px] md:text-xl">
            predict & list
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

      {/* Main Content with Hero Section and Filters */}
      <main className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Welcome to smartBike-Resale!</h1>
        <p className="text-gray-600 text-lg mb-6">Your go-to platform for buying and selling second-hand bikes.</p>

        {/* Filter Section Toggle for Mobile */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setShowFiltersMobile(true)}
            className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-md font-semibold flex items-center justify-center space-x-2 hover:bg-gray-300 transition-colors duration-200"
          >
            <span>Show Filters</span>
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>

        {/* Filter Form Section */}
        <div className="hidden md:block mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Filter Bikes</h2>
          <FilterForm
            filters={filters}
            setFilters={setFilters}
            handleFilterChange={handleFilterChange}
            handleFilterSubmit={handleFilterSubmit}
            handleClearFilters={handleClearFilters}
            isLoadingFilters={isLoadingFilters}
          />
        </div>

        <Modal
          isOpen={showFiltersMobile}
          onClose={() => setShowFiltersMobile(false)}
          title="Filter Bikes"
        >
          <FilterForm
            filters={filters}
            setFilters={setFilters}
            handleFilterChange={handleFilterChange}
            handleFilterSubmit={(e) => {
              handleFilterSubmit(e);
              setShowFiltersMobile(false);
            }}
            handleClearFilters={handleClearFilters}
            isLoadingFilters={isLoadingFilters}
          />
        </Modal>

        {/* Bike Listings Section */}
        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Bike Listings</h2>
          {filterMessage && (
            <p className={`mb-4 text-center ${filteredBikes.length > 0 ? 'text-green-700' : 'text-red-600'} font-medium`}>
              {filterMessage}
            </p>
          )}

          {isLoadingFilters && filteredBikes.length === 0 && (
            <Loader message="Loading bikes..." className="py-8" />
          )}

          {!isLoadingFilters && filteredBikes.length === 0 && (
              <p className="text-center text-gray-600 py-8">No bikes available matching the criteria.</p>
          )}

          {filteredBikes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBikes.map((bike) => (
                <a href={`/bike/${bike._id}`} key={bike._id} className="block group">
                  <div className="bg-gray-100 rounded-lg shadow-md overflow-hidden transform transition-transform duration-200 hover:scale-105 hover:shadow-lg border border-gray-200">
                    <div className="relative h-48 bg-gray-200 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={bike.bikeImage && bike.bikeImage.length > 0 ? bike.bikeImage[0] : `https://placehold.co/400x200/cccccc/333333?text=No+Image`}
                          alt={`${bike.brand} ${bike.bike_name}`}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://placehold.co/400x200/cccccc/333333?text=No+Image`;
                          }}
                        />
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-xl text-gray-800 mb-1">{bike.brand} - {bike.bike_name}</h3>
                      <p className="text-lg text-purple-700 font-semibold mb-2">Nrs. {bike.price?.toLocaleString() || 'N/A'}</p>
                      <div className="text-sm text-gray-600 grid grid-cols-2 gap-y-1">
                        <p><span className="font-medium">Year:</span> {bike.year_of_purchase || 'N/A'}</p>
                        <p><span className="font-medium">CC:</span> {bike.cc || 'N/A'}</p>
                        <p><span className="font-medium">Kms Driven:</span> {bike.kms_driven?.toLocaleString() || 'N/A'}</p>
                        <p><span className="font-medium">Owner:</span> {bike.owner || 'N/A'}</p>
                        <p><span className="font-medium">Engine:</span> {bike.engine_condition || 'N/A'}</p>
                        <p><span className="font-medium">Tyres:</span> {bike.tyre_condition || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoadingFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  disabled={currentPage === page || isLoadingFilters}
                  className={`px-4 py-2 rounded-md font-semibold transition-colors duration-200 ${
                    currentPage === page
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoadingFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
