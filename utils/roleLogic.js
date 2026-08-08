module.exports = async function applyRoleLogic(member) {
  const VERIFIED = "1058636430542381137";
  const CIVILIAN = "1058636416164315147";

  const UNVERIFIED = "1350567722655678528";
  const APPLICANT = "1058636421830824026";

  const hasVerified = member.roles.cache.has(VERIFIED);
  const hasCivilian = member.roles.cache.has(CIVILIAN);

  const hasUnverified = member.roles.cache.has(UNVERIFIED);
  const hasApplicant = member.roles.cache.has(APPLICANT);

  // RULE 1: Civilian + Unverified → Give Verified, Remove Unverified
  if (hasCivilian && hasUnverified) {
    if (!hasVerified) await member.roles.add(VERIFIED).catch(() => {});
    await member.roles.remove(UNVERIFIED).catch(() => {});
    return "verified_pair";
  }

  // RULE 2: Unverified + Applicant → OK
  if (hasUnverified && hasApplicant) {
    return "unverified_pair";
  }

  // RULE 3: Unverified + Verified → Remove Verified, Remove Civilian, Give Applicant
  if (hasUnverified && hasVerified) {
    await member.roles.remove(VERIFIED).catch(() => {});
    if (hasCivilian) await member.roles.remove(CIVILIAN).catch(() => {});
    if (!hasApplicant) await member.roles.add(APPLICANT).catch(() => {});
    return "fixed_unverified";
  }

  // RULE 4: Applicant + Civilian → Remove Verified, Remove Civilian, Give Applicant
  if (hasApplicant && hasCivilian) {
    if (hasVerified) await member.roles.remove(VERIFIED).catch(() => {});
    await member.roles.remove(CIVILIAN).catch(() => {});
    return "fixed_applicant";
  }

  // BASIC RULES
  if (hasVerified && !hasCivilian) {
    await member.roles.add(CIVILIAN).catch(() => {});
    return "added_civilian";
  }

  if (hasUnverified && !hasApplicant) {
    await member.roles.add(APPLICANT).catch(() => {});
    return "added_applicant";
  }

  return null;
};
