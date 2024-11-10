import React, { useState, useEffect, useContext } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { AuthContext } from '../App'  // Make sure to export AuthContext from App.tsx

export default function Transactions() {
    const { user } = useContext(AuthContext)
    const [transactions, setTransactions] = useState([])
    const [newTransaction, setNewTransaction] = useState({
        date: '',
        description: '',
        amount: '',
        category: '',
    })

    useEffect(() => {
        fetchTransactions()
    }, [])

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setNewTransaction(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const token = localStorage.getItem('token')
        try {
            const response = await fetch('http://localhost:5001/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newTransaction),
            })
            if (response.ok) {
                fetchTransactions()
                setNewTransaction({ date: '', description: '', amount: '', category: '' })
            }
        } catch (error) {
            console.error('Failed to add transaction', error)
        }
    }

    return (
        <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">Transactions</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Add New Transaction</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    type="date"
                                    id="date"
                                    name="date"
                                    value={newTransaction.date}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    type="text"
                                    id="description"
                                    name="description"
                                    value={newTransaction.description}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="amount">Amount</Label>
                                <Input
                                    type="number"
                                    id="amount"
                                    name="amount"
                                    value={newTransaction.amount}
                                    onChange={handleInputChange}
                                    required
                                    step="0.01"
                                />
                            </div>
                            <div>
                                <Label htmlFor="category">Category</Label>
                                <Input
                                    type="text"
                                    id="category"
                                    name="category"
                                    value={newTransaction.category}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>
                        <Button type="submit">Add Transaction</Button>
                    </form>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Category</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((transaction) => (
                                <TableRow key={transaction._id}>
                                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                                        ${Math.abs(transaction.amount).toFixed(2)}
                                    </TableCell>
                                    <TableCell>{transaction.category}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}