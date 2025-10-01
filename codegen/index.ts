import { generateCRUD } from "./crud";
import { generateEntity } from "./entity/generate";
import { crudAsciiArt, displayAsciiArt, displayFuncAsciiArt, entityAsciiArt, validatorAsciiArt } from "./helper";
import { generateValidator } from "./validation/generate";

function parseArguments(args: string[]): Record<string, string> {
  const parsedArgs: Record<string, string> = {};

  for (let i = 2; i < args.length; i += 2) {
    const argClean = args[i].replace(/^--/, ''); // Remove leading --
    const argName = argClean.split("=")[0] || '';
    const argValue = argClean.split("=")[1] || '';
    parsedArgs[argName] = argValue;
  }

  return parsedArgs;
}


console.log("Parsing arguments...")
const parsedArgs = parseArguments(process.argv);


if (parsedArgs["generate"] == "validation") {
  console.log("Generating validation...")

  displayAsciiArt().then(() => {
    displayFuncAsciiArt(validatorAsciiArt)
  }).then(() => {
    generateValidator()
  })

}

if (parsedArgs["generate"] === "crud") {
  console.log("Generating CRUD...")

  displayAsciiArt().then(() => {
    displayFuncAsciiArt(crudAsciiArt)
  }).then(() => {
    generateCRUD()
  })

}


if (parsedArgs["generate"] === "entity") {
  console.log("Generating entity...")

  displayAsciiArt().then(() => {
    displayFuncAsciiArt(entityAsciiArt)
  }).then(() => {
    generateEntity()
  })

}