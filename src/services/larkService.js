const LARK_API_BASE = '/api/lark'; // Uses Vite Proxy

export const larkService = {
    /**
     * Get Tenant Access Token
     * @param {string} appId 
     * @param {string} appSecret 
     * @returns {Promise<string>} access_token
     */
    getTenantAccessToken: async (appId, appSecret) => {
        try {
            const response = await fetch(`${LARK_API_BASE}/auth/v3/tenant_access_token/internal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    app_id: appId,
                    app_secret: appSecret,
                }),
            });

            const data = await response.json();

            if (data.code !== 0) {
                throw new Error(`Auth Error: ${data.msg}`);
            }

            return data.tenant_access_token;
        } catch (error) {
            console.error("Lark Auth Failed:", error);
            throw error;
        }
    },

    /**
     * Create a new record in a specific table
     * @param {string} accessToken 
     * @param {string} appToken 
     * @param {string} tableId 
     * @param {object} fields 
     * @returns {Promise<object>} Created Record Data
     */
    createRecord: async (accessToken, appToken, tableId, fields) => {
        try {
            const response = await fetch(`${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    fields: fields,
                }),
            });

            const data = await response.json();

            if (data.code !== 0) {
                // Enhance error message for Link fields
                if (data.msg.includes('LinkFieldConvFail')) {
                    throw new Error(`Link Error: The field value for a Link column is invalid. Please check if the Field Name is correct and if the Record ID exists.`);
                }
                throw new Error(`Create Record Error: ${data.msg}`);
            }

            return data.data.record;
        } catch (error) {
            console.error("Create Record Failed:", error);
            throw error;
        }
    },

    /**
     * Get Table Fields (Schema)
     * @param {string} accessToken 
     * @param {string} appToken 
     * @param {string} tableId 
     */
    getFields: async (accessToken, appToken, tableId) => {
        try {
            const response = await fetch(`${LARK_API_BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                }
            });
            const data = await response.json();
            if (data.code !== 0) throw new Error(data.msg);
            return data.data.items;
        } catch (error) {
            console.error("Get Fields Failed:", error);
            throw error;
        }
    },

    /**
     * Generate Lark OAuth URL
     * @param {string} appId 
     * @param {string} redirectUri 
     */
    getAuthUrl: (appId, redirectUri) => {
        return `https://open.larksuite.com/open-apis/authen/v1/authorize?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=contact:user.id:readonly&state=RANDOM_STATE`;
    },

    /**
     * Exchange Auth Code for User Access Token
     * @param {string} code 
     * @param {string} appId 
     * @param {string} appSecret 
     * @param {string} appToken (using app_access_token if needed, but for user login we use app_access_token usually to get user_access_token? No, standard OIDC uses app_id/secret)
     */
    getUserAccessToken: async (code, appId, appSecret) => {
        try {
            // First, get app_access_token (needed for some flows, but OIDC might just need app_id/secret)
            // Actually, for "Login", we typically use the /authen/v1/oidc/access_token endpoint
            // which allows exchanging code + app_access_token for user_access_token

            // Let's get app_access_token first internal
            const appToken = await larkService.getTenantAccessToken(appId, appSecret);

            const response = await fetch(`${LARK_API_BASE}/authen/v1/oidc/access_token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${appToken}`
                },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    code: code
                }),
            });

            const data = await response.json();
            if (data.code !== 0) throw new Error(data.msg);
            return data.data; // contains access_token, avatar_url, name, etc.
        } catch (error) {
            console.error("Get User Token Failed:", error);
            throw error;
        }
    },

    /**
     * Get User Info (Optional if access_token response already has it)
     * The OIDC access_token response usually contains basic info.
     * But we can also call /authen/v1/user_info
     */
    getUserInfo: async (userAccessToken) => {
        try {
            const response = await fetch(`${LARK_API_BASE}/authen/v1/user_info`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userAccessToken}`
                }
            });
            const data = await response.json();
            if (data.code !== 0) throw new Error(data.msg);
            return data.data;
        } catch (error) {
            console.error("Get User Info Failed:", error);
            throw error;
        }
    }
};
