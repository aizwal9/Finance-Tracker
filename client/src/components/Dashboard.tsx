import React, { useEffect, useState, useContext } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { AuthContext } from '../app'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, subDays, subMonths, subYears, isAfter } from 'date-fns'

export default function Dashboard() {
    const { user } = useContext(AuthContext)
    const [transactions, setTransactions] = useState([])
    const [timeRange, setTimeRange] = useState('week')
    const [filteredTransactions, setFilteredTransactions] = useState([])

    useEffect(() => {
        fetchTransactions()
    }, [timeRange])

    useEffect(() => {
        filterTransactionsByTimeRange()
    }, [transactions, timeRange])

    const fetchTransactions = async () => {
        const token = localStorage.getItem('token')
        try {
            const response = await fetch( import.meta.env.VITE_API_URL + '/api/transactions', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                setTransactions(data)
            }
        } catch (error) {
            console.error('Failed to fetch transactions', error)
        }
    }

    const filterTransactionsByTimeRange = () => {
        const now = new Date()
        let startDate
        switch (timeRange) {
            case 'week':
                startDate = subDays(now, 7)
                break
            case 'month':
                startDate = subMonths(now, 1)
                break
            case 'year':
                startDate = subYears(now, 1)
                break
            default:
                startDate = new Date(0)
        }

        const filtered = transactions.filter(transaction =>
            isAfter(new Date(transaction.date), startDate)
        )
        setFilteredTransactions(filtered)
    }

    const processDataForChart = () => {
        const groupedData = filteredTransactions.reduce((acc, transaction) => {
            const date = format(new Date(transaction.date), 'yyyy-MM-dd')
            if (!acc[date]) {
                acc[date] = {
                    date,
                    income: 0,
                    expenses: 0,
                    displayDate: format(new Date(date), 'MMM d')
                }
            }
            if (transaction.amount > 0) {
                acc[date].income += transaction.amount
            } else {
                acc[date].expenses += Math.abs(transaction.amount)
            }
            return acc
        }, {})

        return Object.entries(groupedData)
            .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
            .map(([_, data]) => data)
    }

    const chartData = processDataForChart()

    const totalBalance = filteredTransactions.reduce((sum, transaction) => sum + transaction.amount, 0)
    const totalIncome = filteredTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = filteredTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const getTimeRangeLabel = () => {
        switch (timeRange) {
            case 'week':
                return 'Last 7 days'
            case 'month':
                return 'Last 30 days'
            case 'year':
                return 'Last 12 months'
            default:
                return 'All time'
        }
    }

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 border rounded-lg shadow-lg">
                    <p className="font-semibold mb-2">{label}</p>
                    <div className="space-y-1">
                        <p className="text-emerald-600">Income: {formatCurrency(payload[0]?.value || 0)}</p>
                        <p className="text-red-600">Expenses: {formatCurrency(payload[1]?.value || 0)}</p>
                    </div>
                </div>
            )
        }
        return null
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Financial Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Current Balance</CardTitle>
                        <CardDescription>Your balance for {getTimeRangeLabel()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatCurrency(totalBalance)}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Income</CardTitle>
                        <CardDescription>Your income for {getTimeRangeLabel()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Expenses</CardTitle>
                        <CardDescription>Your expenses for {getTimeRangeLabel()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Income vs Expenses</CardTitle>
                    <CardDescription>
                        <div className="flex justify-between items-center">
                            <span>Comparison of your income and expenses for {getTimeRangeLabel()}</span>
                            <Select value={timeRange} onValueChange={setTimeRange}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Select time range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="week">Last Week</SelectItem>
                                    <SelectItem value="month">Last Month</SelectItem>
                                    <SelectItem value="year">Last Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer
                        config={{
                            income: {
                                label: "Income",
                                color: "#22c55e",
                            },
                            expenses: {
                                label: "Expenses",
                                color: "#ef4444",
                            },
                        }}
                        className="h-[400px]"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis
                                    dataKey="displayDate"
                                    tick={{ fill: 'hsl(var(--foreground))' }}
                                />
                                <YAxis
                                    tickFormatter={formatCurrency}
                                    tick={{ fill: 'hsl(var(--foreground))' }}
                                    domain={[0, 'auto']}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <ReferenceLine y={0} stroke="#666" />
                                <Bar
                                    dataKey="income"
                                    fill="#22c55e"
                                    name="Income"
                                    barSize={20}
                                />
                                <Bar
                                    dataKey="expenses"
                                    fill="#ef4444"
                                    name="Expenses"
                                    barSize={20}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}