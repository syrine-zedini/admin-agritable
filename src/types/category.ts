// Contenu initial
export type Category = {
  id: string;
  name: string;
  parentId: string | null;
  children?: Category[];
  created_at: string;
};

// Nouveau contenu adapté
export interface Subcategory {
  id: string;
  name: string;
  totalProducts?: number;
  children?: Subcategory[];
}

export interface CategoryExtended extends Category {
  status?: 'active' | 'inactive';
  totalProducts?: number;
  children?: CategoryExtended[];
}
