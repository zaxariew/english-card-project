export type WordCard = {
  id: number;
  russian: string;
  russianExample: string;
  english: string;
  englishExample: string;
  learned: boolean;
  course?: number;
};



export type Group = {
  id: number;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  cardCount: number;
  course?: number;
};

export type UserAccount = {
  id: number;
  username: string;
  createdAt: string;
  cardsLearned: number;
  totalCards: number;
  progress: number;
};

export const API_URLS = {
  auth: 'https://functions.poehali.dev/d31f6748-ce3c-44a4-abfa-4271917daac9',
  cards: 'https://functions.poehali.dev/98633d20-1c13-4175-9b6c-e7cbed102a76',
  translate: 'https://functions.poehali.dev/671e36e0-fbd9-46ff-a494-a599c851fdd8',
  accounts: 'https://functions.poehali.dev/5c9631a9-7bf7-47d0-a949-aaacd6de409f',
};

