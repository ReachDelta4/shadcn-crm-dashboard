"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_rsc_src_app_api__lib_log-activity_ts";
exports.ids = ["_rsc_src_app_api__lib_log-activity_ts"];
exports.modules = {

/***/ "(rsc)/./src/app/api/_lib/log-activity.ts":
/*!******************************************!*\
  !*** ./src/app/api/_lib/log-activity.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   logActivity: () => (/* binding */ logActivity)\n/* harmony export */ });\nasync function logActivity(supabase, ownerId, payload) {\n    try {\n        const nowIso = new Date().toISOString();\n        const row = {\n            owner_id: ownerId,\n            type: payload.type,\n            description: payload.description,\n            message: payload.description,\n            user: payload.user || 'system',\n            entity: payload.entity || null,\n            details: payload.details || null,\n            metadata: payload.details || null,\n            timestamp: payload.timestamp || nowIso\n        };\n        await supabase.from('activity_logs').insert(row);\n    } catch  {\n    // Never throw from logging\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9fbGliL2xvZy1hY3Rpdml0eS50cyIsIm1hcHBpbmdzIjoiOzs7O0FBV08sZUFBZUEsWUFDckJDLFFBQXdCLEVBQ3hCQyxPQUFlLEVBQ2ZDLE9BQXdCO0lBRXhCLElBQUk7UUFDSCxNQUFNQyxTQUFTLElBQUlDLE9BQU9DLFdBQVc7UUFDckMsTUFBTUMsTUFBMkI7WUFDaENDLFVBQVVOO1lBQ1ZPLE1BQU1OLFFBQVFNLElBQUk7WUFDbEJDLGFBQWFQLFFBQVFPLFdBQVc7WUFDaENDLFNBQVNSLFFBQVFPLFdBQVc7WUFDNUJFLE1BQU1ULFFBQVFTLElBQUksSUFBSTtZQUN0QkMsUUFBUVYsUUFBUVUsTUFBTSxJQUFJO1lBQzFCQyxTQUFTWCxRQUFRVyxPQUFPLElBQUk7WUFDNUJDLFVBQVVaLFFBQVFXLE9BQU8sSUFBSTtZQUM3QkUsV0FBV2IsUUFBUWEsU0FBUyxJQUFJWjtRQUNqQztRQUNBLE1BQU1ILFNBQVNnQixJQUFJLENBQUMsaUJBQWlCQyxNQUFNLENBQUNYO0lBQzdDLEVBQUUsT0FBTTtJQUNQLDJCQUEyQjtJQUM1QjtBQUNEIiwic291cmNlcyI6WyJEOlxcRGVsdGEgSVZcXFNvZndhcmVzXFxnbGFzc1xcc2FuZGJveFxcc2hhZGNuLWNybS1kYXNoYm9hcmRcXHNyY1xcYXBwXFxhcGlcXF9saWJcXGxvZy1hY3Rpdml0eS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFN1cGFiYXNlQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ1xyXG5cclxuaW50ZXJmYWNlIEFjdGl2aXR5UGF5bG9hZCB7XHJcblx0dHlwZTogJ3VzZXInIHwgJ2NvbnRhY3QnIHwgJ2xlYWQnIHwgJ2RlYWwnIHwgJ3Rhc2snIHwgJ2VtYWlsJ1xyXG5cdGRlc2NyaXB0aW9uOiBzdHJpbmdcclxuXHR1c2VyPzogc3RyaW5nXHJcblx0ZW50aXR5Pzogc3RyaW5nXHJcblx0ZGV0YWlscz86IFJlY29yZDxzdHJpbmcsIGFueT5cclxuXHR0aW1lc3RhbXA/OiBzdHJpbmdcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGxvZ0FjdGl2aXR5KFxyXG5cdHN1cGFiYXNlOiBTdXBhYmFzZUNsaWVudCxcclxuXHRvd25lcklkOiBzdHJpbmcsXHJcblx0cGF5bG9hZDogQWN0aXZpdHlQYXlsb2FkXHJcbik6IFByb21pc2U8dm9pZD4ge1xyXG5cdHRyeSB7XHJcblx0XHRjb25zdCBub3dJc28gPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcclxuXHRcdGNvbnN0IHJvdzogUmVjb3JkPHN0cmluZywgYW55PiA9IHtcclxuXHRcdFx0b3duZXJfaWQ6IG93bmVySWQsXHJcblx0XHRcdHR5cGU6IHBheWxvYWQudHlwZSxcclxuXHRcdFx0ZGVzY3JpcHRpb246IHBheWxvYWQuZGVzY3JpcHRpb24sXHJcblx0XHRcdG1lc3NhZ2U6IHBheWxvYWQuZGVzY3JpcHRpb24sXHJcblx0XHRcdHVzZXI6IHBheWxvYWQudXNlciB8fCAnc3lzdGVtJyxcclxuXHRcdFx0ZW50aXR5OiBwYXlsb2FkLmVudGl0eSB8fCBudWxsLFxyXG5cdFx0XHRkZXRhaWxzOiBwYXlsb2FkLmRldGFpbHMgfHwgbnVsbCxcclxuXHRcdFx0bWV0YWRhdGE6IHBheWxvYWQuZGV0YWlscyB8fCBudWxsLFxyXG5cdFx0XHR0aW1lc3RhbXA6IHBheWxvYWQudGltZXN0YW1wIHx8IG5vd0lzbyxcclxuXHRcdH1cclxuXHRcdGF3YWl0IHN1cGFiYXNlLmZyb20oJ2FjdGl2aXR5X2xvZ3MnKS5pbnNlcnQocm93KVxyXG5cdH0gY2F0Y2gge1xyXG5cdFx0Ly8gTmV2ZXIgdGhyb3cgZnJvbSBsb2dnaW5nXHJcblx0fVxyXG59XHJcbiJdLCJuYW1lcyI6WyJsb2dBY3Rpdml0eSIsInN1cGFiYXNlIiwib3duZXJJZCIsInBheWxvYWQiLCJub3dJc28iLCJEYXRlIiwidG9JU09TdHJpbmciLCJyb3ciLCJvd25lcl9pZCIsInR5cGUiLCJkZXNjcmlwdGlvbiIsIm1lc3NhZ2UiLCJ1c2VyIiwiZW50aXR5IiwiZGV0YWlscyIsIm1ldGFkYXRhIiwidGltZXN0YW1wIiwiZnJvbSIsImluc2VydCJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/_lib/log-activity.ts\n");

/***/ })

};
;