/* ==========================================================================
   SYNCSTREAM SERVICE WORKER
   Progressive Web App with Offline Support
   ========================================================================== */

const CACHE_NAME = 'syncstream-v1.2.0';
const STATIC_CACHE = 'syncstream-static-v1.2.0';
const DYNAMIC_CACHE = 'syncstream-dynamic-v1.2.0';

// Assets to cache on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/room.html',
    '/css/design-tokens.css',
    '/css/main.css',
    '/js/enhanced-main.js',
    '/js/enhanced-room.js',
    '/js/supabase.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
];

// Dynamic assets to cache (fetched as needed)
const DYNAMIC_ASSETS = [
    'https://www.youtube.com/iframe_api',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.3/dist/umd/supabase.min.js'
];

// Assets that should always be fetched from network
const NETWORK_FIRST = [
    '/api/',
    'supabase.co',
    'youtube.com/watch'
];

// ==========================================================================
// SERVICE WORKER EVENTS
// ==========================================================================

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static assets
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('Service Worker: Caching static assets...');
                return cache.addAll(STATIC_ASSETS);
            }),
            
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // Claim all clients
            self.clients.claim()
        ])
    );
});

// Fetch Event - Network strategy
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        handleFetch(request, url)
    );
});

// ==========================================================================
// FETCH STRATEGIES
// ==========================================================================

async function handleFetch(request, url) {
    try {
        // Network first for API calls and real-time data
        if (isNetworkFirst(url)) {
            return await networkFirst(request);
        }
        
        // Cache first for static assets
        if (isStaticAsset(url)) {
            return await cacheFirst(request);
        }
        
        // Stale while revalidate for dynamic content
        return await staleWhileRevalidate(request);
        
    } catch (error) {
        console.error('Service Worker: Fetch error:', error);
        return await handleFetchError(request, url);
    }
}

// Network first strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Cache first strategy
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Fallback to network
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Return offline fallback if available
        return await getOfflineFallback(request);
    }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    // Always try to fetch fresh data in background
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        // Network failed, but we might have cached version
        return cachedResponse;
    });
    
    // Return cached version immediately if available
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Wait for network if no cached version
    return await fetchPromise;
}

// ==========================================================================
// UTILITY FUNCTIONS
// ==========================================================================

function isNetworkFirst(url) {
    return NETWORK_FIRST.some(pattern => url.href.includes(pattern));
}

function isStaticAsset(url) {
    const pathname = url.pathname;
    return pathname.endsWith('.css') ||
           pathname.endsWith('.js') ||
           pathname.endsWith('.html') ||
           pathname.endsWith('.png') ||
           pathname.endsWith('.jpg') ||
           pathname.endsWith('.svg') ||
           pathname.endsWith('.ico') ||
           url.href.includes('fonts.googleapis.com');
}

async function getOfflineFallback(request) {
    const url = new URL(request.url);
    
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
        const offlinePage = await caches.match('/offline.html');
        if (offlinePage) {
            return offlinePage;
        }
        
        // Fallback HTML
        return new Response(
            createOfflineHTML(),
            {
                headers: { 'Content-Type': 'text/html' },
                status: 503,
                statusText: 'Service Unavailable'
            }
        );
    }
    
    // Return empty response for other requests
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
}

function createOfflineHTML() {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SyncStream - Offline</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%);
                    color: white;
                    text-align: center;
                    padding: 2rem;
                }
                .container {
                    max-width: 400px;
                    background: rgba(255, 255, 255, 0.05);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 1rem;
                    padding: 2rem;
                }
                h1 { color: #8b5cf6; margin-bottom: 1rem; }
                p { margin-bottom: 1.5rem; opacity: 0.8; }
                button {
                    background: #8b5cf6;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    font-size: 1rem;
                    font-weight: 500;
                }
                button:hover { background: #7c3aed; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🟣 SyncStream</h1>
                <h2>You're Offline</h2>
                <p>It looks like you've lost your internet connection. Please check your network and try again.</p>
                <button onclick="window.location.reload()">Try Again</button>
            </div>
        </body>
        </html>
    `;
}

async function handleFetchError(request, url) {
    console.error('Service Worker: Fetch failed for:', url.href);
    
    // Try to return cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Return offline fallback
    return await getOfflineFallback(request);
}

// ==========================================================================
// BACKGROUND SYNC & NOTIFICATIONS
// ==========================================================================

// Background Sync - Handle failed requests when back online
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            handleBackgroundSync()
        );
    }
});

async function handleBackgroundSync() {
    try {
        // Handle any queued operations when back online
        console.log('Service Worker: Processing background sync...');
        
        // This would handle queued chat messages, room joins, etc.
        // Implementation depends on your offline queue strategy
        
    } catch (error) {
        console.error('Service Worker: Background sync failed:', error);
    }
}

// Push Notifications (for future use)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push received');
    
    if (!event.data) return;
    
    try {
        const data = event.data.json();
        
        event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: '/icon-192.png',
                badge: '/badge-72.png',
                data: data.data,
                actions: data.actions || []
            })
        );
    } catch (error) {
        console.error('Service Worker: Push notification error:', error);
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Check if there's already a window open
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Open new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// ==========================================================================
// CACHE MANAGEMENT
// ==========================================================================

// Periodic cleanup of old cache entries
async function cleanupOldCaches() {
    const cacheNames = await caches.keys();
    
    for (const cacheName of cacheNames) {
        if (cacheName.startsWith('syncstream-') && 
            cacheName !== STATIC_CACHE && 
            cacheName !== DYNAMIC_CACHE) {
            
            console.log('Service Worker: Cleaning up old cache:', cacheName);
            await caches.delete(cacheName);
        }
    }
}

// Limit cache size to prevent storage bloat
async function limitCacheSize(cacheName, maxItems) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > maxItems) {
        const itemsToDelete = keys.slice(0, keys.length - maxItems);
        
        for (const key of itemsToDelete) {
            await cache.delete(key);
        }
        
        console.log(`Service Worker: Trimmed ${itemsToDelete.length} items from ${cacheName}`);
    }
}

// ==========================================================================
// PERIODIC MAINTENANCE
// ==========================================================================

// Run maintenance tasks periodically
setInterval(async () => {
    try {
        await cleanupOldCaches();
        await limitCacheSize(DYNAMIC_CACHE, 50);
    } catch (error) {
        console.error('Service Worker: Maintenance error:', error);
    }
}, 24 * 60 * 60 * 1000); // Run once per day

// ==========================================================================
// VERSION MANAGEMENT
// ==========================================================================

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            type: 'VERSION',
            version: CACHE_NAME
        });
    }
});

console.log('Service Worker: Loaded successfully');
