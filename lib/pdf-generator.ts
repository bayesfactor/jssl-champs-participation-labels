import { jsPDF } from "jspdf"
import Papa from "papaparse"
import { format } from "date-fns"

interface Athlete {
  athlete_first_name: string
  athlete_last_name: string
  athlete_age_group: string
}

export async function generatePDF(file: File, staticText: string, staticDate: Date): Promise<void> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as Record<string, string>[]

          // Validate CSV structure
          const requiredColumns = ["athlete_first_name", "athlete_last_name", "athlete_age_group"]
          const headers = Object.keys(data[0] || {})

          const missingColumns = requiredColumns.filter((col) => !headers.includes(col))
          if (missingColumns.length > 0) {
            throw new Error(`CSV is missing required columns: ${missingColumns.join(", ")}`)
          }

          // Filter and map data to get only the columns we need
          const athletes: Athlete[] = data.map((row) => ({
            athlete_first_name: row.athlete_first_name || "",
            athlete_last_name: row.athlete_last_name || "",
            athlete_age_group: row.athlete_age_group || "",
          }))

          if (athletes.length === 0) {
            throw new Error("No data found in the CSV file")
          }

          // Format the date
          const formattedDate = format(staticDate, "MM/dd/yyyy")

          // Create PDF
          const pdf = new jsPDF()

          // Set up table dimensions
          const totalAthletes = athletes.length
          const columns = 3
          const rows = Math.ceil(totalAthletes / columns)

          // Page setup
          const pageWidth = pdf.internal.pageSize.getWidth()
          const pageHeight = pdf.internal.pageSize.getHeight()
          const margin = 10
          const cellWidth = (pageWidth - 2 * margin) / columns
          const cellHeight = 30
          const fontSize = 10

          pdf.setFontSize(fontSize)

          // Add title
          pdf.setFontSize(16)
          pdf.text(`Athlete List - ${staticText}`, margin, margin)
          pdf.setFontSize(12)
          pdf.text(`Date: ${formattedDate}`, margin, margin + 8)
          pdf.setFontSize(fontSize)

          // Draw table
          let athleteIndex = 0

          for (let row = 0; row < rows; row++) {
            const y = margin + 20 + row * cellHeight

            // Check if we need a new page
            if (y + cellHeight > pageHeight - margin) {
              pdf.addPage()
              pdf.setFontSize(16)
              pdf.text(`Athlete List - ${staticText} (continued)`, margin, margin)
              pdf.setFontSize(12)
              pdf.text(`Date: ${formattedDate}`, margin, margin + 8)
              pdf.setFontSize(fontSize)
            }

            for (let col = 0; col < columns; col++) {
              if (athleteIndex < totalAthletes) {
                const athlete = athletes[athleteIndex]
                const x = margin + col * cellWidth
                const cellY = y

                // Draw cell border
                pdf.rect(x, cellY, cellWidth, cellHeight)

                // Add content to cell
                pdf.text(`${athlete.athlete_first_name} ${athlete.athlete_last_name}`, x + 3, cellY + 10)
                pdf.text(`Age Group: ${athlete.athlete_age_group}`, x + 3, cellY + 18)
                pdf.text(`Team: ${staticText}`, x + 3, cellY + 26)

                athleteIndex++
              }
            }
          }

          // Save the PDF
          pdf.save(`athletes_${staticText.replace(/\s+/g, "_")}_${format(staticDate, "yyyy-MM-dd")}.pdf`)
          resolve()
        } catch (error) {
          reject(error)
        }
      },
      error: (error) => {
        reject(new Error(`Error parsing CSV: ${error.message}`))
      },
    })
  })
}
