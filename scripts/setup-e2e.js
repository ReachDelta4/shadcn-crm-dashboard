const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const https = require('https');
const http = require('http');

// Load env vars from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envVars = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            envVars[match[1].trim()] = match[2].trim();
        }
    });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : http;

        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    if (res.statusCode >= 400) {
                        // Don't reject immediately for 400s if we want to handle "user exists"
                        resolve({ error: result, status: res.statusCode });
                    } else {
                        resolve(result);
                    }
                } catch (e) {
                    reject(new Error(`Invalid JSON: ${data}`));
                }
            });
        });

        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function createUser(email, password, role) {
    console.log(`Creating ${role} user: ${email}`);
    const res = await makeRequest(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
            email,
            password,
            data: { full_name: `Test ${role}` }
        })
    });

    if (res.error) {
        if (res.status === 422 || res.error.msg?.includes('already registered')) {
            console.log(`User ${email} already exists, signing in...`);
            // Sign in to get ID
            const signInRes = await makeRequest(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({ email, password })
            });
            if (signInRes.error) throw new Error(`Failed to sign in ${email}: ${JSON.stringify(signInRes.error)}`);
            return signInRes.user.id;
        }
        throw new Error(`Failed to create user ${email}: ${JSON.stringify(res.error)}`);
    }
    return res.user?.id || res.id;
}

async function main() {
    try {
        const timestamp = Date.now();
        const godEmail = `god-${timestamp}@example.com`;
        const orgAdminEmail = `admin-${timestamp}@example.com`;
        const password = 'TestPassword123!';

        const godId = await createUser(godEmail, password, 'God');
        const adminId = await createUser(orgAdminEmail, password, 'Org Admin');

        console.log(`God ID: ${godId}`);
        console.log(`Admin ID: ${adminId}`);

        // Prepare env vars for Playwright
        const testEnv = {
            ...process.env,
            ...envVars,
            GOD_USER_IDS: godId, // This might need to be appended if others exist, but for test isolation, this is good.
            TEST_GOD_EMAIL: godEmail,
            TEST_GOD_PASSWORD: password,
            TEST_ORG_ADMIN_EMAIL: orgAdminEmail,
            TEST_ORG_ADMIN_PASSWORD: password
        };

        console.log('Starting Playwright tests...');
        const playwright = spawn('npx', ['playwright', 'test'], {
            stdio: 'inherit',
            env: testEnv,
            shell: true
        });

        playwright.on('close', (code) => {
            process.exit(code);
        });

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
