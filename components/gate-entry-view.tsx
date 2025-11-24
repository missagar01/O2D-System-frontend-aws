"use client"
import { useState, useEffect } from 'react'

export function GateEntryView() {
  const [gateEntryData, setGateEntryData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [customerFilter, setCustomerFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxGzl1EP1Vc6C5hB4DyOpmxraeUc0Ar4mAw567VOKlaBk0qwdFxyB37cgiGNiKYXww7/exec"
  const SHEET_NAME = "FMS"

  useEffect(() => {
    fetchSheetData()
  }, [])

  useEffect(() => {
    // Apply filters whenever data or filter values change
    let result = [...gateEntryData]
    
    // Apply customer filter
    if (customerFilter) {
      result = result.filter(item => item.customerName === customerFilter)
    }
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(item => 
        item.orderNumber.toLowerCase().includes(term) ||
        item.gateEntryNumber.toLowerCase().includes(term) ||
        item.customerName.toLowerCase().includes(term) ||
        item.truckNumber.toLowerCase().includes(term) ||
        item.timestamp.toLowerCase().includes(term)
      )
    }
    
    setFilteredData(result)
  }, [gateEntryData, customerFilter, searchTerm])

  const fetchSheetData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=${SHEET_NAME}&action=fetch`)
      const result = await response.json()
      
      if (result.success && result.data) {
        // Process the data - skip to row 7 (index 6) and get columns A, B, C, D, E (indices 0, 1, 2, 3, 4)
        const processedData = []
        
        // Start from row 7 (index 6) and process each row
        for (let i = 6; i < result.data.length; i++) {
          const row = result.data[i]
          
          // Extract data from columns A, B, C, D, E (indices 0, 1, 2, 3, 4)
          const timestamp = row[0] || ""
          const orderNumber = row[1] || ""
          const gateEntryNumber = row[2] || ""
          const customerName = row[3] || ""
          const truckNumber = row[4] || ""
          
          // Only add rows that have at least some data
          if (timestamp || orderNumber || gateEntryNumber || customerName || truckNumber) {
            // Format the timestamp to match the sheet format (DD/MM/YYYY HH:MM:SS)
            let formattedTimestamp = "";
            if (timestamp) {
              const date = new Date(timestamp);
              if (!isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
              } else {
                formattedTimestamp = timestamp.toString();
              }
            }
            
            processedData.push({
              timestamp: formattedTimestamp,
              orderNumber: orderNumber.toString(),
              gateEntryNumber: gateEntryNumber.toString(),
              customerName: customerName.toString(),
              truckNumber: truckNumber.toString(),
              status: "Active" // Default status as requested
            })
          }
        }
        
        setGateEntryData(processedData)
        setFilteredData(processedData)
      } else {
        setError(result.error || "Failed to fetch data")
      }
    } catch (err) {
      setError("Error fetching data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Get unique customer names for the dropdown
  const customerNames = [...new Set(gateEntryData.map(item => item.customerName))].filter(name => name).sort()

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gate Entry</h2>
          <p className="text-muted-foreground">Vehicle entry records</p>
        </div>
        
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Gate Entry Records</h3>
            <p className="text-gray-600 text-sm">Loading data from Google Sheets...</p>
          </div>
          <div className="px-6 py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gate Entry</h2>
          <p className="text-muted-foreground">Vehicle entry records</p>
        </div>
        
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Gate Entry Records</h3>
            <p className="text-gray-600 text-sm">Error loading data</p>
          </div>
          <div className="px-6 py-8">
            <div className="text-center">
              <p className="text-red-500 mb-4">Error: {error}</p>
              <button 
                onClick={fetchSheetData}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gate Entry</h2>
        <p className="text-muted-foreground">Vehicle entry records</p>
      </div>
      
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Gate Entry Records</h3>
          <p className="text-gray-600 text-sm">
            All vehicles that have entered the facility ({filteredData.length} records)
          </p>
          
          {/* Filter Controls */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-auto">
              <label htmlFor="customer-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Customer
              </label>
              <select
                id="customer-filter"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Customers</option>
                {customerNames.map((name, index) => (
                  <option key={index} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-full sm:flex-1">
              <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                id="search-filter"
                type="text"
                placeholder="Search by order number, gate entry, customer, truck number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setCustomerFilter('')
                  setSearchTerm('')
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
        <div
          className="overflow-x-auto mobile-card-view relative"
          style={{ maxHeight: '400px', overflowY: 'auto' }}
        >
  <table className="w-full table-auto text-sm">
    <thead className="bg-gray-50 border-b sticky top-0 z-10 shadow-sm text-xs">
      <tr>
        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Timestamp</th>
        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Order Number</th>
        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Gate Entry Number</th>
        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer Name</th>
        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Truck Number</th>
        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-gray-200">
      {filteredData.length > 0 ? (
        filteredData.map((entry, index) => (
          <tr
            key={`${entry.gateEntryNumber || entry.orderNumber || "gate-entry"}-${index}`}
            className="hover:bg-gray-50"
          >
            <td className="px-4 py-3 whitespace-nowrap text-gray-900 text-xs sm:text-sm">{entry.timestamp}</td>
            <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 text-xs sm:text-sm">{entry.orderNumber}</td>
            <td className="px-4 py-3 whitespace-nowrap text-gray-900 text-xs sm:text-sm">{entry.gateEntryNumber}</td>
            <td className="px-4 py-3 whitespace-nowrap text-gray-900 text-xs sm:text-sm">{entry.customerName}</td>
            <td className="px-4 py-3 whitespace-nowrap text-gray-900 text-xs sm:text-sm">{entry.truckNumber}</td>
            <td className="px-4 py-3 whitespace-nowrap">
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                {entry.status}
              </span>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
            No matching records found
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
      </div>
    </div>
  )
}
