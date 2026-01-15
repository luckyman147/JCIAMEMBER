import supabase from '../../../utils/supabase'

export const pointsService = {
  /**
   * Log a change in a member's points to the points_history table.
   * 
   * @param userId - The ID of the member
   * @param points - The number of points added (positive) or deducted (negative)
   * @param description - A human-readable description of the change
   * @param sourceType - The category of the change (e.g., 'activity', 'task', 'manual', 'rank', 'penalty')
   */
  triggerPointsHistory: async (
    userId: string, 
    points: number, 
    description: string, 
    sourceType: string = 'manual'
  ) => {
    if (points === 0) return true;

    try {
      // 1. Update the actual points in the profile first
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const currentPoints = profile?.points || 0;
      const newPoints = Math.max(0, currentPoints + points);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 2. Log the transaction in points_history
      const { error: historyError } = await supabase.from('points_history').insert({
        member_id: userId,
        points: points,
        source_type: sourceType,
        description: description
      })

      if (historyError) {
        console.error('Error logging points history:', historyError)
        return false
      }
      
      return true
    } catch (err) {
      console.error('Points service failure:', err);
      return false;
    }
  }
}
