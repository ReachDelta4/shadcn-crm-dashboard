export function mapAuthError(message: string) {
  if (!message) return "Authentication failed";
  if (message.includes("Invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (message.includes("Email not confirmed")) {
    return "Please verify your email before signing in.";
  }
  if (message.includes("User already registered")) {
    return "An account with this email exists. Try signing in.";
  }
  if (message.includes("Failed to fetch") || message.includes("504")) {
    return "Network timeout contacting auth server. Try again.";
  }
  return "Authentication failed";
}

