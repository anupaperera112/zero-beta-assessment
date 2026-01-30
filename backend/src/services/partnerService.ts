/**
 * Partner Service
 * Manages hardcoded partner IDs A and B with optional API keys
 */

export interface Partner {
  id: string; // 'A' or 'B'
  apiKey?: string; // Optional API key
  name: string;
}

class PartnerService {
  // Hardcoded partners
  private partners: Map<string, Partner> = new Map([
    ['A', { id: 'A', name: 'Partner A', apiKey: process.env.PARTNER_A_API_KEY }],
    ['B', { id: 'B', name: 'Partner B', apiKey: process.env.PARTNER_B_API_KEY }]
  ]);

  /**
   * Get partner by ID
   */
  getPartner(partnerId: string): Partner | undefined {
    return this.partners.get(partnerId);
  }

  /**
   * Check if partner exists
   */
  partnerExists(partnerId: string): boolean {
    return this.partners.has(partnerId);
  }

  /**
   * Validate API key for a partner
   * Returns true if:
   * - Partner has no API key configured (optional feature)
   * - Provided API key matches the partner's API key
   */
  validateApiKey(partnerId: string, providedApiKey?: string): boolean {
    const partner = this.getPartner(partnerId);
    
    if (!partner) {
      return false;
    }

    // If partner has no API key configured, allow access (optional feature)
    if (!partner.apiKey) {
      return true;
    }

    // If partner has API key configured, validate it
    if (!providedApiKey) {
      return false;
    }

    return partner.apiKey === providedApiKey;
  }

  /**
   * Get all partners (for admin/debugging purposes)
   */
  getAllPartners(): Partner[] {
    return Array.from(this.partners.values());
  }

  /**
   * Check if partner requires API key
   */
  requiresApiKey(partnerId: string): boolean {
    const partner = this.getPartner(partnerId);
    return partner ? !!partner.apiKey : false;
  }
}

export const partnerService = new PartnerService();
