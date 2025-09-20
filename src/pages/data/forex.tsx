import React, { useState, useEffect } from "react"
import * as LucideIcons from "lucide-react"
import { fetchForexData, getCurrencyIconName } from "../../lib/forex"
import { ForexRate } from "../../types"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

const ForexPage: React.FC = () => {
  const [forexRates, setForexRates] = useState<ForexRate[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<"1W" | "1M" | "3M" | "6M" | "1Y">(
    "1M"
  )

  // Function to get currency icon
  const getCurrencyIcon = (code: string, size = "h-6 w-6") => {
    const iconName = getCurrencyIconName(code)
    if (!iconName) return null

    const Icon = LucideIcons[iconName as keyof typeof LucideIcons]
    return Icon ? <Icon className={size} /> : null
  }

  // Fetch forex data
  useEffect(() => {
    const getForexData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get all available forex data
        const data = await fetchForexData()
        setForexRates(data)

        // Set USD as selected by default
        if (data.length > 0 && !selectedCurrency) {
          setSelectedCurrency("USD")
        }
      } catch (error) {
        console.error("Error fetching forex data:", error)
        setError(
          error instanceof Error ? error.message : "Failed to fetch forex data"
        )
      } finally {
        setIsLoading(false)
      }
    }

    getForexData()
  }, [selectedCurrency])

  // Get selected currency data
  const selectedCurrencyData = forexRates.find(
    (rate) => rate.code === selectedCurrency
  )

  // Generate historical data based on current rate (mock data)
  const generateHistoricalData = (currentRate: number, timeframe: string) => {
    const data = []
    let days = 30 // default to 1 month

    switch (timeframe) {
      case "1W":
        days = 7
        break
      case "1M":
        days = 30
        break
      case "3M":
        days = 90
        break
      case "6M":
        days = 180
        break
      case "1Y":
        days = 365
        break
      default:
        days = 30
    }

    const today = new Date()
    const volatility = 0.02 // 2% volatility

    for (let i = days; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)

      // Generate a random walk around the current rate
      const randomFactor = 1 + (Math.random() * volatility * 2 - volatility)
      const historicalRate = currentRate * randomFactor

      data.push({
        date: date.toISOString().split("T")[0],
        rate: parseFloat(historicalRate.toFixed(4)),
      })
    }

    return data
  }

  // Format currency name
  const formatCurrencyName = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  // Generate historical data for the selected currency
  const historicalData = selectedCurrencyData
    ? generateHistoricalData(selectedCurrencyData.rate, timeframe)
    : []

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='container mx-auto py-8 px-4'>
        {isLoading ? (
          <div className='flex justify-center items-center h-64'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600'></div>
          </div>
        ) : error ? (
          <div className='bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-md'>
            <p className='font-bold'>Error</p>
            <p>{error}</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
            {/* Currency Selection Panel */}
            <div className='bg-white rounded-lg shadow-md p-6'>
              <h2 className='text-xl font-bold mb-4 text-gray-800'>
                Currencies
              </h2>
              <div className='space-y-2'>
                {forexRates.map((rate) => (
                  <button
                    key={rate.code}
                    onClick={() => setSelectedCurrency(rate.code)}
                    className={`w-full text-left px-4 py-3 rounded-md transition-all flex items-center justify-between ${
                      selectedCurrency === rate.code
                        ? "bg-primary-100 text-primary-800"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    <div className='flex items-center'>
                      <div>
                        <div className='font-medium'>{rate.code}</div>
                        <div className='text-xs text-gray-800'>
                          {formatCurrencyName(rate.currency)}
                        </div>
                      </div>
                    </div>
                    <span className='font-semibold'>
                      ₱{rate.rate?.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Currency Details and Chart */}
            {selectedCurrencyData && (
              <div className='lg:col-span-3'>
                <div className='bg-white rounded-lg shadow-md p-6 mb-8'>
                  <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-6'>
                    <div className='flex items-center mb-4 md:mb-0'>
                      <div className='bg-primary-100 p-3 rounded-full mr-4'>
                        {getCurrencyIcon(
                          selectedCurrencyData.code,
                          "h-8 w-8 text-primary-600"
                        )}
                      </div>
                      <div>
                        <h2 className='text-2xl font-bold text-gray-800'>
                          {selectedCurrencyData.code}
                        </h2>
                        <p className='text-gray-800'>
                          {formatCurrencyName(selectedCurrencyData.currency)}
                        </p>
                      </div>
                    </div>
                    <div className='bg-gray-100 rounded-lg p-4'>
                      <div className='text-sm text-gray-800 mb-1'>
                        Current Rate
                      </div>
                      <div className='text-3xl font-bold text-gray-800'>
                        ₱{selectedCurrencyData.rate.toFixed(4)}
                      </div>
                      <div className='text-xs text-gray-800'>
                        Philippine Peso
                      </div>
                    </div>
                  </div>

                  {/* Timeframe Selection */}
                  <div className='flex space-x-2 mb-4'>
                    {(["1W", "1M", "3M", "6M", "1Y"] as const).map((period) => (
                      <button
                        key={period}
                        onClick={() => setTimeframe(period)}
                        className={`px-3 py-1 text-sm rounded-md ${
                          timeframe === period
                            ? "bg-primary-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>

                  {/* Chart */}
                  <div className='h-80 hidden'>
                    <ResponsiveContainer width='100%' height='100%'>
                      <LineChart
                        data={historicalData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                        <XAxis
                          dataKey='date'
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            const date = new Date(value)
                            return date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          }}
                        />
                        <YAxis
                          domain={["auto", "auto"]}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `₱${value.toFixed(2)}`}
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `₱${value.toFixed(4)}`,
                            "Rate",
                          ]}
                          labelFormatter={(label) => {
                            const date = new Date(label)
                            return date.toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          }}
                        />
                        <Legend />
                        <Line
                          type='monotone'
                          dataKey='rate'
                          name={`PHP to ${selectedCurrencyData.code} Rate`}
                          stroke='#4f46e5'
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Conversion Calculator */}
                <div className='bg-white rounded-lg shadow-md p-6'>
                  <h3 className='text-xl font-bold mb-4 text-gray-800'>
                    Currency Converter
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        Philippine Peso (PHP)
                      </label>
                      <div className='relative rounded-md shadow-sm'>
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                          <span className='text-gray-800 sm:text-sm'>₱</span>
                        </div>
                        <input
                          type='number'
                          className='focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3'
                          placeholder='0.00'
                          defaultValue='1000'
                        />
                      </div>
                    </div>
                    <div>
                      <label className='block text-sm font-medium text-gray-700 mb-2'>
                        {selectedCurrencyData.code} (
                        {formatCurrencyName(selectedCurrencyData.currency)})
                      </label>
                      <div className='relative rounded-md shadow-sm'>
                        <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                          <span className='text-gray-800 sm:text-sm'>
                            {selectedCurrencyData.code === "USD"
                              ? "$"
                              : selectedCurrencyData.code === "EUR"
                              ? "€"
                              : selectedCurrencyData.code === "GBP"
                              ? "£"
                              : selectedCurrencyData.code === "JPY"
                              ? "¥"
                              : ""}
                          </span>
                        </div>
                        <input
                          type='text'
                          className='focus:ring-primary-500 focus:border-primary-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md py-3 bg-gray-50'
                          readOnly
                          value={(1000 / selectedCurrencyData.rate).toFixed(2)}
                        />
                      </div>
                    </div>
                  </div>
                  <p className='mt-4 text-sm text-gray-800'>
                    Exchange rates are provided by Bangko Sentral ng Pilipinas
                    (BSP). Last updated:{" "}
                    {new Date().toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Forex Information Section */}
        <div className='mt-12 bg-white rounded-lg shadow-md p-6'>
          <h2 className='text-2xl font-bold mb-4 text-gray-800'>
            About Foreign Exchange Rates
          </h2>
          <p className='text-gray-800 mb-4'>
            The foreign exchange rates displayed on this page are sourced from
            the Bangko Sentral ng Pilipinas (BSP), the central bank of the
            Philippines. These rates represent the official reference rates for
            the Philippine Peso against major world currencies.
          </p>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mt-6'>
            <div className='border-l-4 border-primary-500 pl-4'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                Understanding Exchange Rates
              </h3>
              <p className='text-gray-800'>
                Exchange rates indicate how much of one currency can be
                exchanged for another. The rates shown here represent the amount
                of Philippine Pesos (PHP) needed to purchase one unit of the
                foreign currency.
              </p>
            </div>
            <div className='border-l-4 border-primary-500 pl-4'>
              <h3 className='text-lg font-semibold text-gray-800 mb-2'>
                Official BSP Rates
              </h3>
              <p className='text-gray-800'>
                For official foreign exchange reference rates and more detailed
                information, please visit the{" "}
                <a
                  href='https://www.bsp.gov.ph/SitePages/Statistics/ExchangeRate.aspx'
                  className='text-primary-600 hover:underline'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  Bangko Sentral ng Pilipinas website
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForexPage
