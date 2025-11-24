"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { RefreshCw, AlertCircle, CalendarIcon, Filter, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxGzl1EP1Vc6C5hB4DyOpmxraeUc0Ar4mAw567VOKlaBk0qwdFxyB37cgiGNiKYXww7/exec"
const SHEET_NAME = "FMS"

export function DashboardView() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const [selectedParty, setSelectedParty] = useState("All Parties")
  const [selectedState, setSelectedState] = useState("All States")
  const [selectedSalesperson, setSelectedSalesperson] = useState("All Salespersons")
  const [fromDate, setFromDate] = useState(null)
  const [toDate, setToDate] = useState(null)
  const [selectedItem, setSelectedItem] = useState("All Items")
const [items, setItems] = useState([])

  const [filterOptions, setFilterOptions] = useState({
    salesPersons: [],
    customers: [],
    states: [],
  })

  const dashboardRef = useRef(null)

  const formatTodayDate = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, "0")
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const year = today.getFullYear()
    return `${day}/${month}/${year}`
  }

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=${SHEET_NAME}&action=fetch`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const result = await response.json()

      if (result.success && result.data) {
        const processedData = processSheetData(result.data)
        setData(processedData)
        setError(null)
        setLastUpdated(new Date())
      } else {
        setError(result.error || "Failed to fetch data from Google Sheets")
        console.error("Google Sheets API error:", result.error)
      }
    } catch (err) {
      setError(`Failed to fetch data: ${err.message}`)
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

const fetchItemsFromFMSSheet = async () => {
  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=${SHEET_NAME}&action=fetch`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const result = await response.json()
    
    if (result.success && result.data) {
      const itemsSet = new Set()
      
      // Start from row 7 (index 6) as header is in row 6 (index 5)
      result.data.slice(6).forEach((row) => {
        // Check if row exists and has at least 28 columns (0-indexed up to 27)
        if (row && Array.isArray(row) && row.length > 27 && row[27] !== undefined && row[27] !== null) {
          const itemValue = row[27].toString().trim()
          if (itemValue !== "") {
            itemsSet.add(itemValue)
          }
        }
      })
      
      const itemsArray = Array.from(itemsSet).sort()
      setItems(itemsArray)
    }
  } catch (error) {
    console.error("Error fetching items from FMS sheet:", error)
  }
}

  const processSheetData = (sheetData) => {
    if (!Array.isArray(sheetData) || sheetData.length === 0) {
      throw new Error("No data rows found in the response")
    }

    // Start from row 7 (index 6) as header is in row 6 (index 5)
    const actualDataRows = sheetData.slice(6)

    const processedData = {
      rawData: actualDataRows,
      uniqueParties: [],
      uniqueStates: [],
      uniqueSalespersons: [],
    }

    // Extract unique values for dropdowns
    const partiesSet = new Set()
    const statesSet = new Set()
    const salespersonsSet = new Set()

    actualDataRows.forEach((row) => {
      if (!row || !Array.isArray(row)) return

      // Column D (index 3) - Party Name
      if (row[3] && row[3].toString().trim() !== "") {
        partiesSet.add(row[3].toString().trim())
      }

      // Column AE (index 30) - State
      if (row[30] && row[30].toString().trim() !== "") {
        statesSet.add(row[30].toString().trim())
      }

      // Column M (index 12) - Salesperson
      if (row[24] && row[24].toString().trim() !== "") {
        salespersonsSet.add(row[24].toString().trim())
      }
    })

    processedData.uniqueParties = Array.from(partiesSet).sort()
    processedData.uniqueStates = Array.from(statesSet).sort()
    processedData.uniqueSalespersons = Array.from(salespersonsSet).sort()

    return processedData
  }

  // Fixed date parsing function
  const parseDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return null

    const str = dateTimeStr.toString().trim()
    // Handle different date formats
    // Format 1: "19-08-2025 11:08:40" or "19/08/2025 11:08:40"
    // Format 2: "19-08-2025" or "19/08/2025"
    // Format 3: "2025-08-19" or other formats

    let datePart = str.split(" ")[0] // Get date part only

    // Replace hyphens with slashes for consistent parsing
    datePart = datePart.replace(/-/g, "/")

    const parts = datePart.split("/")

    if (parts.length === 3) {
      let day, month, year

      // Check if it's DD/MM/YYYY or MM/DD/YYYY or YYYY/MM/DD
      if (parts[0].length === 4) {
        // YYYY/MM/DD format
        year = Number.parseInt(parts[0])
        month = Number.parseInt(parts[1]) - 1
        day = Number.parseInt(parts[2])
      } else if (parts[2].length === 4) {
        // DD/MM/YYYY format (most likely based on your data)
        day = Number.parseInt(parts[0])
        month = Number.parseInt(parts[1]) - 1
        year = Number.parseInt(parts[2])
      } else {
        // Try DD/MM/YY format
        day = Number.parseInt(parts[0])
        month = Number.parseInt(parts[1]) - 1
        year = Number.parseInt(parts[2])
        if (year < 100) {
          year += 2000 // Convert YY to YYYY
        }
      }

      const parsedDate = new Date(year, month, day)
      return parsedDate
    }

    return null
  }

  // Fixed date comparison function
