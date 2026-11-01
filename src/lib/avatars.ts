export interface GameAvatar {
  id: string;
  name: string;
  emoji: string;
  color: string;
  desc: string;
}

export const GAME_AVATARS: GameAvatar[] = [
  { id: "fox", name: "Cáo thông thái", emoji: "🦊", color: "from-amber-500 to-orange-500", desc: "Nhanh nhẹn & Mưu trí" },
  { id: "dragon", name: "Rồng lửa", emoji: "🐲", color: "from-red-500 to-rose-600", desc: "Sức mạnh bộc phá" },
  { id: "lion", name: "Sư tử dũng mãnh", emoji: "🦁", color: "from-yellow-500 to-amber-600", desc: "Bản lĩnh dẫn đầu" },
  { id: "eagle", name: "Đại bàng hoàng gia", emoji: "🦅", color: "from-blue-500 to-indigo-600", desc: "Tầm nhìn sắc bén" },
  { id: "panda", name: "Gấu trúc võ sĩ", emoji: "🐼", color: "from-slate-600 to-slate-800", desc: "Vững vàng & Tĩnh tại" },
  { id: "wizard", name: "Pháp sư tri thức", emoji: "🧙‍♂️", color: "from-purple-500 to-indigo-700", desc: "Bậc thầy logic" },
  { id: "cat", name: "Mèo may mắn", emoji: "🐱", color: "from-pink-400 to-rose-500", desc: "Phản xạ thần tốc" },
  { id: "robot", name: "Robot AI tương lai", emoji: "🤖", color: "from-cyan-500 to-blue-600", desc: "Tính toán chuẩn xác" },
];

export function getAvatarInfo(avatarId?: string): GameAvatar {
  return GAME_AVATARS.find((a) => a.id === avatarId) || GAME_AVATARS[0];
}
