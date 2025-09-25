// Test XSS prevention system
const {
  SECURITY_TEST_UTILS,
} = require("./src/lib/validation/chart-data-validator.ts");

// Test XSS prevention with various attack vectors
const xssVectors = [
  '<script>alert("xss")</script>',
  'javascript:alert("xss")',
  '<img src=x onerror=alert("xss")>',
  '<div onclick="alert(1)">Click me</div>',
  '"><script>alert("xss")</script>',
  '<iframe src="javascript:alert(1)"></iframe>',
];

console.log("Testing XSS Prevention...");

xssVectors.forEach((vector, index) => {
  try {
    const rejected = SECURITY_TEST_UTILS.testXSSPrevention("bar", vector);
    console.log(
      `Vector ${index + 1}: ${rejected ? "BLOCKED ✓" : "ALLOWED ✗"} - "${vector}"`,
    );
  } catch (error) {
    console.log(`Vector ${index + 1}: ERROR - ${error.message}`);
  }
});

console.log("\nTesting malformed data handling...");
const malformedHandled = SECURITY_TEST_UTILS.testMalformedData("bar");
console.log(
  `Malformed data handling: ${malformedHandled ? "SECURE ✓" : "VULNERABLE ✗"}`,
);
