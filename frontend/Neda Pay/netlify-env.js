// Netlify Environment Variables
// Import this file to load all environment variables for Netlify deployment

module.exports = {
  // Public variables (accessible in the browser)
  NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL: "https://sepolia.base.org",
  NEXT_PUBLIC_CHAIN_ID: "84532",
  NEXT_PUBLIC_TSHC_ADDRESS: "0x0859D42FD008D617c087DD386667da51570B1aAB",
  
  // Build configuration variables (only used during build)
  NEXT_SKIP_TYPE_CHECK: "true",
  NEXT_SKIP_ESLINT: "true",
  TYPESCRIPT_SKIP_CHECKING: "true",
  NEXT_TYPESCRIPT_COMPILE_OPTIONS: "{\"transpileOnly\": true, \"ignoreBuildErrors\": true}",
  NEXT_TELEMETRY_DISABLED: "1",
  NODE_OPTIONS: "--max-old-space-size=8192",
  NEXT_DISABLE_SOURCEMAPS: "true",
  NEXT_DISABLE_ESLINT: "true",
  NEXT_IGNORE_TYPESCRIPT_ERRORS: "true",
  NEXT_IGNORE_ESLINT_ERRORS: "true"
};
