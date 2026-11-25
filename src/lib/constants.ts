export const MAX_MEMBERS = 2;
export const PARTNER_COLORS = ["#FF8A70", "#63E6C1"];
export const JOINT_COLOR = "#CDF56B";
export const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const INVITE_LENGTH = 6;

export function pickPartnerColor(usedColors: string[]) {
  return PARTNER_COLORS.find((color) => !usedColors.includes(color)) ?? PARTNER_COLORS[0];
}
