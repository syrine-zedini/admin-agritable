import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserSpreadsheetPreferences } from '@/types/pricing-spreadsheet';

/**
 * Hook to manage user spreadsheet preferences (stored in database)
 * Provides functions to load, save, and update preferences
 * Preferences sync across devices
 */
export const useSpreadsheetPreferences = () => {
  const [preferences, setPreferences] = useState<UserSpreadsheetPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user preferences from database
   */
  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Fetch preferences
      const { data, error: fetchError } = await supabase
        .from('user_spreadsheet_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences if none exist
        const defaultPreferences: Partial<UserSpreadsheetPreferences> = {
          user_id: user.id,
          visible_columns: [],
          selected_b2b_clients: [],
          collapsed_groups: ['logistics'], // Logistics group collapsed by default
          color_preferences: {}, // Empty object for default colors
        };

        const { data: newPreferences, error: insertError } = await supabase
          .from('user_spreadsheet_preferences')
          .insert(defaultPreferences)
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPreferences);
      }
    } catch (err: any) {
      console.error('Error loading spreadsheet preferences:', err);
      setError(err.message || 'Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Save preferences to database
   */
  const savePreferences = useCallback(
    async (updates: Partial<Omit<UserSpreadsheetPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
      if (!preferences) {
        console.error('Cannot save preferences: not loaded');
        return false;
      }

      try {
        const { error: updateError } = await supabase
          .from('user_spreadsheet_preferences')
          .update({
            ...updates,
            updated_at: new Date().toISOString(),
          })
          .eq('id', preferences.id);

        if (updateError) throw updateError;

        // Update local state
        setPreferences((prev) =>
          prev
            ? {
                ...prev,
                ...updates,
                updated_at: new Date().toISOString(),
              }
            : null
        );

        return true;
      } catch (err: any) {
        console.error('Error saving spreadsheet preferences:', err);
        setError(err.message || 'Failed to save preferences');
        return false;
      }
    },
    [preferences]
  );

  /**
   * Update visible columns
   */
  const setVisibleColumns = useCallback(
    async (columns: string[]) => {
      return savePreferences({ visible_columns: columns });
    },
    [savePreferences]
  );

  /**
   * Update selected B2B clients
   */
  const setSelectedB2BClients = useCallback(
    async (clientIds: string[]) => {
      return savePreferences({ selected_b2b_clients: clientIds });
    },
    [savePreferences]
  );

  /**
   * Update collapsed groups
   */
  const setCollapsedGroups = useCallback(
    async (groupIds: string[]) => {
      return savePreferences({ collapsed_groups: groupIds });
    },
    [savePreferences]
  );

  /**
   * Toggle a group's collapsed state
   */
  const toggleGroupCollapse = useCallback(
    async (groupId: string) => {
      if (!preferences) return false;

      const currentCollapsed = preferences.collapsed_groups || [];
      const newCollapsed = currentCollapsed.includes(groupId)
        ? currentCollapsed.filter((id) => id !== groupId)
        : [...currentCollapsed, groupId];

      return setCollapsedGroups(newCollapsed);
    },
    [preferences, setCollapsedGroups]
  );

  /**
   * Update color for a specific group
   */
  const setGroupColor = useCallback(
    async (groupId: string, color: string) => {
      if (!preferences) return false;

      const currentColors = preferences.color_preferences || {};
      const newColors = { ...currentColors, [groupId]: color };

      return savePreferences({ color_preferences: newColors });
    },
    [preferences, savePreferences]
  );

  /**
   * Update multiple group colors at once
   */
  const setColorPreferences = useCallback(
    async (colors: Record<string, string>) => {
      return savePreferences({ color_preferences: colors });
    },
    [savePreferences]
  );

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    isLoading,
    error,
    loadPreferences,
    savePreferences,
    setVisibleColumns,
    setSelectedB2BClients,
    setCollapsedGroups,
    toggleGroupCollapse,
    setGroupColor,
    setColorPreferences,
  };
};
