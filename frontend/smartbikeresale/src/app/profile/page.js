'use client';

import { useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation'; // Removed Next.js specific import
// import Image from 'next/image'; // Removed Next.js specific import

export default function Page() {
  // const router = useRouter(); // Removed Next.js specific hook
  // We'll use a simple window.location for navigation in this isolated environment
  const navigate = (path) => {
    window.location.href = path;
  };

  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState(null); // State to store user profile data
  const [avatarSrc, setAvatarSrc] = useState('');
  const [userInitials, setUserInitials] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState(''); // Message for password change status
  const [avatarFile, setAvatarFile] = useState(null); // State for new avatar file
  const [avatarMessage, setAvatarMessage] = useState(''); // Message for avatar upload status

  useEffect(() => {
    const timeout = setTimeout(() => {
      const token = localStorage.getItem('accessToken');
      const userId = localStorage.getItem('userId');

      if (!token || !userId) {
        navigate('/auth'); // Use custom navigate function
      } else {
        setIsChecking(false); // Allow page to render
        fetchUserProfile(token); // Fetch user profile once authenticated
      }
    }, 500); // Wait 500ms before checking authentication

    return () => clearTimeout(timeout); // Cleanup on component unmount
  }, []);

  // Effect to update avatarSrc and userInitials when user data changes
  useEffect(() => {
    if (user) {
      if (user.avatar) {
        setAvatarSrc(user.avatar);
      } else {
        // Generate initials from fullName if no avatar
        const initials = user.fullName
          ? user.fullName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
          : '';
        setUserInitials(initials);
        setAvatarSrc(''); // Ensure avatarSrc is empty if no avatar URL
      }
    }
  }, [user]);

  /**
   * Fetches the user's profile data from the API.
   * @param {string} token - The access token for authorization.
   */
  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/user/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user); // Set the user state with fetched data
      } else {
        console.error('Failed to fetch user profile:', data.message);
        // Handle error, e.g., show a message to the user
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Handle network errors
    }
  };

  /**
   * Handles the change password request.
   */
  const handleChangePassword = async () => {
    setPasswordMessage(''); // Clear previous messages
    if (!currentPassword || !newPassword) {
      setPasswordMessage('Please fill in both password fields.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setPasswordMessage('Authentication token missing. Please log in again.');
      navigate('/auth'); // Use custom navigate function
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/user/change-password`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordMessage('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordMessage(data.message || 'Failed to change password.');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage('An error occurred. Please try again.');
    }
  };

  /**
   * Handles the file input change for avatar upload.
   */
  const handleAvatarFileChange = (e) => {
    setAvatarFile(e.target.files[0]);
    setAvatarMessage(''); // Clear previous messages
  };

  /**
   * Handles the avatar upload request.
   */
  const handleUploadAvatar = async () => {
    setAvatarMessage(''); // Clear previous messages
    if (!avatarFile) {
      setAvatarMessage('Please select an image file to upload.');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      setAvatarMessage('Authentication token missing. Please log in again.');
      navigate('/auth'); // Use custom navigate function
      return;
    }

    const formData = new FormData();
    formData.append('avatar', avatarFile); // 'avatar' should match the field name expected by your backend

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/user/profile/upload-avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
       
        },
        body: formData,
      });

      const data = await response.json();

      if (response) {
        setAvatarMessage('Avatar uploaded successfully!');
        // Update the avatarSrc immediately to show the new avatar
        setAvatarSrc(data.avatarUrl);
        setUser(prevUser => ({ ...prevUser, avatar: data.avatarUrl })); // Update user state with new avatar URL
        setAvatarFile(null); // Clear the selected file
      } else {
        setAvatarMessage(data.message || 'Failed to upload avatar.');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setAvatarMessage('An error occurred during avatar upload. Please try again.');
    }
  };

  /**
   * Handles the user logout.
   */
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userDetails'); // Clean up userDetails as well
    navigate('/auth'); // Redirect to authentication page
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-12 font-inter">
      {/* Header */}
      <header className="w-full bg-white shadow-md p-4 flex justify-between items-center px-6 md:px-12 rounded-b-lg">
        {/* Logo */}
        <div className="flex items-center">
          <a href="/" className="text-sm md:text-2xl font-bold text-gray-800 tracking-tight hover:text-orange-600 transition-colors duration-200 ml-[-1rem]">
            smartBike-Resale
          </a>
        </div>

        {/* Right-hand side: My Listings, Profile, and Logout */}
        <nav className="flex items-center space-x-2 md:space-x-6 w-[185px] md:w-[35rem] mr-[2rem] md:mr-[-3rem]">

          <a href="/price-prediction" className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200 text-[10px] md:text-xl">
            Predict & List
          </a>


          <a href="/my-listings" className="text-gray-700 hover:text-orange-600 font-medium transition-colors duration-200 py-2 px-3 rounded-md text-[10px] md:text-xl">
            My Listings
          </a>

          {/* Profile Circle Div */}
          <a href="/profile" className="block relative group">
            <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-purple-800 font-bold text-lg overflow-hidden border-2 border-purple-400 shadow-sm transition-all duration-200 group-hover:scale-105">
              {avatarSrc ? (
                // Using standard <img> tag instead of Next.js Image component
                <img
                  src={avatarSrc}
                  alt="User Avatar"
                  width={40}
                  height={40}
                  style={{ objectFit: 'cover' }} // Inline style for object-fit
                  className="rounded-full"
                  onError={(e) => {
                    e.target.onerror = null; // Prevent infinite loop if placeholder also fails
                    e.target.src = `https://placehold.co/40x40/a78bfa/ffffff?text=${userInitials}`;
                  }}
                />
              ) : (
                <span className="text-purple-800">{userInitials}</span>
              )}
            </div>
          </a>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors duration-200"
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Main Profile Content */}
      <main className="w-full max-w-4xl bg-white p-6 md:p-8 mt-8 rounded-lg shadow-xl border border-gray-200">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">Your Profile</h1>

        {user ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* User Details Section */}
            <section className="bg-gray-50 p-6 rounded-lg shadow-inner">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 border-gray-200">Personal Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Full Name:</label>
                  <p className="mt-1 text-lg text-gray-900 font-medium">{user.fullName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Email:</label>
                  <p className="mt-1 text-lg text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Address:</label>
                  <p className="mt-1 text-lg text-gray-900">{user.address}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Account Verified:</label>
                  <p className="mt-1 text-lg text-gray-900">{user.isVerified ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Member Since:</label>
                  <p className="mt-1 text-lg text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </section>

            {/* Avatar Update Section */}
            <section className="bg-gray-50 p-6 rounded-lg shadow-inner flex flex-col items-center justify-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 border-gray-200 w-full text-center">Update Avatar</h2>
              <div className="mb-6 flex flex-col items-center">
                <div className="w-32 h-32 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-5xl overflow-hidden border-4 border-purple-300 shadow-md">
                  {avatarSrc ? (
                    // Using standard <img> tag instead of Next.js Image component
                    <img
                      src={avatarSrc}
                      alt="User Avatar"
                      width={128}
                      height={128}
                      style={{ objectFit: 'cover' }} // Inline style for object-fit
                      className="rounded-full"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/128x128/a78bfa/ffffff?text=${userInitials}`;
                      }}
                    />
                  ) : (
                    <span className="text-purple-700">{userInitials}</span>
                  )}
                </div>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="block w-full text-sm text-gray-900
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-orange-50 file:text-orange-700
                hover:file:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50
                mb-4 cursor-pointer"
              />
              <button
                onClick={handleUploadAvatar}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2.5 px-4 rounded-md shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50"
              >
                Update Avatar
              </button>
              {avatarMessage && (
                <p className={`mt-3 text-sm ${avatarMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                  {avatarMessage}
                </p>
              )}
            </section>
          </div>
        ) : (
          <p className="text-center text-gray-600 text-lg">Loading user data...</p>
        )}

        {/* Change Password Section */}
        <section className="bg-gray-50 p-6 rounded-lg shadow-inner mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 border-gray-200">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">Current Password</label>
              <input
                type="password"
                id="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-gray-500"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm text-gray-500"
                placeholder="Enter new password"
              />
            </div>
            <button
              onClick={handleChangePassword}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50"
            >
              Change Password
            </button>
            {passwordMessage && (
              <p className={`mt-3 text-sm ${passwordMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
                {passwordMessage}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}