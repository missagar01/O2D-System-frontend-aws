"use client"
import { useState, useEffect } from "react"

export function PartyFeedbackView() {
  const [feedbackData, setFeedbackData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwd9JvqX7zktSIDyFXE0hUYwuFWszADWZtQ9Bu1bflvbI6WsIIAnUZFa3CkzyrN3QFw/exec"
  const SHEET_NAME = "Form Responses 1" // You may need to adjust this sheet name

  useEffect(() => {
    fetchSheetData()
  }, [])

  const fetchSheetData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${APPS_SCRIPT_URL}?sheet=${SHEET_NAME}&action=fetch`)
      const result = await response.json()
      
      if (result.success && result.data) {
        // Process the data - skip header row (index 0) and get columns A to N (indices 0-13)
        const processedData = []
        
        // Start from row 2 (index 1) to skip header row
        for (let i = 1; i < result.data.length; i++) {
          const row = result.data[i]
          
          // Extract data from columns A to N (indices 0-13)
          const timestamp = row[0] || ""
          const emailAddress = row[1] || ""
          const customerName = row[2] || ""
          const firmName = row[3] || ""
          const contactNumber = row[4] || ""
          const enquiryRevertRating = row[5] || ""
          const loadingRating = row[6] || ""
          const dispatchRating = row[7] || ""
          const vehicleLineupRating = row[8] || ""
          const communicationRating = row[9] || ""
          const satisfactionRating = row[10] || ""
          const staffRating = row[11] || ""
          const qualityRating = row[12] || ""
          const additionalFeedback = row[13] || ""
          
          // Only add rows that have at least some data
          if (timestamp || emailAddress || customerName || firmName) {
            // Format the timestamp
            let formattedTimestamp = "";
            if (timestamp) {
              const date = new Date(timestamp);
              if (!isNaN(date.getTime())) {
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes}`;
              } else {
                formattedTimestamp = timestamp.toString();
              }
            }
            
            processedData.push({
              timestamp: formattedTimestamp,
              emailAddress: emailAddress.toString(),
              customerName: customerName.toString(),
              firmName: firmName.toString(),
              contactNumber: contactNumber.toString(),
              enquiryRevertRating: enquiryRevertRating.toString(),
              loadingRating: loadingRating.toString(),
              dispatchRating: dispatchRating.toString(),
              vehicleLineupRating: vehicleLineupRating.toString(),
              communicationRating: communicationRating.toString(),
              satisfactionRating: satisfactionRating.toString(),
              staffRating: staffRating.toString(),
              qualityRating: qualityRating.toString(),
              additionalFeedback: additionalFeedback.toString()
            })
          }
        }
        
        setFeedbackData(processedData)
      } else {
        setError(result.error || "Failed to fetch data")
      }
    } catch (err) {
      setError("Error fetching data: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const renderRating = (rating) => {
    if (!rating || rating === "") return "-"
    
    // If it's a numeric rating (1-5), show stars
    const numRating = parseInt(rating)
    if (!isNaN(numRating) && numRating >= 1 && numRating <= 5) {
      return (
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className={`h-4 w-4 ${star <= numRating ? "text-yellow-400" : "text-gray-300"}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="ml-1 text-xs text-gray-600">({numRating})</span>
        </div>
      )
    }
    
    // Otherwise, show the text rating
    return <span className="text-sm">{rating}</span>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Party Feedback</h2>
          <p className="text-muted-foreground">Customer feedback and ratings</p>
        </div>
        
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Customer Feedback</h3>
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
          <h2 className="text-3xl font-bold tracking-tight">Party Feedback</h2>
          <p className="text-muted-foreground">Customer feedback and ratings</p>
        </div>
        
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold">Customer Feedback</h3>
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
        <h2 className="text-3xl font-bold tracking-tight">Party Feedback</h2>
        <p className="text-muted-foreground">Customer feedback and ratings</p>
      </div>

      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Customer Feedback</h3>
          <p className="text-gray-600 text-sm">
            All customer feedback and ratings ({feedbackData.length} records)
          </p>
        </div>
        <div
          className="overflow-x-auto relative"
          style={{ maxHeight: '600px', overflowY: 'auto' }}
        >
          <table className="w-full table-auto text-sm">
            <thead className="bg-gray-50 border-b sticky top-0 z-10 shadow-sm text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Timestamp</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Customer Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Firm Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Contact</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Enquiry Revert</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Loading</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Dispatch</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Vehicle Lineup</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Communication</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Satisfaction</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Staff Rating</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Quality</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Additional Feedback</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {feedbackData.length > 0 ? (
                feedbackData.map((feedback, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 text-xs sm:text-sm">{feedback.timestamp}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 text-xs sm:text-sm">{feedback.customerName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 text-xs sm:text-sm">{feedback.firmName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-900 text-xs sm:text-sm">{feedback.contactNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{renderRating(feedback.enquiryRevertRating)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{renderRating(feedback.loadingRating)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{renderRating(feedback.dispatchRating)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{renderRating(feedback.vehicleLineupRating)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{renderRating(feedback.communicationRating)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{renderRating(feedback.satisfactionRating)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{renderRating(feedback.staffRating)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{renderRating(feedback.qualityRating)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={feedback.additionalFeedback}>
                        {feedback.additionalFeedback}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={13} className="px-6 py-8 text-center text-gray-500">
                    No feedback data found
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
