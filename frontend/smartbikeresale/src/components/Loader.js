export default function Loader({ message, className }) {
  return (
    <div className={`flex items-center justify-center space-x-2 ${className || ''}`}> 
      <svg className="animate-spin h-6 w-6 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      {message && <span className="text-gray-700">{message}</span>}
    </div>
  );
}
