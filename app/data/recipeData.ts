import recipesData from './recipes.json';
import materialsData from './materials.json';

// --- TYPE DEFINITIONS ---

export interface Material {
    id: string;
    name: string;
    price: number;
    category: 'raw' | 'processed' | 'product';
}

export interface Ingredient {
    materialId: string;
    quantity: number;
}

export interface Recipe {
    id: string;
    name: string;
    ingredients: Ingredient[];
    manualTime: number;
    autoTime: number;
    machineName: string;
    skillName: string;
    amount: number;
    storedOn: string;
    craftedBy: string;
}

// --- IMPORTED DATA ---

export const parsedRecipes: Recipe[] = recipesData;

// Create base materials from JSON and add product materials from recipes
export const allMaterials: Material[] = [
    ...materialsData.map(m => ({
        ...m,
        price: 0, // Default all base resources to zero
        category: m.category as 'raw' | 'processed' | 'product'
    })),
    ...parsedRecipes.map(r => ({ 
        id: r.id, 
        name: r.name, 
        price: 0, 
        category: 'product' as const 
    }))
].filter((v,i,a)=>a.findIndex(t=>(t.id === v.id))===i);

export const categoryColorMap = {
    raw: { bg: 'bg-green-800/50', text: 'text-green-300' },
    processed: { bg: 'bg-yellow-800/50', text: 'text-yellow-300' },
    product: { bg: 'bg-blue-800/50', text: 'text-blue-300' },
};
