import { useState, useEffect } from 'react';
import { getLedgers, createLedger } from "@/services/api-service"
import { useDebounce } from '@/hooks/use-debounce';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Types
interface Ledger {
  id: string;
  name: string;
}

interface LedgerSearchProps {
  onLedgerSelect: (ledger: Ledger) => void;
  selectedLedger: Ledger | null;
  initialLedgerId?: string;
}

// New ledger form schema
const newLedgerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export function LedgerSearch({ onLedgerSelect, selectedLedger, initialLedgerId }: LedgerSearchProps) {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);

  const debouncedSearchValue = useDebounce(searchValue, 300);

  // New ledger form
  const form = useForm<z.infer<typeof newLedgerSchema>>({
    resolver: zodResolver(newLedgerSchema),
    defaultValues: {
      name: "",
    },
  });

  // Load ledgers when search value changes
  useEffect(() => {
    const fetchLedgers = async () => {
      setIsSearching(true);
      try {
        const results = await getLedgers(debouncedSearchValue);
        setLedgers(results);
      } catch (error) {
        console.error('Error fetching ledgers:', error);
      }
      setIsSearching(false);
    };

    fetchLedgers();
  }, [debouncedSearchValue]);

  // Load initial ledger if provided
  useEffect(() => {
    if (initialLedgerId && !selectedLedger) {
      const fetchInitialLedger = async () => {
        try {
          const results = await getLedgers();
          const initialLedger = results.find(ledger => ledger.id === initialLedgerId);
          if (initialLedger) {
            onLedgerSelect(initialLedger);
          }
        } catch (error) {
          console.error('Error fetching initial ledger:', error);
        }
      };
      fetchInitialLedger();
    }
  }, [initialLedgerId, selectedLedger, onLedgerSelect]);

  // Handle ledger selection
  const handleSelect = (ledgerId: string) => {
    const selectedLedger = ledgers.find((ledger) => ledger.id === ledgerId);
    if (selectedLedger) {
      onLedgerSelect(selectedLedger);
      setOpen(false);
    }
  };

  // Handle new ledger creation
  const onSubmit = async (data: z.infer<typeof newLedgerSchema>) => {
    try {
      const newLedger = await createLedger(data.name);
      onLedgerSelect(newLedger);
      setDialogOpen(false);
      form.reset();
      // Refresh ledger list
      const updatedLedgers = await getLedgers();
      setLedgers(updatedLedgers);
    } catch (error) {
      console.error('Error creating ledger:', error);
    }
  };

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            {selectedLedger ? selectedLedger.name : "Select ledger..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search ledgers..." 
              value={searchValue} 
              onValueChange={setSearchValue}
            />
            <CommandList>
              {isSearching ? (
                <CommandEmpty>Searching...</CommandEmpty>
              ) : ledgers.length === 0 ? (
                <CommandEmpty>
                  No ledger found.
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="mt-2 w-full"
                        onClick={() => form.setValue("name", searchValue)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create "{searchValue}"
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Ledger</DialogTitle>
                      </DialogHeader>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ledger Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit">Create Ledger</Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CommandEmpty>
              ) : (
                <CommandGroup>
                  {ledgers.map((ledger) => (
                    <CommandItem key={ledger.id} value={ledger.id} onSelect={handleSelect}>
                      <Check
                        className={cn("mr-2 h-4 w-4", selectedLedger?.id === ledger.id ? "opacity-100" : "opacity-0")}
                      />
                      {ledger.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}