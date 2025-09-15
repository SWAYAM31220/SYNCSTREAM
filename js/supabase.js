// Supabase Configuration
// Replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = 'https://trghvobcfbgmsresikrm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZ2h2b2JjZmJnbXNyZXNpa3JtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODAwNTQsImV4cCI6MjA3MzI1NjA1NH0.RIWSnjXMQMK1NGJvLT3856uM_oY8-SFMhwzm6vAZy7M';

// Initialize Supabase client (using CDN version)
let supabase;

// Load Supabase from CDN
function loadSupabase() {
    return new Promise((resolve, reject) => {
        if (window.supabase) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js';
        script.onload = () => {
            try {
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        script.onerror = () => reject(new Error('Failed to load Supabase'));
        document.head.appendChild(script);
    });
}

// Supabase helper functions
const SupabaseAPI = {
    // Initialize Supabase
    async init() {
        try {
            await loadSupabase();
            console.log('Supabase initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            // For development, return true to allow testing without Supabase
            return false;
        }
    },

    // Room operations
    async createRoom(videoUrl) {
        if (!supabase) {
            console.warn('Supabase not initialized, using mock data');
            return { id: this.generateRoomId(), video_url: videoUrl };
        }

        try {
            const roomId = this.generateRoomId();
            const { data, error } = await supabase
                .from('rooms')
                .insert([{ id: roomId, video_url: videoUrl }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error creating room:', error);
            // Fallback for development
            return { id: this.generateRoomId(), video_url: videoUrl };
        }
    },

    async getRoom(roomId) {
        if (!supabase) {
            console.warn('Supabase not initialized, using mock data');
            return { id: roomId, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
        }

        try {
            const { data, error } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', roomId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching room:', error);
            // Fallback for development
            return { id: roomId, video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };
        }
    },

    // Participant operations
    async addParticipant(roomId, name) {
        if (!supabase) {
            console.warn('Supabase not initialized, using mock data');
            return { id: Date.now().toString(), room_id: roomId, name: name };
        }

        try {
            const { data, error } = await supabase
                .from('participants')
                .insert([{ room_id: roomId, name: name }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error adding participant:', error);
            return { id: Date.now().toString(), room_id: roomId, name: name };
        }
    },

    async getParticipants(roomId) {
        if (!supabase) {
            console.warn('Supabase not initialized, using mock data');
            return [{ name: 'Demo User', joined_at: new Date().toISOString() }];
        }

        try {
            const { data, error } = await supabase
                .from('participants')
                .select('*')
                .eq('room_id', roomId)
                .order('joined_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching participants:', error);
            return [];
        }
    },

    // Message operations
    async sendMessage(roomId, senderName, message) {
        if (!supabase) {
            console.warn('Supabase not initialized, using mock data');
            const mockMessage = {
                id: Date.now().toString(),
                room_id: roomId,
                sender_name: senderName,
                message: message,
                created_at: new Date().toISOString()
            };
            // Simulate real-time update
            setTimeout(() => {
                if (window.onNewMessage) {
                    window.onNewMessage(mockMessage);
                }
            }, 100);
            return mockMessage;
        }

        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([{ room_id: roomId, sender_name: senderName, message: message }])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error sending message:', error);
            return null;
        }
    },

    async getMessages(roomId, limit = 50) {
        if (!supabase) {
            console.warn('Supabase not initialized, using mock data');
            return [];
        }

        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
    },

    // Video state operations
    async updateVideoState(roomId, currentTime, isPlaying) {
        if (!supabase) {
            console.warn('Supabase not initialized, video state not synced');
            return;
        }

        try {
            const { error } = await supabase
                .from('video_state')
                .upsert([{
                    room_id: roomId,
                    video_time: currentTime,
                    is_playing: isPlaying,
                    updated_at: new Date().toISOString()
                }]);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating video state:', error);
        }
    },

    async getVideoState(roomId) {
        if (!supabase) {
            console.warn('Supabase not initialized, using default video state');
            return { video_time: 0, is_playing: false };
        }

        try {
            const { data, error } = await supabase
                .from('video_state')
                .select('*')
                .eq('room_id', roomId)
                .single();

            if (error) throw error;
            return data || { video_time: 0, is_playing: false };
        } catch (error) {
            console.error('Error fetching video state:', error);
            return { video_time: 0, is_playing: false };
        }
    },

    // Real-time subscriptions
    subscribeToMessages(roomId, callback) {
        if (!supabase) {
            console.warn('Supabase not initialized, real-time messaging disabled');
            window.onNewMessage = callback;
            return null;
        }

        try {
            const subscription = supabase
                .channel('messages')
                .on('postgres_changes', 
                    { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
                    callback
                )
                .subscribe();

            return subscription;
        } catch (error) {
            console.error('Error subscribing to messages:', error);
            return null;
        }
    },

    subscribeToVideoState(roomId, callback) {
        if (!supabase) {
            console.warn('Supabase not initialized, real-time video sync disabled');
            return null;
        }

        try {
            const subscription = supabase
                .channel('video_state')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'video_state', filter: `room_id=eq.${roomId}` },
                    callback
                )
                .subscribe();

            return subscription;
        } catch (error) {
            console.error('Error subscribing to video state:', error);
            return null;
        }
    },

    subscribeToParticipants(roomId, callback) {
        if (!supabase) {
            console.warn('Supabase not initialized, participant updates disabled');
            return null;
        }

        try {
            const subscription = supabase
                .channel('participants')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'participants', filter: `room_id=eq.${roomId}` },
                    callback
                )
                .subscribe();

            return subscription;
        } catch (error) {
            console.error('Error subscribing to participants:', error);
            return null;
        }
    },

    // Utility functions
    generateRoomId() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    },

    extractVideoId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    },

    isValidYouTubeUrl(url) {
        const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
        return regex.test(url) && this.extractVideoId(url) !== null;
    }
};

// Initialize Supabase when the script loads
SupabaseAPI.init();
