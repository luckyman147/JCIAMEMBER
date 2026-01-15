import supabase from "../../../utils/supabase";

export interface Category {
    id: number;
    name: string;
}

/**
 * Fetch all available categories
 */
export const getCategories = async (): Promise<Category[]> => {
    const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
    
    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
    return data || [];
};

/**
 * Fetch categories for a specific profile
 */
export const getProfileCategories = async (profileId: string): Promise<Category[]> => {
    const { data, error } = await supabase
        .from('profile_categories')
        .select(`
            category_id,
            categories (
                id,
                name
            )
        `)
        .eq('profile_id', profileId);
    
    if (error) {
        console.error('Error fetching profile categories:', error);
        return [];
    }
    
    return data?.map((item: any) => item.categories).filter(Boolean) || [];
};

/**
 * Add a category to a profile
 */
export const addProfileCategory = async (profileId: string, categoryId: number): Promise<boolean> => {
    const { error } = await supabase
        .from('profile_categories')
        .insert({
            profile_id: profileId,
            category_id: categoryId
        });
    
    if (error) {
        if (error.code === '23505') {
            return true;
        }
        console.error('Error adding category to profile:', error);
        throw error;
    }
    return true;
};

/**
 * Remove a category from a profile
 */
export const removeProfileCategory = async (profileId: string, categoryId: number): Promise<boolean> => {
    const { error } = await supabase
        .from('profile_categories')
        .delete()
        .eq('profile_id', profileId)
        .eq('category_id', categoryId);
    
    if (error) {
        console.error('Error removing category from profile:', error);
        throw error;
    }
    return true;
};

/**
 * Create a new universal category
 */
export const createCategory = async (name: string): Promise<Category | null> => {
    const { data, error } = await supabase
        .from('categories')
        .insert({ name: name.trim() })
        .select('id, name')
        .single();
    
    if (error) {
        if (error.code === '23505') {
            throw new Error('Category already exists');
        }
        console.error('Error creating category:', error);
        throw error;
    }
    return data;
};

/**
 * Delete a category globally
 */
export const deleteGlobalCategory = async (id: number): Promise<boolean> => {
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
    
    if (error) {
        console.error('Error deleting category:', error);
        throw error;
    }
    return true;
};
