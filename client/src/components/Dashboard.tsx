import React, { useEffect, useState, useContext } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { AuthContext } from '../App'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
            const response = await fetch('http://localhost:5001/api/transactions', {
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
        const filtered = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date)
            switch (timeRange) {
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                    return transactionDate >= weekAgo
                case 'month':
                    const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
                    return transactionDate >= monthAgo
                case 'year':
                    const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
                    return transactionDate >= yearAgo
                default:
                    return true
            }
        })
        setFilteredTransactions(filtered)
    }

    const processDataForChart = () => {
        const groupedData = filteredTransactions.reduce((acc, transaction) => {
            const date = new Date(transaction.date).toISOString().split('T')[0]
            if (!acc[date]) {
                acc[date] = { date, income: 0, expenses: 0 }
            }
            if (transaction.amount > 0) {
                acc[date].income += transaction.amount
            } else {
                acc[date].expenses += Math.abs(transaction.amount)
            }
            return acc
        }, {})

        return Object.values(groupedData).sort((a, b) => new Date(a.date) - new Date(b.date))
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
                        <p className="text-3xl font-bold text-green-600">${totalBalance.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Income</CardTitle>
                        <CardDescription>Your income for {getTimeRangeLabel()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-blue-600">${totalIncome.toFixed(2)}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Total Expenses</CardTitle>
                        <CardDescription>Your expenses for {getTimeRangeLabel()}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
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
                                color: "hsl(var(--chart-1))",
                            },
                            expenses: {
                                label: "Expenses",
                                color: "hsl(var(--chart-2))",
                            },
                        }}
                        className="h-[300px]"
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Legend />
                                <Line type="monotone" dataKey="income" stroke="var(--color-income)" name="Income" />
                                <Line type="monotone" dataKey="expenses" stroke="var(--color-expenses)" name="Expenses" />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}