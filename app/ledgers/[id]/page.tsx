"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Clock, DollarSign, Scale } from "lucide-react"

// Types
interface Ledger {
  id: string
  name: string
  metalBalance: number
  cashBalance: number
  lastUpdated: string
}

interface Transaction {
  id: string
  type: "sale" | "purchase" | "metal_received" | "metal_given" | "cash_received" | "cash_given"
  amount: number
  weight: number
  purity: number
  timestamp: string
}

export default function LedgerDetails() {
  const params = useParams()
  const ledgerId = params.id as string

  const [ledger, setLedger] = useState<Ledger | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching data
    const fetchLedgerDetails = async () => {
      // In a real app, this would be API calls
      setTimeout(() => {
        setLedger({
          id: ledgerId,
          name:
            ledgerId === "1"
              ? "Main Vault"
              : ledgerId === "2"
                ? "Secondary Storage"
                : ledgerId === "3"
                  ? "Client Holdings"
                  : "Investment Fund",
          metalBalance: 1250.965,
          cashBalance: 50090,
          lastUpdated: new Date().toISOString(),
        })

        setTransactions([
          {
            id: "t1",
            type: "purchase",
            amount: 10000,
            weight: 5.123,
            purity: 0.995,
            timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          },
          {
            id: "t2",
            type: "sale",
            amount: 5000,
            weight: 2.456,
            purity: 0.995,
            timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          },
          {
            id: "t3",
            type: "metal_received",
            amount: 0,
            weight: 10.789,
            purity: 0.9999,
            timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          },
        ])

        setLoading(false)
      }, 1000)
    }

    fetchLedgerDetails()
  }, [ledgerId])

  // Utility functions for formatting
  const truncateTo3Decimals = (value: number): number => {
    return Math.floor(value * 1000) / 1000
  }

  const roundToNearest5 = (amount: number): number => {
    return Math.round(amount / 5) * 5
  }

  const getTransactionTypeLabel = (type: Transaction["type"]) => {
    const labels = {
      sale: "Sale",
      purchase: "Purchase",
      metal_received: "Metal Received",
      metal_given: "Metal Given",
      cash_received: "Cash Received",
      cash_given: "Cash Given",
    }
    return labels[type]
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6" />
          <div className="h-12 bg-muted rounded w-1/2 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!ledger) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">Ledger not found</h1>
        <Button asChild>
          <Link href="/">Back to Dashboard</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        <span>/</span>
        <span>{ledger.name}</span>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{ledger.name}</h1>
        <Button asChild>
          <Link href={`/transactions/new?ledgerId=${ledger.id}`}>New Transaction</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Scale className="h-4 w-4" /> Metal Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{truncateTo3Decimals(ledger.metalBalance)} g</div>
            <p className="text-xs text-muted-foreground">Pure gold (999.9 fine)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" /> Cash Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${roundToNearest5(ledger.cashBalance).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Rounded to nearest 5 units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" /> Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Date(ledger.lastUpdated).toLocaleDateString()}</div>
            <p className="text-xs text-muted-foreground">{new Date(ledger.lastUpdated).toLocaleTimeString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="history">Balance History</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-right py-3 px-4">Amount</th>
                      <th className="text-right py-3 px-4">Weight</th>
                      <th className="text-right py-3 px-4">Purity</th>
                      <th className="text-right py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{getTransactionTypeLabel(transaction.type)}</td>
                        <td className="text-right py-3 px-4">
                          {transaction.amount > 0 ? `$${transaction.amount.toLocaleString()}` : "-"}
                        </td>
                        <td className="text-right py-3 px-4">{truncateTo3Decimals(transaction.weight)} g</td>
                        <td className="text-right py-3 px-4">{(transaction.purity * 100).toFixed(2)}%</td>
                        <td className="text-right py-3 px-4">{new Date(transaction.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Balance History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Balance history chart would be displayed here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

