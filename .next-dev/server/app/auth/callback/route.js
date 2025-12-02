/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/auth/callback/route";
exports.ids = ["app/auth/callback/route"];
exports.modules = {

/***/ "(rsc)/./node_modules/.pnpm/next@15.2.2_react-dom@19.1.1_react@19.1.1__react@19.1.1/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fauth%2Fcallback%2Froute&page=%2Fauth%2Fcallback%2Froute&appPaths=&pagePath=private-next-app-dir%2Fauth%2Fcallback%2Froute.ts&appDir=D%3A%5CDelta%20IV%5CSofwares%5Cglass%5Csandbox%5Cshadcn-crm-dashboard%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5CDelta%20IV%5CSofwares%5Cglass%5Csandbox%5Cshadcn-crm-dashboard&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/next@15.2.2_react-dom@19.1.1_react@19.1.1__react@19.1.1/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fauth%2Fcallback%2Froute&page=%2Fauth%2Fcallback%2Froute&appPaths=&pagePath=private-next-app-dir%2Fauth%2Fcallback%2Froute.ts&appDir=D%3A%5CDelta%20IV%5CSofwares%5Cglass%5Csandbox%5Cshadcn-crm-dashboard%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5CDelta%20IV%5CSofwares%5Cglass%5Csandbox%5Cshadcn-crm-dashboard&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \****************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/.pnpm/next@15.2.2_react-dom@19.1.1_react@19.1.1__react@19.1.1/node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/.pnpm/next@15.2.2_react-dom@19.1.1_react@19.1.1__react@19.1.1/node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/.pnpm/next@15.2.2_react-dom@19.1.1_react@19.1.1__react@19.1.1/node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var D_Delta_IV_Sofwares_glass_sandbox_shadcn_crm_dashboard_src_app_auth_callback_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/auth/callback/route.ts */ \"(rsc)/./src/app/auth/callback/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/auth/callback/route\",\n        pathname: \"/auth/callback\",\n        filename: \"route\",\n        bundlePath: \"app/auth/callback/route\"\n    },\n    resolvedPagePath: \"D:\\\\Delta IV\\\\Sofwares\\\\glass\\\\sandbox\\\\shadcn-crm-dashboard\\\\src\\\\app\\\\auth\\\\callback\\\\route.ts\",\n    nextConfigOutput,\n    userland: D_Delta_IV_Sofwares_glass_sandbox_shadcn_crm_dashboard_src_app_auth_callback_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvLnBucG0vbmV4dEAxNS4yLjJfcmVhY3QtZG9tQDE5LjEuMV9yZWFjdEAxOS4xLjFfX3JlYWN0QDE5LjEuMS9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhdXRoJTJGY2FsbGJhY2slMkZyb3V0ZSZwYWdlPSUyRmF1dGglMkZjYWxsYmFjayUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmF1dGglMkZjYWxsYmFjayUyRnJvdXRlLnRzJmFwcERpcj1EJTNBJTVDRGVsdGElMjBJViU1Q1NvZndhcmVzJTVDZ2xhc3MlNUNzYW5kYm94JTVDc2hhZGNuLWNybS1kYXNoYm9hcmQlNUNzcmMlNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUQlM0ElNUNEZWx0YSUyMElWJTVDU29md2FyZXMlNUNnbGFzcyU1Q3NhbmRib3glNUNzaGFkY24tY3JtLWRhc2hib2FyZCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDZ0Q7QUFDN0g7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkQ6XFxcXERlbHRhIElWXFxcXFNvZndhcmVzXFxcXGdsYXNzXFxcXHNhbmRib3hcXFxcc2hhZGNuLWNybS1kYXNoYm9hcmRcXFxcc3JjXFxcXGFwcFxcXFxhdXRoXFxcXGNhbGxiYWNrXFxcXHJvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2F1dGgvY2FsbGJhY2svcm91dGVcIixcbiAgICAgICAgcGF0aG5hbWU6IFwiL2F1dGgvY2FsbGJhY2tcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXV0aC9jYWxsYmFjay9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIkQ6XFxcXERlbHRhIElWXFxcXFNvZndhcmVzXFxcXGdsYXNzXFxcXHNhbmRib3hcXFxcc2hhZGNuLWNybS1kYXNoYm9hcmRcXFxcc3JjXFxcXGFwcFxcXFxhdXRoXFxcXGNhbGxiYWNrXFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/.pnpm/next@15.2.2_react-dom@19.1.1_react@19.1.1__react@19.1.1/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fauth%2Fcallback%2Froute&page=%2Fauth%2Fcallback%2Froute&appPaths=&pagePath=private-next-app-dir%2Fauth%2Fcallback%2Froute.ts&appDir=D%3A%5CDelta%20IV%5CSofwares%5Cglass%5Csandbox%5Cshadcn-crm-dashboard%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5CDelta%20IV%5CSofwares%5Cglass%5Csandbox%5Cshadcn-crm-dashboard&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/.pnpm/next@15.2.2_react-dom@19.1.1_react@19.1.1__react@19.1.1/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!*********************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/next@15.2.2_react-dom@19.1.1_react@19.1.1__react@19.1.1/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \*********************************************************************************************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(rsc)/./src/app/auth/callback/route.ts":
/*!****************************************!*\
  !*** ./src/app/auth/callback/route.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST),\n/* harmony export */   runtime: () => (/* binding */ runtime)\n/* harmony export */ });\n/* harmony import */ var next_headers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/headers */ \"(rsc)/./node_modules/.pnpm/next@15.2.2_react-dom@19.1.1_react@19.1.1__react@19.1.1/node_modules/next/dist/api/headers.js\");\n/* harmony import */ var _supabase_ssr__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @supabase/ssr */ \"(rsc)/./node_modules/.pnpm/@supabase+ssr@0.7.0_@supabase+supabase-js@2.57.4/node_modules/@supabase/ssr/dist/module/index.js\");\n/* harmony import */ var _server_supabase__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/server/supabase */ \"(rsc)/./src/server/supabase.ts\");\nconst runtime = 'nodejs';\n\n\n\nasync function POST(request) {\n    try {\n        const body = await request.json().catch(()=>({}));\n        const { event, session } = body || {};\n        const cookieStore = await (0,next_headers__WEBPACK_IMPORTED_MODULE_0__.cookies)();\n        const url = \"https://hewpwluinbwaizwqhmjc.supabase.co\";\n        const anon = \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhld3B3bHVpbmJ3YWl6d3FobWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MTU5NTEsImV4cCI6MjA3MjQ5MTk1MX0.jhKzLYPdixxI8zcH20kkzL1WgP9RB33FeHtO0FRY7r4\";\n        if (!url || !anon) return new Response('Supabase env not configured', {\n            status: 500\n        });\n        const supabase = (0,_supabase_ssr__WEBPACK_IMPORTED_MODULE_1__.createServerClient)(url, anon, {\n            cookies: {\n                get (name) {\n                    return cookieStore.get(name)?.value;\n                },\n                set (name, value, options) {\n                    cookieStore.set(name, value, options);\n                },\n                remove (name, options) {\n                    cookieStore.set(name, '', {\n                        ...options,\n                        maxAge: 0\n                    });\n                }\n            }\n        });\n        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {\n            if (session?.access_token && session?.refresh_token) {\n                // Note: setSession may rotate refresh_token server-side. Clients should not reuse old tokens after this.\n                await supabase.auth.setSession({\n                    access_token: session.access_token,\n                    refresh_token: session.refresh_token\n                });\n                if (event === 'SIGNED_IN' && session.user && _server_supabase__WEBPACK_IMPORTED_MODULE_2__.supabaseAdmin) {\n                    await _server_supabase__WEBPACK_IMPORTED_MODULE_2__.supabaseAdmin.from('profiles').upsert({\n                        id: session.user.id,\n                        email: session.user.email || '',\n                        full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',\n                        avatar_url: session.user.user_metadata?.avatar_url || null\n                    }, {\n                        onConflict: 'id'\n                    });\n                }\n            }\n        }\n        if (event === 'SIGNED_OUT') {\n            await supabase.auth.signOut();\n        }\n        return new Response(JSON.stringify({\n            ok: true\n        }), {\n            status: 200,\n            headers: {\n                'Content-Type': 'application/json'\n            }\n        });\n    } catch (e) {\n        console.error('Auth callback error:', e);\n        return new Response('Auth callback error', {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2F1dGgvY2FsbGJhY2svcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBTyxNQUFNQSxVQUFVLFNBQVE7QUFFTztBQUNZO0FBQ0Q7QUFFMUMsZUFBZUksS0FBS0MsT0FBZ0I7SUFDekMsSUFBSTtRQUNGLE1BQU1DLE9BQU8sTUFBTUQsUUFBUUUsSUFBSSxHQUFHQyxLQUFLLENBQUMsSUFBTyxFQUFDO1FBQ2hELE1BQU0sRUFBRUMsS0FBSyxFQUFFQyxPQUFPLEVBQUUsR0FBR0osUUFBUSxDQUFDO1FBRXBDLE1BQU1LLGNBQWMsTUFBTVYscURBQU9BO1FBQ2pDLE1BQU1XLE1BQU1DLDBDQUFvQztRQUNoRCxNQUFNRyxPQUFPSCxrTkFBeUM7UUFDdEQsSUFBSSxDQUFDRCxPQUFPLENBQUNJLE1BQU0sT0FBTyxJQUFJRSxTQUFTLCtCQUErQjtZQUFFQyxRQUFRO1FBQUk7UUFFcEYsTUFBTUMsV0FBV2xCLGlFQUFrQkEsQ0FBQ1UsS0FBS0ksTUFBTTtZQUM3Q2YsU0FBUztnQkFDUG9CLEtBQUlDLElBQVk7b0JBQ2QsT0FBT1gsWUFBWVUsR0FBRyxDQUFDQyxPQUFPQztnQkFDaEM7Z0JBQ0FDLEtBQUlGLElBQVksRUFBRUMsS0FBYSxFQUFFRSxPQUFZO29CQUMzQ2QsWUFBWWEsR0FBRyxDQUFDRixNQUFNQyxPQUFPRTtnQkFDL0I7Z0JBQ0FDLFFBQU9KLElBQVksRUFBRUcsT0FBWTtvQkFDL0JkLFlBQVlhLEdBQUcsQ0FBQ0YsTUFBTSxJQUFJO3dCQUFFLEdBQUdHLE9BQU87d0JBQUVFLFFBQVE7b0JBQUU7Z0JBQ3BEO1lBQ0Y7UUFDRjtRQUVBLElBQUlsQixVQUFVLGVBQWVBLFVBQVUsbUJBQW1CO1lBQ3hELElBQUlDLFNBQVNrQixnQkFBZ0JsQixTQUFTbUIsZUFBZTtnQkFDbkQseUdBQXlHO2dCQUN6RyxNQUFNVCxTQUFTVSxJQUFJLENBQUNDLFVBQVUsQ0FBQztvQkFDN0JILGNBQWNsQixRQUFRa0IsWUFBWTtvQkFDbENDLGVBQWVuQixRQUFRbUIsYUFBYTtnQkFDdEM7Z0JBRUEsSUFBSXBCLFVBQVUsZUFBZUMsUUFBUXNCLElBQUksSUFBSTdCLDJEQUFhQSxFQUFFO29CQUMxRCxNQUFNQSwyREFBYUEsQ0FDaEI4QixJQUFJLENBQUMsWUFDTEMsTUFBTSxDQUFDO3dCQUNOQyxJQUFJekIsUUFBUXNCLElBQUksQ0FBQ0csRUFBRTt3QkFDbkJDLE9BQU8xQixRQUFRc0IsSUFBSSxDQUFDSSxLQUFLLElBQUk7d0JBQzdCQyxXQUFXLFFBQVNMLElBQUksQ0FBQ00sYUFBYSxFQUFVRCxhQUFhM0IsUUFBUXNCLElBQUksQ0FBQ0ksS0FBSyxFQUFFRyxNQUFNLElBQUksQ0FBQyxFQUFFLElBQUk7d0JBQ2xHQyxZQUFZLFFBQVNSLElBQUksQ0FBQ00sYUFBYSxFQUFVRSxjQUFjO29CQUNqRSxHQUFHO3dCQUNEQyxZQUFZO29CQUNkO2dCQUNKO1lBQ0Y7UUFDRjtRQUVBLElBQUloQyxVQUFVLGNBQWM7WUFDMUIsTUFBTVcsU0FBU1UsSUFBSSxDQUFDWSxPQUFPO1FBQzdCO1FBRUEsT0FBTyxJQUFJeEIsU0FBU3lCLEtBQUtDLFNBQVMsQ0FBQztZQUFFQyxJQUFJO1FBQUssSUFBSTtZQUFFMUIsUUFBUTtZQUFLMkIsU0FBUztnQkFBRSxnQkFBZ0I7WUFBbUI7UUFBRTtJQUNuSCxFQUFFLE9BQU9DLEdBQUc7UUFDVkMsUUFBUUMsS0FBSyxDQUFDLHdCQUF3QkY7UUFDdEMsT0FBTyxJQUFJN0IsU0FBUyx1QkFBdUI7WUFBRUMsUUFBUTtRQUFJO0lBQzNEO0FBQ0YiLCJzb3VyY2VzIjpbIkQ6XFxEZWx0YSBJVlxcU29md2FyZXNcXGdsYXNzXFxzYW5kYm94XFxzaGFkY24tY3JtLWRhc2hib2FyZFxcc3JjXFxhcHBcXGF1dGhcXGNhbGxiYWNrXFxyb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgcnVudGltZSA9ICdub2RlanMnXG5cbmltcG9ydCB7IGNvb2tpZXMgfSBmcm9tICduZXh0L2hlYWRlcnMnXG5pbXBvcnQgeyBjcmVhdGVTZXJ2ZXJDbGllbnQgfSBmcm9tICdAc3VwYWJhc2Uvc3NyJ1xuaW1wb3J0IHsgc3VwYWJhc2VBZG1pbiB9IGZyb20gJ0Avc2VydmVyL3N1cGFiYXNlJ1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlcXVlc3QuanNvbigpLmNhdGNoKCgpID0+ICh7fSkpIGFzIGFueVxuICAgIGNvbnN0IHsgZXZlbnQsIHNlc3Npb24gfSA9IGJvZHkgfHwge31cblxuICAgIGNvbnN0IGNvb2tpZVN0b3JlID0gYXdhaXQgY29va2llcygpXG4gICAgY29uc3QgdXJsID0gcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMXG4gICAgY29uc3QgYW5vbiA9IHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZXG4gICAgaWYgKCF1cmwgfHwgIWFub24pIHJldHVybiBuZXcgUmVzcG9uc2UoJ1N1cGFiYXNlIGVudiBub3QgY29uZmlndXJlZCcsIHsgc3RhdHVzOiA1MDAgfSlcblxuICAgIGNvbnN0IHN1cGFiYXNlID0gY3JlYXRlU2VydmVyQ2xpZW50KHVybCwgYW5vbiwge1xuICAgICAgY29va2llczoge1xuICAgICAgICBnZXQobmFtZTogc3RyaW5nKSB7XG4gICAgICAgICAgcmV0dXJuIGNvb2tpZVN0b3JlLmdldChuYW1lKT8udmFsdWVcbiAgICAgICAgfSxcbiAgICAgICAgc2V0KG5hbWU6IHN0cmluZywgdmFsdWU6IHN0cmluZywgb3B0aW9uczogYW55KSB7XG4gICAgICAgICAgY29va2llU3RvcmUuc2V0KG5hbWUsIHZhbHVlLCBvcHRpb25zKVxuICAgICAgICB9LFxuICAgICAgICByZW1vdmUobmFtZTogc3RyaW5nLCBvcHRpb25zOiBhbnkpIHtcbiAgICAgICAgICBjb29raWVTdG9yZS5zZXQobmFtZSwgJycsIHsgLi4ub3B0aW9ucywgbWF4QWdlOiAwIH0pXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pXG5cbiAgICBpZiAoZXZlbnQgPT09ICdTSUdORURfSU4nIHx8IGV2ZW50ID09PSAnVE9LRU5fUkVGUkVTSEVEJykge1xuICAgICAgaWYgKHNlc3Npb24/LmFjY2Vzc190b2tlbiAmJiBzZXNzaW9uPy5yZWZyZXNoX3Rva2VuKSB7XG4gICAgICAgIC8vIE5vdGU6IHNldFNlc3Npb24gbWF5IHJvdGF0ZSByZWZyZXNoX3Rva2VuIHNlcnZlci1zaWRlLiBDbGllbnRzIHNob3VsZCBub3QgcmV1c2Ugb2xkIHRva2VucyBhZnRlciB0aGlzLlxuICAgICAgICBhd2FpdCBzdXBhYmFzZS5hdXRoLnNldFNlc3Npb24oe1xuICAgICAgICAgIGFjY2Vzc190b2tlbjogc2Vzc2lvbi5hY2Nlc3NfdG9rZW4sXG4gICAgICAgICAgcmVmcmVzaF90b2tlbjogc2Vzc2lvbi5yZWZyZXNoX3Rva2VuLFxuICAgICAgICB9KVxuXG4gICAgICAgIGlmIChldmVudCA9PT0gJ1NJR05FRF9JTicgJiYgc2Vzc2lvbi51c2VyICYmIHN1cGFiYXNlQWRtaW4pIHtcbiAgICAgICAgICBhd2FpdCBzdXBhYmFzZUFkbWluXG4gICAgICAgICAgICAuZnJvbSgncHJvZmlsZXMnKVxuICAgICAgICAgICAgLnVwc2VydCh7XG4gICAgICAgICAgICAgIGlkOiBzZXNzaW9uLnVzZXIuaWQsXG4gICAgICAgICAgICAgIGVtYWlsOiBzZXNzaW9uLnVzZXIuZW1haWwgfHwgJycsXG4gICAgICAgICAgICAgIGZ1bGxfbmFtZTogKHNlc3Npb24udXNlci51c2VyX21ldGFkYXRhIGFzIGFueSk/LmZ1bGxfbmFtZSB8fCBzZXNzaW9uLnVzZXIuZW1haWw/LnNwbGl0KCdAJylbMF0gfHwgJ1VzZXInLFxuICAgICAgICAgICAgICBhdmF0YXJfdXJsOiAoc2Vzc2lvbi51c2VyLnVzZXJfbWV0YWRhdGEgYXMgYW55KT8uYXZhdGFyX3VybCB8fCBudWxsLFxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICBvbkNvbmZsaWN0OiAnaWQnXG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGV2ZW50ID09PSAnU0lHTkVEX09VVCcpIHtcbiAgICAgIGF3YWl0IHN1cGFiYXNlLmF1dGguc2lnbk91dCgpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShKU09OLnN0cmluZ2lmeSh7IG9rOiB0cnVlIH0pLCB7IHN0YXR1czogMjAwLCBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSB9KVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcignQXV0aCBjYWxsYmFjayBlcnJvcjonLCBlKVxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UoJ0F1dGggY2FsbGJhY2sgZXJyb3InLCB7IHN0YXR1czogNTAwIH0pXG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJydW50aW1lIiwiY29va2llcyIsImNyZWF0ZVNlcnZlckNsaWVudCIsInN1cGFiYXNlQWRtaW4iLCJQT1NUIiwicmVxdWVzdCIsImJvZHkiLCJqc29uIiwiY2F0Y2giLCJldmVudCIsInNlc3Npb24iLCJjb29raWVTdG9yZSIsInVybCIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwiLCJhbm9uIiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfQU5PTl9LRVkiLCJSZXNwb25zZSIsInN0YXR1cyIsInN1cGFiYXNlIiwiZ2V0IiwibmFtZSIsInZhbHVlIiwic2V0Iiwib3B0aW9ucyIsInJlbW92ZSIsIm1heEFnZSIsImFjY2Vzc190b2tlbiIsInJlZnJlc2hfdG9rZW4iLCJhdXRoIiwic2V0U2Vzc2lvbiIsInVzZXIiLCJmcm9tIiwidXBzZXJ0IiwiaWQiLCJlbWFpbCIsImZ1bGxfbmFtZSIsInVzZXJfbWV0YWRhdGEiLCJzcGxpdCIsImF2YXRhcl91cmwiLCJvbkNvbmZsaWN0Iiwic2lnbk91dCIsIkpTT04iLCJzdHJpbmdpZnkiLCJvayIsImhlYWRlcnMiLCJlIiwiY29uc29sZSIsImVycm9yIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/auth/callback/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/server/supabase.ts":
