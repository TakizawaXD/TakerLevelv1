import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase'; // Asegúrate de que esta ruta sea correcta

interface SignUpData {
  username: string;
  full_name?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: 'male' | 'female' | 'other';
  height_cm?: number | null;
  weight_kg?: number | null;
  fitness_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: any; // Variable para la suscripción de Supabase
    const TIMEOUT_DURATION = 10000; // 10 segundos de tiempo límite para la inicialización

    const initializeAuth = async () => {
      try {
        console.log("useAuth: Intentando obtener sesión inicial de Supabase...");

        // Crear una promesa de tiempo límite
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout al obtener sesión de Supabase')), TIMEOUT_DURATION)
        );

        // Competir la llamada a getSession con el tiempo límite
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise,
        ]);

        if (error) {
          console.error("useAuth: Error al obtener la sesión inicial:", error);
          // Puedes decidir qué hacer aquí si hay un error (ej. mostrar un mensaje al usuario)
        } else {
          console.log("useAuth: Sesión inicial obtenida:", session);
        }

        setUser(session?.user ?? null);

        // Suscribirse a cambios en el estado de autenticación
        console.log("useAuth: Suscribiéndose a cambios de autenticación...");
        const { data: { subscription: newSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          console.log("useAuth: Cambio de estado de autenticación detectado:", _event, session);
          setUser(session?.user ?? null);
        });
        subscription = newSubscription;

      } catch (error: any) { // Captura errores, incluyendo el de timeout
        console.error("useAuth: Error inesperado durante la inicialización del hook o timeout:", error.message || error);
        // Asegúrate de que el usuario sea null si hay un error grave de inicialización
        setUser(null);
      } finally {
        // MUY IMPORTANTE: Siempre establece 'loading' a false.
        console.log("useAuth: Inicialización de autenticación completada. Estableciendo loading a false.");
        setLoading(false);
      }
    };

    initializeAuth();

    // Función de limpieza para desuscribirse
    return () => {
      if (subscription) {
        console.log("useAuth: Desuscribiendo de los cambios de autenticación.");
        subscription.unsubscribe();
      }
    };
  }, []); // El array de dependencias vacío asegura que se ejecute solo una vez.

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    console.log("useAuth: Iniciando proceso de registro para:", email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('useAuth: Error en el registro:', error);
      return { data, error };
    }

    if (data.user) {
      console.log('useAuth: Usuario registrado. Creando perfil de usuario...');
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          auth_user_id: data.user.id,
          email,
          username: userData.username,
          full_name: userData.full_name,
          phone: userData.phone,
          date_of_birth: userData.date_of_birth,
          gender: userData.gender,
          height_cm: userData.height_cm,
          weight_kg: userData.weight_kg,
          fitness_level: userData.fitness_level || 'beginner',
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
        });

      if (profileError) {
        console.error('useAuth: Error al crear el perfil del usuario:', profileError);
        return { data, error: profileError };
      }
      console.log('useAuth: Perfil de usuario creado con éxito.');

      const { data: userDataProfile, error: userProfileFetchError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('auth_user_id', data.user.id)
        .single();

      if (userProfileFetchError) {
        console.error('useAuth: Error al obtener el ID del perfil para misiones:', userProfileFetchError);
        return { data, error: userProfileFetchError };
      }

      if (userDataProfile) {
        console.log('useAuth: Generando misiones diarias y raids iniciales...');
        await supabase.rpc('generate_daily_missions', { user_uuid: userDataProfile.id });
        await supabase.rpc('create_initial_boss_raids', { user_uuid: userDataProfile.id });
        console.log('useAuth: Misiones y raids generadas.');
      }
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    console.log("useAuth: Intentando iniciar sesión para:", email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('useAuth: Error al iniciar sesión:', error);
    } else {
      console.log('useAuth: Sesión iniciada con éxito para:', email);
    }
    return { data, error };
  };

  const signOut = async () => {
    console.log("useAuth: Intentando cerrar sesión...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('useAuth: Error al cerrar sesión:', error);
    } else {
      console.log('useAuth: Sesión cerrada con éxito.');
    }
    return { error };
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
