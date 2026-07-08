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
          const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'long', // 'long' for full month name (e.g., "July")
            day: 'numeric',
          };
          const longDate = staticDate.toLocaleDateString('en-US', options);

          // Create PDF (US Letter: 8.5 x 11 in, dimensions in mm)
          const pdf = new jsPDF({ unit: "mm", format: "letter" })

          // Set up table dimensions
          const totalAthletes = athletes.length
          const columns = 3
          const rows = Math.ceil(totalAthletes / columns)

          // Page setup — dimensions match the Avery 5160 label template.
          // (US Letter, 3 x 10 labels, each 1" tall with a 0.5" top margin
          // and no vertical gap between rows.)
          const MM_PER_IN = 25.4
          const pageWidth = pdf.internal.pageSize.getWidth()
          const pageHeight = pdf.internal.pageSize.getHeight()
          const w_margin = 7
          const h_margin = 0.5 * MM_PER_IN // 0.5" top margin = 12.7mm
          const cellWidth = (pageWidth - 2 * w_margin) / columns
          const cellHeight = 1.0 * MM_PER_IN // 1" label height = 25.4mm (also the row pitch)
          // Progressive per-column horizontal nudge: the left column stays put,
          // the middle shifts +1mm and the right column +2mm to line up with the
          // physical label columns.
          const col_nudge = 1
          const fontSize = 10

          pdf.setFontSize(fontSize)

          // Add title
          //pdf.setFontSize(16)
          //pdf.text(`Athlete List - ${staticText}`, margin, margin)
          //pdf.setFontSize(12)
          //pdf.text(`Date: ${formattedDate}`, margin, margin + 8)
          //pdf.setFontSize(fontSize)

          // Draw table
          let athleteIndex = 0
          let y = h_margin - cellHeight
          for (let row = 0; row < rows; row++) {
            y = y + cellHeight

            // Check if we need a new page
            if (y + cellHeight > pageHeight - h_margin) {
              pdf.addPage()
              y = h_margin
              //pdf.setFontSize(16)
              //pdf.text(`Athlete List - ${staticText} (continued)`, margin, margin)
              //pdf.setFontSize(12)
              //pdf.text(`Date: ${formattedDate}`, margin, margin + 8)
              //pdf.setFontSize(fontSize)
            }

            for (let col = 0; col < columns; col++) {
              if (athleteIndex < totalAthletes) {
                const athlete = athletes[athleteIndex]
                const x = w_margin + col * cellWidth + col * col_nudge
                const cellY = y

                // Draw cell border
                //pdf.rect(x, cellY, cellWidth, cellHeight)

                // Add content to cell
                pdf.setFontSize(12)
                pdf.text(`${athlete.athlete_first_name} ${athlete.athlete_last_name}`, x + 3, cellY + 5)
                pdf.text(`${athlete.athlete_age_group}`, x + 3, cellY + 10)
                pdf.setFontSize(fontSize)
                pdf.text(`${staticText}`, x + 3, cellY + 15)
                pdf.text(`JSSL Championships ${longDate}`, x + 3, cellY + 20)

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
