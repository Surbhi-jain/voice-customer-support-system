/** Short vocabulary hints for Whisper initial_prompt (improves domain terms). */
const TOPIC_STT_HINTS: Record<string, string> = {
  hotel:
    "Hotel check-in, checkout, reservation, housekeeping, room service, amenities, concierge, parking, Wi-Fi.",
  cooking:
    "Cooking, recipe, spices, masala, turmeric, cumin, pav bhaji, biryani, ingredients, oven, boil, fry.",
  retail:
    "Online order, shipping, delivery, tracking, return, refund, exchange, coupon, gift card, package.",
  travel:
    "Flight, airline, baggage, boarding pass, gate, delay, cancellation, passport, visa, connection.",
  banking:
    "Banking, repo rate, interest rate, UPI, NEFT, RTGS, loan, EMI, account, debit card, credit card, ATM, KYC.",
  it_helpdesk:
    "Password, login, VPN, email, Wi-Fi, printer, laptop, software install, error, MFA, Outlook, Teams.",
};

export function buildSttInitialPrompt(topicId: string): string {
  return TOPIC_STT_HINTS[topicId] ?? "";
}