/*!********************************!*\
  !*** ./src/server/supabase.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   supabaseAdmin: () => (/* binding */ supabaseAdmin),\n/* harmony export */   supabaseServer: () => (/* binding */ supabaseServer)\n/* harmony export */ });\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/.pnpm/@supabase+supabase-js@2.57.4/node_modules/@supabase/supabase-js/dist/module/index.js\");\n\nconst supabaseUrl = \"https://hewpwluinbwaizwqhmjc.supabase.co\";\nconst supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;\nif (!supabaseUrl) {\n    throw new Error('Missing Supabase URL for server client');\n}\n// Server-only client with service role for bypassing RLS in admin operations (optional)\nconst supabaseAdmin = supabaseServiceKey ? (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__.createClient)(supabaseUrl, supabaseServiceKey, {\n    auth: {\n        autoRefreshToken: false,\n        persistSession: false\n    }\n}) : null;\n// Server client that respects RLS (uses anon key + user context)\nconst supabaseServer = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_0__.createClient)(supabaseUrl, \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhld3B3bHVpbmJ3YWl6d3FobWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MTU5NTEsImV4cCI6MjA3MjQ5MTk1MX0.jhKzLYPdixxI8zcH20kkzL1WgP9RB33FeHtO0FRY7r4\", {\n    auth: {\n        autoRefreshToken: false,\n        persistSession: false\n    }\n});\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvc2VydmVyL3N1cGFiYXNlLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUFvRDtBQUVwRCxNQUFNQyxjQUFjQywwQ0FBb0M7QUFDeEQsTUFBTUcscUJBQXFCSCxRQUFRQyxHQUFHLENBQUNHLHlCQUF5QjtBQUVoRSxJQUFJLENBQUNMLGFBQWE7SUFDaEIsTUFBTSxJQUFJTSxNQUFNO0FBQ2xCO0FBRUEsd0ZBQXdGO0FBQ2pGLE1BQU1DLGdCQUFnQkgscUJBQ3pCTCxtRUFBWUEsQ0FBQ0MsYUFBYUksb0JBQW9CO0lBQzVDSSxNQUFNO1FBQ0pDLGtCQUFrQjtRQUNsQkMsZ0JBQWdCO0lBQ2xCO0FBQ0YsS0FDQSxLQUFJO0FBRVIsaUVBQWlFO0FBQzFELE1BQU1DLGlCQUFpQlosbUVBQVlBLENBQ3hDQyxhQUNBQyxrTkFBeUMsRUFDekM7SUFDRU8sTUFBTTtRQUNKQyxrQkFBa0I7UUFDbEJDLGdCQUFnQjtJQUNsQjtBQUNGLEdBQ0QiLCJzb3VyY2VzIjpbIkQ6XFxEZWx0YSBJVlxcU29md2FyZXNcXGdsYXNzXFxzYW5kYm94XFxzaGFkY24tY3JtLWRhc2hib2FyZFxcc3JjXFxzZXJ2ZXJcXHN1cGFiYXNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZUNsaWVudCB9IGZyb20gJ0BzdXBhYmFzZS9zdXBhYmFzZS1qcydcblxuY29uc3Qgc3VwYWJhc2VVcmwgPSBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkxcbmNvbnN0IHN1cGFiYXNlU2VydmljZUtleSA9IHByb2Nlc3MuZW52LlNVUEFCQVNFX1NFUlZJQ0VfUk9MRV9LRVlcblxuaWYgKCFzdXBhYmFzZVVybCkge1xuICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgU3VwYWJhc2UgVVJMIGZvciBzZXJ2ZXIgY2xpZW50Jylcbn1cblxuLy8gU2VydmVyLW9ubHkgY2xpZW50IHdpdGggc2VydmljZSByb2xlIGZvciBieXBhc3NpbmcgUkxTIGluIGFkbWluIG9wZXJhdGlvbnMgKG9wdGlvbmFsKVxuZXhwb3J0IGNvbnN0IHN1cGFiYXNlQWRtaW4gPSBzdXBhYmFzZVNlcnZpY2VLZXlcbiAgPyBjcmVhdGVDbGllbnQoc3VwYWJhc2VVcmwsIHN1cGFiYXNlU2VydmljZUtleSwge1xuICAgICAgYXV0aDoge1xuICAgICAgICBhdXRvUmVmcmVzaFRva2VuOiBmYWxzZSxcbiAgICAgICAgcGVyc2lzdFNlc3Npb246IGZhbHNlLFxuICAgICAgfSxcbiAgICB9KVxuICA6IG51bGxcblxuLy8gU2VydmVyIGNsaWVudCB0aGF0IHJlc3BlY3RzIFJMUyAodXNlcyBhbm9uIGtleSArIHVzZXIgY29udGV4dClcbmV4cG9ydCBjb25zdCBzdXBhYmFzZVNlcnZlciA9IGNyZWF0ZUNsaWVudChcbiAgc3VwYWJhc2VVcmwsXG4gIHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX0FOT05fS0VZISxcbiAge1xuICAgIGF1dGg6IHtcbiAgICAgIGF1dG9SZWZyZXNoVG9rZW46IGZhbHNlLFxuICAgICAgcGVyc2lzdFNlc3Npb246IGZhbHNlLFxuICAgIH0sXG4gIH1cbilcbiJdLCJuYW1lcyI6WyJjcmVhdGVDbGllbnQiLCJzdXBhYmFzZVVybCIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwiLCJzdXBhYmFzZVNlcnZpY2VLZXkiLCJTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZIiwiRXJyb3IiLCJzdXBhYmFzZUFkbWluIiwiYXV0aCIsImF1dG9SZWZyZXNoVG9rZW4iLCJwZXJzaXN0U2Vzc2lvbiIsInN1cGFiYXNlU2VydmVyIiwiTkVYVF9QVUJMSUNfU1VQQUJBU0VfQU5PTl9LRVkiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/server/supabase.ts\n");

