"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { LedgerSearch } from "@/components/ledger-search"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { createTransaction } from "@/services/api-service"

// Types
interface Ledger {
  id: string
  name: string
}

// Form schema
const transactionSchema = z.object({
  ledgerId: z.string().min(1, "Ledger is required"),
  type: z.enum(["sale", "purchase", "metal_received", "metal_given", "cash_received", "cash_given"]),
  grossWeight: z.coerce.number().optional(),
  purity: z.coerce.number().min(0).max(100).optional(), // Changed to percentage (0-100)
  rate: z.coerce.number().optional(), // Added rate field
  amount: z.coerce.number().optional(),
  paidAmount: z.coerce.number().optional(), // Added paid amount field
})

type TransactionFormValues = z.infer<typeof transactionSchema>

export default function NewTransaction() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLedgerId = searchParams.get("ledgerId") || ""

  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null)
  const [pureWeight, setPureWeight] = useState<number | null>(null)
  const [roundedAmount, setRoundedAmount] = useState<number | null>(null)
  // Add state for showing receipt
  const [showReceipt, setShowReceipt] = useState(false)

  // Initialize form
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      ledgerId: initialLedgerId,
      type: "purchase",
      grossWeight: undefined,
      purity: 100.00, // Default purity (99.5%)
      rate: undefined,
      amount: undefined,
      paidAmount: undefined, // Default paid amount
    },
  })

  // Watch for form value changes
  const type = form.watch("type")
  const grossWeight = form.watch("grossWeight")
  const purity = form.watch("purity")
  const rate = form.watch("rate")
  const amount = form.watch("amount")
  const paidAmount = form.watch("paidAmount")
  const [balance, setBalance] = useState<number | null>(null)

  // Calculate pure weight and rounded amount when inputs change
  useEffect(() => {
    if (grossWeight && purity && type !== "cash_received" && type !== "cash_given") {
      // Calculate pure weight based on percentage purity
      const calculatedPureWeight = truncateTo3Decimals(grossWeight * (purity / 100))
      setPureWeight(calculatedPureWeight)

      // Auto-calculate amount if rate is provided
      if (rate && calculatedPureWeight) {
        const calculatedAmount = calculatedPureWeight * rate
        form.setValue("amount", roundToNearest5(calculatedAmount))
      }
    } else {
      setPureWeight(null)
    }

    if (amount) {
      const calculatedRoundedAmount = roundToNearest5(amount)
      setRoundedAmount(calculatedRoundedAmount)
    } else {
      setRoundedAmount(null)
    }

    // Calculate balance if amount and paidAmount are provided
    if (amount && paidAmount !== undefined) {
      setBalance(amount - paidAmount)
    } else {
      setBalance(null)
    }
  }, [grossWeight, purity, rate, amount, paidAmount, form, type])

  // Load ledger details if ledgerId is provided
  useEffect(() => {
    if (initialLedgerId) {
      // In a real app, this would be an API call
      setTimeout(() => {
        setSelectedLedger({
          id: initialLedgerId,
          name:
            initialLedgerId === "1"
              ? "Main Vault"
              : initialLedgerId === "2"
                ? "Secondary Storage"
                : initialLedgerId === "3"
                  ? "Client Holdings"
                  : "Investment Fund",
        })
      }, 500)
    }
  }, [initialLedgerId])

  // Handle ledger selection
  const handleLedgerSelect = (ledger: Ledger) => {
    setSelectedLedger(ledger)
    form.setValue("ledgerId", ledger.id)
  }

  // Utility functions
  const truncateTo3Decimals = (value: number | null | undefined): number | null => {
    if (value === null || value === undefined) return null
    return Math.floor(value * 1000) / 1000
  }

  const roundToNearest5 = (amount: number ): number => {

    return Math.round(amount / 5) * 5
  }

  // Form submission
  const onSubmit = async (data: TransactionFormValues) => {
    try {
      const transaction = {
        ...data,
        pureWeight,
        roundedAmount,
        balance,
      };
  
      const createdTransaction = await createTransaction(transaction);
      console.log('Transaction created successfully:', createdTransaction);
  
      // Show receipt and redirect
      setShowReceipt(true);
    } catch (error) {
      console.error('Error creating transaction:', error);
    }
  };
  // Determine which fields to show based on transaction type
  const showWeightFields = ["purchase", "sale", "metal_received", "metal_given"].includes(type)
  const showAmountField = ["purchase", "sale", "cash_received", "cash_given"].includes(type)

  // Add a function to handle printing
  const handlePrint = () => {
    // Create a clone of the receipt for the second copy
    const receiptContent = document.querySelector(".dialog-content")
    if (receiptContent) {
      const clone = receiptContent.cloneNode(true)
      
      // Temporarily append the clone
      document.body.appendChild(clone)

      // Print
      window.print()

      // Remove the clone after printing
      setTimeout(() => {
        document.body.removeChild(clone)
      }, 1000)
    } else {
      window.print()
    }
  }

  // Add a function to close receipt and redirect
  const closeReceiptAndRedirect = () => {
    setShowReceipt(false)
    router.push(`/ledgers/${form.getValues("ledgerId")}`)
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>
        {selectedLedger && (
          <>
            <span>/</span>
            <Link href={`/ledgers/${selectedLedger.id}`} className="hover:underline">
              {selectedLedger.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span>New Transaction</span>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>New Transaction</CardTitle>
          <CardDescription>Record a new transaction in the gold bullion ledger</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="ledgerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ledger</FormLabel>
                    <FormControl>
                      <LedgerSearch
                        onLedgerSelect={handleLedgerSelect}
                        selectedLedger={selectedLedger}
                        initialLedgerId={field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="purchase">Purchase</SelectItem>
                        <SelectItem value="sale">Sale</SelectItem>
                        <SelectItem value="metal_received">Metal Received</SelectItem>
                        <SelectItem value="metal_given">Metal Given</SelectItem>
                        <SelectItem value="cash_received">Cash Received</SelectItem>
                        <SelectItem value="cash_given">Cash Given</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Select the type of transaction you want to record</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showWeightFields && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="grossWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gross Weight (g)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.001"
                              placeholder="0.000"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e.target.valueAsNumber)
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {type !== "cash_received" && type !== "cash_given" && (
                      <FormField
                        control={form.control}
                        name="purity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Purity (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="99.50"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e.target.valueAsNumber)
                                }}
                              />
                            </FormControl>
                            <FormDescription>e.g., 99.50 for 99.5% pure</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {type !== "cash_received" && type !== "cash_given" && (
                      <FormField
                        control={form.control}
                        name="rate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rate ($/g)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => {
                                  field.onChange(e.target.valueAsNumber)
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {pureWeight !== null && type !== "cash_received" && type !== "cash_given" && (
                    <div className="bg-muted p-4 rounded-md">
                      <div className="text-sm font-medium">Pure Weight (g)</div>
                      <div className="text-2xl font-bold">{pureWeight !== null ? pureWeight : "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        Calculated as gross weight × (purity / 100), truncated to 3 decimals
                      </div>
                    </div>
                  )}
                </>
              )}

              {showAmountField && (
                <>
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paidAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paid Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.valueAsNumber)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {balance !== null && (
                    <div className="bg-muted p-4 rounded-md">
                      <div className="text-sm font-medium">Balance ($)</div>
                      <div
                        className={`text-2xl font-bold ${balance > 0 ? "text-red-500" : balance < 0 ? "text-green-500" : ""}`}
                      >
                        {balance !== null ? balance.toFixed(2) : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {balance > 0 ? "Amount due" : balance < 0 ? "Overpaid" : "Fully paid"}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit">Save Transaction</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
      {showReceipt && (
        <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Transaction Receipt</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 print:text-black">
              <div className="text-center border-b pb-2">
                <h2 className="font-bold text-xl">Gold Bullion Transaction</h2>
                <p className="text-sm text-muted-foreground">{new Date().toLocaleString()}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Ledger:</span>
                  <span>{selectedLedger?.name || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Transaction Type:</span>
                  <span>{type.replace("_", " ").charAt(0).toUpperCase() + type.replace("_", " ").slice(1)}</span>
                </div>

                {grossWeight && (
                  <div className="flex justify-between">
                    <span className="font-medium">Gross Weight:</span>
                    <span>{grossWeight} g</span>
                  </div>
                )}

                {purity && type !== "cash_received" && type !== "cash_given" && (
                  <div className="flex justify-between">
                    <span className="font-medium">Purity:</span>
                    <span>{purity.toFixed(2)}%</span>
                  </div>
                )}

                {pureWeight && type !== "cash_received" && type !== "cash_given" && (
                  <div className="flex justify-between">
                    <span className="font-medium">Pure Weight:</span>
                    <span>{pureWeight} g</span>
                  </div>
                )}

                {rate && type !== "cash_received" && type !== "cash_given" && (
                  <div className="flex justify-between">
                    <span className="font-medium">Rate:</span>
                    <span>${rate}/g</span>
                  </div>
                )}

                {amount && (
                  <div className="flex justify-between">
                    <span className="font-medium">Amount:</span>
                    <span>${amount.toFixed(2)}</span>
                  </div>
                )}

                {paidAmount !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-medium">Paid Amount:</span>
                    <span>${paidAmount.toFixed(2)}</span>
                  </div>
                )}

                {balance !== null && (
                  <div className="flex justify-between">
                    <span className="font-medium">Balance:</span>
                    <span className={balance > 0 ? "text-red-500" : balance < 0 ? "text-green-500" : ""}>
                      ${balance.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t pt-2 text-center text-sm text-muted-foreground">
                <p>Thank you for your business</p>
              </div>
            </div>
            <div className="flex justify-between mt-4 print:hidden">
              <Button variant="outline" onClick={closeReceiptAndRedirect}>
                Close
              </Button>
              <Button onClick={handlePrint}>Print Receipt</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

