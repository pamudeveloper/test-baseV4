
import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Save, FileText, Clock, CreditCard, User, Building, Briefcase, Settings, X, Loader2, LogIn, LogOut } from 'lucide-react';
import { larkService } from '../services/larkService';

function Login() {
    // Initialize config from Environment Variables or Local Storage
    const [larkConfig, setLarkConfig] = useState({
        appId: import.meta.env.VITE_LARK_APP_ID || '',
        appSecret: import.meta.env.VITE_LARK_APP_SECRET || '',
        appToken: import.meta.env.VITE_LARK_APP_TOKEN || 'Cj9UbhFn2am6fdsCi4dlHDcrgEv',
        projectTableId: import.meta.env.VITE_LARK_PROJECT_TABLE_ID || 'tbl41qSJJvMhYvL9',
        scheduleTableId: import.meta.env.VITE_LARK_SCHEDULE_TABLE_ID || ''
    });

    const [showConfig, setShowConfig] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false);


    // Check for Auth Code on Mount or restore session
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
            handleAuthCallback(code);
        } else {
            // Restore user from local storage
            const savedUser = localStorage.getItem('lark_user');
            const savedConfig = localStorage.getItem('lark_config');

            if (savedUser) setUser(JSON.parse(savedUser));
            // Only override env vars if user manually saved config before
            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                // shallow merge to keep env vars if local storage is missing keys (optional)
                setLarkConfig(prev => ({ ...prev, ...parsedConfig }));
            }
        }
    }, []);

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        const newConfig = { ...larkConfig, [name]: value };
        setLarkConfig(newConfig);
        localStorage.setItem('lark_config', JSON.stringify(newConfig));
    };

    const handleLogin = () => {
        if (!larkConfig.appId || larkConfig.appId.includes('cli_EXAMPLE')) {
            alert("App ID not configured. Please check your .env file or Settings.");
            setShowConfig(true);
            return;
        }
        // Redirect to Lark
        const redirectUri = window.location.origin + '/'; // http://localhost:5173/
        const url = larkService.getAuthUrl(larkConfig.appId, redirectUri);
        window.location.href = url;
    };

    const handleAuthCallback = async (code) => {
        setIsLoggingIn(true);

        // Ensure we have credentials
        if (!larkConfig.appId || !larkConfig.appSecret) {
            console.warn("Credentials might be missing during callback");
        }

        try {
            console.log("Exchanging Code...");
            const tokenData = await larkService.getUserAccessToken(code, larkConfig.appId, larkConfig.appSecret);
            console.log("Token Received:", tokenData);

            const userData = {
                name: tokenData.name || "Lark User",
                avatar_url: tokenData.avatar_url,
                open_id: tokenData.open_id
            };

            setUser(userData);
            localStorage.setItem('lark_user', JSON.stringify(userData));

            // Clean URL
            window.history.replaceState({}, document.title, "/");

        } catch (error) {
            console.error("Login Failed:", error);
            alert("Login Failed: " + error.message);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('lark_user');
    };

    // Full Screen Login Page
    if (!user && !isLoggingIn && !window.location.search.includes('code=')) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="flex justify-center">
                        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Briefcase className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Project Registration
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Internal System
                    </p>
                </div>

                <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
                        <div className="space-y-6">
                            <div>
                                <button
                                    onClick={handleLogin}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    <LogIn className="w-5 h-5 mr-2" />
                                    Sign in with Lark
                                </button>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Secure Access</span>
                                </div>
                            </div>
                        </div>

                        {/* Subtle Config Trigger for Devs */}
                        <div className="mt-6 flex justify-center">
                            <button onClick={() => setShowConfig(true)} className="text-xs text-gray-300 hover:text-gray-500 transition-colors">
                                Configure Connection
                            </button>
                        </div>
                    </div>
                </div>

                {/* Configuration Modal (available via hidden trigger or initial setup) */}
                {showConfig && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                        {/* ... existing modal content ... */}
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
                            <button onClick={() => setShowConfig(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-bold mb-4 text-gray-900 border-b pb-2">Connection Settings</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
                                    <input type="text" name="appId" value={larkConfig.appId} onChange={handleConfigChange} className="w-full rounded-lg border-gray-300 border p-2.5 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">App Secret</label>
                                    <input type="password" name="appSecret" value={larkConfig.appSecret} onChange={handleConfigChange} className="w-full rounded-lg border-gray-300 border p-2.5 text-sm" />
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button onClick={() => setShowConfig(false)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Loading State for Auth
    if (isLoggingIn || (window.location.search.includes('code=') && !user)) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Authenticating...</h2>
                <p className="text-gray-500">Please wait while we log you in via authentication.</p>
            </div>
        );
    }

    return (
        <div>
            <h1>Logged in as {user.name}</h1>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

export default Login;