/***/ }),

/***/ "(ssr)/./node_modules/.pnpm/next@15.2.2_react-dom@19.1.1_react@19.1.1__react@19.1.1/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!*********************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/next@15.2.2_react-dom@19.1.1_react@19.1.1__react@19.1.1/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \*********************************************************************************************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next@15.2.2_react-dom@19.1.1_react@19.1.1__react@19.1.1","vendor-chunks/tr46@0.0.3","vendor-chunks/@supabase+auth-js@2.71.1","vendor-chunks/@supabase+realtime-js@2.15.5","vendor-chunks/@supabase+postgrest-js@1.21.4","vendor-chunks/@supabase+node-fetch@2.6.15","vendor-chunks/@supabase+storage-js@2.12.1","vendor-chunks/whatwg-url@5.0.0","vendor-chunks/@supabase+ssr@0.7.0_@supabase+supabase-js@2.57.4","vendor-chunks/@supabase+supabase-js@2.57.4","vendor-chunks/cookie@1.0.2","vendor-chunks/@supabase+functions-js@2.4.6","vendor-chunks/webidl-conversions@3.0.1"], () => (__webpack_exec__("(rsc)/./node_modules/.pnpm/next@15.2.2_react-dom@19.1.1_react@19.1.1__react@19.1.1/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fauth%2Fcallback%2Froute&page=%2Fauth%2Fcallback%2Froute&appPaths=&pagePath=private-next-app-dir%2Fauth%2Fcallback%2Froute.ts&appDir=D%3A%5CDelta%20IV%5CSofwares%5Cglass%5Csandbox%5Cshadcn-crm-dashboard%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=D%3A%5CDelta%20IV%5CSofwares%5Cglass%5Csandbox%5Cshadcn-crm-dashboard&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();