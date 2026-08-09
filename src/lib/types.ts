export interface Team {
  name: string;
  image?: string;
}

export type TeamsMap = Record<string, Team>;

export interface Match {
  group: string;
  teamA: string;
  teamB: string;
  scoreA: number | null;
  scoreB: number | null;
  played: boolean;
}

export type MatchesMap = Record<string, Match>;
export type GroupsMap = Record<string, string[]>;

export interface Tournament {
  id: string;
  name: string;
  status: "active" | "finished";
  teams: string[];
  groups: GroupsMap;
  matches: MatchesMap;
  champion: string | null;
  createdAt: number;
  finishedAt?: number;
  teamsSnapshot?: TeamsMap;
}

export type HistoryMap = Record<string, Tournament>;

export interface StandingRow {
  id: string;
  name: string;
  image: string;
  played: number;
  points: number;
  gf: number;
  ga: number;
  gd: number;
}
