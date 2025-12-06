const baseAsciiArt = `
* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * 

      ███╗   ██╗ ██████╗ ██████╗ ███████╗██╗    ██╗ █████╗ ██╗   ██╗███████╗
      ████╗  ██║██╔═══██╗██╔══██╗██╔════╝██║    ██║██╔══██╗██║   ██║██╔════╝
      ██╔██╗ ██║██║   ██║██║  ██║█████╗  ██║ █╗ ██║███████║██║   ██║█████╗  
      ██║╚██╗██║██║   ██║██║  ██║██╔══╝  ██║███╗██║██╔══██║╚██╗ ██╔╝██╔══╝  
      ██║ ╚████║╚██████╔╝██████╔╝███████╗╚███╔███╔╝██║  ██║ ╚████╔╝ ███████╗
      ╚═╝  ╚═══╝ ╚═════╝ ╚═════╝ ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝  ╚═══╝  ╚══════╝

      ██████╗ ██████╗ ██████╗ ███████╗          ██████╗  ███████╗ ███╗   ██╗
      ██╔════╝██╔═══██╗██╔══██╗██╔════╝         ██╔════╝ ██╔════╝ ████╗  ██║
      ██║     ██║   ██║██║  ██║█████╗   █████╗  ██║  ███╗█████╗   ██╔██╗ ██║
      ██║     ██║   ██║██║  ██║██╔══╝           ██║   ██║██╔══╝   ██║╚██╗██║
      ╚██████╗╚██████╔╝██████╔╝███████╗         ╚██████╔╝███████ ╗██║ ╚████║
      ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝          ╚═════╝ ╚══════╝ ╚═╝   ╚═══╝

                   🚀 THE ULTIMATE CODE GENERATION MACHINE 🤘             
                      ⚡ POWERED BY NODEWAVE ENGINEERING ⚡               

* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
`

export const validatorAsciiArt = `${baseAsciiArt}\n
*  Validations Generator v 2.0.0  *
*  by Nodewave Engineering        *

`

export const crudAsciiArt = `${baseAsciiArt}\n
*  CRUD Generator v 2.0.0   *
*  by Nodewave Engineering  *

`

export const entityAsciiArt = `${baseAsciiArt}\n
*  Drizzle Model to Entity Generator v1.0.0   *
*  by Nodewave Engineering                    *

`

export function displayFuncAsciiArt(ascii_art: string) {
	console.clear()
	console.log("\x1b[32m%s\x1b[0m", ascii_art)
}

export async function displayAsciiArt() {
	// Clear screen first
	console.clear()

	// Split the ASCII art into lines
	const lines = baseAsciiArt.split("\n")
	const maxWidth = Math.max(...lines.map((line) => line.length))

	// Create curtain effect - reveal from center
	const curtainWidth = Math.floor(maxWidth / 2)

	for (let i = 0; i <= curtainWidth; i++) {
		// Clear screen
		console.clear()

		// Display ASCII art with curtain effect
		lines.forEach((line) => {
			const leftPart = line.substring(0, i)
			const rightPart = line.substring(maxWidth - i)
			const centerPart = line.substring(i, maxWidth - i)

			// Create curtain effect with different characters
			const leftCurtain = "█".repeat(Math.max(0, curtainWidth - i))
			const rightCurtain = "█".repeat(Math.max(0, curtainWidth - i))

			const displayLine =
				leftCurtain + leftPart + centerPart + rightPart + rightCurtain
			console.log("\x1b[32m%s\x1b[0m", displayLine)
		})

		// Add dramatic pause
		await new Promise((resolve) => setTimeout(resolve, 30))
	}
	console.clear()
}

// Alternative: Slide-in animation from top
export async function displayAsciiArtSlide() {
	console.clear()

	const lines = baseAsciiArt.split("\n")
	const totalLines = lines.length

	for (let i = 0; i <= totalLines; i++) {
		console.clear()

		// Display lines that have "fallen" into place
		for (let j = 0; j < i; j++) {
			if (lines[j]) {
				console.log("\x1b[32m%s\x1b[0m", lines[j])
			}
		}

		// Add falling effect for current line
		if (i < totalLines) {
			for (let k = 0; k < 3; k++) {
				console.log("\x1b[33m%s\x1b[0m", " ".repeat(20) + "▼")
				await new Promise((resolve) => setTimeout(resolve, 30))
				console.clear()

				for (let j = 0; j < i; j++) {
					if (lines[j]) {
						console.log("\x1b[32m%s\x1b[0m", lines[j])
					}
				}
			}
		}

		await new Promise((resolve) => setTimeout(resolve, 30))
	}
}
