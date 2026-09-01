export const localSongs = [
  { title: 'Apne Pyar Ke Sapne', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Aye Mere Humsafar', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Bijli Girate Hosh Udate', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Chandni O Meri Chandni', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Chandni Raat Mein', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Gazab Ka Hai Din', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Gunja Re Chandan', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Hawa Hawa E Hawa', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'I Love You', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'In Aankhon Ki Masti Ke', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Laila Main Laila', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Mara Thumka', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Megha Re Megha Re', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Mehbooba Mehbooba', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Mehbooba O Mehbooba', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Mujhe Chhu Rahi Hain Teri Garm Saansen', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Na Jaane Kya Hua', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Neele Neele Ambar Par', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Papa Kehte Hain', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Parbat Se Kali Ghata Takrai', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Pehli Pehli Baar Mohabbat Ki Hai', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Pyar Ka Dard Hai', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Pyar Ka Tohfa', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Teri Yaad Aa Gayee', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Teri Zindagi Ke Ragini Par', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
  { title: 'Julie Julie', film: 'Pehli Pehli Baar Mohabbat Ki Hai', year: 2015 },
]

export function getLocalSongPath(title: string): string {
  return `/songs/${encodeURIComponent(title)}.mp3`
}
