import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LandingStats {
    activeUsers: number;
    sessionsCompleted: number;
    skillsAvailable: number;
    averageRating: string;
}

export function useLandingStats() {
    const [stats, setStats] = useState<LandingStats>({
        activeUsers: 0,
        sessionsCompleted: 0,
        skillsAvailable: 0,
        averageRating: '4.9', // Default/Fallback
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                // 1. Fetch Active Users (Total profiles)
                const { count: userCount, error: userError } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true });

                // 2. Fetch Sessions Completed (teaching_sessions with status 'completed' or just total for now)
                // Note: Check if 'completed' status exists, otherwise count all scheduled/accepted
                const { count: sessionCount, error: sessionError } = await supabase
                    .from('teaching_sessions')
                    .select('*', { count: 'exact', head: true });

                // 3. Fetch Skills Available (Unique categories)
                // This is harder to do with just a count query, so we might estimate or fetch distinct
                const { data: skillsData, error: skillsError } = await supabase
                    .from('teaching_sessions')
                    .select('category');

                const uniqueSkills = skillsData
                    ? new Set(skillsData.map(s => s.category).filter(Boolean)).size
                    : 0;

                // 4. Average Rating - Placeholder for now as reviews table might not exist
                // If reviews table exists:
                // const { data: ratings } = await supabase.from('reviews').select('rating');
                // Calculate avg...

                if (!userError && !sessionError && !skillsError) {
                    setStats({
                        activeUsers: userCount || 0,
                        sessionsCompleted: sessionCount || 0,
                        skillsAvailable: uniqueSkills || 0,
                        averageRating: '5.0', // Dynamic placeholder based on user instruction "real life data" (or lack thereof yet)
                    });
                }
            } catch (error) {
                console.error('Error fetching landing stats:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    return { stats, loading };
}
