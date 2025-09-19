export interface Senator {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  nickname?: string;
  party: string;
  partyHistory: PartyAffiliation[];
  position?: string;
  termStart: string;
  termEnd: string;
  previousTerms?: Term[];
  photoUrl?: string;
  email?: string;
  phone?: string;
  office?: string;
  committees: CommitteeMembership[];
  stats: SenatorStats;
}

export interface PartyAffiliation {
  party: string;
  startDate: string;
  endDate?: string;
}

export interface Term {
  position: string;
  startDate: string;
  endDate: string;
}

export interface CommitteeMembership {
  id: string;
  name: string;
  role: 'Chairperson' | 'Vice Chairperson' | 'Member';
  startDate: string;
  endDate?: string;
}

export interface SenatorStats {
  billsAuthored: number;
  billsCoAuthored: number;
  billsPassed: number;
  attendanceRate: number;
  votingParticipation: number;
  committeeMeetingsAttended: number;
  totalCommitteeMeetings: number;
}

export interface Bill {
  id: string;
  number: string; // e.g., "SB 1234"
  title: string;
  shortTitle?: string;
  description: string;
  status: BillStatus;
  type: 'Senate Bill' | 'Senate Resolution' | 'House Bill' | 'Joint Resolution';
  dateField: string;
  lastActionDate: string;
  authors: string[];
  coAuthors: string[];
  sponsors: string[];
  committee?: string;
  subject: string[];
  urgency?: 'Regular' | 'Priority' | 'Urgent';
  fullTextUrl?: string;
  timeline: BillEvent[];
}

export type BillStatus =
  | 'Pending in Committee'
  | 'In Committee'
  | 'Reported out of Committee'
  | 'Pending Second Reading'
  | 'Pending Third Reading'
  | 'Passed on Third Reading'
  | 'Transmitted to House'
  | 'In Bicameral Conference'
  | 'Enrolled'
  | 'Signed into Law'
  | 'Vetoed'
  | 'Withdrawn';

export interface BillEvent {
  date: string;
  action: string;
  description?: string;
  chamber: 'Senate' | 'House' | 'Bicameral';
}

export interface VoteRecord {
  billId: string;
  billNumber: string;
  senatorId: string;
  vote: 'Yes' | 'No' | 'Abstain' | 'Absent';
  date: string;
  reading: 'First' | 'Second' | 'Third';
}

export interface VotingSummary {
  billId: string;
  billNumber: string;
  billTitle: string;
  date: string;
  yesVotes: number;
  noVotes: number;
  abstentions: number;
  absent: number;
  result: 'Passed' | 'Failed';
  voteBreakdown: VoteRecord[];
}

export interface Performance {
  senatorId: string;
  period: string;
  billsAuthored: number;
  billsCoAuthored: number;
  billsPassed: number;
  sessionsAttended: number;
  totalSessions: number;
  committeeMeetingsAttended: number;
  totalCommitteeMeetings: number;
  votingRecord: {
    participated: number;
    missed: number;
    total: number;
  };
}

export interface PoliticalParty {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
  founded?: string;
  ideology?: string[];
  currentMembers: number;
  logo?: string;
}

export interface Committee {
  id: string;
  name: string;
  jurisdiction: string;
  chairperson?: string;
  viceChairperson?: string;
  members: CommitteeMember[];
  meetingSchedule?: string;
  recentBills?: string[];
}

export interface CommitteeMember {
  senatorId: string;
  name: string;
  role: 'Chairperson' | 'Vice Chairperson' | 'Member';
  joinDate: string;
}

export interface DashboardFilters {
  searchTerm?: string;
  party?: string[];
  committee?: string[];
  billStatus?: BillStatus[];
  dateRange?: {
    start: string;
    end: string;
  };
  voteType?: ('Yes' | 'No' | 'Abstain' | 'Absent')[];
  sortBy?: 'name' | 'party' | 'billsAuthored' | 'attendance' | 'recent';
}

export interface SenateSession {
  id: string;
  sessionNumber: string;
  date: string;
  type: 'Regular' | 'Special' | 'Committee';
  agenda: string[];
  attendees: string[];
  absentees: string[];
  bills?: string[];
  minutes?: string;
}