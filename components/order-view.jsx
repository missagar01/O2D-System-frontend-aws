"use client"
import { useState, useEffect } from "react"

export function OrdersView() {
  const [pendingOrders, setPendingOrders] = useState([])
  const [completeOrders, setCompleteOrders] = useState([])
  const [cancelOrders, setCancelOrders] = useState([])
  const [partialOrders, setPartialOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [showModal, setShowModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [formData, setFormData] = useState({
    arrangeLogistic: '',
    qty: '',
    remarks: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [historyData, setHistoryData] = useState([])
  const [filteredHistory, setFilteredHistory] = useState([])
  const [filters, setFilters] = useState({
    status: 'all',
    salesperson: '',
    customer: '',
    item: '',
    search: ''
  })
  // Add new state for filter options
  const [filterOptions, setFilterOptions] = useState({
    salespersons: [],
    customers: [],
    items: []
  })
  const [balanceTotals, setBalanceTotals] = useState({
    pending: 0,
    complete: 0,
    cancel: 0,
    partial: 0
  })


  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuC7Cy9GMEziCJi2wbP7S27ERl-_ZhpssLwFZ8_IUgf_Z6oJla8lV45VyX47vFIWg7/exec"

  const fetchOrderData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=ImporterSheet&action=fetch`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }

      const data = result.data
      if (!data || data.length === 0) {
        throw new Error('No data received from sheet')
      }

      // Assuming first row contains headers
      const headers = data[0]
      const rows = data.slice(1)

      // Find column indices
      const salesPersonIndex = headers.findIndex(h => h.toLowerCase().includes('salesperson'))
      const customerIndex = headers.findIndex(h => h.toLowerCase().includes('customer_name'))
      const vrnoIndex = headers.findIndex(h => h.toLowerCase().includes('vrno'))
      const dateIndex = headers.findIndex(h => h.toLowerCase().includes('vrdate'))
      const itemIndex = headers.findIndex(h => h.toLowerCase().includes('item_name'))
      const remarksIndex = headers.findIndex(h => h.toLowerCase().includes('entry_remark'))
      const priorityIndex = headers.findIndex(h => h.toLowerCase().includes('priority'))
      const rateIndex = headers.findIndex(h => h.toLowerCase().includes('rate'))
      const balanceIndex = headers.findIndex(h => h.toLowerCase().includes('balance_qty'))
      const statusIndex = headers.findIndex(h => h.toLowerCase().includes('status'))

      // Process rows into order objects
      // Process rows into order objects
      const processedOrders = rows.map((row, index) => {
        // Format date as dd/mm/yy and include time
        const originalDate = row[dateIndex] || '';
        let formattedDateTime = originalDate;

        // Try to parse the date if it's in a different format
        if (originalDate) {
          try {
            const dateObj = new Date(originalDate);
            if (!isNaN(dateObj.getTime())) {
              const day = String(dateObj.getDate()).padStart(2, '0');
              const month = String(dateObj.getMonth() + 1).padStart(2, '0');
              const year = String(dateObj.getFullYear()).slice(-2);
              const hours = String(dateObj.getHours()).padStart(2, '0');
              const minutes = String(dateObj.getMinutes()).padStart(2, '0');

              formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}`;
            }
          } catch (e) {
            // If parsing fails, keep the original date
          }
        }

        return {
          id: index + 1,
          salesperson: row[salesPersonIndex] || '',
          customerName: row[customerIndex] || '',
          vrno: row[vrnoIndex] || '',
          date: formattedDateTime, // Use formatted date with time
          itemName: row[itemIndex] || '',
          remarks: row[remarksIndex] || '',
          priority: row[priorityIndex] || '',
          rate: row[rateIndex] || '',
          balanceQty: parseFloat(row[balanceIndex]) || 0,
          status: row[statusIndex] || ''
        }
      })
      // Extract unique values for filters
      const salespersons = [...new Set(processedOrders.map(order => order.salesperson).filter(Boolean))].sort()
      const customers = [...new Set(processedOrders.map(order => order.customerName).filter(Boolean))].sort()
      const items = [...new Set(processedOrders.map(order => order.itemName).filter(Boolean))].sort()

      setFilterOptions({
        salespersons,
        customers,
        items
      })

      // Categorize orders by status - ✅ ERROR FIXED YAHAN
      const pending = processedOrders.filter(order =>
        order.status.toLowerCase().includes('pending') || order.status.toLowerCase().includes('open')
      )
      const complete = processedOrders.filter(order =>
        order.status.toLowerCase().includes('complete') || order.status.toLowerCase().includes('completed')
      )
      const cancelled = processedOrders.filter(order =>
        order.status.toLowerCase().includes('cancel') || order.status.toLowerCase().includes('cancelled')
      )
      const partial = processedOrders.filter(order =>
        order.status.toLowerCase().includes('partial')
      )

      // Calculate total balance quantities
      setBalanceTotals({
        pending: pending.reduce((sum, order) => sum + order.balanceQty, 0),
        complete: complete.reduce((sum, order) => sum + order.balanceQty, 0),
        cancel: cancelled.reduce((sum, order) => sum + order.balanceQty, 0),
        partial: partial.reduce((sum, order) => sum + order.balanceQty, 0)
      })

      setPendingOrders(pending)
      setCompleteOrders(complete)
      setCancelOrders(cancelled)
      setPartialOrders(partial)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = (orders) => {
    return orders.filter(order => {
      // Filter by salesperson
      if (filters.salesperson && order.salesperson !== filters.salesperson) {
        return false
      }

      // Filter by customer
      if (filters.customer && order.customerName !== filters.customer) {
        return false
      }

      // Filter by item
      if (filters.item && order.itemName !== filters.item) {
        return false
      }

      // Filter by search term
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        const matchesSearch =
          order.vrno.toLowerCase().includes(searchTerm) ||
          order.customerName.toLowerCase().includes(searchTerm) ||
          order.itemName.toLowerCase().includes(searchTerm) ||
          order.remarks.toLowerCase().includes(searchTerm)

        if (!matchesSearch) return false
      }

      return true
    })
  }

 const fetchHistoryData = async () => {
  try {
    setLoading(true)
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=Order-Flw-Up&action=fetch`)
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch history data')
    }

    const data = result.data
    if (!data || data.length === 0) {
      setHistoryData([])
      setFilteredHistory([])
      return
    }

    const headers = data[0]
    const rows = data.slice(1)

    // Find column indices
    const timestampIndex = headers.findIndex(h => h.toLowerCase().includes('timestamp'))
    const vrnoIndex = headers.findIndex(h => h.toLowerCase().includes('vrno'))
    const arrangeLogisticIndex = headers.findIndex(h => h.toLowerCase().includes('arrange logistic'))
    const qtyIndex = headers.findIndex(h => h.toLowerCase().includes('qty'))
    const remarksIndex = headers.findIndex(h => h.toLowerCase().includes('remarks'))
    const salespersonIndex = headers.findIndex(h => h.toLowerCase().includes('salesperson'))
    
    // Enhanced customer column detection
    let customerIndex = headers.findIndex(h => {
      const headerLower = h.toLowerCase()
      return headerLower.includes('customer') || 
             headerLower.includes('party') || 
             headerLower.includes('customer_name') ||
             headerLower.includes('customername') ||
             headerLower.includes('party_name') ||
             headerLower.includes('partyname')
    })
    
    // If not found by name, use Column G (index 6) since you're submitting to Column G
    if (customerIndex === -1) {
      customerIndex = 6  // Column G = index 6
    }
    
    const itemIndex = headers.findIndex(h => h.toLowerCase().includes('item'))

    // Process rows into history objects
    const processedHistory = rows.map((row, index) => ({
      id: index + 1,
      timestamp: row[timestampIndex] || '',
      vrno: row[vrnoIndex] || '',
      arrangeLogistic: row[arrangeLogisticIndex] || '',
      qty: row[qtyIndex] || '',
      remarks: row[remarksIndex] || '',
      salesperson: row[salespersonIndex] || '',
      customer: row[customerIndex] || '',  // Using fixed customer index
      item: row[itemIndex] || ''
    }))

    setHistoryData(processedHistory)
    setFilteredHistory(processedHistory)
    
  } catch (err) {
    alert('Error fetching history data: ' + err.message)
  } finally {
    setLoading(false)
  }
}

  const handleProcessOrder = (order) => {
    setSelectedOrder(order)
    setFormData({
      arrangeLogistic: '',
      qty: '',
      remarks: ''
    })
    setShowModal(true)
  }
  const handleFormSubmit = async () => {
    // Validation - existing logic
    if (!formData.arrangeLogistic) {
      alert('Please select Arrange Logistic option')
      return
    }

    if (formData.arrangeLogistic === 'Yes' && !formData.qty) {
      alert('Please enter quantity')
      return
    }

    if (!formData.remarks) {
      alert('Please enter remarks')
      return
    }

    setSubmitting(true)

    try {
      const timestamp = new Date().toLocaleString()

      // Prepare row data array with additional columns
      // Original columns + Salesperson (Column F) + Customer (Column G) + Item (Column H)
      const rowData = [
        timestamp,                                      // Column A: Timestamp
        selectedOrder.vrno,                            // Column B: VR No
        formData.arrangeLogistic,                      // Column C: Arrange Logistic
        formData.arrangeLogistic === 'Yes' ? formData.qty : '',  // Column D: Qty
        formData.remarks,                              // Column E: Remarks
        selectedOrder.salesperson || '',               // Column F: Salesperson (from frontend table)
        selectedOrder.customerName || '',              // Column G: Party Name (from frontend table)
        selectedOrder.itemName || ''                   // Column H: Item (from frontend table)
      ]

      // Create form data to match your existing Apps Script
      const formData2 = new FormData()
      formData2.append('sheetName', 'Order-Flw-Up')
      formData2.append('action', 'insert')
      formData2.append('rowData', JSON.stringify(rowData))

      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formData2
      })

      const result = await response.json()

      if (result.success) {
        alert('Order processed successfully!')
        setShowModal(false)
        setSelectedOrder(null)
        setFormData({
          arrangeLogistic: '',
          qty: '',
          remarks: ''
        })
        // Refresh data
        fetchOrderData()
      } else {
        throw new Error(result.error || 'Failed to submit data')
      }
    } catch (err) {
      alert('Error submitting form: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset dependent fields when arrangeLogistic changes
      ...(field === 'arrangeLogistic' ? { qty: '', remarks: '' } : {})
    }))
  }

  const handleOpenHistory = () => {
    setShowHistoryModal(true)
    fetchHistoryData()
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const applyFilters = () => {
    let filtered = [...historyData]

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(item => {
        if (filters.status === 'arranged') {
          return item.arrangeLogistic === 'Yes'
        } else if (filters.status === 'not_arranged') {
          return item.arrangeLogistic === 'No'
        }
        return true
      })
    }

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(item =>
        item.vrno.toLowerCase().includes(searchTerm) ||
        item.remarks.toLowerCase().includes(searchTerm)
      )
    }

    setFilteredHistory(filtered)
  }

  useEffect(() => {
    fetchOrderData()
  }, [])

  useEffect(() => {
    if (showHistoryModal) {
      applyFilters()
    }
  }, [filters, historyData, showHistoryModal])

  if (loading && !showHistoryModal) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-gray-600">Manage all orders</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-gray-600">Manage all orders</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={fetchOrderData}
                className="mt-2 text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTable = (data, type) => (
    <div className="bg-white rounded-lg shadow border">
      <div className="px-6 py-4 border-b flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold capitalize">{type} Orders</h3>
          <p className="text-gray-600 text-sm">Orders with {type} status</p>
        </div>
        <div className="px-3 py-2">
          <span className="text-gray-700 font-medium">Total Balance Qty: </span>
          <span className="text-gray-800 font-bold">
            {typeof balanceTotals[type] === 'number' ? balanceTotals[type].toFixed(2) : '0.00'}
          </span>
        </div>
      </div>

      {/* Filters Section */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Salesperson Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Salesperson</label>
            <select
              value={filters.salesperson}
              onChange={(e) => setFilters({ ...filters, salesperson: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Salespersons</option>
              {filterOptions.salespersons.map((salesperson, index) => (
                <option key={index} value={salesperson}>{salesperson}</option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
            <select
              value={filters.customer}
              onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Customers</option>
              {filterOptions.customers.map((customer, index) => (
                <option key={index} value={customer}>{customer}</option>
              ))}
            </select>
          </div>

          {/* Item Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
            <select
              value={filters.item}
              onChange={(e) => setFilters({ ...filters, item: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Items</option>
              {filterOptions.items.map((item, index) => (
                <option key={index} value={item}>{item}</option>
              ))}
            </select>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search orders..."
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(filters.salesperson || filters.customer || filters.item || filters.search) && (
          <div className="mt-3">
            <button
              onClick={() => setFilters({
                status: 'all',
                salesperson: '',
                customer: '',
                item: '',
                search: ''
              })}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto" style={{ maxHeight: '380px', overflowY: 'auto' }}>
        <table className="w-full">
          <thead className="bg-gray-50 border-b sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesperson</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VR No</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              {type === "pending" && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filterOrders(data).length > 0 ? (
              filterOrders(data).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.salesperson}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.customerName}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.vrno}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.date}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.itemName}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{order.remarks}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.priority}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{order.rate}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {typeof order.balanceQty === 'number' ? order.balanceQty.toFixed(2) : order.balanceQty}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${type === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        type === 'complete' ? 'bg-green-100 text-green-800' :
                          type === 'cancel' ? 'bg-red-100 text-red-800' :
                            type === 'partial' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  {type === "pending" && (
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleProcessOrder(order)}
                        className="bg-blue-600 text-white px-3 py-1 text-xs rounded hover:bg-blue-700 transition-colors"
                      >
                        Process
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={type === "pending" ? 11 : 10} className="px-6 py-8 text-center text-gray-500">
                  No {type} orders found matching your filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-gray-600">Manage all orders from ImporterSheet</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleOpenHistory}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>History Flw-Up</span>
          </button>
          <button
            onClick={fetchOrderData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("pending")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "pending"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Pending ({pendingOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("partial")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "partial"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Partial ({partialOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("complete")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "complete"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Complete ({completeOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("cancel")}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === "cancel"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              Cancel ({cancelOrders.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "pending" && renderTable(pendingOrders, "pending")}
        {activeTab === "partial" && renderTable(partialOrders, "partial")}
        {activeTab === "complete" && renderTable(completeOrders, "complete")}
        {activeTab === "cancel" && renderTable(cancelOrders, "cancel")}
      </div>

      {/* Modal for Process Order Form */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Process Order</h3>
                  <p className="text-gray-600 text-sm mt-1">VR No: {selectedOrder.vrno}</p>
                  <p className="text-gray-600 text-sm">Customer: {selectedOrder.customerName}</p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={submitting}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arrange Logistic <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.arrangeLogistic}
                  onChange={(e) => handleFormChange('arrangeLogistic', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={submitting}
                >
                  <option value="">Select...</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {formData.arrangeLogistic === 'Yes' && (
                <div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.qty}
                      onChange={(e) => handleFormChange('qty', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter quantity"
                      min="1"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Remarks <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => handleFormChange('remarks', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                      placeholder="Enter remarks explaining why logistics cannot be arranged"
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}

              {formData.arrangeLogistic === 'No' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => handleFormChange('remarks', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Enter remarks explaining why logistics cannot be arranged"
                    disabled={submitting}
                  />
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFormSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal for History Follow-Up */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">History Follow-Up</h3>
                  <p className="text-gray-600 text-sm mt-1">Order-Flw-Up Sheet Data</p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Filters - same as before */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All</option>
                    <option value="arranged">Logistics Arranged</option>
                    <option value="not_arranged">Logistics Not Arranged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search by VR No or Remarks"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={applyFilters}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Updated History Table with new columns */}
            <div className="overflow-auto flex-grow" style={{ overflowY: 'auto' }}>
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VR No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrange Logistic</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salesperson</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.timestamp}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.vrno}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.arrangeLogistic === 'Yes'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                            }`}>
                            {item.arrangeLogistic}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.qty}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{item.remarks}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.salesperson}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.customer}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{item.item}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        No history data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
