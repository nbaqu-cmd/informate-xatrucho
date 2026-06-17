export {
  fetchCongressDecreesSince,
  findCongressDecreesInMonth,
  downloadAndExtractDecree,
} from "./gazette.js";
export type { GazetteLaw, GazetteLawCandidate } from "./gazette.js";

export {
  fetchRecentlyApprovedLaws,
  fetchCongressmen,
  fetchVotingRecord,
} from "./congress.js";
export type { CongressLaw, CongressmanRecord, VotingRecord } from "./congress.js";
