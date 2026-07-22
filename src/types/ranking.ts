// 랭킹 한 줄 (한 유저)
export type RankingEntry = {
  rank: number;
  user_id: number;
  nickname: string | null;
  profile_image: string | null;
  stamp_count: number;
  is_me: boolean;
};

// 랭킹 응답 = 상위 목록 + 내 순위(스탬프 없으면 null)
export type Rankings = {
  rankings: RankingEntry[];
  me: RankingEntry | null;
};
