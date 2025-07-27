import BrandInput from './BrandInput';
import BikeNameInput from './BikeNameInput';

export default function FilterForm({
  filters,
  setFilters,
  handleFilterChange,
  handleFilterSubmit,
  handleClearFilters,
  isLoadingFilters,
}) {
  return (
    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Brand */}
      <div>
        <BrandInput bikeData={filters} setBikeData={setFilters} />
      </div>

      {/* Bike Name */}
      <div>
        <BikeNameInput bikeData={filters} setBikeData={setFilters} />
      </div>

      {/* Year of Purchase */}
      <div className="col-span-1 md:col-span-2 lg:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Year of Purchase</label>
        <div className="flex space-x-2">
          <input
            type="number"
            name="year_of_purchase_min"
            placeholder="Min Year (e.g., 2015)"
            value={filters.year_of_purchase_min}
            onChange={handleFilterChange}
            className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
          />
          <input
            type="number"
            name="year_of_purchase_max"
            placeholder="Max Year (e.g., 2022)"
            value={filters.year_of_purchase_max}
            onChange={handleFilterChange}
            className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
          />
        </div>
      </div>

      {/* CC */}
      <div className="col-span-1 md:col-span-2 lg:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">CC (Cubic Capacity)</label>
        <div className="flex space-x-2">
          <input
            type="number"
            name="cc_min"
            placeholder="Min CC (e.g., 150)"
            value={filters.cc_min}
            onChange={handleFilterChange}
            className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
          />
          <input
            type="number"
            name="cc_max"
            placeholder="Max CC (e.g., 350)"
            value={filters.cc_max}
            onChange={handleFilterChange}
            className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
          />
        </div>
      </div>

      {/* KMS Driven */}
      <div className="col-span-1 md:col-span-2 lg:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">KMS Driven</label>
        <div className="flex space-x-2">
          <input
            type="number"
            name="kms_driven_min"
            placeholder="Min Kms (e.g., 1000)"
            value={filters.kms_driven_min}
            onChange={handleFilterChange}
            className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
          />
          <input
            type="number"
            name="kms_driven_max"
            placeholder="Max Kms (e.g., 30000)"
            value={filters.kms_driven_max}
            onChange={handleFilterChange}
            className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Owner */}
      <div>
        <label htmlFor="owner" className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
        <select
          id="owner"
          name="owner"
          value={filters.owner}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400 text-gray-500"
        >
          <option value="First Owner">First Owner</option>
          <option value="Second Owner">Second Owner</option>
          <option value="Third Owner">Third Owner</option>
          <option value="Fourth Owner Or More">Fourth Owner Or More</option>
        </select>
      </div>

      {/* Servicing */}
      <div>
        <label htmlFor="servicing" className="block text-sm font-medium text-gray-700 mb-1">Servicing</label>
        <select
          id="servicing"
          name="servicing"
          value={filters.servicing}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="regular">Regular</option>
          <option value="irregular">Irregular</option>
        </select>
      </div>

      {/* Engine Condition */}
      <div>
        <label htmlFor="engine_condition" className="block text-sm font-medium text-gray-700 mb-1">Engine Condition</label>
        <select
          id="engine_condition"
          name="engine_condition"
          value={filters.engine_condition}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="open">Open</option>
          <option value="seal">Seal</option>
        </select>
      </div>

      {/* Physical Condition */}
      <div>
        <label htmlFor="physical_condition" className="block text-sm font-medium text-gray-700 mb-1">Physical Condition</label>
        <select
          id="physical_condition"
          name="physical_condition"
          value={filters.physical_condition}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="fresh">Fresh</option>
          <option value="like new">Like New</option>
          <option value="old">Old</option>
          <option value="very old">Very Old</option>
        </select>
      </div>

      {/* Tyre Condition */}
      <div>
        <label htmlFor="tyre_condition" className="block text-sm font-medium text-gray-700 mb-1">Tyre Condition</label>
        <select
          id="tyre_condition"
          name="tyre_condition"
          value={filters.tyre_condition}
          onChange={handleFilterChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
        >
          <option value="good">Good</option>
          <option value="new">New</option>
          <option value="old">Old</option>
        </select>
      </div>

      {/* Price */}
      <div className="col-span-1 md:col-span-2 lg:col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
        <div className="flex space-x-2">
          <input
            type="number"
            name="price_min"
            placeholder="Min Price (e.g., 100000)"
            value={filters.price_min}
            onChange={handleFilterChange}
            className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
          />
          <input
            type="number"
            name="price_max"
            placeholder="Max Price (e.g., 400000)"
            value={filters.price_max}
            onChange={handleFilterChange}
            className="w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-4 mt-4">
        <button
          type="button"
          onClick={handleClearFilters}
          className="px-6 py-3 bg-gray-500 text-white rounded-md font-semibold hover:bg-gray-600 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoadingFilters}
        >
          Clear Filters
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-orange-600 text-white rounded-md font-semibold hover:bg-orange-700 transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoadingFilters}
        >
          {isLoadingFilters ? 'Filtering...' : 'Apply Filters'}
        </button>
      </div>
    </form>
  );
}
