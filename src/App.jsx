import { useState, useEffect } from 'react'; 
import axios from 'axios';
import './App.css';

function App() {
  const [region, setRegion] = useState('USA');
  const [errorCount, setErrorCount] = useState(0);
  const [seed, setSeed] = useState('');
  const [randomSeed, setRandomSeed] = useState('');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true); // Track if more data is available

  const batchSize = 10; // Number of records per batch

  // Fetch data from backend
  const fetchData = async (pageNumber = page) => {
    if (isLoading || !hasMore) return; // Prevent multiple fetches

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/generate', {
        region,
        errorCount,
        seed: randomSeed || seed,
        page: pageNumber,
        batchSize: batchSize,
      });

      const newData = response.data;

      if (newData.length < batchSize) {
        setHasMore(false); // No more data to load if less than batch size
      }

      // Use immutable pattern for updating the state
      setData(prevData => [...prevData, ...newData]); // Append new batch of data
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setIsLoading(false);
  };

  // Generate random seed
  const generateRandomSeed = () => {
    const newSeed = Math.random().toString(36).substring(2);
    setRandomSeed(newSeed);
    setData([]); // Clear data when seed changes
    setPage(1);  // Reset page number
    setHasMore(true); // Allow loading more data again
  };

  // Fetch new data when controls change
  useEffect(() => {
    setData([]); // Reset data on change
    setPage(1);  // Reset page on change
    setHasMore(true); // Reset data loading state
    fetchData(1); // Fetch first batch
  }, [region, errorCount, seed, randomSeed]);

  // Infinite scroll listener for table
  useEffect(() => {
    const handleScroll = () => {
      const table = document.querySelector('table');
      const bottomOfTableReached = table && table.getBoundingClientRect().bottom <= window.innerHeight + 10;

      if (bottomOfTableReached && !isLoading && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore]);

  // Fetch new page on page change
  useEffect(() => {
    if (page > 1) {
      fetchData(page);
    }
  }, [page]);

  // CSV Export Functions
  const jsonToCSV = (json) => {
    const csvRows = [];
    // Get the headers
    const headers = Object.keys(json[0]);
    csvRows.push(headers.join(','));
    
    // Map the rows
    for (const row of json) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '\\"');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  const downloadCSV = () => {
    const csv = jsonToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'generated_data.csv');
    a.click();
    
    URL.revokeObjectURL(url); // Clean up
  };

  return (
    <div className="w-full p-4"> {/* Ensure the container takes full width */}
      <h1 className="text-2xl font-bold mb-4 text-center">Fake User Data Generator</h1>
  
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Region Dropdown */}
        <div>
          <label className="block mb-2 font-semibold">Region:</label>
          <select
            className="border rounded px-2 py-1 w-full"
            value={region}
            onChange={e => setRegion(e.target.value)}
          >
            <option value="USA">USA</option>
            <option value="Poland">Poland</option>
            <option value="Georgia">Georgia</option>
          </select>
        </div>
  
        {/* Error Count */}
        <div>
          <label className="block mb-2 font-semibold">Errors per Record:</label>
          <input
            type="range"
            min="0"
            max="10"
            value={errorCount}
            onChange={e => setErrorCount(e.target.value)}
            className="w-full mb-2"
          />
          <input
            type="number"
            value={errorCount}
            onChange={e => setErrorCount(e.target.value)}
            className="border rounded px-2 py-1 w-full"
          />
        </div>
  
        {/* Seed Input */}
        <div>
          <label className="block mb-2 font-semibold">Seed:</label>
          <input
            type="text"
            value={seed}
            onChange={e => setSeed(e.target.value)}
            placeholder="Enter seed value"
            className="border rounded px-2 py-1 w-full"
          />
        </div>
      </div>
  
      {/* Random Seed Button */}
      <button
        onClick={generateRandomSeed}
        className="bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600 block mx-auto"
      >
        Generate Random Seed
      </button>
  
      {/* Export to CSV Button */}
      <button
        onClick={downloadCSV}
        className="bg-green-500 text-white rounded px-4 py-2 hover:bg-green-600 block mx-auto mt-4"
      >
        Export to CSV
      </button>
  
      {/* Data Table */}
      <table className="w-full border mt-4 table-auto">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-4 py-2">#</th>
            <th className="border px-4 py-2">Identifier</th>
            <th className="border px-4 py-2">Name</th>
            <th className="border px-4 py-2">Address</th>
            <th className="border px-4 py-2">Phone</th>
          </tr>
        </thead>
        <tbody>
          {data.map((user, index) => (
            <tr key={index} className="border-b hover:bg-gray-50">
              <td className="border px-4 py-2">{index + 1}</td>
              <td className="border px-4 py-2">{user.identifier}</td>
              <td className="border px-4 py-2">{user.name}</td>
              <td className="border px-4 py-2">{user.address}</td>
              <td className="border px-4 py-2">{user.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
  
      {isLoading && <p className="mt-4">Loading more data...</p>}
      {!hasMore && <p className="mt-4">No more data to load</p>}
    </div>
  );
  
}

export default App;
