"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle, MinusCircle, DollarSign } from "lucide-react"
import { apiPostJson } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface SavingsAdjustmentDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    clientId: string
    clientName: string
    onSuccess?: () => void
}

export function SavingsAdjustmentDialog({
    isOpen,
    onOpenChange,
    clientId,
    clientName,
    onSuccess
}: SavingsAdjustmentDialogProps) {
    const { toast } = useToast()
    const [submitting, setSubmitting] = useState(false)
    const [form, setForm] = useState({
        amountKES: "",
        type: "add" as "add" | "deduct",
        notes: "Weekly savings deposit",
    })

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSubmitting(true)
            const amount = Number(form.amountKES)
            if (isNaN(amount) || amount <= 0) {
                toast({ title: "Invalid amount", description: "Please enter a positive numeric value." })
                return
            }
            const finalAmount = form.type === "deduct" ? -Math.abs(amount) : Math.abs(amount)

            await apiPostJson("/api/savings", {
                clientId,
                amountKES: finalAmount,
                notes: form.notes
            })

            toast({ title: "Success", description: `Savings ${form.type === "add" ? "added" : "deducted"} successfully` })
            onOpenChange(false)
            setForm({ amountKES: "", type: "add", notes: "Weekly savings deposit" })
            onSuccess?.()
        } catch (e: any) {
            toast({ title: "Error", description: e?.message || "Failed to log savings adjustment" })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-card border-0 neumorphic">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <DollarSign className="w-5 h-5 text-primary" />
                        Adjust Savings: {clientName}
                    </DialogTitle>
                </DialogHeader>

                <form className="space-y-5 mt-4" onSubmit={onSubmit}>
                    <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, type: 'add' })}
                            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${form.type === 'add' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:bg-background/50'}`}
                        >
                            <PlusCircle className="w-4 h-4" />
                            Add
                        </button>
                        <button
                            type="button"
                            onClick={() => setForm({ ...form, type: 'deduct' })}
                            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${form.type === 'deduct' ? 'bg-red-600 text-white shadow-md' : 'text-muted-foreground hover:bg-background/50'}`}
                        >
                            <MinusCircle className="w-4 h-4" />
                            Deduct
                        </button>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2 ml-1">Amount (KES)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={form.amountKES}
                                onChange={(e) => setForm({ ...form, amountKES: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                                placeholder="0.00"
                                required
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold text-xs">KES</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2 ml-1">Description / Reason</label>
                        <textarea
                            rows={3}
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            className="w-full px-4 py-3 bg-background rounded-xl border-0 neumorphic-inset focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm resize-none"
                            placeholder="e.g. Weekly deposit, Administrative correction..."
                            required
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 py-4 h-auto rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={submitting || !form.amountKES}
                            className={`flex-[2] py-4 h-auto rounded-xl font-bold shadow-lg transition-transform active:scale-95 border-0 ${form.type === 'add' ? 'bg-primary text-white' : 'bg-red-600 text-white'}`}
                        >
                            {submitting ? "Processing..." : `Log ${form.type === 'add' ? 'Addition' : 'Deduction'}`}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
