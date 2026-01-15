import supabase from '../../../utils/supabase'

export const activityCategoryService = {
  /**
   * Fetch all available activity categories
   */
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name')

    if (error) throw error
    return data || []
  },

  /**
   * Fetch categories linked to a specific activity
   */
  getActivityCategories: async (activityId: string) => {
    const { data, error } = await supabase
      .from('activity_categories')
      .select(`
        category_id,
        categories (
          id,
          name
        )
      `)
      .eq('activity_id', activityId)

    if (error) throw error
    return data?.map((item: any) => item.categories).filter(Boolean) || []
  },

  /**
   * Set categories for an activity (replaces existing categories)
   */
  setActivityCategories: async (activityId: string, categoryIds: number[]) => {
    // First, delete all existing category links
    const { error: deleteError } = await supabase
      .from('activity_categories')
      .delete()
      .eq('activity_id', activityId)

    if (deleteError) throw deleteError

    // If no categories to add, we're done
    if (categoryIds.length === 0) return true

    // Insert new category links
    const inserts = categoryIds.map(categoryId => ({
      activity_id: activityId,
      category_id: categoryId
    }))

    const { error: insertError } = await supabase
      .from('activity_categories')
      .insert(inserts)

    if (insertError) throw insertError
    return true
  },

  /**
   * Add a single category to an activity
   */
  addActivityCategory: async (activityId: string, categoryId: number) => {
    const { error } = await supabase
      .from('activity_categories')
      .insert({
        activity_id: activityId,
        category_id: categoryId
      })

    if (error) {
      if (error.code === '23505') {
        // Already exists, ignore
        return true
      }
      throw error
    }
    return true
  },

  /**
   * Remove a single category link from an activity
   */
  removeActivityCategory: async (activityId: string, categoryId: number) => {
    const { error } = await supabase
      .from('activity_categories')
      .delete()
      .eq('activity_id', activityId)
      .eq('category_id', categoryId)

    if (error) throw error
    return true
  }
}
