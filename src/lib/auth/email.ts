export const sendVerificationEmail = async (data: { user: { email: string; name: string }; url: string; token: string }) => {
  console.log(`[EMAIL] Verification for ${data.user.email}: ${data.url}`)
}