const isDateInRange = (dateStr, fromDate, toDate) => {
  if (!dateStr) return false

  const rowDate = parseDateTime(dateStr)
  if (!rowDate || isNaN(rowDate.getTime())) return false

  // Reset time to 00:00:00 for date-only comparison
  const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate())

  let isInRange = true

  if (fromDate) {
    const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
    if (rowDateOnly < fromDateOnly) {
      isInRange = false
    }
  }

  if (toDate && isInRange) {
    const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
    if (rowDateOnly > toDateOnly) {
      isInRange = false
    }
  }

    return isInRange
  }

const filteredData = data?.rawData?.filter((row) => {
  if (!row || !Array.isArray(row)) return false

  // Party filter (Column D - index 3)
  if (selectedParty !== "All Parties" && row[3] && row[3].toString().trim() !== selectedParty) {
    return false
  }

  // State filter (Column AE - index 30)
  if (selectedState !== "All States" && row[30] && row[30].toString().trim() !== selectedState) {
    return false
  }

  // Salesperson filter (Column M - index 12)
  if (selectedSalesperson !== "All Salespersons" && row[24] && row[24].toString().trim() !== selectedSalesperson) {
    return false
  }

  // Item filter (Column AB - index 27)
  if (selectedItem !== "All Items" && row[27] && row[27].toString().trim() !== selectedItem) {
    return false
  }

  // Date range filter (Column A - index 0) - Fixed logic
  if ((fromDate || toDate) && row[0]) {
    if (!isDateInRange(row[0], fromDate, toDate)) {
      return false
    }
  }

  return true
})

  // Calculate metrics based on filtered data
const calculateFilteredMetrics = () => {
  if (!filteredData || filteredData.length === 0) {
    return {
      totalGateIn: 0,
      totalGateOut: 0,
      totalPendingGateOut: 0,
      loadingPending: 0,
      totalDispatchToday: 0,
      wbIn: 0,
      wbOut: 0,
      wbPending: 0,
      totalAmount: 0,
      totalPaymentsReceived: 0,
      pendingPayments: 0,
      paymentSuccessRate: 0,
    }
  }

  const metrics = {
    totalGateIn: 0,
    totalGateOut: 0,
    totalPendingGateOut: 0,
    loadingPending: 0,
    totalDispatchToday: 0,
    wbIn: 0,
    wbOut: 0,
    wbPending: 0,
    totalAmount: 0,
    totalPaymentsReceived: 0,
    pendingPayments: 0,
    paymentSuccessRate: 94.2,
  }

  filteredData.forEach((row, index) => {
    if (!row || !Array.isArray(row)) return

    try {
      // Total Gate In - count rows with data in column B (index 1)
      if (row[1] && row[1].toString().trim() !== "") {
        metrics.totalGateIn++
      }

      // Total Gate Out - count rows with data in column AG (index 32)
      if (row[32] && row[32].toString().trim() !== "") {
        metrics.totalGateOut++
      }

      // Total Pending Gate Out - count rows where column AG (index 32) is null
      if (!row[32] || row[32].toString().trim() === "") {
        metrics.totalPendingGateOut++
      }

      // Loading Pending - count rows where column J (index 9) is not null and column K (index 10) is null
      if (row[9] && row[9].toString().trim() !== "" && (!row[10] || row[10].toString().trim() === "")) {
        metrics.loadingPending++
      }

      // Total Dispatch Today - count values in column T (index 19)
      // Total Dispatch Today - sum values in column AC (index 28) where column T (index 19) has a value
   // Total Dispatch Today - count values in column T (index 19)
      if (row[19] && row[19].toString().trim() !== "") {
        metrics.totalDispatchToday++
      }

      // WB In - count values in column G (index 6)
      if (row[6] && row[6].toString().trim() !== "") {
        metrics.wbIn++
      }

      // WB Out - count values in column P (index 15)
      if (row[15] && row[15].toString().trim() !== "") {
        metrics.wbOut++
      }

      // WB Pending - count values in column O (index 14)
      if (!row[15] || row[15].toString().trim() === "") {
        metrics.wbPending++
      }

      // Total Amount - sum column AD (index 29)
      if (row[29] && !isNaN(parseFloat(row[29]))) {
        metrics.totalAmount += parseFloat(row[29])
      }

      // Total Payments Received - sum column AL (index 37)
      if (row[37] && !isNaN(parseFloat(row[37]))) {
        metrics.totalPaymentsReceived += parseFloat(row[37])
      }

      // Pending Payments - sum column AM (index 38)
      if (row[38] && !isNaN(parseFloat(row[38]))) {
        metrics.pendingPayments += parseFloat(row[38])
      }
    } catch (error) {
      console.error(`Error processing row ${index + 7}:`, error)
    }
  })

  return metrics
}

