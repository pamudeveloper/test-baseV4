
import fs from 'fs';
import path from 'path';
import https from 'https';

// 1. Read .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const APP_ID = env.VITE_LARK_APP_ID;
const APP_SECRET = env.VITE_LARK_APP_SECRET;
const APP_TOKEN = env.VITE_LARK_APP_TOKEN;
const PROJECT_TABLE_ID = env.VITE_LARK_PROJECT_TABLE_ID;

console.log("App ID:", APP_ID);
// console.log("App Secret:", APP_SECRET); // Keep secret
console.log("App Token:", APP_TOKEN);

// Helper to make HTTPS requests
const request = (url, options, body) => {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
};

async function run() {
    try {
        console.log("1. Getting Tenant Access Token...");
        const tokenRes = await request('https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }));

        if (tokenRes.code !== 0) throw new Error(tokenRes.msg);
        const accessToken = tokenRes.tenant_access_token;
        console.log("   Success!");

        console.log(`2. Getting Fields for Table ${PROJECT_TABLE_ID}...`);
        const fieldsRes = await request(`https://open.larksuite.com/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${PROJECT_TABLE_ID}/fields`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (fieldsRes.code !== 0) throw new Error(fieldsRes.msg);

        const output = {};

        console.log("--- PROJECT TABLE ---");
        output.project = fieldsRes.data.items.map(f => ({ name: f.field_name, type: f.type }));

        const SCHEDULE_TABLE_ID = env.VITE_LARK_SCHEDULE_TABLE_ID;
        if (SCHEDULE_TABLE_ID) {
            console.log("--- SCHEDULE FIELDS LIST ---");
            const sFieldsRes = await request(`https://open.larksuite.com/open-apis/bitable/v1/apps/${APP_TOKEN}/tables/${SCHEDULE_TABLE_ID}/fields`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (sFieldsRes.data && sFieldsRes.data.items) {
                output.schedule = sFieldsRes.data.items.map(f => ({ name: f.field_name, type: f.type }));
            }
        }

        fs.writeFileSync('fields.json', JSON.stringify(output, null, 2));
        console.log("Fields written to fields.json");

    } catch (e) {
        console.error("Error:", e);
    }
}

run();
