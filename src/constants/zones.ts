export const zone = [
  { id: 1, name: 'zone 1', areas: 'Gammarth, La Marsa, Sidi Bou Said, Carthage, Le Kram' },
  { id: 2, name: 'zone 2', areas: "El Manar, Ennasr, Jardins d'El Menzah, Manzah" },
  { id: 3, name: 'zone 3', areas: 'Lac 1, Lac 2' },
  { id: 4, name: 'zone 4', areas: 'Sokra, El Aouina, Borj Louzir' },
  { id: 5, name: 'zone 5', areas: 'Riadh Andalous, Ghazela, Petit Ariana' },
  { id: 6, name: 'zone 6', areas: 'Centre Urbain Nord, Borj Baccouche, Ariana Ville' },
  { id: 7, name: 'zone 7', areas: 'Manouba, Bardo, Denden' },
  { id: 8, name: 'zone 8', areas: 'Tunis Centre Ville, Belvédère, El Omrane' },
  { id: 9, name: 'zone 9', areas: 'Monfleury, Bab Saadoun, Bellevue, Wardia' },
  { id: 10, name: 'zone 10', areas: 'Mourouj' },
  { id: 11, name: 'zone 11', areas: 'Rades, Mégrine, Hammam Lif, Bou Mhel el-Bassatine, Medina Jedida, Ben Arous' }
] as const;

export const governorate = ["Tunis", "Ariana", "Ben Arous", "Manouba"] as const;

export type Zone = typeof zone[number];
export type Governorate = typeof governorate[number];