const clearFilters = () => {
  setSelectedParty("All Parties")
  setSelectedState("All States")
  setSelectedSalesperson("All Salespersons")
  setSelectedItem("All Items")
  setFromDate(null)
  setToDate(null)
}

 const hasActiveFilters =
  selectedParty !== "All Parties" ||
  selectedState !== "All States" ||
  selectedSalesperson !== "All Salespersons" ||
  selectedItem !== "All Items" ||
  fromDate ||
  toDate

const downloadPDF = async () => {
  if (!dashboardRef.current) {
    alert("Dashboard content not ready for download");
    return;
  }

  try {
    const metrics = calculateFilteredMetrics();
    const top10Data = generateTop10Customers();

    // Create a styled HTML document for PDF conversion
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Dashboard Report</title>
        <style>
          @page {
            margin: 20mm;
            size: A4;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
          }
          
          .header h1 {
            font-size: 28px;
            color: #1e40af;
            margin-bottom: 5px;
          }
          
          .header .subtitle {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 10px;
          }
          
          .timestamp {
            font-size: 12px;
            color: #9ca3af;
          }
          
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          
          .kpi-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            background: #f9fafb;
          }
          
          .kpi-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .kpi-value {
            font-size: 20px;
            font-weight: 700;
            color: #1e40af;
          }
          
          .kpi-value.amount {
            color: #059669;
          }
          
          .kpi-value.alert {
            color: #dc2626;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            font-size: 11px;
          }
          
          th {
            background: #f3f4f6;
            color: #374151;
            font-weight: 600;
            padding: 12px 8px;
            text-align: left;
            border: 1px solid #d1d5db;
          }
          
          td {
            padding: 10px 8px;
            border: 1px solid #e5e7eb;
            vertical-align: top;
          }
          
          tr:nth-child(even) {
            background: #f9fafb;
          }
          
          tr:hover {
            background: #f3f4f6;
          }
          
          .filters-section {
            background: #eff6ff;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
          }
          
          .filter-item {
            display: inline-block;
            background: white;
            padding: 5px 10px;
            margin: 5px;
            border-radius: 15px;
            border: 1px solid #d1d5db;
            font-size: 12px;
          }
          
          .no-data {
            text-align: center;
            color: #6b7280;
            font-style: italic;
            padding: 20px;
          }
          
          .page-break {
            page-break-before: always;
          }
          
          @media print {
            body { print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Dashboard Report</h1>
          <div class="subtitle">Filtered view of O2D operations</div>
          <div class="timestamp">Generated on: ${new Date().toLocaleString()}</div>
        </div>

        <div class="section">
          <div class="section-title">Key Performance Indicators</div>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Total Gate In</div>
              <div class="kpi-value">${metrics.totalGateIn}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Gate Out</div>
              <div class="kpi-value">${metrics.totalGateOut}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Dispatch</div>
              <div class="kpi-value">${metrics.totalDispatchToday}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">WB In</div>
              <div class="kpi-value">${metrics.wbIn}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">WB Out</div>
              <div class="kpi-value">${metrics.wbOut}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">WB Pending</div>
              <div class="kpi-value alert">${metrics.wbPending}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Amount</div>
              <div class="kpi-value amount">₹${metrics.totalAmount.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Payments Received</div>
              <div class="kpi-value amount">₹${metrics.totalPaymentsReceived.toLocaleString()}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Pending Payments</div>
              <div class="kpi-value alert">₹${metrics.pendingPayments.toLocaleString()}</div>
            </div>
            // <div class="kpi-card">
            //   <div class="kpi-label">Payment Success Rate</div>
            //   <div class="kpi-value amount">${metrics.paymentSuccessRate}%</div>
            // </div>
          </div>
        </div>

        ${
          hasActiveFilters
            ? `
        <div class="section">
          <div class="section-title">Applied Filters</div>
          <div class="filters-section">
            ${selectedParty !== "All Parties" ? `<span class="filter-item">Party: ${selectedParty}</span>` : ""}
            ${selectedState !== "All States" ? `<span class="filter-item">State: ${selectedState}</span>` : ""}
            ${selectedSalesperson !== "All Salespersons" ? `<span class="filter-item">Salesperson: ${selectedSalesperson}</span>` : ""}
            ${fromDate ? `<span class="filter-item">From: ${format(fromDate, "dd/MM/yyyy")}</span>` : ""}
            ${toDate ? `<span class="filter-item">To: ${format(toDate, "dd/MM/yyyy")}</span>` : ""}
          </div>
        </div>
        `
            : ""
        }

        <div class="section">
          <div class="section-title">Top 10 Customers</div>
          ${
            top10Data.length > 0
              ? `
          <table>
            <thead>
              <tr>
                <th style="width: 8%">Rank</th>
                <th style="width: 50%">Customer Name</th>
                <th style="width: 15%">Dispatches</th>
                <th style="width: 27%">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${top10Data
                .map(
                  (customer) => `
              <tr>
                <td>${customer.rank}</td>
                <td>${customer.name}</td>
                <td>${customer.dispatches}</td>
                <td>${customer.amount}</td>
              </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          `
              : '<div class="no-data">No customer data available</div>'
          }
        </div>

        <div class="section page-break">
          <div class="section-title">Filtered Results (${filteredData?.length || 0} total records)</div>
          ${
            filteredData && filteredData.length > 0
              ? `
          <table>
            <thead>
              <tr>
                <th style="width: 8%">Sr.No.</th>
                <th style="width: 35%">Party Name</th>
                <th style="width: 20%">Salesperson</th>
                <th style="width: 15%">State</th>
                <th style="width: 12%">Dispatch Date</th>
                <th style="width: 10%">Order No.</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData
                .slice(0, 100)
                .map(
                  (row, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${row[3] || "-"}</td>
                <td>${row[24] || "-"}</td>
                <td>${row[30] || "-"}</td>
                <td>${row[19] || "-"}</td>
                <td>${row[1] || "-"}</td>
              </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          ${filteredData.length > 100 ? `<div style="margin-top: 15px; font-size: 12px; color: #6b7280; text-align: center;">Showing first 100 records of ${filteredData.length} total results</div>` : ""}
          `
              : '<div class="no-data">No records found matching your filters</div>'
          }
        </div>

        <div style="margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px;">
          Powered by <strong>Botivate</strong> - Dashboard Report System
        </div>
      </body>
      </html>
    `;

    // Create a blob from the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element for downloading
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dashboard_Report_${new Date().toISOString().slice(0, 10)}.html`;
    
    // Append to body, click, and remove
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Error generating PDF. Please try again.");
  }
}

useEffect(() => {
  fetchData()
  fetchItemsFromFMSSheet()  // Changed from fetchItemsFromLoginSheet
  // Auto-refresh every 5 minutes
  const interval = setInterval(() => {
    fetchData()
    fetchItemsFromFMSSheet()  // Changed from fetchItemsFromLoginSheet
  }, 5 * 60 * 1000)
  return () => clearInterval(interval)
}, [])


  const handleRefresh = () => {
    fetchData()
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-red-500">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
          <button
            onClick={handleRefresh}
            className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF7C7C"]

  // Use calculated metrics from filtered data
  const displayMetrics = data
    ? calculateFilteredMetrics()
    : {
        totalGateIn: 142,
        totalGateOut: 128,
        totalDispatchToday: 95,
        wbIn: 24,
        wbOut: 18,
        wbPending: 7,
        totalPaymentsReceived: 245000,
        pendingPayments: 85500,
        paymentSuccessRate: 94.2,
      }

  const generateChartData = () => {
  if (!filteredData || filteredData.length === 0) {
    return []
  }

  const dataMap = {}

  filteredData.forEach((row) => {
    if (!row || !Array.isArray(row)) return

    let key = ""
    // Use party data as default since we removed toggle buttons
    if (row[3] && row[3].toString().trim() !== "") {
      key = row[3].toString().trim()
    }

    if (key) {
      dataMap[key] = (dataMap[key] || 0) + 1
    }
  })

  const sortedEntries = Object.entries(dataMap).sort(([, a], [, b]) => b - a)
  const top10 = sortedEntries.slice(0, 10)
  const others = sortedEntries.slice(10)
  
  const chartData = top10.map(([name, value], index) => ({
    name,
    value,
    fill: COLORS[index % COLORS.length],
  }))

  // Add "Others" category if there are more than 10 entries
  if (others.length > 0) {
    const othersTotal = others.reduce((sum, [, value]) => sum + value, 0)
    chartData.push({
      name: "Others",
      value: othersTotal,
      fill: "#999999",
    })
  }

  return chartData
}

const generateTop10Customers = () => {
  if (!filteredData || filteredData.length === 0) {
    return []
  }

  const customerMap = {}

  filteredData.forEach((row) => {
    if (!row || !Array.isArray(row)) return

    // Get customer name from column Z (index 25)
    const customerName = row[25] ? row[25].toString().trim() : null
    // Get amount from column AD (index 29)
    const amount = row[29] && !isNaN(parseFloat(row[29])) ? parseFloat(row[29]) : 0
    // Get balance amount from column AM (index 38)
    const balanceAmount = row[38] && !isNaN(parseFloat(row[38])) ? parseFloat(row[38]) : 0
    // Get item name from column AB (index 27)
    const itemName = row[27] ? row[27].toString().trim() : ""
    // Get qty from column AC (index 28)
    const qty = row[28] && !isNaN(parseFloat(row[28])) ? parseFloat(row[28]) : 0
    // Check if column T (index 19) has a valid dispatch date
    const hasDispatch = row[19] && row[19].toString().trim() !== ""

    if (customerName && customerName !== "") {
      if (!customerMap[customerName]) {
        customerMap[customerName] = {
          name: customerName,
          totalAmount: 0,
          dispatchCount: 0,
          balanceAmount: 0,
          items: new Set(),
          totalQty: 0,
        }
      }
      customerMap[customerName].totalAmount += amount
      customerMap[customerName].balanceAmount += balanceAmount
      customerMap[customerName].totalQty += qty

      // Add item to set (automatically removes duplicates)
      if (itemName) {
        customerMap[customerName].items.add(itemName)
      }

      // Only count as dispatch if column T has a value
      if (hasDispatch) {
        customerMap[customerName].dispatchCount += 1
      }
    }
  })

  return Object.values(customerMap)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10)
    .map((customer, index) => ({
      rank: index + 1,
      name: customer.name,
      dispatches: customer.dispatchCount,
      amount: `₹${customer.totalAmount.toLocaleString()}`,
      balanceAmount: `₹${customer.balanceAmount.toLocaleString()}`,
      // Convert Set to comma-separated string
      itemNames: Array.from(customer.items).join(", "),
      totalQty: customer.totalQty.toFixed(2),
    }))
}

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6" ref={dashboardRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-gray-600 text-sm sm:text-base">Filtered view of your O2D operations</p>
          {lastUpdated && <p className="text-xs text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</p>}
        </div>
        <Button onClick={downloadPDF} className="flex items-center gap-2 ignore-pdf">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Download PDF
        </Button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
              </CardTitle>
              <CardDescription>Filter data by party, date range, state, and salesperson</CardDescription>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="ignore-pdf bg-transparent">
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Salesperson Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Salesperson</label>
              <Select value={selectedSalesperson} onValueChange={setSelectedSalesperson}>
                <SelectTrigger>
                  <SelectValue placeholder="Select salesperson" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Salespersons">All Salespersons</SelectItem>
                  {data?.uniqueSalespersons?.map((salesperson) => (
                    <SelectItem key={salesperson} value={salesperson}>
                      {salesperson}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* State Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">State</label>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All States">All States</SelectItem>
                  {data?.uniqueStates?.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Party Name Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Party Name</label>
              <Select value={selectedParty} onValueChange={setSelectedParty}>
                <SelectTrigger>
                  <SelectValue placeholder="Select party" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Parties">All Parties</SelectItem>
                  {data?.uniqueParties?.map((party) => (
                    <SelectItem key={party} value={party}>
                      {party}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

             <div className="space-y-2">
  <label className="text-sm font-medium">Item</label>
  <Select value={selectedItem} onValueChange={setSelectedItem}>
    <SelectTrigger>
      <SelectValue placeholder="Select item" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="All Items">All Items</SelectItem>
      {items.map((item) => (
        <SelectItem key={item} value={item}>
          {item}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>

            {/* From Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !fromDate && "text-gray-500")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !toDate && "text-gray-500")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "dd/MM/yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedParty !== "All Parties" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Party: {selectedParty}
                  <X className="h-3 w-3 cursor-pointer ignore-pdf" onClick={() => setSelectedParty("All Parties")} />
                </Badge>
              )}
              {selectedState !== "All States" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  State: {selectedState}
                  <X className="h-3 w-3 cursor-pointer ignore-pdf" onClick={() => setSelectedState("All States")} />
                </Badge>
              )}
              {selectedSalesperson !== "All Salespersons" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Salesperson: {selectedSalesperson}
                  <X
                    className="h-3 w-3 cursor-pointer ignore-pdf"
                    onClick={() => setSelectedSalesperson("All Salespersons")}
                  />
                </Badge>
              )}
              {fromDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  From: {format(fromDate, "dd/MM/yyyy")}
                  <X className="h-3 w-3 cursor-pointer ignore-pdf" onClick={() => setFromDate(null)} />
                </Badge>
              )}
              {toDate && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  To: {format(toDate, "dd/MM/yyyy")}
                  <X className="h-3 w-3 cursor-pointer ignore-pdf" onClick={() => setToDate(null)} />
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
     {/* KPI Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
  <Card className="w-full overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
      <CardTitle className="text-xs font-medium">Total Gate In</CardTitle>
      <Badge variant="secondary" className="text-xs shrink-0">
        Today
      </Badge>
    </CardHeader>
    <CardContent className="p-3 pt-0">
      <div className="text-lg font-bold text-blue-600">{displayMetrics.totalGateIn}</div>
      <p className="text-xs text-gray-600">Live count from sheet</p>
    </CardContent>
  </Card>

  <Card className="w-full overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
      <CardTitle className="text-xs font-medium">Total Gate Out</CardTitle>
      <Badge variant="secondary" className="text-xs shrink-0">
        Today
      </Badge>
    </CardHeader>
    <CardContent className="p-3 pt-0">
      <div className="text-lg font-bold text-blue-600">{displayMetrics.totalGateOut}</div>
      <p className="text-xs text-gray-600">Live count from sheet</p>
    </CardContent>
  </Card>

  <Card className="w-full overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
      <CardTitle className="text-xs font-medium">Total Pending Gate Out</CardTitle>
      <Badge variant="destructive" className="text-xs shrink-0">
        Pending
      </Badge>
    </CardHeader>
    <CardContent className="p-3 pt-0">
      <div className="text-lg font-bold text-red-600">{displayMetrics.totalPendingGateOut}</div>
      <p className="text-xs text-gray-600">pending</p>
    </CardContent>
  </Card>

  <Card className="w-full overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
      <CardTitle className="text-xs font-medium">Loading Pending</CardTitle>
      <Badge variant="destructive" className="text-xs shrink-0">
        Pending
      </Badge>
    </CardHeader>
    <CardContent className="p-3 pt-0">
      <div className="text-lg font-bold text-red-600">{displayMetrics.loadingPending}</div>
      <p className="text-xs text-gray-600">pending</p>
    </CardContent>
  </Card>

 <Card className="w-full overflow-hidden">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
    <CardTitle className="text-xs font-medium">Total Invoice</CardTitle>
  </CardHeader>
  <CardContent className="p-3 pt-0">
    <div className="text-lg font-bold text-blue-600">
        {displayMetrics.totalDispatchToday}
      </div>
    <p className="text-xs text-gray-600">{formatTodayDate()}</p>
  </CardContent>
</Card>

  <Card className="w-full overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
      <CardTitle className="text-xs font-medium">WB In</CardTitle>
      <Badge variant="secondary" className="text-xs shrink-0">
        Pending
      </Badge>
    </CardHeader>
    <CardContent className="p-3 pt-0">
      <div className="text-lg font-bold text-blue-600">{displayMetrics.wbIn}</div>
    </CardContent>
  </Card>

  <Card className="w-full overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
      <CardTitle className="text-xs font-medium">WB Out</CardTitle>
      <Badge variant="secondary" className="text-xs shrink-0">
        Pending
      </Badge>
    </CardHeader>
    <CardContent className="p-3 pt-0">
      <div className="text-lg font-bold text-blue-600">{displayMetrics.wbOut}</div>
    </CardContent>
  </Card>

  <Card className="w-full overflow-hidden">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
      <CardTitle className="text-xs font-medium">WB Pending</CardTitle>
      <Badge variant="destructive" className="text-xs shrink-0">
        Alert
      </Badge>
    </CardHeader>
    <CardContent className="p-3 pt-0">
      <div className="text-lg font-bold text-red-600">{displayMetrics.wbPending}</div>
      <p className="text-xs text-gray-600">Requires attention</p>
    </CardContent>
  </Card>

 <Card className="w-full overflow-hidden">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
    <CardTitle className="text-xs font-medium">Total Amount</CardTitle>
    <Badge variant="secondary" className="text-xs shrink-0">
      Total
    </Badge>
  </CardHeader>
  <CardContent className="p-3 pt-0">
    <div className="text-lg font-bold text-green-600">
      ₹{displayMetrics.totalAmount}
    </div>
    <p className="text-xs text-gray-600">Column AD sum</p>
  </CardContent>
</Card>

  <Card className="w-full overflow-hidden">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
    <CardTitle className="text-xs font-medium">Total Payments Received</CardTitle>
    <Badge variant="secondary" className="text-xs shrink-0">
      Today
    </Badge>
  </CardHeader>
  <CardContent className="p-3 pt-0">
    <div className="text-lg font-bold text-green-600">
      ₹{displayMetrics.totalPaymentsReceived}
    </div>
    <p className="text-xs text-gray-600">Sum from sheet</p>
  </CardContent>
</Card>

  <Card className="w-full overflow-hidden">
  <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
    <CardTitle className="text-xs font-medium">Pending Payments</CardTitle>
    <Badge variant="destructive" className="text-xs shrink-0">
      Alert
    </Badge>
  </CardHeader>
  <CardContent className="p-3 pt-0">
    <div className="text-lg font-bold text-red-600">
      ₹{displayMetrics.pendingPayments}
    </div>
    <p className="text-xs text-gray-600">Outstanding amount</p>
  </CardContent>
</Card>
</div>

      <Card className="w-full overflow-hidden">
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-sm sm:text-base lg:text-lg">Party Wise Dispatch Analytics</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Distribution by customer ({filteredData?.length || 0} total records)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          <ChartContainer
            config={{
              value: {
                label: "Dispatched",
                color: "#0088FE",
              },
              dispatched: {
                label: "Dispatched",
                color: "#0088FE",
              },
            }}
            className="w-full"
          >
            <div className="w-full" style={{ minHeight: 300 }}>
              <ResponsiveContainer width="100%" aspect={2.5}>
                <PieChart>
                  <Pie
                    data={generateChartData().length > 0 ? generateChartData() : []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius="60%"
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {generateChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-white border rounded-lg p-2 shadow-md">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-gray-600">{data.value} dispatches</p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 10 Customers</CardTitle>
          <CardDescription>
            Top performing customers by dispatch volume
            {hasActiveFilters ? " (filtered results)" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[420px]">
            <Table>
             <TableHeader className="sticky top-0 z-10 bg-white">
  <TableRow>
    <TableHead className="text-xs sm:text-sm">Rank</TableHead>
    <TableHead className="text-xs sm:text-sm">Customer Name</TableHead>
    <TableHead className="text-xs sm:text-sm">Item Name</TableHead>
    <TableHead className="text-xs sm:text-sm">Qty</TableHead>
    <TableHead className="text-xs sm:text-sm">Dispatches</TableHead>
    <TableHead className="text-xs sm:text-sm">Total Amount</TableHead>
    <TableHead className="text-xs sm:text-sm">Balance Amount</TableHead>
  </TableRow>
</TableHeader>
<TableBody>
  {generateTop10Customers().length === 0 ? (
    <TableRow>
      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
        No customer data available
      </TableCell>
    </TableRow>
  ) : (
    generateTop10Customers().map((customer) => (
      <TableRow key={customer.rank}>
        <TableCell className="text-xs sm:text-sm">{customer.rank}</TableCell>
        <TableCell className="text-xs sm:text-sm">{customer.name}</TableCell>
        <TableCell className="text-xs sm:text-sm">{customer.itemNames}</TableCell>
        <TableCell className="text-xs sm:text-sm">{customer.totalQty}</TableCell>
        <TableCell className="text-xs sm:text-sm">{customer.dispatches}</TableCell>
        <TableCell className="text-xs sm:text-sm">{customer.amount}</TableCell>
        <TableCell className="text-xs sm:text-sm">{customer.balanceAmount}</TableCell>
      </TableRow>
    ))
  )}
</TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

<Card>
  <CardHeader>
    <CardTitle>Filtered Results</CardTitle>
    <CardDescription>
      Showing {filteredData?.length || 0} records
      {hasActiveFilters ? " matching your filters" : " (all data)"}
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="overflow-x-auto max-h-[480px]">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-white">
          <TableRow>
            <TableHead className="text-xs sm:text-sm">Sr. No.</TableHead>
            <TableHead className="text-xs sm:text-sm">Party Name</TableHead>
            <TableHead className="text-xs sm:text-sm">Item Name</TableHead>
            <TableHead className="text-xs sm:text-sm">Qty</TableHead>
            <TableHead className="text-xs sm:text-sm">Salesperson</TableHead>
            <TableHead className="text-xs sm:text-sm">State</TableHead>
            <TableHead className="text-xs sm:text-sm">Dispatch Date</TableHead>
            <TableHead className="text-xs sm:text-sm">Order No.</TableHead>
            <TableHead className="text-xs sm:text-sm">Balance Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!filteredData || filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                No records found matching your filters
              </TableCell>
            </TableRow>
          ) : (
            // Group data by customer name
            Object.entries(
              filteredData.reduce((acc, row, index) => {
                const customerName = row[25] ? row[25].toString().trim() : "Unknown Customer";
                
                if (!acc[customerName]) {
                  acc[customerName] = {
                    customerName,
                    items: new Set(),
                    totalQty: 0,
                    salesperson: row[24] || "-",
                    state: row[30] || "-",
                    dispatchDate: row[19] || "-",
                    orderNo: row[1] || "-",
                    balanceAmount: row[38] ? `₹${parseFloat(row[38]).toLocaleString()}` : "-",
                    index: index + 1
                  };
                }
                
                // Add item to set (removes duplicates automatically)
                if (row[27] && row[27].toString().trim() !== "") {
                  acc[customerName].items.add(row[27].toString().trim());
                }
                
                // Add quantity
                if (row[28] && !isNaN(parseFloat(row[28]))) {
                  acc[customerName].totalQty += parseFloat(row[28]);
                }
                
                return acc;
              }, {})
            ).map(([customerName, customerData], index) => (
              <TableRow key={index}>
                <TableCell className="text-xs sm:text-sm">{customerData.index}</TableCell>
                <TableCell className="text-xs sm:text-sm">{customerName}</TableCell>
                <TableCell className="text-xs sm:text-sm">
                  {Array.from(customerData.items).join(", ") || "-"}
                </TableCell>
                <TableCell className="text-xs sm:text-sm">{customerData.totalQty.toFixed(2)}</TableCell>
                <TableCell className="text-xs sm:text-sm">{customerData.salesperson}</TableCell>
                <TableCell className="text-xs sm:text-sm">{customerData.state}</TableCell>
                <TableCell className="text-xs sm:text-sm">{customerData.dispatchDate}</TableCell>
                <TableCell className="text-xs sm:text-sm">{customerData.orderNo}</TableCell>
                <TableCell className="text-xs sm:text-sm">{customerData.balanceAmount}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    {filteredData && filteredData.length > 100 && (
      <div className="mt-4 text-sm text-gray-500 text-center">
        Showing first 100 records of {filteredData.length} total results
      </div>
    )}
  </CardContent>
</Card>
    </div>
  )
}
