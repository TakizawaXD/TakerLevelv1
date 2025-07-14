import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Database } from '../lib/supabase';

export type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("useUserProfile: useEffect activado. Estado del usuario:", user);
    if (user) {
      fetchProfile();
    } else {
      console.log("useUserProfile: No hay usuario autenticado. Reiniciando perfil.");
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const createNewUserProfile = async (userId: string, userEmail: string) => {
    console.log("useUserProfile: Intentando crear nuevo perfil para el usuario:", userId);
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId, // Usar 'id' en lugar de 'auth_user_id' para la clave primaria
        email: userEmail,
        username: userEmail.split('@')[0],
        level: 1,
        total_xp: 0,
        current_xp: 0,
        xp_to_next_level: 100,
        str: 1,
        agi: 1,
        int: 1,
        vit: 1,
        cha: 1,
        available_points: 0,
        current_streak: 0,
        max_streak: 0,
        total_workouts: 0,
        total_missions_completed: 0,
        title: 'Cazador Novato',
        rank: 'E'
      })
      .select('*')
      .single();

    if (error) {
      console.error('useUserProfile: Error al crear el nuevo perfil:', error);
      throw error;
    }
    console.log('useUserProfile: Nuevo perfil creado con éxito:', data);
    return data;
  };

  const fetchProfile = async () => {
    if (!user) {
      console.log("useUserProfile: fetchProfile llamado sin usuario. Retornando.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const TIMEOUT_DURATION = 15000;

    try {
      console.log("useUserProfile: Intentando obtener perfil para auth_user_id:", user.id); // Este log puede permanecer, pero la consulta cambia

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout al obtener el perfil del usuario')), TIMEOUT_DURATION)
      );

      const { data, error } = await Promise.race([
        supabase
          .from('user_profiles')
          .select('*', { head: false })
          .eq('id', user.id) // <--- ¡CORRECCIÓN CLAVE AQUÍ! Cambiado de 'auth_user_id' a 'id'
          .maybeSingle(),
        timeoutPromise,
      ]);

      if (error) {
        console.error('useUserProfile: Error al obtener el perfil:', error);
        throw error;
      }

      if (data) {
        console.log('useUserProfile: Perfil obtenido con éxito:', data);
        setProfile(data);
      } else {
        console.warn('useUserProfile: No se encontró un perfil para el usuario:', user.id, '. Procediendo a crear uno...');
        const newProfile = await createNewUserProfile(user.id, user.email || 'no-email@example.com');
        setProfile(newProfile);
      }
    } catch (error: any) {
      console.error('useUserProfile: Error inesperado al obtener o crear el perfil o timeout:', error.message || error);
      setProfile(null);
    } finally {
      console.log('useUserProfile: Carga del perfil finalizada. Estableciendo loading a false.');
      setLoading(false);
    }
  };

  const addXP = async (xp: number, reason: string = 'workout') => {
    if (!profile) return

    const newTotalXp = profile.total_xp + xp
    let newCurrentXp = profile.current_xp + xp
    let newLevel = profile.level
    let newAvailablePoints = profile.available_points
    let newXpToNext = profile.xp_to_next_level

    let leveledUp = false
    while (newCurrentXp >= newXpToNext) {
      newCurrentXp -= newXpToNext
      newLevel++
      newAvailablePoints++
      newXpToNext = newLevel * 100
      leveledUp = true
    }

    const updatedProfile = {
      total_xp: newTotalXp,
      current_xp: newCurrentXp,
      level: newLevel,
      available_points: newAvailablePoints,
      xp_to_next_level: newXpToNext,
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updatedProfile)
      .eq('id', profile.id)

    if (!error) {
      setProfile({ ...profile, ...updatedProfile })

      if (leveledUp) {
        await checkLevelAchievements(newLevel)
      }
    }

    return { leveledUp, newLevel }
  }

  const allocateStatPoint = async (
    stat: keyof Pick<UserProfile, 'str' | 'agi' | 'int' | 'vit' | 'cha'>
  ) => {
    if (!profile || profile.available_points <= 0) return

    const oldValue = profile[stat]
    const newValue = oldValue + 1

    const updates = {
      [stat]: newValue,
      available_points: profile.available_points - 1,
    }

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', profile.id)

    if (!error) {
      setProfile({ ...profile, ...updates })
    }
  }

  const checkLevelAchievements = async (level: number) => {
    if (!profile) return

    const achievements = []

    if (level === 5)
      achievements.push({
        key: 'level_5',
        title: '🌟 Cazador Emergente',
        description: 'Alcanzaste el nivel 5',
        rarity: 'rare',
      })
    if (level === 10)
      achievements.push({
        key: 'level_10',
        title: '⚡ Cazador Experimentado',
        description: 'Alcanzaste el nivel 10',
        rarity: 'epic',
      })
    if (level === 25)
      achievements.push({
        key: 'level_25',
        title: '👑 Cazador de Élite',
        description: 'Alcanzaste el nivel 25',
        rarity: 'legendary',
      })
    if (level === 50)
      achievements.push({
        key: 'level_50',
        title: '🔥 Cazador Legendario',
        description: 'Alcanzaste el nivel 50',
        rarity: 'mythic',
      })

    for (const achievement of achievements) {
      await supabase
        .from('achievements')
        .insert({
          user_id: profile.id,
          achievement_key: achievement.key,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.title.split(' ')[0],
          rarity: achievement.rarity as any,
        })
        .onConflict('achievement_key')
        .ignore()
    }
  }

  const updateStreak = async (increment: boolean = true) => {
    if (!profile) return

    const newStreak = increment ? profile.current_streak + 1 : 0
    const newMaxStreak = Math.max(profile.max_streak, newStreak)

    const { error } = await supabase
      .from('user_profiles')
      .update({
        current_streak: newStreak,
        max_streak: newMaxStreak,
      })
      .eq('id', profile.id)

    if (!error) {
      setProfile({
        ...profile,
        current_streak: newStreak,
        max_streak: newMaxStreak,
      })
    }
  }

  return {
    profile,
    loading,
    addXP,
    allocateStatPoint,
    updateStreak,
    refreshProfile: fetchProfile,
  };
}
