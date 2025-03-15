"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { getLedgers } from "@/services/api-service"

// Types
interface Ledger {
  id: string
  name: string
  metalBalance: number
  cashBalance: number
  lastUpdated: string
}

export default function Dashboard() {
  const [ledgers, setLedgers] = useState<Ledger[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching data
    const fetchLedgers = async () => {
      try {
        const ledgers = await getLedgers();
        setLedgers(ledgers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching ledgers:', error);
      }
    };

    fetchLedgers()
  }, [])

  // Utility functions for formatting
  const truncateTo3Decimals = (value: number): number => {
    return Math.floor(value * 1000) / 1000
  }

  const roundToNearest5 = (amount: number): number => {
    return Math.round(amount / 5) * 5
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gold Bullion Ledger Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search ledgers..." className="pl-8 w-[250px]" />
          </div>
          <Button asChild>
            <Link href="/transactions/new">New Transaction</Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="h-20 bg-muted rounded-t-lg" />
              <CardContent className="py-6">
                <div className="h-4 bg-muted rounded mb-4" />
                <div className="h-4 bg-muted rounded mb-4 w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ledgers.map((ledger) => (
            <Link href={`/ledgers/${ledger.id}`} key={ledger.id} className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{ledger.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Metal Balance:</span>
                      <span className="font-medium">{truncateTo3Decimals(ledger.metalBalance)} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cash Balance:</span>
                      <span className="font-medium">${roundToNearest5(ledger.cashBalance).toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  Last updated: {new Date(ledger.lastUpdated).toLocaleString()}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

