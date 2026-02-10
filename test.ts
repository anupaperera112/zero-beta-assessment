// vulnerable.ts
function executeUserCommand(userInput: string) {
    console.log("Executing command...");
    
    // VULNERABILITY: eval() executes any string passed to it.
    // An attacker could pass: "process.exit()" or "require('fs').rmSync('/')"
    return eval(userInput); 
}
