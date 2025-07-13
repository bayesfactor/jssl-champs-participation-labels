"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { generatePDF } from "@/lib/pdf-generator"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [staticText, setStaticText] = useState<string>("")
  const [date, setDate] = useState<Date>(() => {
    // Get current year
    const currentYear = new Date().getFullYear()
    // Find the second Sunday in July of the current year
    const date = new Date(currentYear, 6, 1) // July 1st of current year
    // Find the first Sunday
    while (date.getDay() !== 0) {
      date.setDate(date.getDate() + 1)
    }
    // Add 7 days to get to the second Sunday
    date.setDate(date.getDate() + 7)
    return date
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type !== "text/csv") {
        setError("Please upload a CSV file")
        setFile(null)
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      setError("Please upload a CSV file")
      return
    }

    if (!staticText) {
      setError("Please select a team")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await generatePDF(file, staticText, date)
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while generating the PDF")
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>CSV to PDF Generator</CardTitle>
          <CardDescription>
            Upload a CSV file with athlete information to generate a formatted PDF table of participation labels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <div className="flex items-center gap-2">
              <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} className="flex-1" />
            </div>
            {file && <p className="text-sm text-muted-foreground">Selected: {file.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="team">Select Team</Label>
            <Select onValueChange={setStaticText} value={staticText}>
              <SelectTrigger id="team">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Greenmeadow Marlins">Greenmeadow Marlins</SelectItem>
                <SelectItem value="Brookside Waves">Brookside Waves</SelectItem>
                <SelectItem value="Laurelwood">Laurelwood</SelectItem>
                <SelectItem value="Eichler Gators">Eichler Gators</SelectItem>
                <SelectItem value="Saratoga Woods">Saratoga Woods</SelectItem>
                <SelectItem value="Cupertino Hills">Cupertino Hills</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={(date) => date && setDate(date)} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Generating..." : "Generate PDF"}
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
