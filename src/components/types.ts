export type WordCard = {
  id: number;
  russian: string;
  russianExample: string;
  english: string;
  englishExample: string;
  categoryId: number;
  categoryName: string;
  categoryColor: string;
  learned: boolean;
  course?: number;
};

export type Category = {
  id: number;
  name: string;
  color: string;
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
  categories: 'https://functions.poehali.dev/30beca39-899a-4ba5-9f24-b4faa5bcf740',
  cards: 'https://functions.poehali.dev/98633d20-1c13-4175-9b6c-e7cbed102a76',
  translate: 'https://functions.poehali.dev/671e36e0-fbd9-46ff-a494-a599c851fdd8',
  accounts: 'https://functions.poehali.dev/5c9631a9-7bf7-47d0-a949-aaacd6de409f',
};

export const colorOptions = [
  { name: 'Фиолетовый', value: 'bg-gradient-to-br from-purple-500 to-purple-600' },
  { name: 'Розовый', value: 'bg-gradient-to-br from-pink-500 to-pink-600' },
  { name: 'Оранжевый', value: 'bg-gradient-to-br from-orange-500 to-orange-600' },
  { name: 'Синий', value: 'bg-gradient-to-br from-blue-500 to-blue-600' },
  { name: 'Зелёный', value: 'bg-gradient-to-br from-green-500 to-green-600' },
  { name: 'Красный', value: 'bg-gradient-to-br from-red-500 to-red-600' },
  { name: 'Жёлтый', value: 'bg-gradient-to-br from-yellow-500 to-yellow-600' },
  { name: 'Серый', value: 'bg-gradient-to-br from-gray-500 to-gray-600' },
];